from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "LogPaw"
    api_prefix: str = "/api/v1"
    adb_path: str = "adb"
    pid_refresh_interval: int = 3
    log_buffer_max_lines: int = 100_000
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_prefix = "LOGPAW_"


settings = Settings()
