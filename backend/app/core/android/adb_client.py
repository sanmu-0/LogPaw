"""Async ADB command wrapper."""

import asyncio
import logging
import shutil

from app.config import settings

logger = logging.getLogger(__name__)


class ADBClient:
    def __init__(self, serial: str | None = None):
        self._serial = serial
        self._adb = settings.adb_path

    def _build_cmd(self, *args: str) -> list[str]:
        cmd = [self._adb]
        if self._serial:
            cmd.extend(["-s", self._serial])
        cmd.extend(args)
        return cmd

    async def run(self, *args: str, timeout: float = 10.0) -> str:
        cmd = self._build_cmd(*args)
        logger.debug("ADB run: %s", " ".join(cmd))
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=timeout
            )
        except asyncio.TimeoutError:
            proc.kill()
            await proc.wait()
            raise TimeoutError(f"ADB command timed out: {' '.join(cmd)}")
        output = stdout.decode("utf-8", errors="replace").strip()
        if proc.returncode != 0:
            err = stderr.decode("utf-8", errors="replace").strip()
            logger.warning("ADB error (rc=%d): %s", proc.returncode, err)
        return output

    async def shell(self, *args: str, timeout: float = 10.0) -> str:
        return await self.run("shell", *args, timeout=timeout)

    async def start_logcat(
        self, *extra_args: str
    ) -> asyncio.subprocess.Process:
        cmd = self._build_cmd("logcat", "-v", "threadtime", *extra_args)
        logger.debug("ADB logcat start: %s", " ".join(cmd))
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        return proc

    @staticmethod
    def find_adb() -> str | None:
        return shutil.which("adb")
