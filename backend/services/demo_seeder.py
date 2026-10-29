"""
services/demo_seeder.py — Seeds demo data from synthetic CSV files.
"""
from __future__ import annotations

import csv
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import settings

logger = logging.getLogger(__name__)

SEEDER_VERSION = "1.0.0"

PERSONA_FILES = {
    "maya": {
        "expenses": "maya_expenses.csv",
        "tasks": "maya_tasks.csv",
    },
    "arjun": {
        "expenses": "arjun_expenses.csv",
        "tasks": "arjun_tasks.csv",
    },
    "fresh": {
        "expenses": None,
        "tasks": None,
    },
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_csv(path: Path) -> list[dict]:
    if not path.exists():
        raise FileNotFoundError(f"Required synthetic dataset is missing: {path}")
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(dict(row))
    return rows


def seed_persona(user_id: str, persona: str, db: Any) -> dict:
    """
    Seed data for a demo persona. Idempotent — skips if already seeded.

    Returns:
        {"persona": str, "seeded": bool, "already_seeded": bool, "record_counts": dict}
    """
    if persona not in PERSONA_FILES:
        raise ValueError(f"Unknown persona: {persona}. Must be one of {list(PERSONA_FILES)}")

    # Check if already seeded (use migration column names: persona_id and dataset_version)
    if hasattr(db, "mode") and db.mode == "sqlite":
        existing = db.fetchone(
            "SELECT dataset_version FROM demo_seed_runs WHERE user_id = ? AND persona_id = ?",
            (user_id, persona),
        )
    else:
        resp = (
            db.client.table("demo_seed_runs")
            .select("dataset_version")
            .eq("user_id", user_id)
            .eq("persona_id", persona)
            .execute()
        )
        existing = resp.data[0] if resp.data else None

    if existing and existing.get("dataset_version") == SEEDER_VERSION:
        return {
            "persona": persona,
            "seeded": False,
            "already_seeded": True,
            "record_counts": {},
        }

    data_dir = settings.data_dir_path
    files = PERSONA_FILES[persona]
    # Validate inputs before deleting the user's existing demo workspace.
    for required in files.values():
        if required and not (data_dir / required).is_file():
            raise FileNotFoundError(f"Required synthetic dataset is missing: {data_dir / required}")

    _clear_user_data(user_id, db)
    record_counts: dict[str, int] = {}

    # Ensure profile exists
    _ensure_profile(user_id, persona, db)

    # Load expenses
    if files["expenses"]:
        expense_path = data_dir / files["expenses"]
        expense_rows = _load_csv(expense_path)
        count = _insert_expenses(user_id, expense_rows, db)
        record_counts["expenses"] = count
    else:
        record_counts["expenses"] = 0

    # Load tasks
    if files["tasks"]:
        task_path = data_dir / files["tasks"]
        task_rows = _load_csv(task_path)
        count = _insert_tasks(user_id, task_rows, db)
        record_counts["tasks"] = count
    else:
        record_counts["tasks"] = 0

    # Record seed run (use migration column names: persona_id and dataset_version)
    now = _now_iso()
    seed_id = str(uuid.uuid4())
    if hasattr(db, "mode") and db.mode == "sqlite":
        db.execute(
            """
            INSERT OR REPLACE INTO demo_seed_runs (id, user_id, persona_id, dataset_version, seeded_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (seed_id, user_id, persona, SEEDER_VERSION, now),
        )
    else:
        db.client.table("demo_seed_runs").upsert({
            "id": seed_id,
            "user_id": user_id,
            "persona_id": persona,
            "dataset_version": SEEDER_VERSION,
            "seeded_at": now,
        }).execute()

    return {
        "persona": persona,
        "seeded": True,
        "already_seeded": False,
        "record_counts": record_counts,
    }


def reset_demo_user(user_id: str, db: Any) -> dict:
    """Delete all demo data for a user."""
    _clear_user_data(user_id, db)
    return {"deleted": True, "user_id": user_id}


def _ensure_profile(user_id: str, persona: str, db: Any) -> None:
    now = _now_iso()
    persona_names = {"maya": "Maya", "arjun": "Arjun", "fresh": "New User"}
    name = persona_names.get(persona, persona.title())
    # Use profiles table migration columns: user_id as primary key, selected_persona
    if hasattr(db, "mode") and db.mode == "sqlite":
        db.execute(
            """
            INSERT OR IGNORE INTO profiles (user_id, display_name, selected_persona, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, name, persona, now, now),
        )
    else:
        db.client.table("profiles").upsert({
            "user_id": user_id,
            "display_name": name,
            "selected_persona": persona,
            "created_at": now,
            "updated_at": now,
        }).execute()


def _insert_expenses(user_id: str, rows: list[dict], db: Any) -> int:
    now = _now_iso()
    inserted = 0
    for row in rows:
        try:
            expense_id = row.get("id") or str(uuid.uuid4())
            amount = float(row.get("amount", 0))
            if amount <= 0:
                continue
            if hasattr(db, "mode") and db.mode == "sqlite":
                db.execute(
                    """
                    INSERT OR IGNORE INTO expenses (id, user_id, date, amount, category, description, data_source, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        expense_id,
                        user_id,
                        row.get("date", ""),
                        amount,
                        row.get("category", "other"),
                        row.get("description", ""),
                        "demo_synthetic",
                        now,
                        now,
                    ),
                )
            else:
                db.client.table("expenses").upsert({
                    "id": expense_id,
                    "user_id": user_id,
                    "date": row.get("date", ""),
                    "amount": amount,
                    "category": row.get("category", "other"),
                    "description": row.get("description", ""),
                    "data_source": "demo_synthetic",
                    "created_at": now,
                    "updated_at": now,
                }).execute()
            inserted += 1
        except Exception as e:
            logger.warning(f"Failed to insert expense row: {e} | row={row}")
    return inserted


def _insert_tasks(user_id: str, rows: list[dict], db: Any) -> int:
    now = _now_iso()
    inserted = 0
    for row in rows:
        try:
            task_id = row.get("id") or str(uuid.uuid4())
            title = row.get("title", "").strip()
            if not title:
                continue
            completed_at = row.get("completed_at") or None
            if completed_at == "" or completed_at == "None":
                completed_at = None
            due_date = row.get("due_date") or None
            if due_date == "" or due_date == "None":
                due_date = None
            created_at = row.get("created_at") or now

            if hasattr(db, "mode") and db.mode == "sqlite":
                db.execute(
                    """
                    INSERT OR IGNORE INTO tasks (id, user_id, title, category, due_date, completed_at, created_at, db_created_at, db_updated_at, data_source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        task_id,
                        user_id,
                        title,
                        row.get("category", "personal"),  # Use valid category from migration
                        due_date,
                        completed_at,
                        created_at,
                        now,
                        now,
                        "demo_synthetic",
                    ),
                )
            else:
                db.client.table("tasks").upsert({
                    "id": task_id,
                    "user_id": user_id,
                    "title": title,
                    "category": row.get("category", "personal"),  # Use valid category from migration
                    "due_date": due_date,
                    "completed_at": completed_at,
                    "created_at": created_at,
                    "data_source": "demo_synthetic",
                    "db_created_at": now,
                    "db_updated_at": now,
                }).execute()
            inserted += 1
        except Exception as e:
            logger.warning(f"Failed to insert task row: {e} | row={row}")
    return inserted


def _clear_user_data(user_id: str, db: Any) -> None:
    if hasattr(db, "mode") and db.mode == "sqlite":
        db.execute("DELETE FROM expenses WHERE user_id = ?", (user_id,))
        db.execute("DELETE FROM tasks WHERE user_id = ?", (user_id,))
        db.execute("DELETE FROM insight_actions WHERE user_id = ?", (user_id,))
        db.execute("DELETE FROM demo_seed_runs WHERE user_id = ?", (user_id,))
    else:
        for table in ("expenses", "tasks", "insight_actions", "demo_seed_runs"):
            db.client.table(table).delete().eq("user_id", user_id).execute()