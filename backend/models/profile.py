"""models/profile.py — Pydantic schemas for user profiles."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: str
    email: Optional[str]
    name: Optional[str]
    currency: str
    created_at: str
    updated_at: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
