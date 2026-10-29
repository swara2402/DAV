"""routers/dashboard.py — Dashboard summary and metrics."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query

from auth import get_current_user, require_non_demo
from database import get_db
from services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    user: dict = Depends(get_current_user),
    _: None = Depends(require_non_demo),
    db=Depends(get_db),
):
    user_id = user["user_id"]

    # Default to 12 weeks back from latest completed Sunday or 90 days
    if end_date:
        p_end = date.fromisoformat(end_date)
    else:
        p_end = date.today()

    if start_date:
        p_start = date.fromisoformat(start_date)
    else:
        # 12 weeks back (84 days)
        p_start = p_end - timedelta(days=84)

    return get_dashboard_summary(user_id, db, p_start, p_end)