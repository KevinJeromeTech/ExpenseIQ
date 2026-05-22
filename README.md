# ExpenseIQ

A full-stack personal finance dashboard for tracking spending, managing budgets, and surfacing actionable insights.

[![CI](https://github.com/KevinJeromeTech/ExpenseIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/KevinJeromeTech/ExpenseIQ/actions/workflows/ci.yml)

**Live demo:** https://expense-iq-lilac.vercel.app/

---

## Features

**Dashboard**
- Monthly spend summary and budget progress bar
- Financial snapshot (largest purchase, avg transaction, budget status)
- AI-style spending insights (on track / warning / over budget)

**Transactions**
- Add, edit, and delete transactions with category tagging
- Duplicate detection — flags same merchant + amount on the same day
- Search, filter by category, and sort (newest / oldest / highest / lowest)
- CSV export

**Analytics**
- Daily spending trends and cumulative spend charts
- Category breakdown with percentage splits
- Date range filter (7 days / 30 days / all time)

**Security**
- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Zod schema validation on all auth endpoints
- Rate limiting on login/register (20 req / 15 min per IP)

---

## Screenshots

### Landing Page
<img width="1680" height="963" alt="IQLandingPage" src="https://github.com/user-attachments/assets/888be43f-0c29-4d11-87a9-20fb70715230" />

### Login Page
<img width="1680" height="964" alt="IQLoginPage" src="https://github.com/user-attachments/assets/1b05eebe-c441-4758-8b21-4cc102b10a57" />

### Dashboard
<img width="1077" height="956" alt="IQRevampedDashboard" src="https://github.com/user-attachments/assets/3476dee7-7517-4f13-9d35-91d25a1794ff" />
<img width="1081" height="762" alt="IQDashboardPartII" src="https://github.com/user-attachments/assets/4b24ef54-1602-4174-a903-3648e3c5513f" />
<img width="1073" height="724" alt="IQSmartInsights" src="https://github.com/user-attachments/assets/fa7dd8e3-c388-4fdc-8d38-4f9cffc6e4b1" />

### Transactions
<img width="1083" height="941" alt="IQTransaction" src="https://github.com/user-attachments/assets/5f673bb1-b8b4-4823-b3fd-9a56d75af9cd" />


### Analytics


---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 7 |
| Charts | Recharts |
| Routing | React Router v7 |
| Backend | Node.js, Express 5 |
| Validation | Zod |
| ORM | Prisma |
| Database | PostgreSQL (Neon) / SQLite (dev) |
| Auth | JWT + bcryptjs |
| Testing | Vitest, Testing Library |
| CI/CD | GitHub Actions |
| Deploy (client) | Vercel |
| Deploy (server) | Render |

---

## Architecture

```
client/src/
├── services/
│   └── api.ts          # Typed API client — single source of truth for all fetch calls
├── hooks/
│   ├── useAuth.ts      # Token + user session state
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   └── useInsights.ts
├── components/
│   ├── ErrorBoundary.tsx
│   ├── LoginForm.tsx
│   ├── AppLayout.tsx
│   └── ProtectedRoute.tsx
└── pages/
    ├── DashboardPage.tsx
    ├── TransactionsPage.tsx
    └── AnalyticsPage.tsx

server/src/
├── app.ts              # Express app + all API routes
├── server.ts           # Entry point
├── middleware/
│   └── auth.ts         # JWT verification
└── routes/
    └── auth.ts         # Register + login with Zod validation
```

Request flow:
```
React (hooks) → services/api.ts → Express → Prisma → PostgreSQL
```

---

## Local Development

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/KevinJeromeTech/ExpenseIQ.git
cd ExpenseIQ

npm install --prefix client
npm install --prefix server
```

### 2. Environment variables

**`server/.env`**
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-here"
PORT=4000
```

**`client/.env`**
```
VITE_API_BASE_URL=http://localhost:4000
```

### 3. Set up the database

```bash
cd server
npx prisma migrate dev
```

### 4. Run

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open http://localhost:5173

---

## API Reference

All routes except `/api/auth/*` require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/transactions` | List user's transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/budgets` | List user's budgets |
| POST | `/api/budgets` | Create or update budget |
| GET | `/api/insights` | Get spending insights |
| GET | `/api/health` | Health check |

---

## Testing

```bash
cd client
npm run test:run   # run once
npm run test       # watch mode
```

21 unit tests covering:
- `services/api.ts` — request handling, error surfacing, auth headers
- `hooks/useAuth` — session persistence, login, logout, corrupted storage
- `hooks/useBudgets` — data fetching, derived state, 401 handling

---

## Roadmap

- [ ] React Query for smarter data fetching and caching
- [ ] Per-category budgets (currently one global monthly budget)
- [ ] Transaction date picker
- [ ] Password reset flow
- [ ] Docker setup for one-command local dev

---

Built by [Kevin Jerome](https://www.linkedin.com/in/kevinjerome-kj/) · [GitHub](https://github.com/SpikeTek241)
