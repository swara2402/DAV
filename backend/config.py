"""
config.py — Application settings loaded from environment variables.
"""
from __future__ import annotations

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Environment
    ENVIRONMENT: str = "development"
    APP_VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"

    # Supabase (production only)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    # Demo / JWT
    DEMO_JWT_SECRET: str = "demo-secret-key-change-in-production"
    VITE_DEMO_MODE: str = "true"

    # SQLite path for demo/dev
    SQLITE_PATH: str = "./demo.db"

    # Data directory for synthetic CSVs
    DATA_DIR: str = "../data/synthetic/"

    # Insight engine thresholds
    MIN_QUALIFYING_WEEKS: int = 3
    MIN_BASELINE_WEEKS: int = 3
    MIN_ANALYSIS_WEEKS: int = 8

    # Analysis window
    ANALYSIS_WEEKS: int = 12
    OVERDUE_THRESHOLD: int = 3
    INSIGHT_TIMEZONE: str = "Asia/Kolkata"

    @property
    def is_demo(self) -> bool:
        return (
            self.ENVIRONMENT in ("development", "demo")
            or self.VITE_DEMO_MODE.lower() == "true"
        )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def data_dir_path(self) -> Path:
        """Resolve DATA_DIR relative to the backend directory."""
        p = Path(self.DATA_DIR)
        if not p.is_absolute():
            backend_dir = Path(__file__).parent
            p = (backend_dir / p).resolve()
        return p


settings = Settings()
