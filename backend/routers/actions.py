"""routers/actions.py — Insight action and follow-up outcome tracking."""
from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/api/v1/actions", tags=["actions"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _observed_weeks(rows: list[dict], start: date, end: date) -> set[date]:
    """Distinct Monday-start weeks with at least one record in [start, end)."""
    weeks: set[date] = set()
    for row in rows:
        try:
            day = date.fromisoformat(str(row["date"])[:10])
        except (KeyError, TypeError, ValueError):
            continue
        if start <= day < end:
            weeks.add(day - timedelta(days=day.weekday()))
    return weeks


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
    followup_status: str = "pending"  # "pending" | "sufficient_data" | "insufficient_data"


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

    # A manual action can exist without a cached insight; keep the DB contract non-null.
    insight_id = body.insight_id or "manual"

    data = {
        "id": action_id,
        "user_id": user_id,
        "insight_id": insight_id,
        "action_text": body.action_text.strip(),
        "tried_at": now,
        "followup_window_days": 28,
        "followup_status": "pending",
        "outcome_metrics": None,
        "created_at": now,
        "updated_at": now
    }

    if db.mode == "sqlite":
        db.execute(
            """
            INSERT INTO insight_actions (id, user_id, insight_id, action_text, tried_at, followup_window_days, followup_status, outcome_metrics, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                action_id,
                user_id,
                insight_id,
                body.action_text.strip(),
                now,
                28,
                "pending",
                None,
                now,
                now
            ),
        )
        row = db.fetchone("SELECT * FROM insight_actions WHERE id = ?", (action_id,))
    else:
        resp = db.client.table("insight_actions").insert(data).execute()
        row = resp.data[0]

    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "insight_id": row.get("insight_id"),
        "action_text": row["action_text"],
        "created_at": row["created_at"],
        "followup_window_days": 28,
        "followup_status": "pending",
    }


@router.get("", response_model=list[ActionOut])
async def list_actions(
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    user_id = user["user_id"]
    if db.mode == "sqlite":
        rows = db.fetchall(
            "SELECT * FROM insight_actions WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        )
    else:
        resp = db.client.table("insight_actions").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        rows = resp.data or []

    return [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "insight_id": r.get("insight_id"),
            "action_text": r["action_text"],
            "created_at": r["created_at"],
            "followup_window_days": r.get("followup_window_days", 28),
            "followup_status": r.get("followup_status", "pending"),
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
            "SELECT * FROM insight_actions WHERE id = ? AND user_id = ?",
            (action_id, user_id),
        )
    else:
        resp = db.client.table("insight_actions").select("*").eq("id", action_id).eq("user_id", user_id).execute()
        action = resp.data[0] if resp.data else None

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    # Use tried_at from migration instead of created_at
    action_datetime = action["tried_at"].replace("Z", "+00:00") if "Z" in action["tried_at"] else action["tried_at"]
    created_at_dt = datetime.fromisoformat(action_datetime)
    created_date = created_at_dt.date()
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    days_elapsed = (today - created_date).days
    followup_window_days = action.get("followup_window_days", 28)

    # Check if 28 days (4 complete weeks) have elapsed
    if days_elapsed < followup_window_days:
        days_remaining = followup_window_days - days_elapsed
        return FollowupOutcome(
            action_id=action_id,
            action_text=action["action_text"],
            tried_at=action["tried_at"],
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
            SELECT amount, date FROM expenses
            WHERE user_id = ?
              AND category = 'convenience_food'
              AND date >= ?
              AND date < ?
            """,
            (user_id, created_date.isoformat(), followup_end.isoformat()),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("amount,date")
            .eq("user_id", user_id)
            .eq("category", "convenience_food")
            .gte("date", created_date.isoformat())
            .lt("date", followup_end.isoformat())
            .execute()
        )
        post_rows = resp.data or []

    followup_weeks = _observed_weeks(post_rows, created_date, followup_end)
    if len(followup_weeks) < 3:
        # Require records across multiple weeks, not four transactions clustered together.
        if db.mode == "sqlite":
            db.execute(
                """
                UPDATE insight_actions 
                SET followup_status = 'insufficient_data', updated_at = ? 
                WHERE id = ? AND user_id = ?
                """,
                (_now(), action_id, user_id),
            )
        else:
            db.client.table("insight_actions").update({
                "followup_status": "insufficient_data",
                "updated_at": _now()
            }).eq("id", action_id).eq("user_id", user_id).execute()
            
        return FollowupOutcome(
            action_id=action_id,
            action_text=action["action_text"],
            tried_at=action["tried_at"],
            evaluation_date=today.isoformat(),
            followup_window_days=followup_window_days,
            days_elapsed=days_elapsed,
            status="insufficient_data",
            message=f"Follow-up window completed, but records cover only {len(followup_weeks)} distinct weeks. At least 3 observed weeks are required; missing logs are not treated as zero spending.",
        )

    total_cf = sum(float(r["amount"]) for r in post_rows)
    followup_weekly_avg = round(total_cf / 4.0, 2)

    # Calculate baseline average (before action was taken)
    baseline_start = created_date - timedelta(days=followup_window_days)
    if db.mode == "sqlite":
        baseline_rows = db.fetchall(
            """
            SELECT amount, date FROM expenses
            WHERE user_id = ?
              AND category = 'convenience_food'
              AND date >= ?
              AND date < ?
            """,
            (user_id, baseline_start.isoformat(), created_date.isoformat()),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("amount,date")
            .eq("user_id", user_id)
            .eq("category", "convenience_food")
            .gte("date", baseline_start.isoformat())
            .lt("date", created_date.isoformat())
            .execute()
        )
        baseline_rows = resp.data or []

    baseline_weeks = _observed_weeks(baseline_rows, baseline_start, created_date)
    if len(baseline_weeks) < 3:
        if db.mode == "sqlite":
            db.execute(
                "UPDATE insight_actions SET followup_status = 'insufficient_data', updated_at = ? WHERE id = ? AND user_id = ?",
                (_now(), action_id, user_id),
            )
        else:
            db.client.table("insight_actions").update({
                "followup_status": "insufficient_data", "updated_at": _now()
            }).eq("id", action_id).eq("user_id", user_id).execute()
        return FollowupOutcome(
            action_id=action_id, action_text=action["action_text"], tried_at=action["tried_at"],
            evaluation_date=today.isoformat(), followup_window_days=followup_window_days,
            days_elapsed=days_elapsed, status="insufficient_data",
            message=f"Baseline records cover only {len(baseline_weeks)} distinct weeks. At least 3 observed weeks are required for a comparison.",
        )
    baseline_total = sum(float(r["amount"]) for r in baseline_rows) if baseline_rows else 0
    baseline_weekly_avg = round(baseline_total / 4.0, 2)
    percent_change = None
    if baseline_weekly_avg is not None and baseline_weekly_avg > 0:
        percent_change = round(((followup_weekly_avg - baseline_weekly_avg) / baseline_weekly_avg) * 100, 2)

    # Store computed metrics in outcome_metrics column per migration
    outcome_metrics = {
        "baseline_cf_avg": baseline_weekly_avg,
        "followup_cf_avg": followup_weekly_avg,
        "percent_change": percent_change,
        "baseline_start": baseline_start.isoformat(),
        "followup_end": followup_end.isoformat()
    }

    # Update the action's followup_status and outcome_metrics in the database
    if db.mode == "sqlite":
        db.execute(
            """
            UPDATE insight_actions 
            SET followup_status = 'sufficient_data', outcome_metrics = ?, updated_at = ? 
            WHERE id = ? AND user_id = ?
            """,
            (json.dumps(outcome_metrics), _now(), action_id, user_id),
        )
    else:
        db.client.table("insight_actions").update({
            "followup_status": "sufficient_data",
            "outcome_metrics": outcome_metrics,
            "updated_at": _now()
        }).eq("id", action_id).eq("user_id", user_id).execute()

    return FollowupOutcome(
        action_id=action_id,
        action_text=action["action_text"],
        tried_at=action["tried_at"],
        evaluation_date=today.isoformat(),
        followup_window_days=followup_window_days,
        days_elapsed=days_elapsed,
        status="sufficient_data",
        message=(f"Follow-up window has {len(followup_weeks)} observed weeks. " + (f"Baseline averaged ₹{baseline_weekly_avg:,.2f}/week; follow-up averaged ₹{followup_weekly_avg:,.2f}/week ({percent_change}% change)." if baseline_weekly_avg is not None and percent_change is not None else "Not enough baseline coverage to calculate a reliable percentage change.")),
        baseline_cf_avg=baseline_weekly_avg,
        followup_cf_avg=followup_weekly_avg,
        percent_change=percent_change,
    )