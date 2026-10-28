# ============================================================
# Supabase PostgreSQL Row Level Security Policies
# Apply these in the Supabase SQL Editor after creating tables
# ============================================================

-- Enable RLS on all private tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_seed_runs ENABLE ROW LEVEL SECURITY;

-- profiles: users can only see/edit their own profile
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (user_id = auth.uid()::text);

-- expenses: users can only see/edit their own expenses
CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "expenses_insert_own" ON expenses
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "expenses_update_own" ON expenses
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "expenses_delete_own" ON expenses
    FOR DELETE USING (user_id = auth.uid()::text);

-- tasks: users can only see/edit their own tasks
CREATE POLICY "tasks_select_own" ON tasks
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "tasks_insert_own" ON tasks
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "tasks_update_own" ON tasks
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "tasks_delete_own" ON tasks
    FOR DELETE USING (user_id = auth.uid()::text);

-- insights: users can only see/insert their own
CREATE POLICY "insights_select_own" ON insights
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "insights_insert_own" ON insights
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- insight_actions: users can only see/insert their own
CREATE POLICY "actions_select_own" ON insight_actions
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "actions_insert_own" ON insight_actions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "actions_update_own" ON insight_actions
    FOR UPDATE USING (user_id = auth.uid()::text);

-- demo_seed_runs: users can only see/insert their own
CREATE POLICY "seeds_select_own" ON demo_seed_runs
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "seeds_insert_own" ON demo_seed_runs
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

