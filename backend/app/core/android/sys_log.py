"""System log fetcher - pulls system/crash buffer logs related to target app."""

import logging
import re

from app.core.base import LogLine
from app.core.android.adb_client import ADBClient

logger = logging.getLogger(__name__)

LOGCAT_PATTERN = re.compile(
    r"^(\d{2}-\d{2})\s+"
    r"(\d{2}:\d{2}:\d{2}\.\d{3})\s+"
    r"(\d+)\s+"
    r"(\d+)\s+"
    r"([VDIWEF])\s+"
    r"(.+?)\s*:\s+"
    r"(.*)"
)

SYSTEM_TAGS = {
    "AndroidRuntime", "ActivityManager", "WindowManager",
    "ActivityTaskManager", "InputDispatcher", "Process",
    "lowmemorykiller", "DEBUG", "art", "Zygote",
}

CRASH_KEYWORDS = [
    "FATAL EXCEPTION", "ANR in", "Force finishing",
    "Process.*died", "has died", "killing",
    "Native crash", "SIGABRT", "SIGSEGV", "SIGFPE",
]


class SystemLogFetcher:
    def __init__(self, client: ADBClient):
        self._client = client

    async def fetch(self, package_name: str, pid_set: set[str]) -> list[LogLine]:
        results: list[LogLine] = []

        for buffer in ("system", "crash"):
            try:
                output = await self._client.run(
                    "logcat", "-b", buffer, "-v", "threadtime", "-d",
                    timeout=15.0,
                )
                lines = output.splitlines()
                for line_str in lines:
                    line_str = line_str.strip()
                    if not line_str:
                        continue
                    log = self._parse_line(line_str)
                    if self._is_app_related(log, package_name, pid_set):
                        log.source = "system"
                        results.append(log)
            except Exception:
                logger.exception("Failed to fetch %s buffer", buffer)

        results.sort(key=lambda l: l.timestamp)
        logger.info("Fetched %d system logs related to %s", len(results), package_name)
        return results

    @staticmethod
    def _is_app_related(log: LogLine, package_name: str, pid_set: set[str]) -> bool:
        if log.pid in pid_set:
            return True

        pkg_lower = package_name.lower()
        content = f"{log.tag} {log.message}".lower()
        if pkg_lower in content:
            return True

        if log.tag in SYSTEM_TAGS:
            for kw in CRASH_KEYWORDS:
                if re.search(kw, log.message, re.IGNORECASE):
                    return True

        return False

    @staticmethod
    def _parse_line(line: str) -> LogLine:
        m = LOGCAT_PATTERN.match(line)
        if not m:
            return LogLine(raw=line, message=line, source="system")
        date, time, pid, tid, level, tag, message = m.groups()
        return LogLine(
            raw=line,
            timestamp=f"{date} {time}",
            pid=pid,
            tid=tid,
            level=level,
            tag=tag.strip(),
            message=message,
            source="system",
        )
