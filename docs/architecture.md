# Architecture

## System Overview

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

The system is a standard client-server application with a stateless REST API. The frontend never touches the database directly; all data access is mediated through the backend, which enforces authentication and, in production, Supabase Row Level Security (RLS).

---

## Directory Structure

```
DAV/
├── README.md
├── backend/
│   ├── main.py                  # FastAPI app entry point, router registration
│   ├── requirements.txt
│   ├── .env.example
│   ├── database.py              # SQLAlchemy engine + session factory
│   ├── models.py                # ORM models: User, Expense, Task, Insight, InsightAction
│   ├── schemas.py               # Pydantic request/response schemas
│   ├── auth.py                  # JWT creation, verification, dependency injection
│   ├── routers/
│   │   ├── expenses.py          # CRUD: /expenses
│   │   ├── tasks.py             # CRUD: /tasks
│   │   ├── insights.py          # GET /insights/current
│   │   ├── actions.py           # POST /actions (Tried It)
│   │   ├── demo.py              # POST /demo/seed, DELETE /demo/reset
│   │   └── auth.py              # POST /auth/login, /auth/logout
│   ├── engine/
│   │   ├── insight_engine.py    # Core calculation logic
│   │   └── weekly_aggregator.py # Week boundary + overdue snapshot helpers
│   └── tests/
│       ├── conftest.py          # Pytest fixtures, test DB setup
│       ├── test_insight_engine.py
│       ├── test_expenses.py
│       ├── test_tasks.py
│       └── test_auth.py
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.tsx             # React root
│       ├── App.tsx              # Router, theme provider
│       ├── api/
│       │   ├── client.ts        # Axios instance, interceptors
│       │   ├── expenses.ts      # React Query hooks for expenses
│       │   ├── tasks.ts         # React Query hooks for tasks
│       │   └── insights.ts      # React Query hooks for insights
│       ├── components/
│       │   ├── Dashboard/
│       │   │   ├── InsightCard.tsx
│       │   │   ├── SpendingSummary.tsx
│       │   │   └── TaskOverview.tsx
│       │   ├── InsightDetail/
│       │   │   ├── EvidenceChart.tsx   # Recharts bar chart
│       │   │   └── CalculationPanel.tsx
│       │   ├── Auth/
│       │   │   └── PersonaSelector.tsx
│       │   └── shared/
│       │       ├── ThemeToggle.tsx
│       │       └── LoadingSpinner.tsx
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Dashboard.tsx
│       │   ├── InsightDetail.tsx
│       │   └── Settings.tsx
│       ├── store/
│       │   └── authStore.ts     # Zustand: auth token, persona
│       └── types/
│           └── index.ts         # Shared TypeScript interfaces
├── data/
│   ├── generate_synthetic.py    # Deterministic persona data generation
│   ├── validate_synthetic.py    # Schema + pattern validation
│   └── schemas/
│       └── data_dictionary.md
└── docs/
    ├── architecture.md          # This file
    ├── insight_methodology.md
    ├── synthetic_data_methodology.md
    ├── data_dictionary.md
    ├── privacy_and_security.md
    ├── testing_and_evaluation.md
    ├── demo_script.md
    └── research_paper_outline.md
```

---

## Component Architecture

### Auth Flow

```
Landing Page
  │
  ▼
"Explore Demo" clicked
  │
  ▼
PersonaSelector (Maya / Arjun)
  │
  ├─ POST /demo/seed   ──► Backend seeds SQLite with synthetic data
  │                        Returns: { token, user_id }
  │
  ▼
authStore.ts stores token in memory (dev) / localStorage
  │
  ▼
Dashboard renders with Authorization: Bearer <token> on all requests
```

In production, the auth flow replaces the demo seed with Supabase email/password login, which returns a Supabase JWT. The backend validates this JWT against the Supabase public key.

### Data Flow

```
React Component
  │
  │  useQuery('expenses') / useQuery('tasks')
  ▼
React Query Cache
  │  (cache miss or stale)
  ▼
Axios client  ──► GET /expenses?user_id=<id>   ──► FastAPI router
                                                     │
                                                     ▼
                                                 SQLAlchemy query
                                                     │
                                                     ▼
                                                 SQLite / Supabase
                                                     │
                                                     ▼
                                                 Pydantic response
                                                     │
  React Query Cache  ◄────────────────────────── JSON response
  │
  ▼
Component re-renders with fresh data
```

### Insight Calculation Flow

```
GET /insights/current
  │
  ▼
insight_engine.py
  │
  ├─ 1. Determine analysis window
  │      → Most recent 12 complete ISO weeks (Mon–Sun, Asia/Kolkata)
  │
  ├─ 2. For each week: aggregate convenience_food spending
  │      → SUM(expense.amount WHERE category='convenience_food' AND date IN [week_start, week_end])
  │
  ├─ 3. For each week: compute overdue task count at Sunday 23:59:59 IST snapshot
  │      → COUNT(tasks WHERE due_date < snapshot AND (completed_at IS NULL OR completed_at > snapshot))
  │
  ├─ 4. Classify weeks
  │      → qualifying_weeks: overdue_count >= MIN_QUALIFYING_WEEKS_THRESHOLD (default 3)
  │      → baseline_weeks:   overdue_count < threshold
  │
  ├─ 5. Check evidence requirements
  │      → window >= 8 weeks, qualifying >= 3, baseline >= 3, baseline_avg > 0
  │      → If any fail: return { status: 'insufficient_data', failed_condition: '...' }
  │
  ├─ 6. Compute ratio
  │      → qualifying_avg = mean(qualifying_week spending)
  │      → baseline_avg   = mean(baseline_week spending)
  │      → ratio          = qualifying_avg / baseline_avg
  │
  └─ 7. Return InsightResponse
         → { status, ratio, qualifying_avg, baseline_avg, weeks[], engine_version }
```

---

## Technology Choices and Rationale

### FastAPI (Backend)
- **Async-native**: handles concurrent requests efficiently without threading complexity.
- **Typed with Pydantic**: request and response validation is automatic; schema errors return descriptive 422 responses.
- **Auto-generated docs**: `/docs` (Swagger) and `/redoc` are available in development with zero configuration.
- **Lightweight**: minimal boilerplate compared to Django; appropriate for a focused API surface.

### Supabase (Production Database)
- **PostgreSQL under the hood**: full SQL expressiveness, JSONB support, window functions.
- **Row Level Security (RLS)**: data isolation enforced at the database layer, not just the application layer — a critical safeguard for multi-tenant personal data.
- **Supabase Auth**: built-in JWT issuance, email verification, and session management without running a separate auth service.
- **Hosted and managed**: eliminates operational overhead for a small project.

### SQLite (Development Database)
- **Zero configuration**: no server process, no credentials, no Docker required to run locally.
- **Portable**: the `.db` file can be inspected with any SQLite viewer.
- **SQLAlchemy compatibility**: the same ORM models work in both environments via a single `DATABASE_URL` swap.

### React Query (Frontend Data Fetching)
- **Automatic caching**: repeated navigations to the same page avoid redundant network requests.
- **Loading and error states**: built-in without manual `useState` management.
- **Background refetch**: data stays fresh without polling boilerplate.
- **Optimistic updates**: used for the "Tried It" action to give immediate UI feedback.

### Recharts (Visualization)
- **React-native**: built as React components, not a wrapper around a D3 or Canvas imperative API.
- **Composable**: the evidence bar chart is assembled from `<BarChart>`, `<Bar>`, `<ReferenceLine>`, and `<Tooltip>` primitives, making it easy to extend.
- **TypeScript-typed**: no separate `@types` package required.

---

## Security Architecture

### JWT Validation
- All protected endpoints use a FastAPI dependency (`get_current_user`) that decodes and validates the JWT.
- In development, the backend issues its own HS256 tokens signed with `SECRET_KEY`.
- In production, the backend validates Supabase RS256 JWTs using Supabase's public JWKS endpoint.
- Expired or malformed tokens return HTTP 401.

### Row Level Security (RLS)
Supabase RLS policies are defined per table. Every policy restricts access to rows where `user_id = auth.uid()`. See [`docs/privacy_and_security.md`](privacy_and_security.md) for example SQL.

### CORS Configuration
The FastAPI app sets `allow_origins` from the `CORS_ORIGINS` environment variable. In development this defaults to `http://localhost:5173`. In production it is set to the specific Vercel deployment URL.

### No Credentials in the Frontend
- `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the browser. It is only used in the backend.
- The frontend only receives the public-scoped Supabase anon key (if used directly) or a short-lived JWT — never a key with elevated privileges.
- `.env` files are in `.gitignore`.

---

## Scalability Considerations

The current architecture is appropriate for a single-user demo and small-scale use. For production scale:

- **Database**: Supabase PostgreSQL handles thousands of users with RLS; add indexes on `(user_id, date)` for expenses and `(user_id, due_date)` for tasks.
- **Insight caching**: the insight endpoint re-computes on every request. For large user bases, cache the result per `(user_id, iso_week)` with a short TTL.
- **Stateless backend**: the FastAPI app is stateless (no in-process sessions), so horizontal scaling on Railway or Cloud Run requires no changes.
