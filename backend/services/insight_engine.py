"""
services/insight_engine.py — Core insight calculation engine.

Implements `calculate_overdue_convenience_insight(user_id, db)`:

Definitions:
  - Analysis window: Most recent 12 complete calendar weeks (Mon-Sun, Asia/Kolkata)
  - Week snapshot: Sunday 23:59:59 IST of each week
  - Qualifying week: ≥3 tasks overdue at Sunday snapshot
  - Baseline week: <3 tasks overdue at Sunday snapshot
  - Overdue at snapshot: task.due_date < snapshot AND (completed_at IS NULL OR completed_at > snapshot)
  - Convenience food spending: sum(amount) WHERE category='convenience_food' in that Mon-Sun week
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

import pandas as pd
import numpy as np

from config import settings

logger = logging.getLogger(__name__)

ENGINE_VERSION = "1.0.0"
FORMULA_VERSION = "v1.0"
INSIGHT_TIMEZONE = "Asia/Kolkata"

# IST offset: UTC+5:30
IST_OFFSET = timezone(timedelta(hours=5, minutes=30))


# ---------------------------------------------------------------------------
# Timezone helpers
# ---------------------------------------------------------------------------

def _now_ist() -> datetime:
    """Current time in IST."""
    return datetime.now(IST_OFFSET)


def _to_ist(dt: datetime) -> datetime:
    """Convert aware datetime to IST; localise naive datetimes as IST."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=IST_OFFSET)
    return dt.astimezone(IST_OFFSET)


def _week_bounds(monday: date) -> tuple[date, date]:
    """Return (monday, sunday) for the week starting on given Monday."""
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _sunday_snapshot(monday: date) -> datetime:
    """Sunday 23:59:59 IST for the week starting on Monday."""
    sunday = monday + timedelta(days=6)
    return datetime(sunday.year, sunday.month, sunday.day, 23, 59, 59, tzinfo=IST_OFFSET)


def _get_analysis_weeks(n: int = 12) -> list[date]:
    """
    Return list of n most recent complete Mon-Sun week start dates (Mondays),
    excluding the current in-progress week.
    Weeks are returned in ascending order (oldest first).
    """
    today = _now_ist().date()
    # Most recent completed Sunday
    days_since_monday = today.weekday()  # Mon=0, Sun=6
    # Last completed Sunday: if today is Monday (0), last Sunday was yesterday
    last_sunday = today - timedelta(days=days_since_monday + 1)
    # Last completed week's Monday
    last_monday = last_sunday - timedelta(days=6)

    weeks = []
    current_monday = last_monday
    for _ in range(n):
        weeks.append(current_monday)
        current_monday -= timedelta(days=7)

    # Return in ascending order (oldest first)
    return list(reversed(weeks))


# ---------------------------------------------------------------------------
# Data loading from DB
# ---------------------------------------------------------------------------

def _load_expenses(user_id: str, db: Any, start_date: date, end_date: date) -> pd.DataFrame:
    """Load expenses for user in [start_date, end_date]."""
    if hasattr(db, "mode") and db.mode == "sqlite":
        rows = db.fetchall(
            """
            SELECT date, amount, category, description
            FROM expenses
            WHERE user_id = ?
              AND date >= ?
              AND date <= ?
            """,
            (user_id, start_date.isoformat(), end_date.isoformat()),
        )
    else:
        # Supabase
        resp = (
            db.client.table("expenses")
            .select("date,amount,category,description")
            .eq("user_id", user_id)
            .gte("date", start_date.isoformat())
            .lte("date", end_date.isoformat())
            .execute()
        )
        rows = resp.data if resp.data else []

    if not rows:
        return pd.DataFrame(columns=["date", "amount", "category", "description"])

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"]).dt.date
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)
    return df


def _load_tasks(user_id: str, db: Any, start_date: date, end_date: date) -> pd.DataFrame:
    """
    Load tasks relevant to the analysis window.
    We need tasks whose due_date falls within the window OR were completed
    within the window (to capture historical overdue state).
    For correctness, load all tasks with due_date <= end_date.
    """
    if hasattr(db, "mode") and db.mode == "sqlite":
        rows = db.fetchall(
            """
            SELECT id, title, due_date, completed_at, created_at
            FROM tasks
            WHERE user_id = ?
              AND due_date IS NOT NULL
              AND due_date <= ?
            """,
            (user_id, end_date.isoformat()),
        )
    else:
        resp = (
            db.client.table("tasks")
            .select("id,title,due_date,completed_at,created_at")
            .eq("user_id", user_id)
            .not_.is_("due_date", "null")
            .lte("due_date", end_date.isoformat())
            .execute()
        )
        rows = resp.data if resp.data else []

    if not rows:
        return pd.DataFrame(columns=["id", "title", "due_date", "completed_at"])

    df = pd.DataFrame(rows)
    df["due_date"] = pd.to_datetime(df["due_date"], errors="coerce").dt.date
    df["completed_at"] = pd.to_datetime(df["completed_at"], errors="coerce").dt.date
    return df


# ---------------------------------------------------------------------------
# Per-week calculation
# ---------------------------------------------------------------------------

def _is_overdue_at_snapshot(task_due: Any, task_completed: Any, snapshot: date) -> bool:
    """
    A task is overdue at snapshot if:
      task.due_date < snapshot_date AND (completed_at IS NULL OR completed_at > snapshot_date)
    Note: snapshot_date here is the Sunday of the week.
    Handles None, NaT, and string/datetime objects gracefully.
    """
    if task_due is None or pd.isna(task_due):
        return False

    if isinstance(task_due, datetime):
        task_due = task_due.date()
    elif isinstance(task_due, str):
        task_due = date.fromisoformat(task_due[:10])

    if task_due >= snapshot:
        return False

    if task_completed is None or pd.isna(task_completed):
        return True

    if isinstance(task_completed, datetime):
        task_completed = task_completed.date()
    elif isinstance(task_completed, str):
        task_completed = date.fromisoformat(task_completed[:10])

    return task_completed > snapshot


def _compute_week(
    monday: date,
    expenses_df: pd.DataFrame,
    tasks_df: pd.DataFrame,
    overdue_threshold: int,
) -> dict[str, Any]:
    """Compute metrics for a single week."""
    _, sunday = _week_bounds(monday)
    snapshot_dt = _sunday_snapshot(monday)
    snapshot_date = snapshot_dt.date()  # Sunday date

    # A week with no expense records is unobserved, not proof of zero spending.
    week_expense_mask = (expenses_df["date"] >= monday) & (expenses_df["date"] <= sunday)
    expense_record_count = int(week_expense_mask.sum())
    spending_observed = expense_record_count > 0
    # Convenience food spending: transactions in this observed Mon-Sun week.
    mask = week_expense_mask & (expenses_df["category"] == "convenience_food")
    cf_spending = float(expenses_df.loc[mask, "amount"].sum())

    # Exclude tasks that had not been created by the historical snapshot.
    # Older unit fixtures without created_at represent tasks already in existence.
    snapshot_tasks = tasks_df
    if not tasks_df.empty and "created_at" in tasks_df.columns:
        def _created_by_snapshot(value: Any) -> bool:
            if value is None or pd.isna(value):
                return False
            try:
                created = pd.Timestamp(value)
                if created.tzinfo is not None:
                    created = created.tz_convert("Asia/Kolkata")
                return created.date() <= snapshot_date
            except (TypeError, ValueError):
                return False
        snapshot_tasks = tasks_df[tasks_df["created_at"].apply(_created_by_snapshot)]

    # Overdue tasks at Sunday snapshot
    overdue_mask = snapshot_tasks.apply(
        lambda row: _is_overdue_at_snapshot(
            row["due_date"], row["completed_at"], snapshot_date
        ),
        axis=1,
    )
    overdue_tasks = snapshot_tasks[overdue_mask] if not snapshot_tasks.empty else pd.DataFrame(columns=["title"])
    overdue_count = int(len(overdue_tasks))
    if "title" in overdue_tasks.columns:
        overdue_titles = overdue_tasks["title"].dropna().tolist()[:20]  # cap at 20
    else:
        overdue_titles = []

    is_qualifying = overdue_count >= overdue_threshold

    return {
        "week_start": monday.isoformat(),
        "week_end": sunday.isoformat(),
        "snapshot": snapshot_date.isoformat(),
        "overdue_count": overdue_count,
        "convenience_food_spending": round(cf_spending, 2),
        "expense_record_count": expense_record_count,
        "spending_observed": spending_observed,
        "overdue_task_titles": overdue_titles,
        "is_qualifying": is_qualifying,
        "group": "qualifying" if is_qualifying else "baseline",
    }


# ---------------------------------------------------------------------------
# Main insight function
# ---------------------------------------------------------------------------

def calculate_overdue_convenience_insight(
    user_id: str,
    db: Any,
    analysis_weeks: int | None = None,
    overdue_threshold: int | None = None,
    min_qualifying_weeks: int | None = None,
    min_baseline_weeks: int | None = None,
    min_analysis_weeks: int | None = None,
) -> dict[str, Any]:
    """
    Calculate the overdue-convenience-food correlation insight for a user.

    Returns a complete insight dict with status='sufficient' or 'insufficient_data'.
    Never raises — always returns a valid dict.
    """
    # Config (allow overrides for testing)
    n_weeks = analysis_weeks if analysis_weeks is not None else settings.ANALYSIS_WEEKS
    threshold = overdue_threshold if overdue_threshold is not None else settings.OVERDUE_THRESHOLD
    min_q = min_qualifying_weeks if min_qualifying_weeks is not None else settings.MIN_QUALIFYING_WEEKS
    min_b = min_baseline_weeks if min_baseline_weeks is not None else settings.MIN_BASELINE_WEEKS
    min_a = min_analysis_weeks if min_analysis_weeks is not None else settings.MIN_ANALYSIS_WEEKS

    def _insufficient(reason: str, weekly_breakdown: list = None, total_weeks: int = 0) -> dict:
        return {
            "insight_type": "overdue_convenience_correlation",
            "status": "insufficient_data",
            "headline": "Not enough data to calculate this insight yet.",
            "observation_start": None,
            "observation_end": None,
            "timezone": INSIGHT_TIMEZONE,
            "week_start_day": "Monday",
            "snapshot_convention": "Sunday 23:59:59 IST",
            "overdue_threshold": threshold,
            "qualifying_weeks": [],
            "baseline_weeks": [],
            "qualifying_week_count": 0,
            "baseline_week_count": 0,
            "qualifying_avg": None,
            "baseline_avg": None,
            "ratio": None,
            # Statistical rigor metadata (even for insufficient data)
            "qualifying_ci_95": None,
            "baseline_ci_95": None,
            "qualifying_std": None,
            "baseline_std": None,
            "outliers_removed_qualifying": 0,
            "outliers_removed_baseline": 0,
            "statistical_methodology": {
                "outlier_detection": "IQR method (1.5*IQR bounds)",
                "confidence_interval": "95% Student t interval for each group mean; not an interval for the ratio",
                "limitations": [
                    "Small sample size (n < 30), confidence intervals are approximate",
                    "Correlation does not imply causation",
                    "Analysis only captures within-user variation, not population-level effects",
                    "Does not control for confounding variables (holidays, income, household size)"
                ]
            },
            "formula": "ratio = mean(qualifying_cf_spending) / mean(baseline_cf_spending)",
            "formula_version": FORMULA_VERSION,
            "recommended_action": (
                "Keep logging your expenses and tasks. "
                "The insight will appear once there's enough data."
            ),
            "possible_explanation": (
                "High task load may increase stress, making convenient food options "
                "more appealing. This is a hypothesis based on association, not proven causation."
            ),
            "data_source": _detect_data_source(user_id),
            "engine_version": ENGINE_VERSION,
            "min_qualifying_weeks_required": min_q,
            "min_baseline_weeks_required": min_b,
            "insufficient_reason": reason,
            "total_weeks_analyzed": total_weeks,
            "weekly_breakdown": weekly_breakdown or [],
        }

    # ------------------------------------------------------------------
    # 1. Build analysis window
    # ------------------------------------------------------------------
    try:
        week_starts = _get_analysis_weeks(n_weeks)
    except Exception as exc:
        logger.error(f"Failed to compute analysis weeks: {exc}")
        return _insufficient("internal_error")

    if not week_starts:
        return _insufficient("no_data")

    start_date = week_starts[0]
    end_date = week_starts[-1] + timedelta(days=6)  # last Sunday

    # ------------------------------------------------------------------
    # 2. Load data
    # ------------------------------------------------------------------
    try:
        expenses_df = _load_expenses(user_id, db, start_date, end_date)
        tasks_df = _load_tasks(user_id, db, start_date, end_date)
    except Exception as exc:
        logger.error(f"DB error loading data for {user_id}: {exc}")
        return _insufficient("db_error")

    if expenses_df.empty and tasks_df.empty:
        return _insufficient("no_data")

    # ------------------------------------------------------------------
    # 3. Compute per-week metrics
    # ------------------------------------------------------------------
    weekly_breakdown = []
    for monday in week_starts:
        week_data = _compute_week(monday, expenses_df, tasks_df, threshold)
        weekly_breakdown.append(week_data)

    total_weeks = len(weekly_breakdown)

    # ------------------------------------------------------------------
    # 4. Split only weeks with observed expense records into qualifying / baseline.
    # Missing logs are unknown, not zero-spend baseline weeks.
    # ------------------------------------------------------------------
    observed_weeks = [w for w in weekly_breakdown if w.get("spending_observed", False)]
    if len(observed_weeks) < min_a:
        return _insufficient(
            "insufficient_expense_coverage",
            weekly_breakdown=weekly_breakdown,
            total_weeks=len(observed_weeks),
        )

    qualifying = [w for w in observed_weeks if w["is_qualifying"]]
    baseline = [w for w in observed_weeks if not w["is_qualifying"]]

    n_qualifying = len(qualifying)
    n_baseline = len(baseline)

    # Threshold checks
    if n_qualifying < min_q:
        return _insufficient(
            "insufficient_qualifying_weeks",
            weekly_breakdown=weekly_breakdown,
            total_weeks=total_weeks,
        )

    if n_baseline < min_b:
        return _insufficient(
            "insufficient_baseline_weeks",
            weekly_breakdown=weekly_breakdown,
            total_weeks=total_weeks,
        )

    # ------------------------------------------------------------------
    # 5. Compute averages with full precision + statistical metrics
    # ------------------------------------------------------------------
    qualifying_spendings = np.array([w["convenience_food_spending"] for w in qualifying], dtype=np.float64)
    baseline_spendings = np.array([w["convenience_food_spending"] for w in baseline], dtype=np.float64)

    # Outlier detection and removal (IQR method) - only remove extreme values
    def remove_outliers(data: np.ndarray) -> np.ndarray:
        if len(data) < 4:  # Need enough data to compute robust stats
            return data
        q1, q3 = np.percentile(data, [25, 75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        return data[(data >= lower_bound) & (data <= upper_bound)]

    # Apply outlier filtering
    qualifying_filtered = remove_outliers(qualifying_spendings)
    baseline_filtered = remove_outliers(baseline_spendings)

    # If we filtered out all data, use original to avoid complete failure
    if len(qualifying_filtered) == 0:
        qualifying_filtered = qualifying_spendings
    if len(baseline_filtered) == 0:
        baseline_filtered = baseline_spendings

    # Calculate statistical metrics
    qualifying_avg_full = float(np.mean(qualifying_filtered))
    baseline_avg_full = float(np.mean(baseline_filtered))
    qualifying_std = float(np.std(qualifying_filtered, ddof=1)) if len(qualifying_filtered) > 1 else 0.0
    baseline_std = float(np.std(baseline_filtered, ddof=1)) if len(baseline_filtered) > 1 else 0.0

    from scipy.stats import t as student_t

    # Standard error of the mean (for uncertainty estimates)
    qualifying_sem = qualifying_std / np.sqrt(len(qualifying_filtered)) if len(qualifying_filtered) > 1 else 0.0
    baseline_sem = baseline_std / np.sqrt(len(baseline_filtered)) if len(baseline_filtered) > 1 else 0.0

    # Exact two-sided Student t critical value for each sample's mean CI.
    # These are separate mean intervals, not a confidence interval for the ratio.
    qualifying_critical = float(student_t.ppf(0.975, len(qualifying_filtered) - 1)) if len(qualifying_filtered) > 1 else float("nan")
    baseline_critical = float(student_t.ppf(0.975, len(baseline_filtered) - 1)) if len(baseline_filtered) > 1 else float("nan")
    qualifying_ci_low = qualifying_avg_full - qualifying_critical * qualifying_sem if np.isfinite(qualifying_critical) else qualifying_avg_full
    qualifying_ci_high = qualifying_avg_full + qualifying_critical * qualifying_sem if np.isfinite(qualifying_critical) else qualifying_avg_full
    baseline_ci_low = baseline_avg_full - baseline_critical * baseline_sem if np.isfinite(baseline_critical) else baseline_avg_full
    baseline_ci_high = baseline_avg_full + baseline_critical * baseline_sem if np.isfinite(baseline_critical) else baseline_avg_full

    # Division by zero guard
    if baseline_avg_full == 0.0:
        return _insufficient(
            "baseline_avg_zero",
            weekly_breakdown=weekly_breakdown,
            total_weeks=total_weeks,
        )

    ratio_full = qualifying_avg_full / baseline_avg_full

    # Round display values (compute with full precision above)
    qualifying_avg_display = round(qualifying_avg_full, 2)
    baseline_avg_display = round(baseline_avg_full, 2)
    ratio_display = round(ratio_full, 2)
    qualifying_ci_low_display = round(qualifying_ci_low, 2)
    qualifying_ci_high_display = round(qualifying_ci_high, 2)
    baseline_ci_low_display = round(baseline_ci_low, 2)
    baseline_ci_high_display = round(baseline_ci_high, 2)

    # ------------------------------------------------------------------
    # 6. Build headline
    # ------------------------------------------------------------------
    headline = (
        f"During high-stress weeks, your convenience food spending was "
        f"{ratio_display:.1f}× higher"
    )

    # ------------------------------------------------------------------
    # 7. Build output week detail lists
    # ------------------------------------------------------------------
    def _to_week_detail(w: dict) -> dict:
        return {
            "week_start": w["week_start"],
            "week_end": w["week_end"],
            "overdue_count": w["overdue_count"],
            "convenience_food_spending": w["convenience_food_spending"],
            "expense_record_count": w.get("expense_record_count", 0),
            "spending_observed": w.get("spending_observed", False),
            "overdue_task_titles": w["overdue_task_titles"],
        }

    return {
        "insight_type": "overdue_convenience_correlation",
        "status": "sufficient",
        "headline": headline,
        "observation_start": week_starts[0].isoformat(),
        "observation_end": (week_starts[-1] + timedelta(days=6)).isoformat(),
        "timezone": INSIGHT_TIMEZONE,
        "week_start_day": "Monday",
        "snapshot_convention": "Sunday 23:59:59 IST",
        "overdue_threshold": threshold,
        "qualifying_weeks": [_to_week_detail(w) for w in qualifying],
        "baseline_weeks": [_to_week_detail(w) for w in baseline],
        "qualifying_week_count": n_qualifying,
        "baseline_week_count": n_baseline,
        "qualifying_avg": qualifying_avg_display,
        "baseline_avg": baseline_avg_display,
        "ratio": ratio_display,
        # Statistical rigor metadata
        "qualifying_ci_95": [qualifying_ci_low_display, qualifying_ci_high_display],
        "baseline_ci_95": [baseline_ci_low_display, baseline_ci_high_display],
        "qualifying_std": round(qualifying_std, 2),
        "baseline_std": round(baseline_std, 2),
        "outliers_removed_qualifying": len(qualifying_spendings) - len(qualifying_filtered),
        "outliers_removed_baseline": len(baseline_spendings) - len(baseline_filtered),
        "statistical_methodology": {
            "outlier_detection": "IQR method (1.5*IQR bounds)",
            "confidence_interval": "95% Student t interval for each group mean; not an interval for the ratio",
            "limitations": [
                "Small sample size (n < 30), confidence intervals are approximate",
                "Correlation does not imply causation",
                "Analysis only captures within-user variation, not population-level effects",
                "Does not control for confounding variables (holidays, income, household size)"
            ]
        },
        "formula": "ratio = mean(qualifying_cf_spending) / mean(baseline_cf_spending)",
        "formula_version": FORMULA_VERSION,
        "recommended_action": (
            "When you notice 3+ tasks piling up, try preparing a simple meal "
            "instead of ordering in."
        ),
        "possible_explanation": (
            "High task load may increase stress, making convenient food options "
            "more appealing. This is a hypothesis based on association, not proven causation."
        ),
        "data_source": _detect_data_source(user_id),
        "engine_version": ENGINE_VERSION,
        "min_qualifying_weeks_required": min_q,
        "min_baseline_weeks_required": min_b,
        "insufficient_reason": None,
        "total_weeks_analyzed": total_weeks,
        "weekly_breakdown": weekly_breakdown,
    }


def _detect_data_source(user_id: str) -> str:
    """Heuristic: demo users have synthetic data, others have user_entered."""
    if user_id.startswith("demo_"):
        return "demo_synthetic"
    return "user_entered"