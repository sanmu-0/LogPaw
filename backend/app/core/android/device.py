"""Android device discovery and info."""

import logging
import re

from app.core.base import DeviceInfo, DeviceProvider, AppInfo
from app.core.android.adb_client import ADBClient
from app.core.android.app_finder import AppFinder

logger = logging.getLogger(__name__)


class AndroidDeviceProvider(DeviceProvider):
    def __init__(self):
        self._client = ADBClient()
        self._app_finder = AppFinder(self._client)
        self._cached_device: DeviceInfo | None = None

    async def get_device(self) -> DeviceInfo | None:
        output = await self._client.run("devices", "-l")
        lines = output.strip().splitlines()[1:]  # skip header

        for line in lines:
            line = line.strip()
            if not line or "offline" in line or "unauthorized" in line:
                continue

            parts = line.split()
            if len(parts) < 2 or parts[1] != "device":
                continue

            serial = parts[0]
            self._client = ADBClient(serial)
            self._app_finder = AppFinder(self._client)

            info = await self._fetch_device_info(serial, line)
            self._cached_device = info
            return info

        self._cached_device = None
        return None

    async def _fetch_device_info(self, serial: str, raw_line: str) -> DeviceInfo:
        model_match = re.search(r"model:(\S+)", raw_line)
        model = model_match.group(1).replace("_", " ") if model_match else "Unknown"

        brand = await self._client.shell("getprop", "ro.product.brand")
        android_ver = await self._client.shell("getprop", "ro.build.version.release")
        sdk_ver = await self._client.shell("getprop", "ro.build.version.sdk")

        if not model or model == "Unknown":
            model = await self._client.shell("getprop", "ro.product.model")

        return DeviceInfo(
            serial=serial,
            model=model.strip(),
            brand=brand.strip().capitalize(),
            android_version=android_ver.strip(),
            sdk_version=sdk_ver.strip(),
            connection="USB",
        )

    async def list_apps(self, query: str) -> list[AppInfo]:
        return await self._app_finder.search(query)

    @property
    def client(self) -> ADBClient:
        return self._client

    @property
    def cached_device(self) -> DeviceInfo | None:
        return self._cached_device
