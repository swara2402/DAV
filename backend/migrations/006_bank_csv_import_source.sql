-- Allow explicitly sourced bank CSV transactions in Supabase.
-- Apply after migrations 001-005 before deploying the CSV import feature.
-- Safe to re-run on existing projects.
ALTER TABLE public.expenses
  ALTER COLUMN data_source SET DEFAULT 'user_entered';

ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS expenses_data_source_check;

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_data_source_check
  CHECK (data_source IN ('user_entered', 'demo_synthetic', 'bank_csv_import'));
