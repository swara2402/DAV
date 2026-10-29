"""routers/profiles.py — Profile endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from auth import get_current_user, require_non_demo
from database import get_db
from models.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("/me", response_model=ProfileOut)
async def get_my_profile(
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    """Get current user profile, creating one if it doesn't exist."""
    user_id = user["user_id"]

    if db.mode == "sqlite":
        profile = db.fetchone("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    else:
        resp = db.client.table("profiles").select("*").eq("user_id", user_id).execute()
        profile = resp.data[0] if resp.data else None

    if not profile:
        now = _now()
        profile = {
            "user_id": user_id,
            "display_name": "User",  # Matches migration default
            "selected_persona": None,
            "created_at": now,
            "updated_at": now,
        }
        if db.mode == "sqlite":
            db.execute(
                "INSERT INTO profiles (user_id, display_name, selected_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                (user_id, profile["display_name"], profile["selected_persona"], now, now),
            )
        else:
            db.client.table("profiles").insert(profile).execute()

    return profile


@router.patch("/me", response_model=ProfileOut)
async def update_my_profile(
    body: ProfileUpdate,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    now = _now()
    updates = body.model_dump(exclude_none=True)
    updates["updated_at"] = now

    if db.mode == "sqlite":
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [user_id]
        db.execute(f"UPDATE profiles SET {set_clause} WHERE user_id = ?", tuple(values))
        profile = db.fetchone("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    else:
        db.client.table("profiles").update(updates).eq("user_id", user_id).execute()
        resp = db.client.table("profiles").select("*").eq("user_id", user_id).execute()
        profile = resp.data[0] if resp.data else None

    return profile