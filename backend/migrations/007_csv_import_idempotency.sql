-- Stable, user-scoped idempotency for bank CSV imports.
-- Apply after migration 006. Existing transactions remain unchanged.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS source_fingerprint TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_user_source_fingerprint
  ON public.expenses(user_id, source_fingerprint)
  WHERE source_fingerprint IS NOT NULL;
