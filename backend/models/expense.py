"""models/expense.py — Pydantic schemas for expenses."""
from __future__ import annotations

from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from models.common import VALID_EXPENSE_CATEGORIES


class ExpenseCreate(BaseModel):
    date: date
    amount: float = Field(..., gt=0, description="Amount must be positive")
    category: str
    description: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(
                f"Invalid category '{v}'. Must be one of: {sorted(VALID_EXPENSE_CATEGORIES)}"
            )
        return v


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    description: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_EXPENSE_CATEGORIES:
            raise ValueError(f"Invalid category '{v}'")
        return v


class ExpenseOut(BaseModel):
    id: str
    user_id: str
    date: str  # stored as ISO string in SQLite
    amount: float
    category: str
    description: Optional[str]
    data_source: Optional[str] = None
    created_at: str
    updated_at: str
