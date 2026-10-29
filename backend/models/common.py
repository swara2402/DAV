"""models/common.py — Shared Pydantic types and helpers."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Generic API wrapper."""
    success: bool = True
    data: T | None = None
    error: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    has_next: bool


VALID_EXPENSE_CATEGORIES = {
    "convenience_food",
    "groceries",
    "transport",
    "shopping",
    "bills",
    "other",
}

VALID_TASK_CATEGORIES = {
    "work",
    "personal",
    "health",
    "finance",
    "household",
}