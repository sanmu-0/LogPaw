"""Fuzzy app matching with case-insensitive and abbreviation support."""

import logging
import re

from thefuzz import fuzz

from app.core.base import AppInfo
from app.core.android.adb_client import ADBClient

logger = logging.getLogger(__name__)


class AppFinder:
    def __init__(self, client: ADBClient):
        self._client = client
        self._packages: list[str] = []

    async def refresh_packages(self) -> list[str]:
        output = await self._client.shell("pm", "list", "packages", "-3")
        self._packages = []
        for line in output.splitlines():
            line = line.strip()
            if line.startswith("package:"):
                self._packages.append(line[8:])
        logger.info("Loaded %d third-party packages", len(self._packages))
        return self._packages

    async def search(self, query: str, limit: int = 10) -> list[AppInfo]:
        if not self._packages:
            await self.refresh_packages()

        if not query or not query.strip():
            return [AppInfo(package_name=p, score=0) for p in self._packages[:limit]]

        query = query.strip()
        scored: list[AppInfo] = []

        for pkg in self._packages:
            score = self._compute_score(query, pkg)
            if score > 0:
                scored.append(AppInfo(package_name=pkg, score=score))

        scored.sort(key=lambda a: a.score, reverse=True)
        return scored[:limit]

    @staticmethod
    def _compute_score(query: str, package: str) -> int:
        q_lower = query.lower()
        pkg_lower = package.lower()

        # 1. Exact substring match (highest priority)
        if q_lower in pkg_lower:
            return 100

        # 2. Abbreviation match: "kb" matches "com.kiwibit.app"
        #    Check if query chars appear in order within any segment
        segments = pkg_lower.replace(".", " ").replace("_", " ").replace("-", " ").split()
        if _abbreviation_match(q_lower, segments):
            return 85

        # 3. Initials match: "kb" matches segments starting with k, b
        #    e.g., "kiwi.bit" -> initials "kb"
        initials = "".join(s[0] for s in segments if s)
        if q_lower in initials:
            return 80

        # 4. Fuzzy match on the last segment (app name part)
        last_segment = segments[-1] if segments else pkg_lower
        ratio = fuzz.partial_ratio(q_lower, last_segment)
        if ratio >= 60:
            return ratio

        # 5. Fuzzy match on full package name
        ratio = fuzz.partial_ratio(q_lower, pkg_lower)
        if ratio >= 50:
            return ratio - 10

        return 0


def _abbreviation_match(query: str, segments: list[str]) -> bool:
    """Check if query characters match in order across segment initials + content.

    For example, "kb" matches ["com", "kiwibit", "app"] because
    "kiwibit" contains 'k' and 'b' in order.
    Also "vch" matches ["com", "vicohome", "app"] since vicohome has v, c, h.
    """
    combined = "".join(segments)
    qi = 0
    for ch in combined:
        if qi < len(query) and ch == query[qi]:
            qi += 1
        if qi == len(query):
            return True

    # Also try matching across segment first-chars
    if len(query) <= len(segments):
        qi = 0
        for seg in segments:
            if qi < len(query) and seg and seg[0] == query[qi]:
                qi += 1
            if qi == len(query):
                return True

    return False
