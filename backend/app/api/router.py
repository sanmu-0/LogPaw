"""API router aggregation."""

from fastapi import APIRouter

from app.api.devices import router as devices_router
from app.api.apps import router as apps_router
from app.api.logs import router as logs_router

api_router = APIRouter()
api_router.include_router(devices_router, tags=["devices"])
api_router.include_router(apps_router, tags=["apps"])
api_router.include_router(logs_router, tags=["logs"])
