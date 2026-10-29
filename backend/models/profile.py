"""models/profile.py — Pydantic schemas for user profiles."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ProfileOut(BaseModel):
    user_id: str
    display_name: Optional[str]
    selected_persona: Optional[str]
    created_at: str
    updated_at: str


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    selected_persona: Optional[str] = None