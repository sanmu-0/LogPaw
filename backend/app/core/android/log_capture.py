"""Full logcat capture with PID-based filtering.

Architecture:
  - adb logcat runs continuously, capturing ALL device logs
  - Every line is stored in full_logs buffer
  - Lines matching target app PIDs go to filtered_logs and are pushed via callback
  - PID set is refreshed every N seconds to handle app restarts
  - Historical PIDs are kept (never removed) so past logs always match
"""

import asyncio
import logging
import re
from collections.abc import Callable, Awaitable

from app.config import settings
from app.core.base import LogLine, LogProvider
from app.core.android.adb_client import ADBClient
from app.core.android.sys_log import SystemLogFetcher

logger = logging.getLogger(__name__)

LOGCAT_PATTERN = re.compile(
    r"^(\d{2}-\d{2})\s+"           # date
    r"(\d{2}:\d{2}:\d{2}\.\d{3})\s+"  # time
    r"(\d+)\s+"                     # pid
    r"(\d+)\s+"                     # tid
    r"([VDIWEF])\s+"               # level
    r"(.+?)\s*:\s+"                # tag
    r"(.*)"                        # message
)

SYSTEM_RELATED_TAGS = {
    "AndroidRuntime", "ActivityManager", "WindowManager",
    "InputDispatcher", "ActivityTaskManager", "Process",
    "lowmemorykiller", "DEBUG",
}


class LogCapture(LogProvider):
    def __init__(self, client: ADBClient):
        self._client = client
        self._package: str = ""
        self._pid_set: set[str] = set()
        self._full_logs: list[LogLine] = []
        self._filtered_logs: list[LogLine] = []
        self._process: asyncio.subprocess.Process | None = None
        self._pid_task: asyncio.Task | None = None
        self._capture_task: asyncio.Task | None = None
        self._running = False
        self._on_filtered_log: Callable[[LogLine], Awaitable[None]] | None = None
        self._on_status: Callable[[dict], Awaitable[None]] | None = None
        self._sys_log_fetcher = SystemLogFetcher(client)

    def set_callbacks(
        self,
        on_filtered_log: Callable[[LogLine], Awaitable[None]],
        on_status: Callable[[dict], Awaitable[None]] | None = None,
    ):
        self._on_filtered_log = on_filtered_log
        self._on_status = on_status

    async def start_capture(self, package_name: str):
        self._package = package_name
        self._pid_set.clear()
        self._full_logs.clear()
        self._filtered_logs.clear()
        self._running = True

        await self._refresh_pids()

        self._process = await self._client.start_logcat("-T", "1")
        self._capture_task = asyncio.create_task(self._read_loop())
        self._pid_task = asyncio.create_task(self._pid_refresh_loop())
        logger.info("Capture started for %s, initial PIDs: %s", package_name, self._pid_set)

        if self._on_status:
            await self._on_status({
                "type": "status",
                "event": "pids_info",
                "message": f"正在追踪 PID: {self._pid_set or '(应用未运行)'}",
                "all_pids": list(self._pid_set),
            })

    async def stop_capture(self):
        self._running = False
        if self._pid_task:
            self._pid_task.cancel()
            self._pid_task = None
        if self._capture_task:
            self._capture_task.cancel()
            self._capture_task = None
        if self._process:
            try:
                self._process.kill()
                await self._process.wait()
            except ProcessLookupError:
                pass
            self._process = None
        logger.info("Capture stopped for %s", self._package)

    async def fetch_system_logs(self, package_name: str) -> list[LogLine]:
        sys_logs = await self._sys_log_fetcher.fetch(package_name, self._pid_set)
        for log in sys_logs:
            self._filtered_logs.append(log)
            if self._on_filtered_log:
                await self._on_filtered_log(log)
        self._filtered_logs.sort(key=lambda l: l.timestamp)
        return sys_logs

    def get_full_logs(self) -> list[LogLine]:
        return self._full_logs

    def get_filtered_logs(self) -> list[LogLine]:
        return self._filtered_logs

    async def _read_loop(self):
        assert self._process and self._process.stdout
        try:
            while self._running:
                raw = await self._process.stdout.readline()
                if not raw:
                    if self._process.returncode is not None:
                        logger.warning("logcat process exited, restarting...")
                        await self._restart_logcat()
                        continue
                    break

                line_str = raw.decode("utf-8", errors="replace").rstrip("\n\r")
                if not line_str:
                    continue

                log_line = self._parse_line(line_str)
                self._full_logs.append(log_line)

                if len(self._full_logs) > settings.log_buffer_max_lines:
                    self._full_logs = self._full_logs[-settings.log_buffer_max_lines:]

                if self._is_app_related(log_line):
                    log_line.source = "app"
                    self._filtered_logs.append(log_line)
                    if self._on_filtered_log:
                        await self._on_filtered_log(log_line)
        except asyncio.CancelledError:
            pass
        except Exception:
            logger.exception("Error in logcat read loop")

    async def _restart_logcat(self):
        if self._process:
            try:
                self._process.kill()
                await self._process.wait()
            except ProcessLookupError:
                pass
        self._process = await self._client.start_logcat()

    async def _pid_refresh_loop(self):
        try:
            while self._running:
                await asyncio.sleep(settings.pid_refresh_interval)
                old_pids = self._pid_set.copy()
                await self._refresh_pids()
                new_pids = self._pid_set - old_pids
                if new_pids and self._on_status:
                    await self._on_status({
                        "type": "status",
                        "event": "pid_changed",
                        "new_pids": list(new_pids),
                        "all_pids": list(self._pid_set),
                        "message": f"检测到新进程: {new_pids}",
                    })
                    await self._backfill_logs(new_pids)
        except asyncio.CancelledError:
            pass

    async def _refresh_pids(self):
        try:
            output = await self._client.shell("pidof", self._package, timeout=5.0)
            pids = output.strip().split()
            for pid in pids:
                if pid.isdigit():
                    self._pid_set.add(pid)
        except Exception:
            logger.debug("pidof failed for %s (app may not be running)", self._package)

    async def _backfill_logs(self, new_pids: set[str]):
        """When new PIDs are detected, scan full buffer for missed logs."""
        backfilled = 0
        existing_raws = {l.raw for l in self._filtered_logs}
        for log in self._full_logs:
            if log.pid in new_pids and log.raw not in existing_raws:
                log.source = "app"
                self._filtered_logs.append(log)
                if self._on_filtered_log:
                    await self._on_filtered_log(log)
                backfilled += 1
        if backfilled:
            self._filtered_logs.sort(key=lambda l: l.timestamp)
            logger.info("Backfilled %d logs for new PIDs %s", backfilled, new_pids)

    def _is_app_related(self, log: LogLine) -> bool:
        if log.pid in self._pid_set:
            return True
        return False

    @staticmethod
    def _parse_line(line: str) -> LogLine:
        m = LOGCAT_PATTERN.match(line)
        if not m:
            return LogLine(raw=line, message=line)
        date, time, pid, tid, level, tag, message = m.groups()
        return LogLine(
            raw=line,
            timestamp=f"{date} {time}",
            pid=pid,
            tid=tid,
            level=level,
            tag=tag.strip(),
            message=message,
        )
