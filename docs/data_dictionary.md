# Life, Decoded — Data Dictionary & Schema Specification

This document formally specifies the database schemas, entity relationships, validation constraints, enumeration values, and temporal conventions implemented in **Life, Decoded**.

---

## 1. Temporal & Calculation Conventions

### Week Boundary Standard
- **Timezone**: `Asia/Kolkata` (IST, UTC+5:30).
- **Week Start**: Monday `00:00:00` IST.
- **Week End**: Sunday `23:59:59` IST.
- **ISO Standard**: Conforms to ISO 8601 calendar week definition.

### Historical Overdue Snapshot Convention
A task is counted as **overdue at a historical Sunday snapshot** ($S$) if and only if:
1. `due_date < snapshot_date` ($S$), **AND**
2. `completed_at IS NULL` OR `completed_at > snapshot_date` ($S$).

A task completed late must continue to be recorded as overdue in every snapshot between its deadline and its eventual completion date.

### Qualifying vs Baseline Week Cohorts
- **Qualifying Week**: A complete calendar week with $\ge 3$ tasks overdue at the Sunday closing snapshot.
- **Baseline Week**: A complete calendar week with $< 3$ tasks overdue at the Sunday closing snapshot.

---

## 2. Table Specifications

### 2.1 `profiles`
Stores user profile information, selected persona, and currency settings.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` / `user_id` | TEXT (UUID) | No | None | Primary key. In production, foreign key referencing `auth.users.id`. In demo mode, `demo_<persona>`. |
| `email` | TEXT | Yes | `NULL` | User's email address. |
| `name` / `display_name` | TEXT | Yes | `NULL` | User's display name. |
| `currency` | TEXT | No | `'INR'` | ISO 4217 currency code. |
| `selected_persona` | TEXT | Yes | `NULL` | Fictional persona active in session (`'maya'`, `'arjun'`, `'fresh'`). |
| `created_at` | TEXT (ISO) | No | `now()` | UTC ISO 8601 creation timestamp. |
| `updated_at` | TEXT (ISO) | No | `now()` | UTC ISO 8601 last update timestamp. |

---

### 2.2 `expenses`
Stores transaction records for personal spending.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | TEXT (UUID) | No | UUIDv4 | Primary key. |
| `user_id` | TEXT | No | None | Foreign key referencing `profiles.id`. |
| `date` | TEXT (Date) | No | None | ISO 8601 calendar date (`YYYY-MM-DD`). |
| `amount` | REAL | No | None | Expense amount in INR. Must be strictly positive ($> 0$). |
| `category` | TEXT | No | None | Category enumeration (see Category Values below). |
| `description` | TEXT | Yes | `''` | Optional descriptive label (e.g. merchant, item). |
| `data_source` | TEXT | No | `'user_entered'` | `'user_entered'` or `'demo_synthetic'`. |
| `created_at` | TEXT (ISO) | No | `now()` | Creation timestamp. |
| `updated_at` | TEXT (ISO) | No | `now()` | Modification timestamp. |

#### Allowed Expense Categories:
- `convenience_food`: Delivery, takeout, quick snacks, on-demand meals (Zomato, Swiggy, Dominos).
- `groceries`: Supermarket, raw ingredients, cooking staples (BigBasket, Zepto staples).
- `transport`: Fuel, public transit, rideshare, cab fares.
- `shopping`: Apparel, electronics, household goods, books.
- `bills`: Utilities, electricity, mobile recharge, internet, rent.
- `other`: Miscellaneous expenses.

---

### 2.3 `tasks`
Stores actionable responsibilities and historical deadlines.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | TEXT (UUID) | No | UUIDv4 | Primary key. |
| `user_id` | TEXT | No | None | Foreign key referencing `profiles.id`. |
| `title` | TEXT | No | None | Task name or action description (max 500 characters). |
| `category` | TEXT | No | `'other'` | Task domain category (see Task Categories below). |
| `due_date` | TEXT (Date) | Yes | `NULL` | Deadline date (`YYYY-MM-DD`). |
| `completed_at` | TEXT (ISO) | Yes | `NULL` | Timestamp or date when completed. `NULL` if open. |
| `created_at` | TEXT (ISO) | No | `now()` | When the task was created by the user. |
| `data_source` | TEXT | No | `'user_entered'` | Source tag. |
| `updated_at` | TEXT (ISO) | No | `now()` | Modification timestamp. |

#### Allowed Task Categories:
- `work`: Professional commitments, work deliverables, client tasks.
- `personal`: Personal errands, appointments, social tasks.
- `health`: Medical appointments, exercise, prescriptions.
- `finance`: Taxes, bill payments, banking, investments.
- `household`: Chores, maintenance, groceries, laundry.
- `other`: General tasks.

---

### 2.4 `insights`
Persistent cache and audit trail of computed behavioral findings.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | No | Primary key. |
| `user_id` | TEXT | No | Foreign key referencing `profiles.id`. |
| `insight_type` | TEXT | No | Identifier e.g. `'overdue_convenience_correlation'`. |
| `status` | TEXT | No | `'sufficient'` or `'insufficient_data'`. |
| `computed_result` | TEXT (JSON) | No | Full structured result payload. |
| `observation_start`| TEXT (Date) | Yes | Starting date of the 12-week analysis window. |
| `observation_end` | TEXT (Date) | Yes | Closing date of the 12-week analysis window. |
| `engine_version` | TEXT | No | Version string (`'1.0.0'`). |
| `data_source` | TEXT | No | Data origin flag. |
| `created_at` | TEXT (ISO) | No | Timestamp of calculation. |

---

### 2.5 `insight_actions`
Tracks user commitments to trial actions ("Tried It" workflow).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | No | Primary key. |
| `user_id` | TEXT | No | Foreign key referencing `profiles.id`. |
| `insight_id` | TEXT | Yes | Associated insight type or ID. |
| `action_text` | TEXT | No | Verbatim text of the trial action taken. |
| `tried_at` | TEXT (ISO) | No | Timestamp when the user logged the action. |
| `followup_window_days` | INTEGER | No | Number of days required for evaluation (Default: 28). |
| `followup_status` | TEXT | No | `'pending'`, `'sufficient_data'`, or `'insufficient_data'`. |
| `outcome_metrics` | TEXT (JSON) | Yes | Comparison outcome metrics computed upon window completion. |
| `created_at` | TEXT (ISO) | No | Creation timestamp. |

---

### 2.6 `demo_seed_runs`
Ensures idempotency and prevents duplicate seed records.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | TEXT (UUID) | No | Primary key. |
| `user_id` | TEXT | No | Foreign key referencing `profiles.id`. |
| `persona_id` | TEXT | No | Persona code (`'maya'`, `'arjun'`, `'fresh'`). |
| `dataset_version` | TEXT | No | Seed dataset version (`'v1.0'`). |
| `seeded_at` | TEXT (ISO) | No | Timestamp when seed was executed. |
