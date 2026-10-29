#!/usr/bin/env python3
"""Download and summarize the real India Time Use Survey (2024) dataset.

This research pipeline intentionally does NOT convert survey rows into personal
expense transactions or overdue tasks. The survey is cross-sectional activity
diary data, not a linked longitudinal finance/task dataset.
"""
from __future__ import annotations

import argparse
import gzip
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

SOURCE_URL = "https://github.com/Vonter/india-timeuse-survey/releases/latest/download/timeuse.csv.gz"
SOURCE_REPO = "https://github.com/Vonter/india-timeuse-survey"
LICENSE_URL = "https://opendatacommons.org/licenses/odbl/1-0/"
REQUIRED_COLUMNS = {
    "person_id", "state", "age", "time_from", "time_to", "activity_code",
    "activity_location", "payment_status", "day_of_week", "mult",
}


def download_source(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": "LifeDecoded-public-data-import/1.0"})
    with urllib.request.urlopen(request, timeout=90) as response, destination.open("wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            out.write(chunk)


def parse_duration_minutes(frame: pd.DataFrame) -> pd.Series:
    start = pd.to_datetime(frame["time_from"].astype(str), format="%H:%M", errors="coerce")
    end = pd.to_datetime(frame["time_to"].astype(str), format="%H:%M", errors="coerce")
    start_minutes = start.dt.hour * 60 + start.dt.minute
    end_minutes = end.dt.hour * 60 + end.dt.minute
    duration = end_minutes - start_minutes
    duration = duration.where(duration >= 0, duration + 24 * 60)
    # Time-use slots should not exceed a full day. Invalid rows are excluded below.
    return duration.where(duration.between(0, 24 * 60))


def load_source(path: Path) -> pd.DataFrame:
    with gzip.open(path, "rb") as source:
        frame = pd.read_csv(source, low_memory=False)
    missing = REQUIRED_COLUMNS - set(frame.columns)
    if missing:
        raise ValueError(f"Source schema changed; missing required columns: {sorted(missing)}")
    return frame


def summarize(frame: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    original_rows = len(frame)
    frame = frame.copy()
    frame["duration_minutes"] = parse_duration_minutes(frame)
    frame["age"] = pd.to_numeric(frame["age"], errors="coerce")
    frame["weight"] = pd.to_numeric(frame["mult"], errors="coerce")
    frame = frame.dropna(subset=[
        "person_id", "activity_code", "duration_minutes", "age", "weight",
    ])
    frame = frame[(frame["duration_minutes"] >= 0) & (frame["duration_minutes"] <= 1440)]
    frame = frame[frame["weight"] > 0]
    frame["age_band"] = pd.cut(
        frame["age"], bins=[0, 17, 24, 34, 44, 59, 120],
        labels=["0-17", "18-24", "25-34", "35-44", "45-59", "60+"],
        right=True, include_lowest=True,
    ).astype("string")
    frame["activity_hours"] = frame["duration_minutes"] / 60.0
    frame["weighted_activity_hours"] = frame["activity_hours"] * frame["weight"]

    group_columns = [
        "survey_year", "state", "age_band", "activity_code",
        "activity_location", "payment_status", "day_of_week",
    ]
    present_group_columns = [column for column in group_columns if column in frame.columns]
    grouped = frame.groupby(present_group_columns, dropna=False, observed=True)
    summary = grouped.agg(
        activity_rows=("person_id", "size"),
        respondents=("person_id", "nunique"),
        weighted_hours_sum=("weighted_activity_hours", "sum"),
        weight_sum=("weight", "sum"),
    ).reset_index()
    summary["weighted_mean_hours_per_record"] = (
        summary["weighted_hours_sum"] / summary["weight_sum"].replace(0, pd.NA)
    )
    summary = summary.drop(columns=["weighted_hours_sum", "weight_sum"])
    summary = summary.sort_values(
        ["state", "age_band", "activity_code", "day_of_week"],
        na_position="last",
    ).reset_index(drop=True)

    metadata = {
        "dataset_name": "India Time Use Survey 2024 (pre-processed public release)",
        "source_repository": SOURCE_REPO,
        "source_download_url": SOURCE_URL,
        "source_license": "Open Database License (ODbL); source notes also identify MoSPI-copyrighted content",
        "license_url": LICENSE_URL,
        "retrieved_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_rows": int(original_rows),
        "valid_activity_rows": int(len(frame)),
        "excluded_rows": int(original_rows - len(frame)),
        "unique_respondents_in_valid_rows": int(frame["person_id"].nunique()),
        "summary_rows": int(len(summary)),
        "summary_columns": list(summary.columns),
        "method": (
            "Activity duration is calculated from time_from/time_to; an end time earlier "
            "than start is treated as crossing midnight. Rows with invalid times, missing "
            "required analytical values, or non-positive survey multipliers are excluded. "
            "The multiplier is used to calculate weighted mean activity hours per record. "
            "This is a descriptive summary, not a causal estimate."
        ),
        "limitations": [
            "This survey does not contain linked personal expense transactions or task due/completion histories.",
            "Do not join these records to the app's user records or present them as personal financial data.",
            "Interpret weighted means in light of the survey's sampling design and official documentation.",
            "Attribution and share-alike obligations may apply to redistributed adaptations under ODbL.",
        ],
    }
    return summary, metadata


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", default="../data/public/india-time-use-2024")
    parser.add_argument("--source-file", help="Use an already downloaded timeuse.csv.gz instead of downloading.")
    parser.add_argument("--url", default=SOURCE_URL, help=argparse.SUPPRESS)
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)
    source_path = Path(args.source_file).resolve() if args.source_file else output_dir / "timeuse.csv.gz"

    try:
        if not args.source_file:
            print(f"Downloading public survey data from {args.url}", flush=True)
            download_source(args.url, source_path)
        print("Validating source schema and computing weighted summaries…", flush=True)
        frame = load_source(source_path)
        summary, metadata = summarize(frame)
        summary_path = output_dir / "activity_summary.csv"
        manifest_path = output_dir / "manifest.json"
        summary.to_csv(summary_path, index=False)
        manifest_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(json.dumps({
            "summary_csv": str(summary_path),
            "manifest_json": str(manifest_path),
            "source_rows": metadata["source_rows"],
            "valid_activity_rows": metadata["valid_activity_rows"],
            "unique_respondents": metadata["unique_respondents_in_valid_rows"],
            "summary_rows": metadata["summary_rows"],
        }, indent=2))
        return 0
    except Exception as exc:
        print(f"Import failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
