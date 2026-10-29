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
      1. Plain token: "demo_maya", "demo_arjun", "demo_fresh" (ONLY IN DEMO MODE)
      2. Signed JWT with sub = demo_<persona>
    Returns user dict or None if invalid.
    """
    # Only allow demo token authentication if we're actually in demo mode
    if not settings.is_demo:
        logger.debug("Demo token rejected in non-demo environment")
        return None

    # Plain token shortcut - ONLY enabled in demo/development mode
    if token in DEMO_USER_IDS:
        persona = token.split("_", 1)[1]
        logger.debug(f"Valid plain demo token accepted for persona: {persona}")
        return {
            "user_id": token,
            "email": f"{persona}@demo.lifedecoded.app",
            "is_demo": True,
        }

    # Try JWT - verify expiration except in pure demo mode
    try:
        from jose import jwt, JWTError  # type: ignore
        
        # First validate header algorithm to prevent alg switching attacks
        header = jwt.get_unverified_header(token)
        if header.get("alg") not in ["HS256"]:
            logger.warning(f"Unsupported JWT algorithm in demo token: {header.get('alg')}")
            return None

        # In pure demo mode (local development only), allow expired tokens for convenience
        # In all other environments, verify token expiration
        verify_exp = not (settings.ENVIRONMENT == "demo")
        payload = jwt.decode(
            token,
            settings.DEMO_JWT_SECRET,
            algorithms=["HS256"],
            options={
                "verify_exp": verify_exp,
                "verify_aud": True,
                "require_sub": True
            },
            audience="demo",
            issuer="lifedecoded-demo"
        )
        user_id = payload.get("sub", "")
        if user_id in DEMO_USER_IDS:
            persona = user_id.split("_", 1)[1]
            logger.debug(f"Valid signed demo JWT accepted for persona: {persona}")
            return {
                "user_id": user_id,
                "email": payload.get("email", f"{persona}@demo.lifedecoded.app"),
                "is_demo": True,
            }
    except JWTError as e:
        # Handle expected JWT validation errors gracefully (expired, invalid signature, etc.)
        logger.debug(f"Demo JWT validation failed (expected in normal usage): {type(e).__name__}")
        return None
    except ValueError as e:
        # Handle value errors from token parsing
        logger.warning(f"Demo token parsing error: {type(e).__name__}")
        return None
    except Exception as e:
        # Log unexpected errors with full context but don't expose details to clients
        logger.error(f"Unexpected error in demo token validation: {str(e)}", exc_info=True)
        return None

    return None


def _decode_supabase_token(token: str) -> dict[str, Any]:
    """
    Validate Supabase JWT per official Supabase authentication specifications.
    Extracts the actual JWT secret from the anon key and verifies all critical claims.
    Raises HTTPException on failure.
    """
    from jose import jwt, JWTError  # type: ignore
    import base64
    from urllib.parse import urlparse

    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        logger.error("Supabase not properly configured")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable",
        )

    try:
        # Supabase JWT secrets are base64 encoded in the anon key (last segment)
        # Extract the actual JWT secret from the anon key
        anon_key_parts = settings.SUPABASE_ANON_KEY.split(".")
        if len(anon_key_parts) != 3:
            raise ValueError("Invalid Supabase anon key format")
            
        # The secret is the last part, base64 decoded
        jwt_secret = base64.urlsafe_b64decode(anon_key_parts[2] + "=" * (4 - len(anon_key_parts[2]) % 4))
        
        # First extract and validate the JWT header to check algorithm (prevents alg:none attacks)
        header = jwt.get_unverified_header(token)
        if header.get("alg") not in ["HS256", "RS256"]:
            logger.warning(f"Unsupported JWT algorithm: {header.get('alg')}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        # Extract project reference from SUPABASE_URL for issuer validation using proper URL parsing
        parsed_url = urlparse(settings.SUPABASE_URL)
        project_ref = parsed_url.netloc.split(".")[0]
        expected_issuer = f"https://{project_ref}.supabase.co"

        # Validate all standard JWT claims per Supabase's official authentication spec
        # Official claim requirements: https://supabase.com/docs/guides/auth/auth-jwt#jwt-claims
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={
                "verify_exp": True,  # Always verify expiration - critical for security
                "verify_aud": True,  # Enforce audience verification
                "verify_iss": True,  # Enforce issuer verification
                "require_sub": True,  # Require subject claim to be present
                "require_exp": True,
                "require_iss": True,
                "require_aud": True,
            },
            audience="authenticated",
            issuer=expected_issuer,
        )
        
        user_id = payload.get("sub", "")
        email = payload.get("email", "")
        exp = payload.get("exp")
        iat = payload.get("iat")
        
        # Additional safety checks even though require_sub is enabled
        if not user_id:
            logger.warning("JWT missing required 'sub' claim")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        
        # Ensure time claims exist to prevent replay attacks
        if exp is None or iat is None:
            logger.warning("JWT missing required time claims (exp/iat)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        logger.info(f"Successfully authenticated production user: {user_id}")
        return {"user_id": user_id, "email": email, "is_demo": False}
    except JWTError as e:
        logger.warning(f"JWT validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except Exception as e:
        logger.error(f"Unexpected error during authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
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

    # ONLY allow demo tokens if settings.is_demo is True (strict enforcement)
    if settings.is_demo:
        user = _decode_demo_token(token)
        if user:
            return user

    # All other environments (production, staging, development non-demo) must use Supabase tokens
    return _decode_supabase_token(token)


def require_demo_mode() -> None:
    """Dependency that blocks access in production. Ensures demo endpoints are only available in demo mode."""
    if not settings.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo endpoints are only available in demo mode",
        )


def require_non_demo(user: dict = Depends(get_current_user)) -> None:
    """Dependency that blocks demo users from accessing production/non-demo endpoints. Fixes SEC-07."""
    if user.get("is_demo"):
        logger.warning("Demo user attempted to access non-demo endpoint")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo users cannot access this endpoint",
        )