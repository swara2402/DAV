"""Authentication dependencies for demo and Supabase-backed production."""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings

logger = logging.getLogger(__name__)
DEMO_PERSONAS = {"maya", "arjun", "fresh"}
DEMO_USER_IDS = {f"demo_{persona}" for persona in DEMO_PERSONAS}
bearer_scheme = HTTPBearer(auto_error=False)


def _unauthorized() -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})


def _decode_demo_token(token: str) -> dict[str, Any] | None:
    if not settings.is_demo:
        return None
    if token in DEMO_USER_IDS:
        persona = token.removeprefix("demo_")
        return {"user_id": token, "email": f"{persona}@demo.lifedecoded.app", "is_demo": True}
    try:
        header = jwt.get_unverified_header(token)
        if header.get("alg") != "HS256":
            return None
        payload = jwt.decode(
            token, settings.DEMO_JWT_SECRET, algorithms=["HS256"],
            audience="demo", issuer="lifedecoded-demo",
            options={"require_sub": True, "require_exp": True},
        )
        user_id = payload.get("sub")
        if user_id not in DEMO_USER_IDS:
            return None
        persona = user_id.removeprefix("demo_")
        return {"user_id": user_id, "email": payload.get("email", f"{persona}@demo.lifedecoded.app"), "is_demo": True}
    except (JWTError, ValueError, TypeError):
        return None


@lru_cache(maxsize=1)
def _fetch_supabase_jwks() -> dict[str, Any]:
    """Fetch trusted signing keys from this configured Supabase project's Auth JWKS endpoint."""
    base = settings.SUPABASE_URL.rstrip("/")
    if not base or urlparse(base).scheme != "https":
        raise RuntimeError("Supabase URL is not configured as HTTPS")
    response = httpx.get(f"{base}/auth/v1/.well-known/jwks.json", timeout=5.0)
    response.raise_for_status()
    payload = response.json()
    keys = payload.get("keys", [])
    if not isinstance(keys, list) or not keys:
        raise RuntimeError("Supabase JWKS endpoint returned no signing keys")
    return {key.get("kid"): key for key in keys if key.get("kid")}


def _decode_supabase_token(token: str) -> dict[str, Any]:
    if not settings.SUPABASE_URL:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if algorithm == "HS256":
            # Legacy Supabase JWT secret is a dedicated secret, never the public anon key.
            if not settings.SUPABASE_JWT_SECRET:
                logger.error("Received legacy HS256 token but SUPABASE_JWT_SECRET is not configured")
                raise _unauthorized()
            key: Any = settings.SUPABASE_JWT_SECRET
        elif algorithm in {"ES256", "RS256"}:
            kid = header.get("kid")
            key = _fetch_supabase_jwks().get(kid)
            if not key:
                raise _unauthorized()
        else:
            raise _unauthorized()

        host = urlparse(settings.SUPABASE_URL).netloc
        issuer = f"https://{host}/auth/v1"
        payload = jwt.decode(
            token, key, algorithms=[algorithm], audience="authenticated", issuer=issuer,
            options={"require_sub": True, "require_exp": True, "require_iss": True, "require_aud": True},
        )
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise _unauthorized()
        return {"user_id": user_id, "email": payload.get("email", ""), "is_demo": False}
    except HTTPException:
        raise
    except (JWTError, httpx.HTTPError, ValueError, TypeError, KeyError, RuntimeError) as exc:
        logger.warning("Supabase JWT validation failed (%s)", type(exc).__name__)
        raise _unauthorized() from None


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header required", headers={"WWW-Authenticate": "Bearer"})
    token = credentials.credentials
    if settings.is_demo:
        demo_user = _decode_demo_token(token)
        if demo_user:
            return demo_user
    return _decode_supabase_token(token)


def require_demo_mode() -> None:
    if not settings.is_demo:
        raise HTTPException(status_code=403, detail="Demo endpoints are only available in demo mode")


def require_non_demo(user: dict = Depends(get_current_user)) -> None:
    if user.get("is_demo"):
        raise HTTPException(status_code=403, detail="This endpoint requires an authenticated account")
