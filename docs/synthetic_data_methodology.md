# Synthetic Data Methodology

## 1. Overview & Purpose

To provide an instant, reliable, zero-onboarding experience for first-time visitors, **Life, Decoded** includes deterministic, version-controlled synthetic datasets for two representative personas: **Maya** and **Arjun**.

> [!IMPORTANT]
> **Synthetic Disclosure:** These records are artificially constructed using probabilistic generation models. They do not correspond to any living individual, real bank transactions, or actual employer accounts. All demo metrics are explicitly designated with `data_source: "demo_synthetic"`.

---

## 2. Personas & Characteristics

### Persona 1: Maya (23, Junior Software Analyst, Bangalore)
- **Living situation**: Lives independently in a rented 1BHK apartment in Koramangala, Bangalore.
- **Income**: Fixed monthly salary of ₹45,000 paid on the 1st of each month.
- **Work pattern**: Fixed 9-to-5 working schedule with periodic deadline crunches (sprint wrap-ups).
- **Planted Behavioral Hypothesis**: During high-stress weeks (sprint cutoffs), overdue work and administrative tasks accumulate, resulting in fatigue and frequent on-demand meal deliveries via Swiggy/Zomato.
- **Dataset Size**: 114 expense records, 78 task records across 12 complete weeks.
- **Planted Outcome**: 5 qualifying weeks, 7 baseline weeks; Observed Ratio: **3.20×**.

### Persona 2: Arjun (25, Freelance UI/UX Designer, Mumbai)
- **Living situation**: Rented studio in Bandra, Mumbai.
- **Income**: Irregular project milestone payments with high variance.
- **Work pattern**: Independent client contracts, irregular working hours, self-directed schedules.
- **Planted Behavioral Hypothesis**: Client review weeks create intense task overload, driving takeout orders and quick snacks instead of grocery cooking.
- **Dataset Size**: 129 expense records, 67 task records across 12 complete weeks.
- **Planted Outcome**: 5 qualifying weeks, 7 baseline weeks; Observed Ratio: **3.42×**.

---

## 3. Deterministic Generation Parameters

All synthetic data is generated via `/Users/sam/Desktop/DAV/data/generate_synthetic.py`.

- **Random Seed**: Fixed at `42` (`random.Random(42)`).
- **Observation Window**:
  - `WINDOW_START`: Monday `2026-08-03`.
  - `WINDOW_END`: Sunday `2026-10-25`.
  - Duration: Exactly 12 complete ISO calendar weeks (84 days).
- **Timezone**: `Asia/Kolkata` (IST, UTC+05:30).

---

## 4. The Planted Association Pattern

To mathematically validate the Insight Engine, both datasets have a planted association between overdue task volume and convenience-food expenditure:

1. **High-Stress (Qualifying) Weeks**:
   - Maya's Designated Weeks: Weeks `[1, 4, 7, 9, 11]`.
   - Arjun's Designated Weeks: Weeks `[0, 3, 6, 8, 10]`.
   - Task Characteristics: 3 to 5 tasks overdue at the Sunday 23:59:59 IST snapshot. Overdue tasks are completed late (1 to 3 days after Sunday), ensuring historical overdue status at the snapshot without carrying over infinitely.
   - Convenience Food Expenditure: ₹800 to ₹2,000 per week.

2. **Calm (Baseline) Weeks**:
   - Task Characteristics: 0 to 1 tasks overdue at the Sunday snapshot.
   - Convenience Food Expenditure: ₹200 to ₹600 per week.

3. **Ordinary Baseline Expenses**:
   - Both personas include realistic background transactions for groceries, transport (metro, auto, fuel), monthly utilities (mobile, electricity, internet), shopping, and personal care.

---

## 5. Automated Data Validation

The synthetic dataset integrity is guaranteed by `data/validate_synthetic.py`, which enforces 32 automated checks:
1. Exact column headers and schemas.
2. Zero duplicate UUIDs across all records.
3. Strict ISO 8601 date format conformance.
4. Non-negative currency amounts in INR.
5. Membership in allowed category sets.
6. Temporal validity: `created_at <= due_date` for all tasks.
7. Completion validity: `completed_at >= created_at` for all completed tasks.
8. 12-week complete coverage for both expenses and tasks.
9. Verification of planted pattern:
   - Maya ratio: $\ge 1.5\times$ (Observed: 3.20×).
   - Maya week counts: $\ge 3$ qualifying (Observed: 5), $\ge 3$ baseline (Observed: 7).
   - Arjun ratio: $\ge 1.5\times$ (Observed: 3.42×).
   - Arjun week counts: $\ge 3$ qualifying (Observed: 5), $\ge 3$ baseline (Observed: 7).

