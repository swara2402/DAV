-- Expand expense categories to match the API's supported category set.
-- Safe to re-run. Apply after migrations 001-004 on existing Supabase projects.
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_category_check CHECK (
    category IN (
      'convenience_food', 'groceries', 'transport', 'shopping', 'bills',
      'utilities', 'entertainment', 'healthcare', 'clothing', 'education',
      'personal_care', 'dining_out', 'subscriptions', 'household', 'other'
    )
  );
