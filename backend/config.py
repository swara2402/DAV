"""Validated application settings for Life, Decoded."""
from __future__ import annotations

import os
from typing import Any
from pathlib import Path
from urllib.parse import urlparse

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENVIRONMENT: str = "development"
    APP_VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    # Only required for legacy Supabase projects still signing JWTs with HS256.
    SUPABASE_JWT_SECRET: str = ""
    DEMO_JWT_SECRET: str = "demo-secret-key-change-in-production"
    VITE_DEMO_MODE: str = "true"
    SQLITE_PATH: str = "./demo.db"
    DATA_DIR: str = "../data/synthetic/"
    MIN_QUALIFYING_WEEKS: int = 3
    MIN_BASELINE_WEEKS: int = 3
    MIN_ANALYSIS_WEEKS: int = 8
    ANALYSIS_WEEKS: int = 12
    OVERDUE_THRESHOLD: int = 3
    INSIGHT_TIMEZONE: str = "Asia/Kolkata"

    def model_post_init(self, __context: Any) -> None:
        if self.ENVIRONMENT not in {"development", "demo", "staging", "production", "test"}:
            raise ValueError("ENVIRONMENT must be development, demo, staging, production, or test")
        if self.uses_supabase:
            environment_label = "production" if self.is_production else "staging"
            if self.VITE_DEMO_MODE.lower() == "true":
                raise ValueError(f"VITE_DEMO_MODE cannot be true in {environment_label}")
            if not self.SUPABASE_URL or not self.SUPABASE_SERVICE_ROLE_KEY:
                raise ValueError(
                    f"SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in {environment_label}"
                )
            parsed = urlparse(self.SUPABASE_URL)
            if parsed.scheme != "https" or not parsed.netloc:
                raise ValueError(f"SUPABASE_URL must be a valid HTTPS URL in {environment_label}")
            origins = self._cors_origins()
            if not origins:
                raise ValueError(
                    f"CORS_ORIGINS must contain at least one explicit {environment_label} origin"
                )
            for origin in origins:
                parsed_origin = urlparse(origin)
                if origin == "*" or parsed_origin.scheme != "https" or not parsed_origin.netloc:
                    raise ValueError(
                        f"{environment_label.title()} CORS origins must be explicit HTTPS origins; "
                        "wildcards are forbidden"
                    )
            if self.is_production and (
                self.DEMO_JWT_SECRET == "demo-secret-key-change-in-production"
                or len(self.DEMO_JWT_SECRET) < 32
            ):
                raise ValueError("Set a unique DEMO_JWT_SECRET of at least 32 characters")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def uses_supabase(self) -> bool:
        """Use the hosted database in staging and production, never silently fall back to SQLite."""
        return self.ENVIRONMENT in {"staging", "production"}

    @property
    def is_demo(self) -> bool:
        return self.ENVIRONMENT in {"development", "demo", "test"}

    @property
    def data_dir_path(self):
        return (Path(__file__).resolve().parent / self.DATA_DIR).resolve()

    def _cors_origins(self) -> list[str]:
        return [item.strip().rstrip("/") for item in os.getenv("CORS_ORIGINS", "").split(",") if item.strip()]

    @property
    def allowed_cors_origins(self) -> list[str]:
        configured = self._cors_origins()
        if self.uses_supabase:
            return configured
        defaults = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]
        return list(dict.fromkeys(defaults + configured))


settings = Settings()
