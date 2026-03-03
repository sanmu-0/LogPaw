"""WebSocket endpoint for real-time log streaming."""

import json
import logging

from fastapi import WebSocket, WebSocketDisconnect

from app.core.android.device import AndroidDeviceProvider
from app.core.android.log_capture import LogCapture
from app.core.base import LogLine

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages the single active log capture session."""

    def __init__(self):
        self._capture: LogCapture | None = None
        self._ws: WebSocket | None = None

    def get_active_capture(self) -> LogCapture | None:
        return self._capture

    async def start(self, ws: WebSocket, package_name: str, device_provider: AndroidDeviceProvider):
        await self.stop()

        client = device_provider.client
        self._capture = LogCapture(client)
        self._ws = ws

        async def on_log(log: LogLine):
            try:
                await ws.send_json({
                    "type": "log",
                    "timestamp": log.timestamp,
                    "level": log.level,
                    "tag": log.tag,
                    "pid": log.pid,
                    "tid": log.tid,
                    "message": log.message,
                    "source": log.source,
                    "raw": log.raw,
                })
            except Exception:
                pass

        async def on_status(data: dict):
            try:
                await ws.send_json(data)
            except Exception:
                pass

        self._capture.set_callbacks(on_filtered_log=on_log, on_status=on_status)
        await self._capture.start_capture(package_name)

    async def stop(self):
        if self._capture:
            await self._capture.stop_capture()
            self._capture = None
        self._ws = None


session_manager = SessionManager()


async def log_websocket_endpoint(websocket: WebSocket, package_name: str):
    await websocket.accept()
    logger.info("WebSocket connected for package: %s", package_name)

    from app.api.devices import device_provider

    device = await device_provider.get_device()
    if not device:
        await websocket.send_json({
            "type": "error",
            "message": "未检测到设备",
        })
        await websocket.close()
        return

    try:
        await session_manager.start(websocket, package_name, device_provider)

        await websocket.send_json({
            "type": "status",
            "event": "connected",
            "message": f"已开始采集 {package_name} 的日志",
        })

        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                if action == "clear":
                    if session_manager._capture:
                        session_manager._capture._filtered_logs.clear()
                    await websocket.send_json({
                        "type": "status",
                        "event": "cleared",
                        "message": "日志已清空",
                    })
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected for %s", package_name)
    except Exception:
        logger.exception("WebSocket error for %s", package_name)
    finally:
        await session_manager.stop()
