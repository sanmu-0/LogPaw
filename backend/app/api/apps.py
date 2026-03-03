"""App search API endpoints."""

from fastapi import APIRouter, Query

from app.api.devices import device_provider

router = APIRouter()


@router.get("/device/apps")
async def search_apps(q: str = Query(default="", description="搜索关键词")):
    apps = await device_provider.list_apps(q)
    return {
        "items": [{"package_name": a.package_name, "score": a.score} for a in apps],
        "total": len(apps),
    }
