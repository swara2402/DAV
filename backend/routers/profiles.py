"""Profile endpoints using the canonical user_id/display_name schema."""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from database import get_db
from models.profile import ProfileOut, ProfileUpdate

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

@router.get("/me", response_model=ProfileOut)
async def get_my_profile(user: dict = Depends(get_current_user), db=Depends(get_db)):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        profile = db.fetchone("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    else:
        resp = db.client.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()
        profile = resp.data[0] if resp.data else None
    if profile:
        return profile
    now = _now()
    profile = {"user_id": user_id, "display_name": user.get("email", "").split("@")[0] or "User",
               "selected_persona": user_id.removeprefix("demo_") if user.get("is_demo") else None,
               "created_at": now, "updated_at": now}
    if db.mode == "sqlite":
        db.execute("INSERT INTO profiles (user_id, display_name, selected_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                   (profile["user_id"], profile["display_name"], profile["selected_persona"], now, now))
    else:
        db.client.table("profiles").upsert(profile).execute()
    return profile

@router.patch("/me", response_model=ProfileOut)
async def update_my_profile(body: ProfileUpdate, user: dict = Depends(get_current_user), db=Depends(get_db)):
    user_id = user["user_id"]
    updates = body.model_dump(exclude_unset=True)
    allowed = {"display_name", "selected_persona"}
    if set(updates) - allowed:
        raise HTTPException(status_code=422, detail="Unsupported profile field")
    if updates.get("selected_persona") not in (None, "maya", "arjun", "fresh"):
        raise HTTPException(status_code=422, detail="Invalid selected_persona")
    updates["updated_at"] = _now()
    if db.mode == "sqlite":
        current = db.fetchone("SELECT user_id FROM profiles WHERE user_id = ?", (user_id,))
        if not current:
            raise HTTPException(status_code=404, detail="Profile not found")
        clause = ", ".join(f"{key} = ?" for key in updates)
        db.execute(f"UPDATE profiles SET {clause} WHERE user_id = ?", tuple(updates.values()) + (user_id,))
        return db.fetchone("SELECT * FROM profiles WHERE user_id = ?", (user_id,))
    db.client.table("profiles").update(updates).eq("user_id", user_id).execute()
    resp = db.client.table("profiles").select("*").eq("user_id", user_id).limit(1).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return resp.data[0]
