# Life, Decoded

> Discover patterns in your spending and task habits — with full transparency on how every insight is calculated.

---

## Overview

**Life, Decoded** helps young professionals (aged 21–26) uncover hidden correlations between their workload and spending behavior. The central insight the system surfaces:

> *During weeks with high task overload (≥ 3 overdue tasks), users tend to spend significantly more on convenience food.*

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
  │  SQLAlchemy ORM
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
| `SECRET_KEY` | JWT signing secret (generate with `openssl rand -hex 32`) | ✅ Required |
| `SUPABASE_URL` | Supabase project URL | Production only |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only, never frontend) | Production only |
| `DATABASE_URL` | Override default DB path (optional in dev) | Optional |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | Optional (defaults to localhost) |
| `MIN_QUALIFYING_WEEKS_THRESHOLD` | Minimum overdue tasks to classify a qualifying week (default: `3`) | Optional |

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

The test suite covers the insight engine, API CRUD endpoints, authentication, and cross-user isolation. See [`docs/testing_and_evaluation.md`](docs/testing_and_evaluation.md) for full coverage details.

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

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**.
2. Select the repo; set **Root Directory** to `backend`.
3. Add environment variables:
   - `ENVIRONMENT=production`
   - `SECRET_KEY=<generated secret>`
   - `SUPABASE_URL=<your Supabase project URL>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service role key>`
   - `CORS_ORIGINS=https://<your-vercel-app>.vercel.app`
4. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy.

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

---

## License

MIT — see `LICENSE` for details.
