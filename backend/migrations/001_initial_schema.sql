-- ============================================================
-- Migration 001: Initial Schema for Life, Decoded
-- ============================================================
-- Designed for both Supabase PostgreSQL (production)
-- and SQLite (development/demo mode via Python backend).
-- SQLite-compatible syntax used. PostgreSQL extensions noted.
-- ============================================================

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'User',
    selected_persona TEXT CHECK (selected_persona IN ('maya', 'arjun', 'fresh', NULL)),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,             -- ISO date YYYY-MM-DD
    amount REAL NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL CHECK (
        category IN ('convenience_food', 'groceries', 'transport', 'shopping', 'bills', 'other')
    ),
    description TEXT DEFAULT '',
    data_source TEXT NOT NULL DEFAULT 'user_entered'
        CHECK (data_source IN ('user_entered', 'demo_synthetic')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,       -- ISO date YYYY-MM-DD (when task was created by user)
    due_date TEXT NOT NULL,         -- ISO date YYYY-MM-DD
    completed_at TEXT DEFAULT NULL, -- ISO date YYYY-MM-DD, NULL if incomplete
    category TEXT NOT NULL DEFAULT 'personal' CHECK (
        category IN ('work', 'personal', 'health', 'finance', 'household')
    ),
    data_source TEXT NOT NULL DEFAULT 'user_entered'
        CHECK (data_source IN ('user_entered', 'demo_synthetic')),
    db_created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    db_updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Insights (computed results cache)
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_type TEXT NOT NULL DEFAULT 'overdue_convenience_correlation',
    status TEXT NOT NULL CHECK (status IN ('sufficient', 'insufficient_data', 'error')),
    computed_result TEXT NOT NULL,  -- JSON string
    observation_start TEXT,
    observation_end TEXT,
    engine_version TEXT NOT NULL DEFAULT '1.0.0',
    data_source TEXT NOT NULL DEFAULT 'user_entered',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Insight Actions (user tried-it records)
CREATE TABLE IF NOT EXISTS insight_actions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_id TEXT NOT NULL,
    action_text TEXT NOT NULL,
    tried_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    followup_window_days INTEGER NOT NULL DEFAULT 28,
    followup_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (followup_status IN ('pending', 'sufficient_data', 'insufficient_data')),
    outcome_metrics TEXT DEFAULT NULL,  -- JSON string when computed
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Demo Seed Runs (prevents duplicate seeding)
CREATE TABLE IF NOT EXISTS demo_seed_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    persona_id TEXT NOT NULL CHECK (persona_id IN ('maya', 'arjun', 'fresh')),
    dataset_version TEXT NOT NULL DEFAULT 'v1.0',
    seeded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (user_id, persona_id, dataset_version)
);

