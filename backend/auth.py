"""
auth.py — Authentication middleware.

Two modes:
  - Demo / development: accept a simple demo token ("demo_<persona>")
    or a signed JWT containing {"user_id": "demo_<persona>", "is_demo": true}.
  - Production: validate Supabase JWT from Authorization header.

Provides `get_current_user(request)` FastAPI dependency.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Known demo personas
# ---------------------------------------------------------------------------
DEMO_PERSONAS = {"maya", "arjun", "fresh"}
DEMO_USER_IDS = {f"demo_{p}" for p in DEMO_PERSONAS}

bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------

def _decode_demo_token(token: str) -> dict[str, Any] | None:
    """
    Accept:
      1. Plain token: "demo_maya", "demo_arjun", "demo_fresh"
      2. Signed JWT with sub = demo_<persona>
    Returns user dict or None if invalid.
    """
    # Plain token shortcut
    if token in DEMO_USER_IDS:
        persona = token.split("_", 1)[1]
        return {
            "user_id": token,
            "email": f"{persona}@demo.lifedecoded.app",
            "is_demo": True,
        }

    # Try JWT
    try:
        from jose import jwt, JWTError  # type: ignore
        payload = jwt.decode(
            token,
            settings.DEMO_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_exp": False},
        )
        user_id = payload.get("sub") or payload.get("user_id", "")
        if user_id in DEMO_USER_IDS:
            persona = user_id.split("_", 1)[1]
            return {
                "user_id": user_id,
                "email": payload.get("email", f"{persona}@demo.lifedecoded.app"),
                "is_demo": True,
            }
    except Exception:
        pass

    return None


def _decode_supabase_token(token: str) -> dict[str, Any]:
    """Validate Supabase JWT. Raises HTTPException on failure."""
    from jose import jwt, JWTError  # type: ignore

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase not configured",
        )

    try:
        # Supabase JWTs use the anon key as the JWT secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_ANON_KEY,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub", "")
        email = payload.get("email", "")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub",
            )
        return {"user_id": user_id, "email": email, "is_demo": False}
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    """
    Returns {"user_id": str, "email": str, "is_demo": bool}.
    Raises HTTP 401 if unauthenticated.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # In demo/dev mode, try demo token first
    if settings.is_demo:
        user = _decode_demo_token(token)
        if user:
            return user

    # In production (or if demo token failed in dev), try Supabase JWT
    if settings.is_production:
        return _decode_supabase_token(token)

    # Dev mode but token wasn't a valid demo token — still allow demo JWTs
    user = _decode_demo_token(token)
    if user:
        return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or unrecognized token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_demo_mode() -> None:
    """Dependency that blocks access in production."""
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo endpoints are not available in production",
        )
