from __future__ import annotations

import pandas as pd

from scripts.import_public_timeuse import REQUIRED_COLUMNS, parse_duration_minutes, summarize


def test_duration_handles_midnight_and_invalid_values():
    frame = pd.DataFrame({
        "time_from": ["23:30", "09:00", "bad"],
        "time_to": ["00:15", "10:30", "11:00"],
    })
    result = parse_duration_minutes(frame)
    assert result.iloc[0] == 45
    assert result.iloc[1] == 90
    assert pd.isna(result.iloc[2])


def test_summary_uses_real_source_fields_and_reports_exclusions():
    frame = pd.DataFrame([
        {
            "person_id": "p1", "state": "Maharashtra", "age": 23,
            "time_from": "09:00", "time_to": "10:00", "activity_code": "A1",
            "activity_location": "home", "payment_status": "unpaid",
            "day_of_week": "Monday", "mult": 2.0, "survey_year": 2024,
        },
        {
            "person_id": "p2", "state": "Maharashtra", "age": 30,
            "time_from": "10:00", "time_to": "11:30", "activity_code": "A1",
            "activity_location": "home", "payment_status": "unpaid",
            "day_of_week": "Monday", "mult": 1.0, "survey_year": 2024,
        },
        {
            "person_id": "p3", "state": "Gujarat", "age": 40,
            "time_from": "bad", "time_to": "11:00", "activity_code": "A2",
            "activity_location": "work", "payment_status": "paid",
            "day_of_week": "Tuesday", "mult": 1.0, "survey_year": 2024,
        },
    ])
    assert REQUIRED_COLUMNS.issubset(frame.columns)
    summary, manifest = summarize(frame)
    assert manifest["source_rows"] == 3
    assert manifest["valid_activity_rows"] == 2
    assert manifest["excluded_rows"] == 1
    assert manifest["unique_respondents_in_valid_rows"] == 2
    row = summary.iloc[0]
    assert row["respondents"] == 2
    # (1 hour * weight 2 + 1.5 hours * weight 1) / (2 + 1)
    assert abs(row["weighted_mean_hours_per_record"] - (3.5 / 3)) < 1e-9
