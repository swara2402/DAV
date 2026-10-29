-- Supabase Row Level Security. Safe to re-run.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_seed_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS expenses_select_own ON public.expenses;
DROP POLICY IF EXISTS expenses_insert_own ON public.expenses;
DROP POLICY IF EXISTS expenses_update_own ON public.expenses;
DROP POLICY IF EXISTS expenses_delete_own ON public.expenses;
DROP POLICY IF EXISTS expenses_owner_all ON public.expenses;
CREATE POLICY expenses_owner_all ON public.expenses FOR ALL TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS tasks_select_own ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_own ON public.tasks;
DROP POLICY IF EXISTS tasks_update_own ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_own ON public.tasks;
DROP POLICY IF EXISTS tasks_owner_all ON public.tasks;
CREATE POLICY tasks_owner_all ON public.tasks FOR ALL TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS insights_select_own ON public.insights;
DROP POLICY IF EXISTS insights_insert_own ON public.insights;
DROP POLICY IF EXISTS insights_owner_all ON public.insights;
CREATE POLICY insights_owner_all ON public.insights FOR ALL TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS actions_select_own ON public.insight_actions;
DROP POLICY IF EXISTS actions_insert_own ON public.insight_actions;
DROP POLICY IF EXISTS actions_update_own ON public.insight_actions;
DROP POLICY IF EXISTS insight_actions_owner_all ON public.insight_actions;
CREATE POLICY insight_actions_owner_all ON public.insight_actions FOR ALL TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS seeds_select_own ON public.demo_seed_runs;
DROP POLICY IF EXISTS seeds_insert_own ON public.demo_seed_runs;
DROP POLICY IF EXISTS demo_seed_runs_owner_all ON public.demo_seed_runs;
CREATE POLICY demo_seed_runs_owner_all ON public.demo_seed_runs FOR ALL TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
