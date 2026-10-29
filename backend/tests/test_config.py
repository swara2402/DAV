"""Regression tests for fail-closed production configuration."""
import pytest
from pydantic import ValidationError

from config import Settings


def production_settings(**overrides) -> Settings:
    values = {
        "ENVIRONMENT": "production",
        "VITE_DEMO_MODE": "false",
        "SUPABASE_URL": "https://example-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "server-only-test-key",
        "DEMO_JWT_SECRET": "test-only-secret-that-is-at-least-32-characters",
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)


def test_production_accepts_explicit_https_cors_origin(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://app.example.com")
    configured = production_settings()
    assert configured.is_production
    assert configured.allowed_cors_origins == ["https://app.example.com"]


@pytest.mark.parametrize(
    "origin",
    [
        "*",
        "http://app.example.com",
        "app.example.com",
        "https://",
    ],
)
def test_production_rejects_unsafe_cors_origins(
    monkeypatch: pytest.MonkeyPatch, origin: str
):
    monkeypatch.setenv("CORS_ORIGINS", origin)
    with pytest.raises(ValidationError, match="Production CORS origins"):
        production_settings()


def test_production_requires_explicit_cors_origin(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    with pytest.raises(ValidationError, match="CORS_ORIGINS"):
        production_settings()


def test_production_rejects_demo_mode(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://app.example.com")
    with pytest.raises(ValidationError, match="VITE_DEMO_MODE"):
        production_settings(VITE_DEMO_MODE="true")


def test_production_requires_supabase_server_credentials(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://app.example.com")
    with pytest.raises(ValidationError, match="SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"):
        production_settings(SUPABASE_SERVICE_ROLE_KEY="")
