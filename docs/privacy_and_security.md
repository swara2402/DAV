# Privacy, Security, & Data Governance Architecture

## 1. Core Principles

**Life, Decoded** is designed around data minimization, user sovereignty, and transparent statistical analysis.
- **No Plaid/Bank Credential Scraping**: We deliberately do not request banking login credentials, account numbers, or debit card PINs.
- **Strict User Ownership**: Users have full custody of their financial records and can delete them at any time.
- **Auditable Algorithms**: No opaque machine learning models or black-box neural networks dictate financial advice.

---

## 2. Authentication Architecture

The system provides dual-mode authentication:

1. **Development & Demo Mode (`ENVIRONMENT=development`)**:
   - Token format: `Bearer demo_<persona>` or signed demo JWT.
   - Distinct, isolated namespaces for `demo_maya`, `demo_arjun`, and `demo_fresh`.
   - Never exposes administrative commands.

2. **Production Mode (`ENVIRONMENT=production`)**:
   - Supabase Auth with asymmetric JWT verification.
   - Tokens verified using `SUPABASE_ANON_KEY` or RS256/HS256 cryptographic verification.
   - Rejects mock/demo tokens with HTTP 401 Unauthorized.

---

## 3. Database Security & Row Level Security (RLS)

In production Supabase PostgreSQL, all user data tables have Row Level Security enabled. Policies ensure that no query or mutation can access another user's rows.

### RLS Policies (`migrations/003_rls_policies.sql`):

```sql
-- Expenses table isolation
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON expenses
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "expenses_insert_own" ON expenses
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "expenses_update_own" ON expenses
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "expenses_delete_own" ON expenses
    FOR DELETE USING (user_id = auth.uid()::text);
```

Identical policies are enforced for `tasks`, `profiles`, `insights`, and `insight_actions`.

---

## 4. API Security & Ownership Enforcement

In every FastAPI endpoint:
1. `user_id` is derived strictly from the cryptographically verified `Authorization` token via the `get_current_user` dependency.
2. The user ID is never trusted from the URL path or request payload.
3. Database mutations (`UPDATE`, `DELETE`) enforce matching `user_id`, preventing horizontal privilege escalation (cross-user access).

### Input Validation & Sanitization
- All incoming payloads are validated via Pydantic v2 schemas:
  - `amount > 0` and rounded to 2 decimal places.
  - Categories strictly validated against whitelisted sets.
  - Task dates validated: `created_at <= due_date` and `completed_at >= created_at`.

---

## 5. Secret Management & CORS Configuration

- All secrets are managed via environment variables (`.env`).
- `.env` is ignored in Git (`.gitignore`).
- A clean template `.env.example` is provided with placeholder values.
- `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to backend processes and never bundled into frontend builds.
- Production CORS is configured exclusively for verified frontend domains:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=allowed_origins if settings.is_production else ["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

---

## 6. Data Reset & Deletion Procedure

Users have the right to erase all associated records.
- Endpoint: `POST /api/v1/demo/reset` (with `confirm: true`).
- Action: Atomically deletes all records in `expenses`, `tasks`, `actions`, and `demo_seed_runs` where `user_id` matches the caller.
