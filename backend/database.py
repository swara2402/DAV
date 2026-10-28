"""
database.py — Database connection layer.

Supports two modes:
  - demo/development: SQLite at SQLITE_PATH
  - production: Supabase via supabase-py

Usage:
    from database import get_db, init_db
    db = get_db()          # returns DB wrapper
    init_db()              # called at startup to create tables (SQLite only)
"""
from __future__ import annotations

import sqlite3
import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Generator

from config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SQLite schema (demo / development)
# ---------------------------------------------------------------------------
SQLITE_SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    currency TEXT DEFAULT 'INR',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    due_date TEXT,
    completed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_id TEXT,
    action_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    follow_up_data TEXT,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS demo_seed_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    version TEXT NOT NULL,
    seeded_at TEXT NOT NULL,
    record_counts TEXT,
    UNIQUE(user_id, persona)
);
"""


# ---------------------------------------------------------------------------
# SQLite wrapper
# ---------------------------------------------------------------------------
class SQLiteDB:
    """Thin wrapper around sqlite3 that mimics the interface used by routers."""

    def __init__(self, db_path: str):
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
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
        """Execute a statement and return rows as list of dicts."""
        with self.connection() as conn:
            cur = conn.execute(sql, params)
            if cur.description:
                return [dict(row) for row in cur.fetchall()]
            return []

    def execute_many(self, sql: str, params_list: list[tuple]) -> None:
        with self.connection() as conn:
            conn.executemany(sql, params_list)

    def fetchone(self, sql: str, params: tuple = ()) -> dict | None:
        with self.connection() as conn:
            cur = conn.execute(sql, params)
            row = cur.fetchone()
            return dict(row) if row else None

    def fetchall(self, sql: str, params: tuple = ()) -> list[dict]:
        with self.connection() as conn:
            cur = conn.execute(sql, params)
            return [dict(row) for row in cur.fetchall()]

    @property
    def mode(self) -> str:
        return "sqlite"


# ---------------------------------------------------------------------------
# Supabase wrapper
# ---------------------------------------------------------------------------
class SupabaseDB:
    """Thin wrapper around supabase-py client."""

    def __init__(self):
        try:
            from supabase import create_client, Client  # type: ignore
            self._client: Client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY,
            )
        except ImportError as e:
            raise RuntimeError("supabase package not installed") from e

    @property
    def client(self):
        return self._client

    @property
    def mode(self) -> str:
        return "supabase"


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------
_db_instance: SQLiteDB | SupabaseDB | None = None


def get_db_instance() -> SQLiteDB | SupabaseDB:
    global _db_instance
    if _db_instance is None:
        if settings.is_production:
            logger.info("Connecting to Supabase (production mode)")
            _db_instance = SupabaseDB()
        else:
            db_path = str(Path(settings.SQLITE_PATH).resolve())
            logger.info(f"Using SQLite database at {db_path}")
            _db_instance = SQLiteDB(db_path)
    return _db_instance


def init_db() -> None:
    """Create SQLite tables on startup (no-op for Supabase)."""
    db = get_db_instance()
    if isinstance(db, SQLiteDB):
        with db.connection() as conn:
            conn.executescript(SQLITE_SCHEMA)
        logger.info("SQLite schema initialised")
    else:
        logger.info("Supabase mode — skipping local schema init")


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db() -> SQLiteDB | SupabaseDB:
    """FastAPI dependency — returns the shared DB instance."""
    return get_db_instance()
