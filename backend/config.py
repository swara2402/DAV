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

    def model_post_init(self, __context__: Any) -> None:
        """Validate critical configuration after loading."""
        # Fail closed in production with any insecure configuration
        if self.is_production:
            # Block production if any demo/development settings are enabled
            if self.ENVIRONMENT != "production":
                raise ValueError("ENVIRONMENT must be set to 'production' in production")
            if self.VITE_DEMO_MODE.lower() == "true":
                raise ValueError("VITE_DEMO_MODE cannot be true in production")
            
            # Validate all required production credentials exist
            if not self.SUPABASE_URL or not self.SUPABASE_SERVICE_ROLE_KEY or not self.SUPABASE_ANON_KEY:
                raise ValueError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must all be set in production")
            
            # Validate secrets are not using defaults
            if self.DEMO_JWT_SECRET == "demo-secret-key-change-in-production":
                raise ValueError("DEMO_JWT_SECRET must be changed from default in production")
            
            # Validate secret strength (at least 32 characters for all JWT/secrets)
            if len(self.DEMO_JWT_SECRET) < 32:
                raise ValueError("DEMO_JWT_SECRET must be at least 32 characters long in production")
            if len(self.SUPABASE_SERVICE_ROLE_KEY) < 32:
                raise ValueError("SUPABASE_SERVICE_ROLE_KEY must be at least 32 characters long in production")
            if len(self.SUPABASE_ANON_KEY) < 32:
                raise ValueError("SUPABASE_ANON_KEY must be at least 32 characters long in production")
            
            # Validate SUPABASE_URL format
            from urllib.parse import urlparse
            try:
                parsed = urlparse(self.SUPABASE_URL)
                if parsed.scheme != "https":
                    raise ValueError("SUPABASE_URL must use HTTPS in production")
            except Exception as e:
                raise ValueError(f"Invalid SUPABASE_URL format: {e}")
            
            # Validate CORS origins don't contain wildcard in production
            import os
            cors_origins = os.getenv("CORS_ORIGINS", "")
            if cors_origins:
                origins = [o.strip() for o in cors_origins.split(",")]
                if "*" in origins:
                    raise ValueError("Wildcard CORS origin (*) is not allowed in production")
                # Validate each origin is a proper URL
                from urllib.parse import urlparse
                for origin in origins:
                    try:
                        result = urlparse(origin)
                        if not all([result.scheme, result.netloc]):
                            raise ValueError(f"Invalid CORS origin format: {origin}")
                        if result.scheme not in ["https"]:
                            raise ValueError(f"CORS origin must use HTTPS in production: {origin}")
                    except Exception as e:
                        raise ValueError(f"Invalid CORS origin {origin}: {str(e)}")

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
        """
        Demo mode is ONLY enabled if ENVIRONMENT is explicitly 'development' or 'demo'.
        Never enable demo mode in production, regardless of frontend settings.
        This prevents accidental exposure of demo authentication in production.
        """
        return self.ENVIRONMENT in ("development", "demo") and not self.is_production

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def allowed_cors_origins(self) -> list[str]:
        """
        Get validated CORS origins. In production, never allows wildcards.
        Returns list of properly formatted origins.
        """
        # Default local development origins
        default_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
        ]
        
        # Parse environment CORS origins
        env_cors = os.getenv("CORS_ORIGINS", "")
        parsed_origins = []
        if env_cors:
            for origin in env_cors.split(","):
                trimmed = origin.strip()
                if trimmed:
                    parsed_origins.append(trimmed)
        
        # In production, validate all origins and reject wildcards
        if self.is_production:
            all_origins = default_origins + parsed_origins
            # Filter out any wildcards
            validated = []
            for origin in all_origins:
                if origin == "*":
                    logger.error("Wildcard CORS origin rejected in production")
                    continue
                # Basic URL validation for production origins
                if origin.startswith(("http://", "https://")):
                    validated.append(origin)
                else:
                    logger.warning(f"Invalid origin format rejected in production: {origin}")
            return validated
        else:
            # In development, allow localhost defaults + any parsed origins
            return default_origins + parsed_origins

    @property
    def allowed_cors_origins(self) -> list[str]:
        """
        Parse and validate CORS origins from environment.
        In production, rejects wildcards and invalid URLs.
        """
        import os
        from urllib.parse import urlparse
        
        cors_env = os.getenv("CORS_ORIGINS", "")
        if not cors_env:
            # Default to frontend dev server in development
            if self.is_demo or self.ENVIRONMENT == "development":
                return ["http://localhost:5173", "http://127.0.0.1:5173"]
            return []
            
        origins = [o.strip() for o in cors_env.split(",") if o.strip()]
        
        # Production validations
        if self.is_production:
            if "*" in origins:
                raise ValueError("Wildcard CORS origin (*) is forbidden in production")
            # Validate each origin format
            for origin in origins:
                try:
                    parsed = urlparse(origin)
                    if not all([parsed.scheme, parsed.netloc]):
                        raise ValueError(f"Invalid CORS origin format: {origin}")
                    if parsed.scheme not in ["https"]:
                        raise ValueError(f"Production CORS origins must use HTTPS: {origin}")
                except Exception as e:
                    raise ValueError(f"Invalid CORS origin {origin}: {str(e)}")
                    
        return origins

    @property
    def allowed_cors_origins(self) -> list[str]:
        """
        Return validated list of CORS origins.
        In development: defaults to localhost:5173 (frontend Vite dev server)
        In production: validates configured origins to reject wildcards and enforce HTTPS
        """
        import os
        cors_origins = os.getenv("CORS_ORIGINS", "")
        if cors_origins:
            origins = [o.strip() for o in cors_origins.split(",") if o.strip()]
        else:
            # Default development origins
            origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
            
        # Validate in production
        if self.is_production:
            if "*" in origins:
                raise ValueError("Wildcard CORS origin (*) is not allowed in production")
            from urllib.parse import urlparse
            for origin in origins:
                try:
                    result = urlparse(origin)
                    if not all([result.scheme, result.netloc]):
                        raise ValueError(f"Invalid CORS origin format: {origin}")
                    if result.scheme != "https":
                        raise ValueError(f"CORS origin must use HTTPS in production: {origin}")
                except Exception as e:
                    raise ValueError(f"Invalid CORS origin {origin}: {str(e)}")
                    
        return origins

    @property
    def data_dir_path(self) -> Path:
        """Resolve DATA_DIR relative to the backend directory."""
        p = Path(self.DATA_DIR)
        if not p.is_absolute():
            backend_dir = Path(__file__).parent
            p = (backend_dir / p).resolve()
        return p


settings = Settings()