"""routers/tasks.py — Task CRUD and completion endpoints."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth import get_current_user
from database import get_db
from models.task import TaskCreate, TaskUpdate, TaskComplete, TaskOut

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_profile_exists(user_id: str, email: str, db) -> None:
    now = _now()
    if db.mode == "sqlite":
        db.execute(
            "INSERT OR IGNORE INTO profiles (user_id, display_name, selected_persona, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, email.split("@")[0] if email else "User", None, now, now),
        )
    else:
        db.client.table("profiles").upsert({
            "user_id": user_id,
            "display_name": email.split("@")[0] if email else "User",
            "selected_persona": None,
            "created_at": now,
            "updated_at": now,
        }).execute()


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status", description="completed|open|overdue"),
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    today_str = date.today().isoformat()

    if db.mode == "sqlite":
        clauses = ["user_id = ?"]
        params: list = [user_id]
        if category:
            clauses.append("category = ?")
            params.append(category)
        if status_filter == "completed":
            clauses.append("completed_at IS NOT NULL")
        elif status_filter == "open":
            clauses.append("completed_at IS NULL")
        elif status_filter == "overdue":
            clauses.append("completed_at IS NULL AND due_date IS NOT NULL AND due_date < ?")
            params.append(today_str)

        where = " AND ".join(clauses)
        sql = f"SELECT * FROM tasks WHERE {where} ORDER BY due_date ASC, created_at DESC"
        return db.fetchall(sql, tuple(params))
    else:
        query = db.client.table("tasks").select("*").eq("user_id", user_id)
        if category:
            query = query.eq("category", category)
        if status_filter == "completed":
            query = query.not_.is_("completed_at", "null")
        elif status_filter == "open":
            query = query.is_("completed_at", "null")
        elif status_filter == "overdue":
            query = query.is_("completed_at", "null").not_.is_("due_date", "null").lt("due_date", today_str)
        resp = query.order("due_date").execute()
        return resp.data or []


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    _ensure_profile_exists(user_id, user.get("email", ""), db)
    task_id = str(uuid.uuid4())
    now = _now()
    created_str = body.created_at.isoformat() if body.created_at else now
    due_str = body.due_date.isoformat() if body.due_date else (date.today().isoformat())  # Require due date per migration
    comp_str = body.completed_at.isoformat() if body.completed_at else None

    # Validate category is one of the allowed values per migration CHECK constraint
    allowed_categories = {'work', 'personal', 'health', 'finance', 'household'}
    if body.category is not None and body.category not in allowed_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(allowed_categories)}"
        )

    # Temporal validation
    if due_str and body.created_at and body.due_date:
        if body.created_at.date() > body.due_date:
            raise HTTPException(
                status_code=400,
                detail="Task creation date cannot be after due date",
            )
    if comp_str and body.created_at and body.completed_at:
        if body.completed_at < body.created_at.date():
            raise HTTPException(
                status_code=400,
                detail="Completion date cannot be before creation date",
            )

    data = {
        "id": task_id,
        "user_id": user_id,
        "title": body.title.strip(),
        "category": body.category or "personal",
        "due_date": due_str,
        "completed_at": comp_str,
        "created_at": created_str,
        "db_created_at": now,
        "db_updated_at": now,
        "data_source": "user_entered"  # Default to user_entered per migration
    }

    if db.mode == "sqlite":
        db.execute(
            """
            INSERT INTO tasks (id, user_id, title, category, due_date, completed_at, created_at, db_created_at, db_updated_at, data_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                task_id,
                user_id,
                data["title"],
                data["category"],
                due_str,
                comp_str,
                created_str,
                now,
                now,
                "user_entered",
            ),
        )
        return db.fetchone("SELECT * FROM tasks WHERE id = ?", (task_id,))
    else:
        resp = db.client.table("tasks").insert(data).execute()
        if not resp.data:
            raise HTTPException(status_code=500, detail="Failed to create task")
        return resp.data[0]


@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        task = db.fetchone(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id),
        )
    else:
        resp = db.client.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        task = resp.data[0] if resp.data else None

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        existing = db.fetchone(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id),
        )
    else:
        resp = db.client.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        existing = resp.data[0] if resp.data else None

    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    now = _now()
    updates = {}
    if body.title is not None:
        updates["title"] = body.title.strip()
    if body.category is not None:
        updates["category"] = body.category
        # Validate category if it's being updated
        allowed_categories = {'work', 'personal', 'health', 'finance', 'household'}
        if updates["category"] not in allowed_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(allowed_categories)}"
            )
    if body.due_date is not None:
        updates["due_date"] = body.due_date.isoformat()
    if body.completed_at is not None:
        updates["completed_at"] = body.completed_at.isoformat()
    updates["db_updated_at"] = now

    if db.mode == "sqlite":
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [task_id, user_id]
        db.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = ? AND user_id = ?",
            tuple(values),
        )
        return db.fetchone("SELECT * FROM tasks WHERE id = ?", (task_id,))
    else:
        db.client.table("tasks").update(updates).eq("id", task_id).eq("user_id", user_id).execute()
        resp = db.client.table("tasks").select("*").eq("id", task_id).execute()
        return resp.data[0]


@router.post("/{task_id}/complete", response_model=TaskOut)
async def mark_task_complete(
    task_id: str,
    body: TaskComplete,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        existing = db.fetchone(
            "SELECT * FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id),
        )
    else:
        resp = db.client.table("tasks").select("*").eq("id", task_id).eq("user_id", user_id).execute()
        existing = resp.data[0] if resp.data else None

    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")

    now = _now()
    comp_str = body.completed_at.isoformat()

    if db.mode == "sqlite":
        db.execute(
            "UPDATE tasks SET completed_at = ?, db_updated_at = ? WHERE id = ? AND user_id = ?",
            (comp_str, now, task_id, user_id),
        )
        return db.fetchone("SELECT * FROM tasks WHERE id = ?", (task_id,))
    else:
        db.client.table("tasks").update({
            "completed_at": comp_str,
            "db_updated_at": now,
        }).eq("id", task_id).eq("user_id", user_id).execute()
        resp = db.client.table("tasks").select("*").eq("id", task_id).execute()
        return resp.data[0]


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        res = db.fetchone(
            "SELECT id FROM tasks WHERE id = ? AND user_id = ?",
            (task_id, user_id),
        )
        if not res:
            raise HTTPException(status_code=404, detail="Task not found")
        db.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    else:
        resp = db.client.table("tasks").select("id").eq("id", task_id).eq("user_id", user_id).execute()
        if not resp.data:
            raise HTTPException(status_code=404, detail="Task not found")
        db.client.table("tasks").delete().eq("id", task_id).eq("user_id", user_id).execute()
    return None