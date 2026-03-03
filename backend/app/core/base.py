"""Abstract base classes for multi-platform support (Android / iOS)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator


@dataclass
class DeviceInfo:
    serial: str
    model: str = "Unknown"
    brand: str = "Unknown"
    android_version: str = ""
    sdk_version: str = ""
    connection: str = "USB"


@dataclass
class AppInfo:
    package_name: str
    score: int = 0


@dataclass
class LogLine:
    raw: str
    timestamp: str = ""
    pid: str = ""
    tid: str = ""
    level: str = ""
    tag: str = ""
    message: str = ""
    source: str = "app"  # "app" | "system"


@dataclass
class LogSession:
    """Holds full and filtered logs for a session."""
    package_name: str
    pid_history: set = field(default_factory=set)
    full_logs: list[LogLine] = field(default_factory=list)
    filtered_logs: list[LogLine] = field(default_factory=list)


class DeviceProvider(ABC):
    @abstractmethod
    async def get_device(self) -> DeviceInfo | None:
        ...

    @abstractmethod
    async def list_apps(self, query: str) -> list[AppInfo]:
        ...


class LogProvider(ABC):
    @abstractmethod
    async def start_capture(self, package_name: str) -> AsyncIterator[LogLine]:
        ...

    @abstractmethod
    async def stop_capture(self) -> None:
        ...

    @abstractmethod
    async def fetch_system_logs(self, package_name: str) -> list[LogLine]:
        ...

    @abstractmethod
    def get_full_logs(self) -> list[LogLine]:
        ...

    @abstractmethod
    def get_filtered_logs(self) -> list[LogLine]:
        ...
