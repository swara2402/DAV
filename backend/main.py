"""
main.py — FastAPI application entry point for Life, Decoded.
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import init_db
from routers import health, profiles, expenses, tasks, dashboard, insights, actions, demo

# Logging setup
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("lifedecoded")

# Optional Sentry initialization
if os.getenv("SENTRY_DSN"):
    try:
        import sentry_sdk
        sentry_sdk.init(
            dsn=os.getenv("SENTRY_DSN"),
            traces_sample_rate=0.2,
            environment=settings.ENVIRONMENT,
        )
        logger.info("Sentry monitoring initialized")
    except Exception as e:
        logger.warning(f"Could not initialize Sentry: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Life, Decoded API...")
    init_db()
    logger.info(f"Database initialized. Environment: {settings.ENVIRONMENT}")
    yield
    logger.info("Shutting down Life, Decoded API...")


app = FastAPI(
    title="Life, Decoded API",
    description="Explainable personal behavioral and financial analytics engine.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS configuration
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
env_cors = os.getenv("CORS_ORIGINS", "")
if env_cors:
    for origin in env_cors.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in allowed_origins:
            allowed_origins.append(trimmed)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# Include Routers
app.include_router(health.router)
app.include_router(profiles.router)
app.include_router(expenses.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(actions.router)
app.include_router(demo.router)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

