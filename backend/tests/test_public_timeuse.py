"""Regression tests for public time-use survey aggregation and loading."""
from __future__ import annotations

import json

import pandas as pd

from scripts import import_public_timeuse
from services import insight_engine


def test_summarize_preserves_additive_weighted_totals():
    frame = pd.DataFrame(
        [
            {
                "person_id": "p1",
                "state": "Maharashtra",
                "age": 22,
                "time_from": "09:00",
                "time_to": "11:00",
                "activity_code": "employment",
                "activity_location": "home",
                "payment_status": "paid",
                "day_of_week": "Monday",
                "mult": 2.0,
                "survey_year": 2024,
            },
            {
                "person_id": "p2",
                "state": "Maharashtra",
                "age": 22,
                "time_from": "10:00",
                "time_to": "11:00",
                "activity_code": "employment",
                "activity_location": "home",
                "payment_status": "paid",
                "day_of_week": "Monday",
                "mult": 1.0,
                "survey_year": 2024,
            },
        ]
    )

    summary, metadata = import_public_timeuse.summarize(frame)

    assert len(summary) == 1
    row = summary.iloc[0]
    assert row["weighted_hours_sum"] == 5.0
    assert row["weight_sum"] == 3.0
    assert row["weighted_mean_hours_per_record"] == 5.0 / 3.0
    assert row["activity_rows"] == 2
    assert metadata["unique_respondents_in_valid_rows"] == 2


def test_population_context_uses_weighted_totals_not_mean_of_means(tmp_path, monkeypatch):
    summary_path = tmp_path / "activity_summary.csv"
    manifest_path = tmp_path / "manifest.json"
    pd.DataFrame(
        [
            {
                "age_band": "18-24",
                "state": "Maharashtra",
                "weighted_hours_sum": 4.0,
                "weight_sum": 2.0,
                "activity_rows": 2,
            },
            {
                "age_band": "25-34",
                "state": "Maharashtra",
                "weighted_hours_sum": 1.0,
                "weight_sum": 1.0,
                "activity_rows": 1,
            },
            {
                "age_band": "60+",
                "state": "Maharashtra",
                "weighted_hours_sum": 100.0,
                "weight_sum": 10.0,
                "activity_rows": 10,
            },
        ]
    ).to_csv(summary_path, index=False)
    manifest_path.write_text(json.dumps({"dataset_name": "test fixture"}), encoding="utf-8")
    monkeypatch.setattr(insight_engine, "SUMMARY_CSV_PATH", summary_path)
    monkeypatch.setattr(insight_engine, "MANIFEST_JSON_PATH", manifest_path)

    result = insight_engine.load_public_timeuse_data()

    assert result is not None
    metrics = result["population_metrics"]
    # Only working-age rows: (4 + 1) / (2 + 1), not mean(2, 1).
    assert metrics["avg_activity_record_hours"] == round(5.0 / 3.0, 4)
    assert metrics["age_band_breakdown"]["18-24"]["avg_activity_record_hours"] == 2.0
    assert metrics["age_band_breakdown"]["18-24"]["activity_records"] == 2
    assert "not total daily work time" in metrics["metric_definition"]


def test_population_context_rejects_legacy_unweighted_summary(tmp_path, monkeypatch):
    summary_path = tmp_path / "activity_summary.csv"
    manifest_path = tmp_path / "manifest.json"
    pd.DataFrame(
        [{"age_band": "18-24", "weighted_mean_hours_per_record": 3.0}]
    ).to_csv(summary_path, index=False)
    manifest_path.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(insight_engine, "SUMMARY_CSV_PATH", summary_path)
    monkeypatch.setattr(insight_engine, "MANIFEST_JSON_PATH", manifest_path)

    assert insight_engine.load_public_timeuse_data() is None
