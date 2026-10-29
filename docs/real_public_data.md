# Real public-data ingestion

Life, Decoded has two distinct data responsibilities:

1. **Personal insight engine:** computes within-user comparisons from that user's own expense and task records.
2. **Public research analysis:** summarizes genuine, published survey records for population-level context.

The second pipeline now has a reproducible importer for India's Time Use Survey 2024, using the pre-processed public release from [Vonter/india-timeuse-survey](https://github.com/Vonter/india-timeuse-survey), sourced from MoSPI. The repository publishes the data under the Open Database License (ODbL), while noting some underlying content may be copyrighted by MoSPI. Review the source's current terms and attribution requirements before redistributing derived data.

## Run the import

From the `backend` directory, with the project's requirements installed:

```bash
python scripts/import_public_timeuse.py
```

This downloads the release and writes two local outputs under `data/public/india-time-use-2024/`:

- `activity_summary.csv`: state, age band, activity, location, payment status, and day-of-week summaries. It retains additive weighted-hour and survey-weight totals so later aggregation does not take an unweighted mean of group means.
- `manifest.json`: source URL, retrieval time, source/valid/excluded row counts, columns, method, license notes, and limitations.
- `timeuse.csv.gz`: the downloaded source archive, kept locally and not committed to this repository.

To process an archive you've already downloaded:

```bash
python scripts/import_public_timeuse.py --source-file /path/to/timeuse.csv.gz
```

The importer fails closed if expected columns are missing. It records invalid-row exclusions and never silently fills missing activity times with made-up values.

## Important research boundary

This is real survey data about time use. It is **not** a record of individual bank transactions and does **not** include the app's linked overdue-task history. Therefore the importer deliberately does not create expense rows, task rows, fictional timestamps, or person-level joins. It cannot validate the app's original task-overload versus convenience-food-spending hypothesis. That insight must be computed only from a real participant's own linked records, or studied with a separate dataset that legitimately contains both constructs and permits the linkage.

The existing Maya/Arjun demo fixtures remain synthetic benchmark fixtures and must continue to be labeled as such. They are not transformed into "real" data by this import. Use the public summary for separate population-level descriptive research, and do not present it as personal user data.

## Output interpretation

`weighted_mean_hours_per_record` is the survey-multiplier-weighted mean duration for rows in each grouping, not a daily average for an individual. The API's `avg_activity_record_hours` is computed as the sum of weighted hours divided by the sum of survey multipliers across eligible age-band records. It is deliberately labelled as a mean activity-record duration, not 'daily work hours'. The loader excludes the 0–17 and 60+ age bands from its 18–59 summary and declines to load older summaries that lack additive weighted totals. After deploying a new importer version, rerun `python scripts/import_public_timeuse.py` to regenerate the local summary. Use official survey documentation to account for the survey design before making population estimates. Results are descriptive and do not establish causality.
