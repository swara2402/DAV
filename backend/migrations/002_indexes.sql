-- ============================================================
-- Migration 002: Indexes for Performance
-- ============================================================

-- Expenses lookups by user and date
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses (user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses (user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_datasource ON expenses (user_id, data_source);

-- Tasks lookups by user and dates
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks (user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_datasource ON tasks (user_id, data_source);

-- Insights and actions by user
CREATE INDEX IF NOT EXISTS idx_insights_user ON insights (user_id);
CREATE INDEX IF NOT EXISTS idx_actions_user ON insight_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_actions_insight ON insight_actions (insight_id);

-- Demo seed deduplication
CREATE INDEX IF NOT EXISTS idx_seed_runs_user_persona ON demo_seed_runs (user_id, persona_id);

