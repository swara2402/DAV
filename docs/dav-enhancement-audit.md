# DAV implementation audit and verification checklist

This document is an engineering checklist for the existing product. It is not a presentation or study guide.

## Scope and current architecture

LifeDecoded uses a React + TypeScript + Vite frontend, a FastAPI backend, Pandas/NumPy analytics, SQLite for local development, and Supabase Auth/PostgreSQL for the configured production path. The dashboard currently exposes period selection, an expense CSV import action, spending summaries, a weekly trend, a workload/spending comparison, recent records, and an evidence detail route.

This review was performed against the repository's remote `main` snapshot before edits. The GitHub API does not expose a local developer's uncommitted working tree, so local changes cannot be assessed here.

## Changes made in this enhancement

- Replaced wording that described the minimum-observation threshold as producing a "statistically confident" ratio. The threshold is a stability rule for a descriptive comparison, not a statistical significance test and not evidence of causation.
- Added actionable dashboard empty states for weekly spending, workload/spending breakdowns, and recent expense records. They point users toward the relevant record-entry flow rather than leaving a passive blank chart or table.
- Preserved the existing data model, routes, charting library, insight thresholds, and API architecture.

## DAV concept-to-feature mapping

| DAV concept | Existing implementation or verification target | Guardrail |
|---|---|---|
| Analytics lifecycle | CSV ingestion, validation, weekly aggregation, insight calculation, dashboard, evidence view | Keep transformation steps reproducible |
| Data quality and preprocessing | CSV header/row handling, category inference, validation and duplicate-import protections | Show accepted/skipped/rejected counts where the API provides them; do not infer a quality score |
| Tidy data and data dictionary | `data/schemas/data_dictionary.md`, `docs/data_dictionary.md` | Keep field names, units and meanings consistent across layers |
| Feature engineering | Weekly workload measures and convenience-food spending aggregation | Use the same definitions in insight and dashboard calculations |
| Measurement scales | Dates, currency amounts, category labels, overdue-task counts | Do not average nominal categories or compare incompatible units |
| Exploratory visualization | Weekly spending trend and workload/spending chart | Label axes, units, period and missing observations |
| Explanatory visualization | Evidence detail and qualifying/baseline comparison | Show sample counts and the comparison rule |
| Hypothesis formulation | Association between recorded workload and convenience-food spending | Observational records cannot establish causation |
| Sampling and sufficiency | Minimum of 3 qualifying and 3 baseline weeks over the configured analysis window | Explain insufficient observations; do not call this statistical significance |
| Normalization, standardization, PCA | Not required for current descriptive comparisons | Do not add methods without a question and defensible interpretation |
| Provenance | Synthetic persona files and India Time Use Survey importer documentation | Keep public survey data separate from personal transaction histories |

## Analytics definitions to preserve

- A qualifying week is determined by the configured overdue-task threshold at the weekly snapshot.
- Qualifying and baseline groups must meet the existing minimum observation counts before the ratio is shown.
- A ratio compares group averages only when the baseline average supports a meaningful ratio. A zero baseline must not be converted into an infinite or fabricated result.
- Weekly records are observational. Results describe the data supplied and do not prove that workload causes spending changes.
- Synthetic personas must remain clearly labelled as synthetic. Public time-use survey data must not be presented as if it were linked to an individual's financial transactions.

For the authoritative formulas and snapshot rules, see [Insight methodology](insight_methodology.md). For CSV contracts and privacy boundaries, see [Transaction import](real_transaction_import.md) and [Privacy and security](privacy_and_security.md).

## Verification commands

Run from the repository root in an environment with the documented dependencies installed:

```bash
cd backend
python -m pytest tests/ -v --tb=short
```

```bash
cd frontend
npm test
npm run lint
npm run build
```

```bash
cd ..
python data/validate_synthetic.py
```

**Execution status for this enhancement:** these commands have not been run in a local checkout in this session. Do not treat previously recorded test output in older documentation as a fresh result for this branch. Check the branch's CI workflow and execute the commands before merging.

## Remaining verification work

- Exercise the dashboard on empty, sparse, and populated personal workspaces.
- Verify the CSV import preview/summary against the actual backend response shape, including rejected-row reasons and repeated imports.
- Confirm all chart values match the API's aggregation for identical date boundaries.
- Test mobile layouts, keyboard focus, reduced-motion settings, and screen-reader labels in a browser.
- Verify Supabase row-level security and authentication using the deployed project's actual policies and configuration.
- Review current CI results for this branch before merge.
