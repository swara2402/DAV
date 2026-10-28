# Data Dictionary — Life, Decoded

Complete reference for all tables in the Life, Decoded database schema.

---

## Conventions

### Week Convention
- **Standard**: ISO 8601 weeks — each week starts on **Monday**, ends on **Sunday**
- **Timezone**: All week boundaries evaluated in **Asia/Kolkata (IST, UTC+5:30)**
- **Snapshot time**: End-of-week snapshot taken at **Sunday 23:59:59 IST**

### Overdue Definition
A task is **overdue** at snapshot time `S` if:

```
task.due_date < snapshot_date(S)
AND (
    task.completed_at IS NULL
    OR task.completed_at > task.due_date || 'T23:59:59'
)
```

Equivalently in plain English: the task's due date has passed and it was either never completed or completed after its due date.

### Qualifying Week Definition
A week is a **qualifying week** (high-stress indicator) if, at the Sunday 23:59:59 IST snapshot, the persona has **≥ 3 overdue tasks** whose `due_date` falls within that week's Monday–Sunday window.

---

## Tables

---

### `expenses`

Tracks individual financial transactions for a persona.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 string (e.g. `"3f2504e0-..."`) |
| `persona_id` | TEXT | NOT NULL, FK → profiles.id | Identifier of the owning persona |
| `date` | TEXT | NOT NULL | Transaction date in `YYYY-MM-DD` format |
| `amount` | REAL | NOT NULL, ≥ 0 | Amount in Indian Rupees (INR), 2 decimal places |
| `category` | TEXT | NOT NULL | See allowed values below |
| `description` | TEXT | NOT NULL | Human-readable description of the expense |

**Allowed `category` values:**

| Value | Description |
|---|---|
| `convenience_food` | Takeaway, food delivery apps (Swiggy, Zomato, Blinkit, etc.) |
| `groceries` | Planned grocery shopping (DMart, BigBasket, kirana, etc.) |
| `transport` | Commuting and travel (Uber, Ola, metro, auto, petrol, etc.) |
| `shopping` | Discretionary retail purchases (Amazon, Myntra, Flipkart, etc.) |
| `bills` | Recurring utilities and subscriptions (electricity, internet, OTT, gym, etc.) |
| `other` | Any expense that does not fit the above categories |

---

### `tasks`

Tracks to-do items and their completion status for a persona.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 string |
| `persona_id` | TEXT | NOT NULL, FK → profiles.id | Identifier of the owning persona |
| `title` | TEXT | NOT NULL | Short description of the task |
| `created_at` | TEXT | NOT NULL | ISO 8601 datetime when the task was created (`YYYY-MM-DDTHH:MM:SS`) |
| `due_date` | TEXT | NOT NULL | Date the task is due, in `YYYY-MM-DD` format; must be ≥ `created_at` date |
| `completed_at` | TEXT | NULLABLE | ISO 8601 datetime of completion, or empty string / NULL if not yet done. When present, must be ≥ `created_at`. May be > `due_date` for late completions. |
| `category` | TEXT | NOT NULL | See allowed values below |

**Allowed `category` values:**

| Value | Description |
|---|---|
| `work` | Professional tasks, meetings, deliverables |
| `personal` | Personal errands, relationships, life admin |
| `health` | Medical appointments, fitness, well-being |
| `finance` | Financial tasks (bills, investments, returns) |
| `household` | Home maintenance, supplies, domestic tasks |

**Temporal constraints:**
- `created_at` ≤ `due_date` (end of day)
- `completed_at` ≥ `created_at` (when present)
- `completed_at` may be > `due_date` (late completion — this is what makes a task historically overdue in past snapshots)

---

### `profiles`

Stores persona/user metadata.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | Unique persona identifier (e.g. `"maya-001"`) |
| `name` | TEXT | NOT NULL | Display name of the persona |
| `age` | INTEGER | NOT NULL, > 0 | Age in years |
| `city` | TEXT | NOT NULL | City of residence |
| `occupation` | TEXT | NOT NULL | Job or occupation description |
| `monthly_income_inr` | REAL | NULLABLE, ≥ 0 | Regular monthly income in INR; NULL for irregular/freelance income |
| `created_at` | TEXT | NOT NULL | ISO 8601 datetime when the profile was created |

---

### `insights`

Generated insights derived from expense and task data. Each insight captures a discovered behavioral pattern for a persona over a specific analysis window.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 string |
| `persona_id` | TEXT | NOT NULL, FK → profiles.id | Owning persona |
| `insight_type` | TEXT | NOT NULL | Slug identifying the insight algorithm (e.g. `"overdue_vs_convenience_food"`) |
| `title` | TEXT | NOT NULL | Short human-readable insight title |
| `body` | TEXT | NOT NULL | Full insight explanation in plain language |
| `confidence` | REAL | NOT NULL, 0.0–1.0 | Model confidence score |
| `window_start` | TEXT | NOT NULL | Start date of the analysis window (`YYYY-MM-DD`) |
| `window_end` | TEXT | NOT NULL | End date of the analysis window (`YYYY-MM-DD`) |
| `qualifying_weeks` | INTEGER | NOT NULL, ≥ 0 | Number of qualifying weeks (≥3 overdue tasks) in the window |
| `baseline_weeks` | INTEGER | NOT NULL, ≥ 0 | Number of baseline weeks (<3 overdue tasks) in the window |
| `ratio` | REAL | NOT NULL, > 0 | Convenience food spend ratio: qualifying ÷ baseline average |
| `generated_at` | TEXT | NOT NULL | ISO 8601 datetime when the insight was generated |

---

### `insight_actions`

Tracks user interactions with surfaced insights (dismissed, saved, acted upon).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 string |
| `insight_id` | TEXT | NOT NULL, FK → insights.id | Related insight |
| `persona_id` | TEXT | NOT NULL, FK → profiles.id | Owning persona |
| `action` | TEXT | NOT NULL | User action taken: `"viewed"`, `"dismissed"`, `"saved"`, `"acted"` |
| `acted_at` | TEXT | NOT NULL | ISO 8601 datetime of the action |
| `notes` | TEXT | NULLABLE | Optional user-supplied notes when action = `"acted"` |

**Allowed `action` values:**

| Value | Meaning |
|---|---|
| `viewed` | Insight was displayed to the user |
| `dismissed` | User dismissed / marked as not relevant |
| `saved` | User bookmarked the insight for later |
| `acted` | User acknowledged and took action based on the insight |

---

### `demo_seed_runs`

Audit log for synthetic data generation runs, enabling reproducibility tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY, NOT NULL | UUID v4 string |
| `run_at` | TEXT | NOT NULL | ISO 8601 datetime when the generation script was executed |
| `script_version` | TEXT | NOT NULL | Version tag of the generator script (e.g. `"v1.0"`) |
| `seed` | INTEGER | NOT NULL | Random seed used (e.g. `42`) |
| `window_start` | TEXT | NOT NULL | Start of the data window (`YYYY-MM-DD`) |
| `window_end` | TEXT | NOT NULL | End of the data window (`YYYY-MM-DD`) |
| `records_created` | INTEGER | NOT NULL, ≥ 0 | Total records written across all output files |
| `notes` | TEXT | NULLABLE | Any additional context about the run |

---

## Category Quick Reference

### Expense Categories
`convenience_food` · `groceries` · `transport` · `shopping` · `bills` · `other`

### Task Categories
`work` · `personal` · `health` · `finance` · `household`

### Insight Action Types
`viewed` · `dismissed` · `saved` · `acted`

---

## Planted Pattern Reference

The synthetic dataset has a deliberately planted correlation for demo/testing:

```
High overdue-task weeks → Higher convenience food spending
  Qualifying week threshold : ≥ 3 overdue tasks (snapshot: Sunday 23:59:59 IST)
  Target ratio              : 1.8× – 3.0× (qualifying avg ÷ baseline avg)
  Validation threshold      : ratio > 1.5×
```

See [`data/synthetic/README.md`](../synthetic/README.md) for exact generated statistics.

---

*Last updated: 2026-10-28 · Schema version: v1.0*
