"""Device API endpoints."""

from fastapi import APIRouter, HTTPException

from app.core.android.device import AndroidDeviceProvider

router = APIRouter()
device_provider = AndroidDeviceProvider()


@router.get("/device")
async def get_device():
    device = await device_provider.get_device()
    if not device:
        raise HTTPException(
            status_code=404,
            detail="未检测到设备，请确认 USB 已连接且已开启 USB 调试",
        )
    return {
        "serial": device.serial,
        "model": device.model,
        "brand": device.brand,
        "android_version": device.android_version,
        "sdk_version": device.sdk_version,
        "connection": device.connection,
    }
