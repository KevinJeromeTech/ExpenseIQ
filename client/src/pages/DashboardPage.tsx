import type { Insight, Transaction } from "../types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

type MonthlyReport = {
  totalSpent: number;
  transactionCount: number;
  topCategory: string;
  largestPurchase: string;
  largestAmount: number;
  budgetStatus: string;
};

type MonthlyComparison = {
  thisTotal: number;
  prevTotal: number;
  change: number;
  categories: { category: string; thisMonth: number; prevMonth: number }[];
};

type DashboardPageProps = {
  userEmail: string;
  totalSpent: number;
  totalIncome: number;
  netBalance: number;
  transactions: Transaction[];
  topCategory: string;
  monthlyReport: MonthlyReport;
  monthlyBudget: number | "";
  setMonthlyBudget: React.Dispatch<React.SetStateAction<number | "">>;
  budgetAmount: number;
  remainingBudget: number;
  budgetStatus: string;
  budgetUsedPercent: number;
  isSavingBudget: boolean;
  saveBudget: () => Promise<void>;
  insights: Insight[];
  monthlyComparison: MonthlyComparison;
};

export default function DashboardPage({
  userEmail,
  totalSpent,
  totalIncome,
  netBalance,
  transactions,
  topCategory,
  monthlyReport,
  monthlyBudget,
  setMonthlyBudget,
  budgetAmount,
  remainingBudget,
  budgetStatus,
  budgetUsedPercent,
  isSavingBudget,
  saveBudget,
  insights,
  monthlyComparison,
}: DashboardPageProps) {
  const expenseCount = transactions.filter((t) => t.type !== "income").length;
  const averageTransaction = expenseCount > 0 ? totalSpent / expenseCount : 0;

  return (
    <>
      <section className="dashboard-hero">
        <p className="eyebrow">Finance Dashboard</p>
        <h1>ExpenseIQ</h1>
        <p className="hero-subtitle">
          Track spending, monitor budgets, and uncover smarter financial
          insights.
        </p>
        <p className="signed-in-text">Signed in as {userEmail}</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <h2 className="stat-value expense-value">${totalSpent.toFixed(2)}</h2>
          <p className="stat-sub">All time</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total Income</p>
          <h2 className="stat-value income-value">${totalIncome.toFixed(2)}</h2>
          <p className="stat-sub">All time</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Net Balance</p>
          <h2 className={`stat-value ${netBalance >= 0 ? "income-value" : "expense-value"}`}>
            {netBalance >= 0 ? "+" : ""}${netBalance.toFixed(2)}
          </h2>
          <p className="stat-sub">Income − Expenses</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Top Category</p>
          <h2 className="stat-value">{topCategory}</h2>
          <p className="stat-sub">Highest spend</p>
        </div>
      </section>

      <section className="card report-card">
        <div className="section-header">
          <p className="eyebrow">Monthly Report</p>
          <h3>Your Financial Snapshot</h3>
        </div>

        <div className="report-grid">
          <div className="report-item highlight">
            <span>Largest Purchase</span>
            <strong>
              {monthlyReport.largestPurchase} · $
              {monthlyReport.largestAmount.toFixed(2)}
            </strong>
          </div>

          <div className="report-item">
            <span>Budget Used</span>
            <strong>{budgetUsedPercent.toFixed(1)}%</strong>
          </div>

          <div className="report-item">
            <span>Remaining</span>
            <strong className={remainingBudget >= 0 ? "positive" : "danger"}>
              ${remainingBudget.toFixed(2)}
            </strong>
          </div>

          <div className="report-item">
            <span>Average Transaction</span>
            <strong>${averageTransaction.toFixed(2)}</strong>
          </div>

          <div className="report-item">
            <span>Budget Status</span>
            <strong
              className={`status ${monthlyReport.budgetStatus
                .toLowerCase()
                .replaceAll(" ", "-")}`}
            >
              {monthlyReport.budgetStatus}
            </strong>
          </div>
        </div>
      </section>

      <section className="card budget-card">
        <h3>Monthly Budget</h3>

        <div className="budget-grid">
          <div className="budget-input-section">
            <label className="budget-label">Set Monthly Budget</label>

            <input
              className="budget-input"
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudget}
              onChange={(e) =>
                setMonthlyBudget(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />

            <button
              type="button"
              className="primary-button budget-button"
              onClick={saveBudget}
              disabled={isSavingBudget}
            >
              {isSavingBudget ? "Saving..." : "Save Budget"}
            </button>
          </div>

          <div className="budget-stats">
            <div className="budget-row">
              <span>Budget</span>
              <strong>${budgetAmount.toFixed(2)}</strong>
            </div>

            <div className="budget-row">
              <span>Spent</span>
              <strong>${totalSpent.toFixed(2)}</strong>
            </div>

            <div className="budget-row">
              <span>Remaining</span>
              <strong className={remainingBudget >= 0 ? "positive" : "danger"}>
                ${remainingBudget.toFixed(2)}
              </strong>
            </div>

            <div className="budget-row">
              <span>Status</span>
              <strong
                className={`status ${budgetStatus
                  .toLowerCase()
                  .replaceAll(" ", "-")}`}
              >
                {budgetStatus}
              </strong>
            </div>
          </div>
        </div>

        <div className="progress-track">
          <div
            className={`progress-fill ${
              budgetUsedPercent >= 100
                ? "danger-fill"
                : budgetUsedPercent >= 75
                ? "warning-fill"
                : "positive-fill"
            }`}
            style={{ width: `${budgetUsedPercent}%` }}
          />
        </div>

        <p className="budget-caption">
          {budgetUsedPercent.toFixed(1)}% of monthly budget used
        </p>
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <p className="eyebrow">Month over Month</p>
          <h3>
            Monthly Comparison{" "}
            <span className={`change-badge ${monthlyComparison.change > 0 ? "danger" : "positive"}`}>
              {monthlyComparison.change > 0 ? "+" : ""}
              {monthlyComparison.change}%
            </span>
          </h3>
        </div>
        <div className="comparison-summary">
          <div className="comparison-item">
            <span>This month</span>
            <strong>${monthlyComparison.thisTotal.toFixed(2)}</strong>
          </div>
          <div className="comparison-item">
            <span>Last month</span>
            <strong>${monthlyComparison.prevTotal.toFixed(2)}</strong>
          </div>
        </div>
        {monthlyComparison.categories.length > 0 && (
          <div className="chart-wrapper" style={{ marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyComparison.categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis type="category" dataKey="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-nav)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)" }}
                  formatter={(v) => [`$${(v as number).toFixed(2)}`]}
                />
                <Legend />
                <Bar dataKey="thisMonth" name="This Month" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="prevMonth" name="Last Month" fill="rgba(148,163,184,0.35)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card insights-card">
        <p className="eyebrow">AI Insights</p>
        <h3>Smart Financial Signals</h3>

        {insights.length === 0 ? (
          <p className="empty-state">
            Add transactions and a monthly budget to unlock smarter insights.
          </p>
        ) : (
          <div className="insight-list">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`insight-item ${
                  insight.type === "danger"
                    ? "danger"
                    : insight.type === "warning"
                    ? "warning"
                    : "positive"
                }`}
              >
                <span className="insight-dot" />
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}