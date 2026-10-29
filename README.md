# Life, Decoded

> Discover patterns in your spending and task habits — with full transparency on how every insight is calculated.

---

## Overview

**Life, Decoded** helps young professionals (aged 21–26) uncover hidden correlations between their workload and spending behavior. The central insight the system surfaces:

> *In this user's logged data, weeks with at least 3 overdue tasks can be compared with other observed weeks for convenience-food spending. The result is an association, not a causal or population-level claim.*

Rather than just showing budgets, Life, Decoded explains *why* spending patterns emerge — and backs every insight with an evidence panel showing the exact dates, weekly totals, and formula used.

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Python | 3.11+ |
| npm | 9+ |

### Local Development (Demo Mode)

```bash
# 1. Clone and enter the repo
git clone <repo>
cd DAV

# 2. Start the backend
cd backend
pip3 install -r requirements.txt
cp .env.example .env          # Edit: set ENVIRONMENT=development
uvicorn main:app --reload --port 8000

# 3. Start the frontend (open a new terminal)
cd frontend
cp .env.example .env          # Edit: set VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev

# 4. Open the app
open http://localhost:5173
```

> **Demo mode** uses SQLite and synthetic personas (Maya, Arjun). No real bank connections or personal data required.

---

## Architecture

```
Browser (React / TypeScript / Vite)
  │
  │  HTTPS — Axios + React Query
  ▼
FastAPI Backend (Python 3.11)
  │
  │  Database access wrapper (sqlite3 / supabase-py)
  ▼
SQLite (development) / Supabase PostgreSQL (production)
  ▲
  │
Insight Engine (Pandas / NumPy)
```

See [`docs/architecture.md`](docs/architecture.md) for the full breakdown including directory structure, component architecture, and technology rationale.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `ENVIRONMENT` | `development` or `production` | ✅ Required |
| `DEMO_JWT_SECRET` | Unique secret of at least 32 characters; required by production configuration | Required |
| `VITE_DEMO_MODE` | Must be `false` for production backend configuration | Production only |
| `SUPABASE_URL` | Supabase project URL | Production only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only, never frontend) | Production only |
| `SUPABASE_ANON_KEY` | Public Supabase anon key, not a signing secret | Optional |
| `SUPABASE_JWT_SECRET` | Legacy HS256 signing secret only; do not set to the anon key | Only for legacy HS256 projects |
| `SQLITE_PATH` | SQLite database path for development/demo | Optional |
| `CORS_ORIGINS` | Comma-separated allowed origins; production requires explicit HTTPS origins | Required in production; optional in development |
| `OVERDUE_THRESHOLD` | Minimum overdue tasks to classify a qualifying week (default: `3`) | Optional |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend base URL, e.g. `http://localhost:8000` | ✅ Required |
| `VITE_ENVIRONMENT` | `development` or `production` | Optional |

> ⚠️ **Never commit `.env` files.** Both are listed in `.gitignore`.

---

## Running Tests

### Backend (pytest)

```bash
cd backend
python3 -m pytest tests/ -v --tb=short
```

The test suite is intended to cover the insight engine, API CRUD endpoints, authentication, and cross-user isolation. GitHub Actions runs the automated checks; a green run is required before treating a commit as verified. See [`docs/testing_and_evaluation.md`](docs/testing_and_evaluation.md) for full coverage details.

### Frontend (TypeScript type check via build)

```bash
cd frontend
npm run build
```

---

## Deployment

### Frontend → Vercel

1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variable: `VITE_API_BASE_URL=<your Railway backend URL>`.
5. Deploy. Vercel auto-detects Vite.

### Backend → Railway

1. Create a Railway project and deploy the repository with root directory `backend`.
2. Set these backend environment variables:
   - `ENVIRONMENT=production`
   - `VITE_DEMO_MODE=false`
   - `DEMO_JWT_SECRET=<unique random secret of at least 32 characters>`
   - `SUPABASE_URL=<your Supabase project URL>`
   - `SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>`
   - `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`
   - For legacy Supabase projects using HS256 only: `SUPABASE_JWT_SECRET=<legacy JWT secret>`
3. Use the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
4. Apply migrations `001_initial_schema.sql`, `002_indexes.sql`, `003_rls_policies.sql`, `004_security_hardening.sql`, and `005_expense_category_alignment.sql` in order in Supabase before enabling production traffic.

Production JWT verification uses the project's Auth JWKS endpoint for asymmetric signing keys. Never use the public anon key as a JWT signing secret. The API uses a service-role client, which bypasses RLS, so every database query must remain explicitly scoped to the authenticated user's `user_id`.
---

## Known Limitations

- **Demo mode uses SQLite.** Production deployments require a Supabase PostgreSQL instance with Row Level Security enabled.
- **No real bank integrations.** All expense data is entered manually or seeded from synthetic personas.
- **Insights require sufficient data.** The engine requires ≥ 3 qualifying weeks **and** ≥ 3 baseline weeks within the most recent 12 complete calendar weeks. If either group is missing, the dashboard shows an `insufficient_data` status with a specific explanation.
- **Association, not causation.** The insight ratio describes a correlation in user-entered data — it does not prove that task overload *causes* higher spending.

---

## Documentation

| Document | Description |
|----------|-------------|
| [`docs/architecture.md`](docs/architecture.md) | System design, directory structure, technology choices |
| [`docs/insight_methodology.md`](docs/insight_methodology.md) | Precise definitions, formulas, and evidence thresholds |
| [`docs/synthetic_data_methodology.md`](docs/synthetic_data_methodology.md) | How synthetic personas were generated and validated |
| [`docs/data_dictionary.md`](docs/data_dictionary.md) | Full database schema and field descriptions |
| [`docs/privacy_and_security.md`](docs/privacy_and_security.md) | Auth, RLS, secret management, data reset |
| [`docs/testing_and_evaluation.md`](docs/testing_and_evaluation.md) | Test coverage, manual verification steps |
| [`docs/demo_script.md`](docs/demo_script.md) | 60-second walkthrough for demos |
| [`docs/research_paper_outline.md`](docs/research_paper_outline.md) | Academic paper outline targeting CHI / UbiComp |
| [`docs/public_datasets.md`](docs/public_datasets.md) | Public research datasets and safe integration rules |

---

## License

MIT — see `LICENSE` for details.
