"""tests/test_insight_engine.py — Unit and integration tests for the Insight Engine."""
from __future__ import annotations

from datetime import date, datetime, timedelta
import pandas as pd
import pytest

from services.insight_engine import (
    calculate_overdue_convenience_insight,
    _is_overdue_at_snapshot,
    _compute_week,
)
from services.demo_seeder import seed_persona, _clear_user_data
from database import get_db


def test_overdue_historical_snapshot():
    """
    Test historical snapshot logic:
    A task is overdue at Sunday snapshot if:
      due_date < Sunday AND (completed_at IS NULL OR completed_at > Sunday)
    A task completed late must still count as overdue in historical snapshots
    after its deadline but before its completion date.
    """
    snapshot = date(2026, 8, 9)  # Sunday

    # Case 1: Completed on time (before Sunday snapshot) -> NOT overdue
    assert _is_overdue_at_snapshot(
        task_due=date(2026, 8, 7),
        task_completed=date(2026, 8, 8),
        snapshot=snapshot,
    ) is False

    # Case 2: Due before Sunday, never completed (None / NaT) -> OVERDUE
    assert _is_overdue_at_snapshot(
        task_due=date(2026, 8, 7),
        task_completed=None,
        snapshot=snapshot,
    ) is True

    # Case 3: Due before Sunday, completed LATE (Tuesday after Sunday) -> OVERDUE at this snapshot
    assert _is_overdue_at_snapshot(
        task_due=date(2026, 8, 7),
        task_completed=date(2026, 8, 11),
        snapshot=snapshot,
    ) is True

    # Case 4: The same task at next week's Sunday snapshot (Aug 16) -> NOT overdue anymore
    next_snapshot = date(2026, 8, 16)
    assert _is_overdue_at_snapshot(
        task_due=date(2026, 8, 7),
        task_completed=date(2026, 8, 11),
        snapshot=next_snapshot,
    ) is False

    # Case 5: Due in the future (due > Sunday) -> NOT overdue at this snapshot
    assert _is_overdue_at_snapshot(
        task_due=date(2026, 8, 12),
        task_completed=None,
        snapshot=snapshot,
    ) is False


def test_correct_weekly_aggregation():
    """Test that convenience food spending aggregates within Monday-Sunday bounds."""
    monday = date(2026, 8, 3)
    sunday = date(2026, 8, 9)

    expenses_data = [
        {"date": date(2026, 8, 2), "amount": 100.0, "category": "convenience_food"},  # Before week
        {"date": date(2026, 8, 3), "amount": 250.0, "category": "convenience_food"},  # Mon
        {"date": date(2026, 8, 6), "amount": 300.0, "category": "convenience_food"},  # Thu
        {"date": date(2026, 8, 6), "amount": 1500.0, "category": "groceries"},        # Different category
        {"date": date(2026, 8, 9), "amount": 400.0, "category": "convenience_food"},  # Sun
        {"date": date(2026, 8, 10), "amount": 500.0, "category": "convenience_food"}, # Next Mon
    ]
    exp_df = pd.DataFrame(expenses_data)
    tasks_df = pd.DataFrame(columns=["id", "title", "due_date", "completed_at"])

    week_res = _compute_week(monday, exp_df, tasks_df, overdue_threshold=3)
    assert week_res["convenience_food_spending"] == 950.0  # 250 + 300 + 400
    assert week_res["overdue_count"] == 0
    assert week_res["is_qualifying"] is False
    assert week_res["group"] == "baseline"


def test_qualifying_baseline_grouping():
    """Test that >= 3 overdue tasks produces qualifying week, < 3 produces baseline."""
    monday = date(2026, 8, 3)
    exp_df = pd.DataFrame([{"date": date(2026, 8, 5), "amount": 800.0, "category": "convenience_food"}])

    # 3 overdue tasks
    tasks_3 = pd.DataFrame([
        {"id": "1", "title": "T1", "due_date": date(2026, 8, 5), "completed_at": None},
        {"id": "2", "title": "T2", "due_date": date(2026, 8, 6), "completed_at": None},
        {"id": "3", "title": "T3", "due_date": date(2026, 8, 7), "completed_at": None},
    ])
    res_qual = _compute_week(monday, exp_df, tasks_3, overdue_threshold=3)
    assert res_qual["overdue_count"] == 3
    assert res_qual["is_qualifying"] is True
    assert res_qual["group"] == "qualifying"

    # 2 overdue tasks
    tasks_2 = pd.DataFrame([
        {"id": "1", "title": "T1", "due_date": date(2026, 8, 5), "completed_at": None},
        {"id": "2", "title": "T2", "due_date": date(2026, 8, 6), "completed_at": None},
    ])
    res_base = _compute_week(monday, exp_df, tasks_2, overdue_threshold=3)
    assert res_base["overdue_count"] == 2
    assert res_base["is_qualifying"] is False
    assert res_base["group"] == "baseline"


def test_empty_dataset_returns_insufficient():
    """An empty dataset must return status 'insufficient_data' without crashing."""
    db = get_db()
    _clear_user_data("empty_user", db)
    insight = calculate_overdue_convenience_insight("empty_user", db)

    assert insight["status"] == "insufficient_data"
    assert insight["ratio"] is None
    assert insight["qualifying_week_count"] == 0
    assert insight["baseline_week_count"] == 0
    assert "insufficient" in insight["headline"].lower() or "not enough" in insight["headline"].lower()


def test_zero_baseline_returns_insufficient():
    """If baseline convenience food spending average is 0, ratio cannot be computed."""
    db = get_db()
    test_user = "zero_baseline_user"
    _clear_user_data(test_user, db)

    # Insert only qualifying week expenses (baseline weeks have 0 CF spend)
    # The engine should return insufficient_data rather than division by zero / inf
    insight = calculate_overdue_convenience_insight(test_user, db)
    assert insight["status"] == "insufficient_data"
    assert insight["ratio"] is None


def test_insufficient_qualifying_weeks():
    """Fewer than 3 qualifying weeks must result in status 'insufficient_data'."""
    db = get_db()
    test_user = "few_qualifying_user"
    _clear_user_data(test_user, db)

    # Insert 1 qualifying week and 10 baseline weeks
    # Should report insufficient_data with explanation
    insight = calculate_overdue_convenience_insight(test_user, db)
    assert insight["status"] == "insufficient_data"
    assert insight["ratio"] is None


def test_maya_fixture():
    """
    Integration test: Maya's synthetic fixture data loaded into DB.
    Verifies that the Insight Engine derives the expected ratio (~3.20x)
    matching the validated synthetic dataset.
    """
    db = get_db()
    _clear_user_data("demo_maya", db)
    seed_res = seed_persona("demo_maya", "maya", db)
    assert seed_res["seeded"] is True

    insight = calculate_overdue_convenience_insight("demo_maya", db)
    assert insight["status"] == "sufficient"
    assert insight["qualifying_week_count"] == 5
    assert insight["baseline_week_count"] == 7
    assert insight["ratio"] is not None
    # Maya's ratio should be ~3.20x (allowing float tolerance)
    assert 3.0 <= insight["ratio"] <= 3.4
    assert "3.2×" in insight["headline"] or f"{insight['ratio']:.1f}×" in insight["headline"]
    assert len(insight["qualifying_weeks"]) == 5
    assert len(insight["baseline_weeks"]) == 7
    assert insight["data_source"] == "demo_synthetic"


def test_arjun_fixture():
    """
    Integration test: Arjun's synthetic fixture data loaded into DB.
    Verifies that the Insight Engine derives the expected ratio (~3.42x)
    matching the validated synthetic dataset.
    """
    db = get_db()
    _clear_user_data("demo_arjun", db)
    seed_res = seed_persona("demo_arjun", "arjun", db)
    assert seed_res["seeded"] is True

    insight = calculate_overdue_convenience_insight("demo_arjun", db)
    assert insight["status"] == "sufficient"
    assert insight["qualifying_week_count"] == 5
    assert insight["baseline_week_count"] == 7
    assert insight["ratio"] is not None
    assert 3.2 <= insight["ratio"] <= 3.6
    assert f"{insight['ratio']:.1f}×" in insight["headline"]
    assert insight["data_source"] == "demo_synthetic"


def test_reproducible_results():
    """Running the engine twice on the same user records must produce identical results."""
    db = get_db()
    res1 = calculate_overdue_convenience_insight("demo_maya", db)
    res2 = calculate_overdue_convenience_insight("demo_maya", db)

    assert res1["ratio"] == res2["ratio"]
    assert res1["qualifying_avg"] == res2["qualifying_avg"]
    assert res1["baseline_avg"] == res2["baseline_avg"]
    assert res1["qualifying_week_count"] == res2["qualifying_week_count"]


def test_no_hardcoded_ratio():
    """Maya and Arjun must have different ratios derived from their distinct datasets."""
    db = get_db()
    maya_res = calculate_overdue_convenience_insight("demo_maya", db)
    arjun_res = calculate_overdue_convenience_insight("demo_arjun", db)

    assert maya_res["ratio"] != arjun_res["ratio"]
    assert maya_res["qualifying_avg"] != arjun_res["qualifying_avg"]
