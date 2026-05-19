import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { shareApi } from "../services/api";
import type { ShareSnapshot } from "../types";

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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
      <div className="dashboard-hero" style={{ textAlign: "center", marginBottom: 32 }}>
        <p className="eyebrow">Shared Budget Report</p>
        <h1>ExpenseIQ</h1>
        <p className="hero-subtitle">Read-only financial snapshot</p>
      </div>

      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Income</p>
          <h2 className="stat-value positive">${data.totalIncome.toFixed(2)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <h2 className="stat-value">${data.totalExpenses.toFixed(2)}</h2>
        </div>
        <div className="stat-card">
          <p className="stat-label">Net Income</p>
          <h2 className={`stat-value ${data.netIncome >= 0 ? "positive" : "danger"}`}>
            ${data.netIncome.toFixed(2)}
          </h2>
        </div>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h3>Recent Transactions</h3>
        <div className="transactions-list">
          {data.recentTransactions.map(t => (
            <div key={t.id} className="transaction-row">
              <div style={{ flex: 1 }}>
                <p className="merchant">{t.merchant}</p>
                <p className="category-badge" data-category={t.category}>{t.category}</p>
              </div>
              <p className={`amount ${t.type === "income" ? "positive" : ""}`}>
                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p style={{ textAlign: "center", marginTop: 24, color: "#64748b", fontSize: "0.85rem" }}>
        Powered by <Link to="/">ExpenseIQ</Link>
      </p>
    </div>
  );
}
