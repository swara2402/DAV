"""routers/insights.py — Insight calculation endpoints."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends

from auth import get_current_user
from database import get_db
from models.insight import InsightOut
from services.insight_engine import calculate_overdue_convenience_insight

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


@router.get("/overdue-convenience", response_model=InsightOut)
async def get_overdue_convenience_insight(
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Computes the central insight:
    'During weeks with 3 or more overdue tasks, average convenience-food spending was X times the baseline.'
    Derived deterministically from the user's underlying expense and task records.
    """
    user_id = user["user_id"]
    result = calculate_overdue_convenience_insight(user_id, db)

    # Persist or update insight record for auditability
    now = datetime.now(timezone.utc).isoformat()
    insight_id = str(uuid.uuid4())
    computed_json = json.dumps(result)

    if db.mode == "sqlite":
        try:
            db.execute(
                """
                INSERT INTO insights (id, user_id, insight_type, status, computed_result, observation_start, observation_end, engine_version, data_source, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    insight_id,
                    user_id,
                    result["insight_type"],
                    result["status"],
                    computed_json,
                    result.get("observation_start"),
                    result.get("observation_end"),
                    result.get("engine_version", "1.0.0"),
                    result.get("data_source", "user_entered"),
                    now,
                ),
            )
        except Exception:
            pass  # Non-blocking if table write has issues
    else:
        try:
            db.client.table("insights").insert({
                "id": insight_id,
                "user_id": user_id,
                "insight_type": result["insight_type"],
                "status": result["status"],
                "computed_result": computed_json,
                "observation_start": result.get("observation_start"),
                "observation_end": result.get("observation_end"),
                "engine_version": result.get("engine_version", "1.0.0"),
                "data_source": result.get("data_source", "user_entered"),
                "created_at": now,
            }).execute()
        except Exception:
            pass

    return result
