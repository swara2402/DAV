"""routers/expenses.py — Expense CRUD endpoints."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user, require_non_demo
from database import get_db
from models.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_profile_exists(user_id: str, email: str, db) -> None:
    now = _now()
    if db.mode == "sqlite":
        db.execute(
            "INSERT OR IGNORE INTO profiles (user_id, display_name, selected_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, (email.split("@")[0] if email else "User"), None, now, now),
        )
    else:
        db.client.table("profiles").upsert({
            "user_id": user_id,
            "display_name": email.split("@")[0] if email else "User",
            "selected_persona": None,
            "created_at": now,
            "updated_at": now,
        }).execute()


@router.get("", response_model=list[ExpenseOut])
async def list_expenses(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    offset = (page - 1) * page_size

    if db.mode == "sqlite":
        clauses = ["user_id = ?"]
        params: list = [user_id]
        if start_date:
            clauses.append("date >= ?")
            params.append(start_date)
        if end_date:
            clauses.append("date <= ?")
            params.append(end_date)
        if category:
            clauses.append("category = ?")
            params.append(category)

        where = " AND ".join(clauses)
        sql = f"SELECT * FROM expenses WHERE {where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?"
        params.extend([page_size, offset])
        return db.fetchall(sql, tuple(params))
    else:
        query = db.client.table("expenses").select("*").eq("user_id", user_id)
        if start_date:
            query = query.gte("date", start_date)
        if end_date:
            query = query.lte("date", end_date)
        if category:
            query = query.eq("category", category)
        resp = query.order("date", desc=True).range(offset, offset + page_size - 1).execute()
        return resp.data or []


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    body: ExpenseCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    _ensure_profile_exists(user_id, user.get("email", ""), db)
    expense_id = str(uuid.uuid4())
    now = _now()
    date_str = body.date.isoformat()

    data = {
        "id": expense_id,
        "user_id": user_id,
        "date": date_str,
        "amount": round(body.amount, 2),
        "category": body.category,
        "description": body.description or "",
        "created_at": now,
        "updated_at": now,
    }

    if db.mode == "sqlite":
        db.execute(
            """
            INSERT INTO expenses (id, user_id, date, amount, category, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                expense_id,
                user_id,
                date_str,
                data["amount"],
                data["category"],
                data["description"],
                now,
                now,
            ),
        )
        return db.fetchone("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    else:
        resp = db.client.table("expenses").insert(data).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create expense")
        return resp.data[0]


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(
    expense_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        expense = db.fetchone(
            "SELECT * FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("*")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        expense = resp.data[0] if resp.data else None

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.put("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: str,
    body: ExpenseUpdate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    # Check ownership
    if db.mode == "sqlite":
        existing = db.fetchone(
            "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("id")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        existing = resp.data[0] if resp.data else None

    if not existing:
        raise HTTPException(status_code=404, detail="Expense not found")

    now = _now()
    updates = {}
    if body.date is not None:
        updates["date"] = body.date.isoformat()
    if body.amount is not None:
        updates["amount"] = round(body.amount, 2)
    if body.category is not None:
        updates["category"] = body.category
    if body.description is not None:
        updates["description"] = body.description
    updates["updated_at"] = now

    if db.mode == "sqlite":
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [expense_id, user_id]
        db.execute(
            f"UPDATE expenses SET {set_clause} WHERE id = ? AND user_id = ?",
            tuple(values),
        )
        return db.fetchone("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    else:
        db.client.table("expenses").update(updates).eq("id", expense_id).eq("user_id", user_id).execute()
        resp = db.client.table("expenses").select("*").eq("id", expense_id).execute()
        return resp.data[0]


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        res = db.fetchone(
            "SELECT id FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
        if not res:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.execute(
            "DELETE FROM expenses WHERE id = ? AND user_id = ?",
            (expense_id, user_id),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("id")
            .eq("id", expense_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=404, detail="Expense not found")
        db.client.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()
    return None