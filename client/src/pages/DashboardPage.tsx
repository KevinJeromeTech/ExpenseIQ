import { useState, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useBudgets } from "../hooks/useBudgets";
import { useInsights } from "../hooks/useInsights";
import toast from "react-hot-toast";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment"] as const;

export default function DashboardPage() {
  const { token, user, onUnauthorized } = useAuthContext();

  const { transactions, isLoading: isLoadingTransactions } = useTransactions({ token, onUnauthorized });
  const { budgets, savedMonthlyLimit, saveBudget, isSavingBudget } = useBudgets({ token, onUnauthorized });
  const { insights } = useInsights({ token, onUnauthorized });

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [budgetInputValue, setBudgetInputValue] = useState<number | "">("");

  // Category budget inputs keyed by category name
  const [categoryBudgetInputs, setCategoryBudgetInputs] = useState<Record<string, string>>({});
  const [isSavingCategoryBudget, setIsSavingCategoryBudget] = useState<Record<string, boolean>>({});

  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const topCategory = useMemo(() => {
    if (transactions.length === 0) return "N/A";
    const totals: Record<string, number> = {};
    for (const t of transactions) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  }, [transactions]);

  const largestTransaction = useMemo(
    () =>
      transactions.length > 0
        ? transactions.reduce((max, t) => (t.amount > max.amount ? t : max))
        : null,
    [transactions]
  );

  const budgetAmount = typeof savedMonthlyLimit === "number" ? savedMonthlyLimit : 0;
  const remainingBudget = budgetAmount - totalSpent;
  const budgetUsedPercent = budgetAmount > 0 ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0;
  const budgetStatus =
    budgetAmount === 0
      ? "No Budget Set"
      : totalSpent > budgetAmount
      ? "Over Budget"
      : budgetUsedPercent >= 75
      ? "Near Limit"
      : "On Track";

  const averageTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of transactions) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return totals;
  }, [transactions]);

  const monthlyReport = {
    totalSpent,
    transactionCount: transactions.length,
    topCategory,
    largestPurchase: largestTransaction?.merchant ?? "N/A",
    largestAmount: largestTransaction?.amount ?? 0,
    budgetStatus,
  };

  const handleSaveMonthlyBudget = async () => {
    const limit = typeof budgetInputValue === "number" ? budgetInputValue : 0;
    if (limit <= 0) {
      toast.error("Enter a valid budget amount.");
      return;
    }
    try {
      await saveBudget({ category: "Monthly", limit, month: currentMonth });
      toast.success("Monthly budget saved!");
    } catch {
      // error handled in hook
    }
  };

  const getCategoryBudgetValue = (cat: string) => {
    if (categoryBudgetInputs[cat] !== undefined) return categoryBudgetInputs[cat];
    const existing = budgets.find((b) => b.category === cat && b.month === currentMonth);
    return existing ? String(existing.limit) : "";
  };

  const handleSaveCategoryBudget = async (cat: string) => {
    const raw = getCategoryBudgetValue(cat);
    const limit = parseFloat(raw);
    if (!raw || isNaN(limit) || limit <= 0) {
      toast.error(`Enter a valid budget for ${cat}.`);
      return;
    }
    setIsSavingCategoryBudget((prev) => ({ ...prev, [cat]: true }));
    try {
      await saveBudget({ category: cat, limit, month: currentMonth });
      toast.success(`${cat} budget saved!`);
      setCategoryBudgetInputs((prev) => { const next = { ...prev }; delete next[cat]; return next; });
    } catch {
      // error handled in hook
    } finally {
      setIsSavingCategoryBudget((prev) => ({ ...prev, [cat]: false }));
    }
  };

  if (!isLoadingTransactions && savedMonthlyLimit !== null && budgetInputValue === "") {
    // pre-fill budget input once on load — only if user hasn't typed anything
  }

  return (
    <>
      <section className="dashboard-hero">
        <p className="eyebrow">Finance Dashboard</p>
        <h1>ExpenseIQ</h1>
        <p className="hero-subtitle">
          Track spending, monitor budgets, and uncover smarter financial insights.
        </p>
        <p className="signed-in-text">Signed in as {user?.email}</p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Spent</p>
          <h2 className="stat-value">${totalSpent.toFixed(2)}</h2>
          <p className="stat-sub">This month</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Transactions</p>
          <h2 className="stat-value">{transactions.length}</h2>
          <p className="stat-sub">Recorded</p>
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
              {monthlyReport.largestPurchase} · ${monthlyReport.largestAmount.toFixed(2)}
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
              value={budgetInputValue}
              placeholder={savedMonthlyLimit !== null ? String(savedMonthlyLimit) : "0.00"}
              onChange={(e) =>
                setBudgetInputValue(e.target.value === "" ? "" : Number(e.target.value))
              }
            />

            <button
              type="button"
              className="primary-button budget-button"
              onClick={() => void handleSaveMonthlyBudget()}
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
                className={`status ${budgetStatus.toLowerCase().replaceAll(" ", "-")}`}
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

        <p className="budget-caption">{budgetUsedPercent.toFixed(1)}% of monthly budget used</p>
      </section>

      <section className="card budget-card">
        <h3>Category Budgets</h3>
        <p className="budget-caption" style={{ marginBottom: "1rem" }}>
          Set spending limits per category for this month.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {CATEGORIES.map((cat) => {
            const spent = categoryTotals[cat] ?? 0;
            const inputVal = getCategoryBudgetValue(cat);
            const limit = parseFloat(inputVal) || 0;
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
            const isSaving = isSavingCategoryBudget[cat] ?? false;

            return (
              <div key={cat} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <span className="budget-label">{cat}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #94a3b8)" }}>
                    ${spent.toFixed(2)} spent
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    className="budget-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Set limit"
                    value={inputVal}
                    onChange={(e) =>
                      setCategoryBudgetInputs((prev) => ({ ...prev, [cat]: e.target.value }))
                    }
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="primary-button budget-button"
                    onClick={() => void handleSaveCategoryBudget(cat)}
                    disabled={isSaving || isSavingBudget}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
                {limit > 0 && (
                  <>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${
                          percent >= 100
                            ? "danger-fill"
                            : percent >= 75
                            ? "warning-fill"
                            : "positive-fill"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="budget-caption">
                      {percent.toFixed(1)}% of ${limit.toFixed(2)} {cat} budget used
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
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
