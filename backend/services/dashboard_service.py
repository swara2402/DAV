"""
services/dashboard_service.py — Dashboard summary calculations.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

import pandas as pd

logger = logging.getLogger(__name__)


def get_dashboard_summary(user_id: str, db: Any, period_start: date, period_end: date) -> dict:
    """Compute dashboard summary for a user within [period_start, period_end]."""

    # Load expenses
    if hasattr(db, "mode") and db.mode == "sqlite":
        expense_rows = db.fetchall(
            """
            SELECT date, amount, category FROM expenses
            WHERE user_id = ?
              AND date >= ?
              AND date <= ?
            """,
            (user_id, period_start.isoformat(), period_end.isoformat()),
        )
        task_rows = db.fetchall(
            """
            SELECT due_date, completed_at FROM tasks
            WHERE user_id = ?
            """,
            (user_id,),
        )
    else:
        resp = (
            db.client.table("expenses")
            .select("date,amount,category")
            .eq("user_id", user_id)
            .gte("date", period_start.isoformat())
            .lte("date", period_end.isoformat())
            .execute()
        )
        expense_rows = resp.data or []
        task_resp = db.client.table("tasks").select("due_date,completed_at").eq("user_id", user_id).execute()
        task_rows = task_resp.data or []

    # Expenses DataFrame
    if expense_rows:
        exp_df = pd.DataFrame(expense_rows)
        exp_df["amount"] = pd.to_numeric(exp_df["amount"], errors="coerce").fillna(0)
        exp_df["date"] = pd.to_datetime(exp_df["date"]).dt.date
    else:
        exp_df = pd.DataFrame(columns=["date", "amount", "category"])

    total_spending = float(exp_df["amount"].sum())
    cf_spending = float(exp_df.loc[exp_df["category"] == "convenience_food", "amount"].sum())
    spending_by_category: dict[str, float] = {}
    if not exp_df.empty:
        for cat, grp in exp_df.groupby("category"):
            spending_by_category[str(cat)] = round(float(grp["amount"].sum()), 2)

    # Weekly breakdown
    weekly_spending = []
    if not exp_df.empty:
        # Build Monday-aligned weekly buckets within period
        current = period_start
        # Align to nearest Monday on or before period_start
        offset = current.weekday()  # 0=Mon
        week_start = current - timedelta(days=offset)
        while week_start <= period_end:
            week_end = week_start + timedelta(days=6)
            mask = (exp_df["date"] >= max(week_start, period_start)) & (exp_df["date"] <= min(week_end, period_end))
            week_total = float(exp_df.loc[mask, "amount"].sum())
            week_cf = float(exp_df.loc[mask & (exp_df["category"] == "convenience_food"), "amount"].sum())
            weekly_spending.append({
                "week_start": week_start.isoformat(),
                "total": round(week_total, 2),
                "convenience_food": round(week_cf, 2),
            })
            week_start += timedelta(days=7)

    # Tasks
    today = date.today()
    completed = 0
    upcoming = 0
    overdue = 0
    for row in task_rows:
        dd_str = row.get("due_date")
        ca_str = row.get("completed_at")
        dd = date.fromisoformat(dd_str[:10]) if dd_str else None
        ca = date.fromisoformat(ca_str[:10]) if ca_str else None

        if ca is not None:
            completed += 1
        elif dd is not None:
            if dd < today:
                overdue += 1
            else:
                upcoming += 1

    return {
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "total_spending": round(total_spending, 2),
        "convenience_food_spending": round(cf_spending, 2),
        "tasks_completed": completed,
        "tasks_upcoming": upcoming,
        "tasks_overdue": overdue,
        "weekly_spending": weekly_spending,
        "spending_by_category": spending_by_category,
    }
