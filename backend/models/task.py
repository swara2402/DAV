"""models/task.py — Pydantic schemas for tasks."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from models.common import VALID_TASK_CATEGORIES


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    category: Optional[str] = None
    due_date: Optional[date] = None
    completed_at: Optional[date] = None
    created_at: Optional[datetime] = None

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if not isinstance(v, str) or not v.strip():
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip()

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_TASK_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[str] = None
    due_date: Optional[date] = None
    completed_at: Optional[date] = None

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not isinstance(v, str) or not v.strip()):
            raise ValueError("Title cannot be empty or whitespace")
        return v.strip() if isinstance(v, str) else v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_TASK_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'")
        return v


class TaskComplete(BaseModel):
    completed_at: date


class TaskOut(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    due_date: str
    completed_at: Optional[str]
    created_at: str  # User-facing created_at (from task creation)
    db_created_at: str
    db_updated_at: str