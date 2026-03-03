"""Log operation API endpoints."""

from fastapi import APIRouter, Query
from fastapi.responses import PlainTextResponse

from app.websocket.log_ws import session_manager

router = APIRouter()


@router.post("/logs/system")
async def fetch_system_logs():
    capture = session_manager.get_active_capture()
    if not capture:
        return {"detail": "没有活跃的日志会话", "items": []}

    sys_logs = await capture.fetch_system_logs(capture._package)
    return {
        "items": [
            {
                "timestamp": l.timestamp,
                "level": l.level,
                "tag": l.tag,
                "pid": l.pid,
                "message": l.message,
                "source": l.source,
                "raw": l.raw,
            }
            for l in sys_logs
        ],
        "total": len(sys_logs),
    }


@router.get("/logs/export")
async def export_logs(type: str = Query(default="filtered", description="filtered 或 full")):
    capture = session_manager.get_active_capture()
    if not capture:
        return PlainTextResponse("没有活跃的日志会话", status_code=404)

    if type == "full":
        logs = capture.get_full_logs()
    else:
        logs = capture.get_filtered_logs()

    content = "\n".join(l.raw for l in logs)
    return PlainTextResponse(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=logpaw_{type}.log"},
    )


@router.get("/logs/full")
async def get_full_logs():
    capture = session_manager.get_active_capture()
    if not capture:
        return PlainTextResponse("没有活跃的日志会话", status_code=404)

    logs = capture.get_full_logs()
    content = "\n".join(l.raw for l in logs)
    return PlainTextResponse(content=content)
