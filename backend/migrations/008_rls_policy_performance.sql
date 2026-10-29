-- Optimize authenticated-user RLS policies by evaluating auth.uid() once per statement.
-- This preserves the same ownership checks while avoiding per-row re-evaluation.
DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_insert ON public.profiles;
DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_select ON public.profiles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid())::text);
CREATE POLICY profiles_owner_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid())::text);
CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS expenses_owner_all ON public.expenses;
CREATE POLICY expenses_owner_all ON public.expenses
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS tasks_owner_all ON public.tasks;
CREATE POLICY tasks_owner_all ON public.tasks
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS insights_owner_all ON public.insights;
CREATE POLICY insights_owner_all ON public.insights
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS insight_actions_owner_all ON public.insight_actions;
CREATE POLICY insight_actions_owner_all ON public.insight_actions
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS demo_seed_runs_owner_all ON public.demo_seed_runs;
CREATE POLICY demo_seed_runs_owner_all ON public.demo_seed_runs
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);
