"""models/insight.py — Pydantic schemas for insight responses."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel


class WeekDetail(BaseModel):
    week_start: str
    week_end: str
    overdue_count: int
    convenience_food_spending: float
    overdue_task_titles: list[str]


class InsightOut(BaseModel):
    insight_type: str
    status: str  # "sufficient" | "insufficient_data"
    headline: str
    observation_start: Optional[str]
    observation_end: Optional[str]
    timezone: str
    week_start_day: str
    snapshot_convention: str
    overdue_threshold: int
    qualifying_weeks: list[WeekDetail]
    baseline_weeks: list[WeekDetail]
    qualifying_week_count: int
    baseline_week_count: int
    qualifying_avg: Optional[float]
    baseline_avg: Optional[float]
    ratio: Optional[float]
    formula: str
    formula_version: str
    recommended_action: str
    possible_explanation: str
    data_source: str
    engine_version: str
    min_qualifying_weeks_required: int
    min_baseline_weeks_required: int
    insufficient_reason: Optional[str]
    total_weeks_analyzed: int
    weekly_breakdown: list[dict]
