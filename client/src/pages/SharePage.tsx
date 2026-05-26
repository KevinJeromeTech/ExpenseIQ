import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { shareApi } from "../services/api";
import type { ShareSnapshot } from "../types";

const COLORS = ["#f472b6", "#34d399", "#60a5fa", "#fb923c", "#a78bfa", "#fbbf24", "#38bdf8", "#f87171"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ShareSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    shareApi.getSnapshot(token)
      .then(setData)
      .catch(() => setError("This share link is invalid or has been revoked."));
  }, [token]);

  if (error) return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="auth-eyebrow">Shared Report</p>
        <h1 className="auth-title">Link Unavailable</h1>
        <p className="auth-subtitle">{error}</p>
        <Link to="/" className="primary-button" style={{ textAlign: "center", display: "block" }}>Go to ExpenseIQ</Link>
      </div>
    </div>
  );

  if (!data) return <div className="page-loading" aria-label="Loading shared report">Loading…</div>;

  return (
    <div className="share-page">
      <header className="share-header">
        <p className="eyebrow">Shared Financial Report</p>
        <h1 className="share-title">ExpenseIQ Snapshot</h1>
        <p className="share-subtitle">Read-only financial summary · {data.transactionCount} transactions</p>
      </header>

      {/* Stats */}
      <section className="stats-grid share-stats">
        <div className="stat-card">
          <p className="stat-label">Total Income</p>
          <h2 className="stat-value positive">{fmt(data.totalIncome)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <h2 className="stat-value">{fmt(data.totalExpenses)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Net Income</p>
          <h2 className={`stat-value ${data.netIncome >= 0 ? "positive" : "danger"}`}>
            {fmt(data.netIncome)}
          </h2>
        </div>
      </section>

      {/* Charts row */}
      {data.categoryBreakdown.length > 0 && (
        <section className="share-charts-row">
          {/* Donut chart */}
          <div className="card share-chart-card">
            <p className="eyebrow">Breakdown</p>
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {data.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [fmt(Number(v ?? 0)), "Spent"]}
                  contentStyle={{ background: "rgba(10,18,37,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: "0.82rem" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "0.78rem", paddingTop: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category bar list */}
          <div className="card share-category-list">
            <p className="eyebrow">Detail</p>
            <h3>Category Totals</h3>
            <div className="share-cat-rows">
              {data.categoryBreakdown.map((cat, i) => {
                const pct = data.totalExpenses > 0 ? (cat.value / data.totalExpenses) * 100 : 0;
                return (
                  <div key={cat.name} className="share-cat-row">
                    <div className="share-cat-header">
                      <span className="share-cat-dot" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="share-cat-name">{cat.name}</span>
                      <span className="share-cat-amount">{fmt(cat.value)}</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], opacity: 0.85 }}
                      />
                    </div>
                    <span className="share-cat-pct">{pct.toFixed(1)}% of expenses</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent transactions */}
      <section className="card share-transactions-card">
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {data.recentTransactions.map(t => (
            <div key={t.id} className="transaction-row">
              <div className="transaction-info">
                <p className="merchant">{t.merchant}</p>
                <div className="transaction-meta">
                  <span className="category-badge" data-category={t.category}>{t.category}</span>
                  {t.transactionDate && (
                    <span className="transaction-date">
                      {new Date(t.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  )}
                </div>
              </div>
              <p className={`amount ${t.type === "income" ? "positive" : ""}`}>
                {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="share-footer">
        <p>Powered by <Link to="/">ExpenseIQ</Link> · Read-only snapshot</p>
      </footer>
    </div>
  );
}
