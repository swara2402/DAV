-- Life, Decoded canonical Supabase PostgreSQL schema.
-- SQLite development schema is maintained in backend/database.py separately.
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL DEFAULT 'User',
    selected_persona TEXT CHECK (selected_persona IN ('maya','arjun','fresh')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL CHECK (category IN ('convenience_food','groceries','transport','shopping','bills','other')),
    description TEXT NOT NULL DEFAULT '',
    data_source TEXT NOT NULL DEFAULT 'user_entered' CHECK (data_source IN ('user_entered','demo_synthetic')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    due_date DATE NOT NULL,
    completed_at DATE,
    category TEXT NOT NULL DEFAULT 'personal' CHECK (category IN ('work','personal','health','finance','household')),
    data_source TEXT NOT NULL DEFAULT 'user_entered' CHECK (data_source IN ('user_entered','demo_synthetic')),
    db_created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    db_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_type TEXT NOT NULL DEFAULT 'overdue_convenience_correlation',
    status TEXT NOT NULL CHECK (status IN ('sufficient','insufficient_data','error')),
    computed_result JSONB NOT NULL,
    observation_start DATE,
    observation_end DATE,
    engine_version TEXT NOT NULL DEFAULT '1.0.0',
    data_source TEXT NOT NULL DEFAULT 'user_entered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.insight_actions (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_id TEXT NOT NULL,
    action_text TEXT NOT NULL,
    tried_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    followup_window_days INTEGER NOT NULL DEFAULT 28 CHECK (followup_window_days > 0),
    followup_status TEXT NOT NULL DEFAULT 'pending' CHECK (followup_status IN ('pending','sufficient_data','insufficient_data')),
    outcome_metrics JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.demo_seed_runs (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    persona_id TEXT NOT NULL CHECK (persona_id IN ('maya','arjun','fresh')),
    dataset_version TEXT NOT NULL DEFAULT 'v1.0',
    seeded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, persona_id, dataset_version)
);
