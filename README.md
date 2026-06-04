# ExpenseIQ

A full-stack personal finance dashboard for tracking spending, managing budgets, and surfacing actionable insights — built with React, TypeScript, and Node.js.

[![CI](https://github.com/KevinJeromeTech/ExpenseIQ/actions/workflows/ci.yml/badge.svg)](https://github.com/KevinJeromeTech/ExpenseIQ/actions/workflows/ci.yml)

**Live demo:** https://expense-iq-lilac.vercel.app/

---

## Features

**Marketing landing page**
- Dedicated `/` route with hero section, feature highlights, floating stat preview cards, and CTA
- Separate `/login` route with a split two-column layout — branded panel left, form right
- Fully responsive; collapses to single-column on mobile

**Dashboard**
- Monthly spend summary and global budget progress bar
- Financial snapshot (largest purchase, avg transaction, net income, budget status)
- Spending insights engine — rule-based logic flags on track / near limit / over budget / projected overage states against each category budget
- Per-category budget cards — click any card to set or edit a monthly limit inline; progress bar turns amber at 75% and red at 100%
- Month-over-month category comparison
- Achievements / milestones (Budget Keeper, Savings Star, Active Tracker, etc.)
- Spending breakdown donut chart
- One-click shareable snapshot link (copies to clipboard)

**Transactions**
- Add, edit, and delete expense and income transactions
- **AI auto-categorization** — powered by [Claude Haiku](https://www.anthropic.com/claude) (`claude-haiku-4-5`); when you enter a merchant name and tab away, the category is auto-filled based on your category list with a ✦ AI suggested badge
- Recurring transactions — weekly / bi-weekly / monthly / yearly; server auto-creates occurrences on schedule
- Duplicate detection — flags same merchant + amount on the same day
- Search by merchant, filter by category and date range, sort by newest / oldest / highest / lowest
- Bulk select and delete
- CSV export and CSV import
- Native date picker themed to match dark / light mode

**Analytics**
- Daily spending trends and cumulative spend charts
- Category breakdown with percentage splits
- Date range filter (7 days / 30 days / all time)

**Shareable reports**
- Generate a public read-only link to your financial snapshot
- Share page includes summary stats, a spending-by-category donut chart, category totals with progress bars, and recent transactions — no login required

**Settings**
- Dark / light theme toggle with persistent preference
- Currency and date format selection
- Password change
- Custom category management (add / remove)
- Budget alert threshold (warn at X% of budget)
- Bulk delete all transactions
- Account deletion

**Security**
- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Zod schema validation on all auth endpoints
- Rate limiting on login / register (20 req / 15 min per IP)
- Password reset via email token

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
| Frontend | React 19, TypeScript 5.9, Vite 7 |
| State / Data | TanStack React Query v5 |
| Charts | Recharts |
| AI | Anthropic Claude API (`claude-haiku-4-5`) |
| Routing | React Router v7 |
| Backend | Node.js, Express 5 |
| Validation | Zod |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon) / SQLite (dev) |
| Auth | JWT + bcryptjs |
| Testing | Vitest, Testing Library, Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deploy (client) | Vercel |
| Deploy (server) | Render |

---

## Architecture

```
client/src/
├── services/
│   └── api.ts               # Typed HTTP client — single source of truth for all API calls
├── hooks/
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   ├── useBudgets.ts
│   ├── useCategories.ts
│   └── useInsights.ts
├── components/
│   ├── AppLayout.tsx        # Nav + page shell for authenticated routes
│   ├── LoginForm.tsx
│   ├── ProtectedRoute.tsx
│   ├── Dropdown.tsx
│   ├── ThemeProvider.tsx
│   ├── PreferencesProvider.tsx
│   └── ErrorBoundary.tsx
└── pages/
    ├── LandingPage.tsx       # Public marketing page (/)
    ├── LoginPage.tsx         # Split two-column login (/login)
    ├── DashboardPage.tsx
    ├── TransactionsPage.tsx
    ├── AnalyticsPage.tsx
    ├── SettingsPage.tsx
    ├── SharePage.tsx         # Public read-only snapshot (/share/:token)
    ├── ForgotPasswordPage.tsx
    └── ResetPasswordPage.tsx

server/src/
├── app.ts                   # Express app + all API routes
├── server.ts                # Entry point
├── database/
│   └── prisma.ts            # Prisma client singleton
├── lib/
│   └── mailer.ts            # Password reset email sending
├── middleware/
│   └── auth.ts              # JWT verification
└── routes/
    ├── auth.ts              # Register, login, password reset
    └── users.ts             # User profile and account management
```

Request flow:
```
React (hooks + React Query) → services/api.ts → Express → Prisma → PostgreSQL
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
ANTHROPIC_API_KEY="your-anthropic-api-key"
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

All routes except `/api/auth/*` and `/api/share/:token` require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password via token |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/budgets` | List budgets (monthly + per-category) |
| POST | `/api/budgets` | Create or update a budget |
| GET | `/api/insights` | Get rule-based spending insights (on track / over budget) |
| POST | `/api/categorize` | AI-suggest a category for a merchant (Claude Haiku) |
| GET | `/api/categories` | List custom categories |
| POST | `/api/categories` | Add a category |
| DELETE | `/api/categories/:id` | Remove a category |
| POST | `/api/share/generate` | Generate a shareable snapshot link |
| GET | `/api/share/:token` | Get public snapshot (no auth required) |
| DELETE | `/api/share` | Revoke share link |
| GET | `/api/health` | Health check |

---

## Testing

```bash
cd client
npm run test:run   # run once
npm run test       # watch mode
```

Unit tests covering:
- `services/api.ts` — request handling, error surfacing, auth headers
- `hooks/useAuth` — session persistence, login, logout, corrupted storage
- `hooks/useBudgets` — data fetching, derived state, 401 handling

---

## Roadmap

- [ ] Bank / CSV import with auto-parsing
- [ ] Custom date ranges in Analytics
- [ ] Spending forecasting (project end-of-month total from current pace)
- [ ] Transaction tags (cross-category labels like "work" or "vacation")
- [ ] Savings goals with progress tracking
- [ ] Weekly email digest
- [ ] Command palette (`Cmd+K`) for quick-add and navigation
- [ ] Animated number counters on stat cards
- [x] Skeleton loaders in place of "Loading…" text
- [ ] Rate limiting on all endpoints (currently auth-only)
- [ ] Docker setup for one-command local dev

---

Built by [Kevin Jerome](https://www.linkedin.com/in/kevinjerome-kj/) · [GitHub](https://github.com/SpikeTek241)
