# Production readiness and launch blockers

This checklist describes code-level readiness only. It does not imply that a live deployment or Supabase project has been tested.

## Current status

- [x] Backend production configuration rejects demo mode and requires hosted database configuration.
- [x] Staging and production use Supabase rather than silently falling back to SQLite.
- [x] Automated tests cover demo endpoints being blocked in production and cross-user task/action isolation.
- [x] Supabase migrations define owner-scoped RLS policies for application tables.
- [ ] **Real account authentication in the frontend.** The current `AuthContext` only supports demo personas and a demo personal session. The Auth page explicitly says real registration/sign-in is unavailable. Production blocks the demo endpoints, so this frontend cannot currently sign a real user in.
- [ ] Real Supabase Auth session persistence, refresh, and logout wired to API authorization headers.
- [ ] Production-like integration tests against a dedicated Supabase staging project.
- [ ] Verify every migration has been applied to the target project in order.
- [ ] Verify the deployed frontend origin is the only intended CORS origin.
- [ ] Verify the backend service-role key is stored only in backend deployment secrets and is never exposed to the frontend.
- [ ] Run end-to-end smoke tests on the deployed app and verify a second account cannot read or mutate the first account's data.

## Required before a real-user launch

1. Integrate Supabase Auth in the frontend. Implement sign-up/sign-in, persistent sessions, refresh, and logout. Remove demo-only assumptions from the production auth flow while retaining a clearly isolated demo mode if desired.
2. Ensure every API request uses the current Supabase access token and handles expired sessions without silently reverting to a demo identity.
3. Configure a dedicated Supabase staging project and apply migrations `001_initial_schema.sql` through `007_csv_import_idempotency.sql` in order. Confirm the resulting schema against the current API's expected columns and constraints.
4. Test create/read/update/delete operations for expenses and tasks with two distinct authenticated accounts. Confirm the service-role-backed API always filters reads and mutations by the authenticated `user_id`, because service-role access bypasses RLS.
5. Verify production environment variables in the deployment dashboard without printing secret values in logs or sharing them in issue reports.
6. Deploy to staging first. Check health, auth, CSV import duplicate handling, dashboard data, logout/session expiry, and error handling before promoting to production.

## Important security distinction

The database layer uses a Supabase service-role client, which bypasses Row Level Security. RLS policies are valuable defense in depth for direct client access, but they do not automatically protect queries made with the service role. The backend must continue to scope each user's database operations to the validated token subject, and this behavior must be integration-tested.

## Verification record

- GitHub Actions backend and frontend CI have passed for the most recently merged configuration/test changes.
- Live Supabase connectivity, actual deployed environment variables, applied migration state, production RLS behavior, and hosted end-to-end flows have **not** been verified in this repository review.
