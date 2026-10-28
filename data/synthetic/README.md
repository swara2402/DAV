# Synthetic Dataset — Life, Decoded

> **Important**: This data is entirely synthetic and computer-generated. It does **not** represent real people, real transactions, or real events.

---

## Overview

These CSV files provide a realistic synthetic dataset for the **Life, Decoded** application — a personal finance + productivity insight engine. Two fictional personas are included to power demo, development, and testing workflows.

---

## Generation

| Property | Value |
|---|---|
| Generator script | `data/generate_synthetic.py` |
| Random seed | `42` (fully deterministic) |
| Python version | 3.10+ |
| Run command | `python3 data/generate_synthetic.py` from project root |

---

## 12-Week Window

| | Date |
|---|---|
| **Start** | Monday **2026-08-04** (ISO week 32) |
| **End** | Sunday **2026-10-25** (ISO week 43) |
| **Duration** | 12 complete ISO weeks |
| **Timezone** | Asia/Kolkata (IST, UTC+5:30) |

Week boundaries follow ISO 8601 convention: each week starts on **Monday** and ends on **Sunday**. End-of-week snapshots are taken at **Sunday 23:59:59 IST**.

---

## Files

| File | Persona | Records |
|---|---|---|
| `maya_expenses.csv`  | Maya (maya-001)  | ~114 expense rows |
| `maya_tasks.csv`     | Maya (maya-001)  | ~78 task rows |
| `arjun_expenses.csv` | Arjun (arjun-001) | ~119 expense rows |
| `arjun_tasks.csv`    | Arjun (arjun-001) | ~75 task rows |

---

## Personas

### Maya (`maya-001`)
- Age: 23, first-job professional
- City: Bangalore
- Income: ₹45,000/month salary (regular 9–5)
- Pattern: Busy work weeks → convenience food reliance

### Arjun (`arjun-001`)
- Age: 25, freelancer
- City: Mumbai
- Income: Irregular freelance payments
- Pattern: High-stress weeks (many overdue tasks) → elevated convenience food spending

---

## Planted Pattern (Statistically Verifiable)

Both personas exhibit a clear, measurable correlation between **task overload** and **convenience food spending**.

### Definition
- **Overdue task** (at end-of-week snapshot): `due_date` falls within the week AND (`completed_at` is empty OR `completed_at > due_date`)
- **Qualifying week**: ≥ 3 overdue tasks at Sunday 23:59:59 IST snapshot
- **Baseline week**: < 3 overdue tasks at snapshot

### Designations
- **Maya high-stress weeks** (week indices 0-based): 1, 4, 7, 9, 11
- **Arjun high-stress weeks** (week indices 0-based): 0, 3, 6, 8, 10

### Spending Targets

| Persona | High-stress CF spend | Baseline CF spend | Target ratio |
|---|---|---|---|
| Maya  | ₹800–2,000/week | ₹200–600/week | 2.0–3.0× |
| Arjun | ₹800–2,000/week | ₹200–600/week | 1.8–2.5× |

### Actual Generated Ratios (v1.0)

| Persona | Qualifying weeks | Baseline weeks | Avg CF qualifying | Avg CF baseline | Ratio |
|---|---|---|---|---|---|
| Maya  | 9 | 3 | ₹908.96/week | ₹423.34/week | **2.15×** |
| Arjun | 9 | 3 | ₹973.43/week | ₹323.44/week | **3.01×** |

---

## Key Statistics

### Maya
- Total expense records: 114
- Total spend: ₹63,317.81
- Convenience food total: ₹9,450.67
- Task records: 78

### Arjun
- Total expense records: 119
- Total spend: ₹61,637.79
- Convenience food total: ₹9,731.24
- Task records: 75

---

## Category Values

**Expenses**: `convenience_food`, `groceries`, `transport`, `shopping`, `bills`, `other`

**Tasks**: `work`, `personal`, `health`, `finance`, `household`

---

## Version

**v1.0** — Initial synthetic dataset for Life, Decoded MVP.
