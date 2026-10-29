"""Database connection layer for SQLite demo mode and Supabase production."""
from __future__ import annotations

import logging
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from config import settings

logger = logging.getLogger(__name__)

SQLITE_SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'User',
    selected_persona TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
    amount REAL NOT NULL CHECK(amount >= 0),
    category TEXT NOT NULL CHECK(category IN ('convenience_food','groceries','transport','shopping','bills','utilities','entertainment','healthcare','clothing','education','personal_care','dining_out','subscriptions','household','other')),
    description TEXT DEFAULT '', data_source TEXT NOT NULL DEFAULT 'user_entered',
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'personal' CHECK(category IN ('work','personal','health','finance','household')),
    due_date TEXT NOT NULL, completed_at TEXT, created_at TEXT NOT NULL,
    db_created_at TEXT NOT NULL, db_updated_at TEXT NOT NULL,
    data_source TEXT NOT NULL DEFAULT 'user_entered',
    FOREIGN KEY(user_id) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, insight_type TEXT NOT NULL,
    status TEXT NOT NULL, computed_result TEXT NOT NULL, observation_start TEXT,
    observation_end TEXT, engine_version TEXT NOT NULL DEFAULT '1.0.0',
    data_source TEXT NOT NULL DEFAULT 'user_entered', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS insight_actions (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, insight_id TEXT NOT NULL,
    action_text TEXT NOT NULL, tried_at TEXT NOT NULL,
    followup_window_days INTEGER NOT NULL DEFAULT 28,
    followup_status TEXT NOT NULL DEFAULT 'pending'
      CHECK(followup_status IN ('pending','sufficient_data','insufficient_data')),
    outcome_metrics TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES profiles(user_id)
);
CREATE TABLE IF NOT EXISTS demo_seed_runs (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    persona_id TEXT NOT NULL CHECK(persona_id IN ('maya','arjun','fresh')),
    dataset_version TEXT NOT NULL DEFAULT 'v1.0', seeded_at TEXT NOT NULL,
    UNIQUE(user_id, persona_id, dataset_version)
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_actions_user_created ON insight_actions(user_id, created_at);
"""

class SQLiteDB:
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    @contextmanager
    def connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = self._connect()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def execute(self, sql: str, params: tuple = ()) -> list[dict]:
        with self.connection() as conn:
            cur = conn.execute(sql, params)
            return [dict(row) for row in cur.fetchall()] if cur.description else []

    def execute_many(self, sql: str, params_list: list[tuple]) -> None:
        with self.connection() as conn:
            conn.executemany(sql, params_list)

    def fetchone(self, sql: str, params: tuple = ()) -> dict | None:
        with self.connection() as conn:
            row = conn.execute(sql, params).fetchone()
            return dict(row) if row else None

    def fetchall(self, sql: str, params: tuple = ()) -> list[dict]:
        return self.execute(sql, params)

    @property
    def mode(self) -> str:
        return "sqlite"


class SupabaseDB:
    """Service-role client. Every query must also scope records by authenticated user_id."""
    def __init__(self):
        from supabase import create_client
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase production credentials are missing")
        self._client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    @property
    def client(self):
        return self._client

    @property
    def mode(self) -> str:
        return "supabase"


_db_instance: SQLiteDB | SupabaseDB | None = None

def get_db_instance() -> SQLiteDB | SupabaseDB:
    global _db_instance
    if _db_instance is None:
        if settings.is_production:
            logger.info("Connecting to Supabase in production mode")
            _db_instance = SupabaseDB()
        else:
            path = str(Path(settings.SQLITE_PATH).resolve())
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            _db_instance = SQLiteDB(path)
    return _db_instance

def init_db() -> None:
    db = get_db_instance()
    if isinstance(db, SQLiteDB):
        with db.connection() as conn:
            conn.executescript(SQLITE_SCHEMA)
        logger.info("SQLite schema initialised")
    else:
        logger.info("Supabase mode: apply versioned SQL migrations before deployment")

def get_db() -> SQLiteDB | SupabaseDB:
    return get_db_instance()
