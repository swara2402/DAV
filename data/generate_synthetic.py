"""
generate_synthetic.py
Generates deterministic synthetic expense and task data for two personas:
  - Maya  (id: maya-001):  23-year-old first-job professional in Bangalore
  - Arjun (id: arjun-001): 25-year-old freelancer in Mumbai

Seed: 42
12-week window: 2026-08-04 (Monday) → 2026-10-25 (Sunday)

Planted pattern
---------------
Weeks designated as "high-stress" have ≥3 overdue tasks AND higher
convenience food spending than baseline weeks.
  Maya  ratio target: 2.0-3.0x
  Arjun ratio target: 1.8-2.5x

Overdue definition (end-of-week Sunday 23:59:59 IST snapshot):
  task.due_date falls within that week's window (monday..sunday)
  AND (completed_at IS NULL  OR  completed_at > due_date)

Run from project root:
    python3 data/generate_synthetic.py
"""

import csv
import os
import random
import uuid
from datetime import date, datetime, timedelta

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SEED = 42
rng = random.Random(SEED)

WINDOW_START = date(2026, 8, 3)    # Monday, week 1
WINDOW_END   = date(2026, 10, 25)  # Sunday,  week 12

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "synthetic")
os.makedirs(OUTPUT_DIR, exist_ok=True)

EXPENSE_CATEGORIES = ["convenience_food", "groceries", "transport", "shopping", "bills", "other"]
TASK_CATEGORIES    = ["work", "personal", "health", "finance", "household"]


def week_mondays():
    mondays = []
    d = WINDOW_START
    while d <= WINDOW_END:
        mondays.append(d)
        d += timedelta(weeks=1)
    return mondays


WEEK_MONDAYS = week_mondays()
assert len(WEEK_MONDAYS) == 12, f"Expected 12 weeks, got {len(WEEK_MONDAYS)}"


def week_sunday(monday: date) -> date:
    return monday + timedelta(days=6)


def rand_date_in_week(monday: date) -> date:
    return monday + timedelta(days=rng.randint(0, 6))


def fmt_date(d: date) -> str:
    return d.strftime("%Y-%m-%d")


def fmt_datetime(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def new_id() -> str:
    return str(uuid.UUID(int=rng.getrandbits(128), version=4))


# ---------------------------------------------------------------------------
# Expense description banks
# ---------------------------------------------------------------------------

CONVENIENCE_DESCS = [
    "Swiggy dinner order", "Zomato lunch", "Dunzo grocery quick delivery",
    "McDonald's meal", "Domino's pizza", "KFC bucket", "Blinkit snacks run",
    "Chai + samosa outside", "Breakfast at cafe", "Zepto instant order",
    "Late-night Swiggy", "Office canteen (overpriced)", "Uber Eats weekend",
]
GROCERY_DESCS = [
    "DMart monthly groceries", "BigBasket order", "Local kirana store",
    "Milk and bread", "Fruits and veggies", "Weekly provisions",
    "Zepto scheduled grocery", "Reliance Fresh",
]
TRANSPORT_DESCS = [
    "Uber/Ola commute", "Metro card recharge", "Auto fare", "Petrol fill",
    "Bus pass renewal", "Rapido bike ride", "Airport cab",
]
SHOPPING_DESCS = [
    "Amazon delivery", "Myntra order", "Flipkart sale purchase",
    "IKEA home item", "Croma electronics", "Nykaa order",
]
BILL_DESCS = [
    "Electricity bill", "Mobile recharge", "OTT subscription",
    "Internet bill", "Gym membership", "Society maintenance",
    "Water bill",
]
OTHER_DESCS = [
    "Medical expense", "Book purchase", "Stationery", "Gift for friend",
    "Movie tickets", "Event tickets", "Miscellaneous",
]

CATEGORY_DESC_MAP = {
    "convenience_food": CONVENIENCE_DESCS,
    "groceries":        GROCERY_DESCS,
    "transport":        TRANSPORT_DESCS,
    "shopping":         SHOPPING_DESCS,
    "bills":            BILL_DESCS,
    "other":            OTHER_DESCS,
}

TASK_TITLE_MAP = {
    "work":      ["Prepare project report", "Client call follow-up", "Submit invoice",
                  "Code review PR", "Update Jira board", "Team standup notes",
                  "Quarterly presentation", "Write documentation", "Deploy hotfix",
                  "Reply to stakeholder email"],
    "personal":  ["Call parents", "Book dentist appointment", "Plan weekend trip",
                  "Buy birthday gift", "Renew driving license", "Clean apartment",
                  "Update resume", "Catch up with old friend"],
    "health":    ["Morning run 5km", "Yoga session", "Doctor appointment",
                  "Pharmacy pickup", "Health insurance claim", "Blood test"],
    "finance":   ["Pay credit card bill", "Check investment portfolio",
                  "File GST return", "Transfer rent", "Review bank statement",
                  "Top up PPF account"],
    "household": ["Pay electricity bill", "Fix leaking tap", "Restock groceries",
                  "Schedule house cleaning", "Buy LPG cylinder", "Internet recharge"],
}

# ---------------------------------------------------------------------------
# Persona definitions
# ---------------------------------------------------------------------------

PERSONAS = {
    "maya": {
        "id":               "maya-001",
        "city":             "Bangalore",
        "monthly_salary":   45000,
        # 5 designated high-stress weeks (0-based indices into WEEK_MONDAYS)
        "high_stress_weeks": [1, 4, 7, 9, 11],
    },
    "arjun": {
        "id":               "arjun-001",
        "city":             "Mumbai",
        "monthly_salary":   None,
        # 5 designated high-stress weeks
        "high_stress_weeks": [0, 3, 6, 8, 10],
    },
}

# ---------------------------------------------------------------------------
# Core generation functions
# ---------------------------------------------------------------------------

def make_expense(persona_id: str, day: date, category: str,
                 amount: float, description: str = None) -> dict:
    desc = description or rng.choice(CATEGORY_DESC_MAP[category])
    return {
        "id":          new_id(),
        "persona_id":  persona_id,
        "date":        fmt_date(day),
        "amount":      f"{amount:.2f}",
        "category":    category,
        "description": desc,
    }


def generate_expenses(persona_key: str) -> list:
    p = PERSONAS[persona_key]
    persona_id   = p["id"]
    high_stress  = set(p["high_stress_weeks"])
    records = []

    for week_idx, monday in enumerate(WEEK_MONDAYS):
        is_high_stress = week_idx in high_stress

        # ---- Convenience food ----
        if is_high_stress:
            cf_total = rng.uniform(800, 2000)
            cf_count = rng.randint(3, 6)
        else:
            cf_total = rng.uniform(200, 600)
            cf_count = rng.randint(1, 3)

        splits = sorted([rng.random() for _ in range(cf_count - 1)])
        splits = [0.0] + splits + [1.0]
        cf_amounts = [cf_total * (splits[i + 1] - splits[i]) for i in range(cf_count)]
        for amt in cf_amounts:
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "convenience_food", amt))

        # ---- Groceries (1-3 per week) ----
        for _ in range(rng.randint(1, 3)):
            amt = rng.uniform(200, 1500)
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "groceries", amt))

        # ---- Transport (2-5 per week) ----
        for _ in range(rng.randint(2, 5)):
            amt = rng.uniform(50, 500)
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "transport", amt))

        # ---- Shopping (0-2 per week) ----
        for _ in range(rng.randint(0, 2)):
            amt = rng.uniform(200, 3000)
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "shopping", amt))

        # ---- Bills (sparse, ~25% chance per week) ----
        if rng.random() < 0.25:
            amt = rng.uniform(200, 3000)
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "bills", amt))

        # ---- Other (35% chance per week) ----
        if rng.random() < 0.35:
            amt = rng.uniform(100, 1000)
            day = rand_date_in_week(monday)
            records.append(make_expense(persona_id, day, "other", amt))

    return records


def generate_tasks(persona_key: str) -> list:
    """Generate task records for a persona.

    Overdue at end-of-week snapshot means:
      task.due_date falls within that week (monday..sunday)
      AND (completed_at == ""  OR  completed_at > due_date as datetime)

    To avoid cumulative carry-over, all 'never-completed' overdue tasks are
    given a due_date strictly within their designated week only.
    Tasks in baseline weeks that remain open have due_date in a future week
    so they don't count as overdue this week.
    """
    p = PERSONAS[persona_key]
    persona_id  = p["id"]
    high_stress = set(p["high_stress_weeks"])
    records = []

    for week_idx, monday in enumerate(WEEK_MONDAYS):
        sunday          = week_sunday(monday)
        is_high_stress  = week_idx in high_stress

        if is_high_stress:
            n_overdue   = rng.randint(3, 5)   # ≥3 overdue at Sunday snapshot
            n_completed = rng.randint(2, 4)   # completed on time
        else:
            n_overdue   = rng.randint(0, 1)   # 0 or 1 overdue (<3) at Sunday snapshot
            n_completed = rng.randint(3, 5)   # completed on time

        # --- Overdue tasks (due Wed-Sat of this week, completed 1-3 days after Sunday) ---
        for _ in range(n_overdue):
            cat   = rng.choice(TASK_CATEGORIES)
            title = rng.choice(TASK_TITLE_MAP[cat])

            created_offset = rng.randint(0, 2)
            created_hour   = rng.randint(8, 12)
            created_dt     = datetime(monday.year, monday.month, monday.day,
                                      created_hour, rng.randint(0, 59))
            created_dt    += timedelta(days=created_offset)

            # due_date: Thursday-Saturday of this week
            due_offset = rng.randint(3, 5)
            due_d      = monday + timedelta(days=due_offset)

            # completed_at: completed late (1-3 days after Sunday snapshot)
            # In the final week, can remain uncompleted
            if week_idx == len(WEEK_MONDAYS) - 1 and rng.random() < 0.4:
                completed_str = ""
            else:
                late_days = rng.randint(1, 3)
                completed_dt = datetime(sunday.year, sunday.month, sunday.day,
                                        rng.randint(10, 20), rng.randint(0, 59))
                completed_dt += timedelta(days=late_days)
                completed_str = fmt_datetime(completed_dt)

            records.append({
                "id":           new_id(),
                "persona_id":   persona_id,
                "title":        title,
                "created_at":   fmt_datetime(created_dt),
                "due_date":     fmt_date(due_d),
                "completed_at": completed_str,
                "category":     cat,
            })

        # --- Completed on-time tasks (due this week, completed before/on due_date) ---
        for _ in range(n_completed):
            cat   = rng.choice(TASK_CATEGORIES)
            title = rng.choice(TASK_TITLE_MAP[cat])

            created_offset = rng.randint(0, 2)
            created_hour   = rng.randint(8, 18)
            created_dt     = datetime(monday.year, monday.month, monday.day,
                                      created_hour, rng.randint(0, 59))
            created_dt    += timedelta(days=created_offset)

            due_offset = rng.randint(created_offset + 1, 6)
            due_d      = monday + timedelta(days=due_offset)

            comp_offset = rng.randint(0, due_offset - created_offset)
            completed_dt = datetime(due_d.year, due_d.month, due_d.day,
                                    rng.randint(9, 20), rng.randint(0, 59))
            completed_dt -= timedelta(days=comp_offset)

            if completed_dt < created_dt:
                completed_dt = created_dt + timedelta(hours=1)
            due_eod = datetime(due_d.year, due_d.month, due_d.day, 23, 59, 59)
            if completed_dt > due_eod:
                completed_dt = due_eod - timedelta(hours=rng.randint(1, 3))

            records.append({
                "id":           new_id(),
                "persona_id":   persona_id,
                "title":        title,
                "created_at":   fmt_datetime(created_dt),
                "due_date":     fmt_date(due_d),
                "completed_at": fmt_datetime(completed_dt),
                "category":     cat,
            })

    # Add a few upcoming open tasks in the current/future period for realism
    for _ in range(4):
        cat = rng.choice(TASK_CATEGORIES)
        title = rng.choice(TASK_TITLE_MAP[cat])
        created_dt = datetime(2026, 10, 23, rng.randint(9, 17), rng.randint(0, 59))
        future_due = date(2026, 10, 28) + timedelta(days=rng.randint(1, 7))
        records.append({
            "id": new_id(),
            "persona_id": persona_id,
            "title": title,
            "created_at": fmt_datetime(created_dt),
            "due_date": fmt_date(future_due),
            "completed_at": "",
            "category": cat,
        })

    return records


# ---------------------------------------------------------------------------
# Stats helpers
# ---------------------------------------------------------------------------

def compute_insight_ratio(expenses: list, tasks: list, persona_id: str):
    """
    Compute week-by-week convenience food vs overdue-task counts.

    Overdue at end-of-week snapshot for week_idx:
      task.due_date in [monday, sunday] of that week
      AND (completed_at == "" OR completed_at > due_date)
    """
    persona_tasks    = [t for t in tasks    if t["persona_id"] == persona_id]
    persona_expenses = [e for e in expenses if e["persona_id"] == persona_id]

    week_overdue = {}
    for week_idx, monday in enumerate(WEEK_MONDAYS):
        sunday = week_sunday(monday)
        count  = 0
        for t in persona_tasks:
            due_d = date.fromisoformat(t["due_date"])
            if due_d > sunday:
                continue
            comp = t["completed_at"]
            if comp == "":
                count += 1
            else:
                comp_d = datetime.fromisoformat(comp).date()
                if comp_d > sunday:
                    count += 1
        week_overdue[week_idx] = count

    # Per-week convenience food spend
    week_cf = {i: 0.0 for i in range(12)}
    for e in persona_expenses:
        if e["category"] != "convenience_food":
            continue
        d = date.fromisoformat(e["date"])
        for week_idx, monday in enumerate(WEEK_MONDAYS):
            if monday <= d <= week_sunday(monday):
                week_cf[week_idx] += float(e["amount"])
                break

    qualifying = [i for i, c in week_overdue.items() if c >= 3]
    baseline   = [i for i, c in week_overdue.items() if c < 3]

    avg_qual = sum(week_cf[i] for i in qualifying) / len(qualifying) if qualifying else 0
    avg_base = sum(week_cf[i] for i in baseline)   / len(baseline)   if baseline  else 0
    ratio    = avg_qual / avg_base if avg_base > 0 else float("inf")

    return ratio, avg_qual, avg_base, len(qualifying), len(baseline), week_overdue


def write_csv(path: str, rows: list, fieldnames: list):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("Life, Decoded — Synthetic Data Generator (seed=42)")
    print(f"Window: {fmt_date(WINDOW_START)} → {fmt_date(WINDOW_END)}  ({len(WEEK_MONDAYS)} weeks)")
    print("=" * 60)

    all_expenses = {}
    all_tasks    = {}

    for persona_key in ("maya", "arjun"):
        expenses = generate_expenses(persona_key)
        tasks    = generate_tasks(persona_key)
        all_expenses[persona_key] = expenses
        all_tasks[persona_key]    = tasks

    # Write all CSVs now (all persona data generated with stable seed)
    for persona_key in ("maya", "arjun"):
        expenses = all_expenses[persona_key]
        tasks    = all_tasks[persona_key]

        exp_path  = os.path.join(OUTPUT_DIR, f"{persona_key}_expenses.csv")
        task_path = os.path.join(OUTPUT_DIR, f"{persona_key}_tasks.csv")
        write_csv(exp_path,  expenses, ["id", "persona_id", "date", "amount", "category", "description"])
        write_csv(task_path, tasks,    ["id", "persona_id", "title", "created_at", "due_date", "completed_at", "category"])

        # Merge all for ratio calculation (validation needs only persona-specific anyway)
        all_exp_flat  = expenses
        all_task_flat = tasks
        persona_id    = PERSONAS[persona_key]["id"]

        ratio, avg_qual, avg_base, n_qual, n_base, week_ov = compute_insight_ratio(
            all_exp_flat, all_task_flat, persona_id
        )

        print(f"\n[{persona_key.upper()}]")
        print(f"  Expense records : {len(expenses)}")
        print(f"  Task records    : {len(tasks)}")
        total_spend = sum(float(e["amount"]) for e in expenses)
        cf_spend    = sum(float(e["amount"]) for e in expenses if e["category"] == "convenience_food")
        print(f"  Total spend     : ₹{total_spend:,.2f}")
        print(f"  Convenience food: ₹{cf_spend:,.2f}")
        print(f"\n  Per-week overdue task counts: {[week_ov[i] for i in range(12)]}")
        print(f"\n  Insight pattern:")
        print(f"    Qualifying weeks (≥3 overdue tasks): {n_qual}")
        print(f"    Baseline weeks  (<3 overdue tasks) : {n_base}")
        print(f"    Avg CF spend — qualifying : ₹{avg_qual:,.2f}/week")
        print(f"    Avg CF spend — baseline   : ₹{avg_base:,.2f}/week")
        print(f"    Ratio (qualifying/baseline): {ratio:.2f}x  "
              f"{'✓' if ratio >= 1.8 else '✗ (BELOW TARGET)'}")

    print("\n" + "=" * 60)
    print("Files written to:", os.path.abspath(OUTPUT_DIR))
    print("=" * 60)


if __name__ == "__main__":
    main()
