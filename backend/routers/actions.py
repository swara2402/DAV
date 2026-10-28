"""routers/actions.py — Insight action and follow-up outcome tracking."""
from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/v1/actions", tags=["actions"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class ActionCreate(BaseModel):
    insight_id: Optional[str] = None
    action_text: str = Field(..., min_length=1, max_length=1000)


class ActionOut(BaseModel):
    id: str
    user_id: str
    insight_id: Optional[str]
    action_text: str
    created_at: str
    followup_window_days: int = 28
    status: str = "pending"  # "pending" | "sufficient_data" | "insufficient_data"


class FollowupOutcome(BaseModel):
    action_id: str
    action_text: str
    tried_at: str
    evaluation_date: str
    followup_window_days: int
    days_elapsed: int
    status: str  # "insufficient_data" | "sufficient_data"
    message: str
    baseline_cf_avg: Optional[float] = None
    followup_cf_avg: Optional[float] = None
    percent_change: Optional[float] = None
    causation_disclaimer: str = (
        "Note: Before/after comparison shows observed differences over time and does not prove that "
        "the action caused any change in spending. Many external factors influence weekly habits."
    )


@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
async def create_action(
    body: ActionCreate,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    action_id = str(uuid.uuid4())
    now = _now()

    if db.mode == "sqlite":
        db.execute(
            """
            INSERT INTO actions (id, user_id, insight_id, action_text, created_at, follow_up_data)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (action_id, user_id, body.insight_id, body.action_text.strip(), now, None),
        )
        row = db.fetchone("SELECT * FROM actions WHERE id = ?", (action_id,))
    else:
        resp = db.client.table("actions").insert({
            "id": action_id,
            "user_id": user_id,
            "insight_id": body.insight_id,
            "action_text": body.action_text.strip(),
            "created_at": now,
        }).execute()
        row = resp.data[0]

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "insight_id": row.get("insight_id"),
        "action_text": row["action_text"],
        "created_at": row["created_at"],
        "followup_window_days": 28,
        "status": "pending",
    }


@router.get("", response_model=list[ActionOut])
async def list_actions(
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        rows = db.fetchall(
            "SELECT * FROM actions WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
    else:
        resp = db.client.table("actions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        rows = resp.data or []

    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "insight_id": r.get("insight_id"),
            "action_text": r["action_text"],
            "created_at": r["created_at"],
            "followup_window_days": 28,
            "status": "pending",
        }
        for r in rows
    ]


@router.get("/{action_id}/followup", response_model=FollowupOutcome)
async def get_action_followup(
    action_id: str,
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        action = db.fetchone(
            "SELECT * FROM actions WHERE id = ? AND user_id = ?",
            (action_id, user_id),
        )
    else:
        resp = db.client.table("actions").select("*").eq("id", action_id).eq("user_id", user_id).execute()
        action = resp.data[0] if resp.data else None

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    created_at_dt = datetime.fromisoformat(action["created_at"].replace("Z", "+00:00"))
    created_date = created_at_dt.date()
    today = date.today()
    days_elapsed = (today - created_date).days
    followup_window_days = 28

    # Check if 28 days (4 complete weeks) have elapsed
    if days_elapsed < followup_window_days:
        days_remaining = followup_window_days - days_elapsed
        return FollowupOutcome(
            action_id=action_id,
            action_text=action["action_text"],
            tried_at=action["created_at"],
            evaluation_date=today.isoformat(),
            followup_window_days=followup_window_days,
            days_elapsed=days_elapsed,
            status="insufficient_data",
            message=(
                f"Not enough data yet. {days_elapsed} of {followup_window_days} days have passed. "
                f"Full follow-up evaluation requires 4 complete weeks of records ({days_remaining} days remaining)."
            ),
        )

    # If 28+ days have elapsed, compute subsequent convenience food spending vs baseline
    followup_end = created_date + timedelta(days=followup_window_days)
    if db.mode == "sqlite":
        post_rows = db.fetchall(
            """
            SELECT amount FROM expenses
            WHERE user_id = ?
              AND category = 'convenience_food'
              AND date >= ?
              AND date <= ?
            """,
            (user_id, created_date.isoformat(), followup_end.isoformat()),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("amount")
            .eq("user_id", user_id)
            .eq("category", "convenience_food")
            .gte("date", created_date.isoformat())
            .lte("date", followup_end.isoformat())
            .execute()
        )
        post_rows = resp.data or []

    if len(post_rows) < 4:
        return FollowupOutcome(
            action_id=action_id,
            action_text=action["action_text"],
            tried_at=action["created_at"],
            evaluation_date=today.isoformat(),
            followup_window_days=followup_window_days,
            days_elapsed=days_elapsed,
            status="insufficient_data",
            message="Follow-up window completed, but fewer than 4 expense records exist in the follow-up period to evaluate outcomes reliably.",
        )

    total_cf = sum(float(r["amount"]) for r in post_rows)
    followup_weekly_avg = round(total_cf / 4.0, 2)

    return FollowupOutcome(
        action_id=action_id,
        action_text=action["action_text"],
        tried_at=action["created_at"],
        evaluation_date=today.isoformat(),
        followup_window_days=followup_window_days,
        days_elapsed=days_elapsed,
        status="sufficient_data",
        message=f"Follow-up complete across 4 weeks. Subsequent convenience food spending averaged ₹{followup_weekly_avg:,.2f}/week.",
        followup_cf_avg=followup_weekly_avg,
    )

