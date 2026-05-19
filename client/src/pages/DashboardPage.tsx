import { useState, useMemo } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useBudgets } from "../hooks/useBudgets";
import { useInsights } from "../hooks/useInsights";
import { shareApi } from "../services/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment"] as const;
const COLORS = ["#f472b6","#34d399","#60a5fa","#fb923c","#a78bfa","#fbbf24","#38bdf8"];

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

  // Share state
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);

  // Income/expense split
  const expenses = useMemo(() => transactions.filter(t => t.type !== "income"), [transactions]);
  const incomeTransactions = useMemo(() => transactions.filter(t => t.type === "income"), [transactions]);
  const totalExpenses = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const totalIncome = useMemo(() => incomeTransactions.reduce((s, t) => s + t.amount, 0), [incomeTransactions]);
  const netIncome = totalIncome - totalExpenses;

  const topCategory = useMemo(() => {
    if (expenses.length === 0) return "N/A";
    const totals: Record<string, number> = {};
    for (const t of expenses) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  }, [expenses]);

  const largestTransaction = useMemo(
    () =>
      expenses.length > 0
        ? expenses.reduce((max, t) => (t.amount > max.amount ? t : max))
        : null,
    [expenses]
  );

  const budgetAmount = typeof savedMonthlyLimit === "number" ? savedMonthlyLimit : 0;
  const remainingBudget = budgetAmount - totalExpenses;
  const budgetUsedPercent = budgetAmount > 0 ? Math.min((totalExpenses / budgetAmount) * 100, 100) : 0;
  const budgetStatus =
    budgetAmount === 0
      ? "No Budget Set"
      : totalExpenses > budgetAmount
      ? "Over Budget"
      : budgetUsedPercent >= 75
      ? "Near Limit"
      : "On Track";

  const averageTransaction = expenses.length > 0 ? totalExpenses / expenses.length : 0;

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of expenses) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return totals;
  }, [expenses]);

  const monthlyReport = {
    totalSpent: totalExpenses,
    transactionCount: transactions.length,
    topCategory,
    largestPurchase: largestTransaction?.merchant ?? "N/A",
    largestAmount: largestTransaction?.amount ?? 0,
    budgetStatus,
  };

  // Donut chart data
  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of expenses) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    return Object.entries(totals).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [expenses]);

  // Month-over-month comparison
  const now = new Date();
  const thisMonthStr = now.toISOString().slice(0, 7);
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

  const momData = useMemo(() => {
    const thisMonth: Record<string, number> = {};
    const lastMonth: Record<string, number> = {};
    for (const t of expenses) {
      const month = new Date(t.transactionDate ?? t.createdAt).toISOString().slice(0, 7);
      if (month === thisMonthStr) thisMonth[t.category] = (thisMonth[t.category] ?? 0) + t.amount;
      if (month === lastMonthStr) lastMonth[t.category] = (lastMonth[t.category] ?? 0) + t.amount;
    }
    const allCats = new Set([...Object.keys(thisMonth), ...Object.keys(lastMonth)]);
    return Array.from(allCats).map(cat => ({
      category: cat,
      current: thisMonth[cat] ?? 0,
      previous: lastMonth[cat] ?? 0,
      change: lastMonth[cat] ? ((((thisMonth[cat] ?? 0) - lastMonth[cat]) / lastMonth[cat]) * 100) : null,
    })).sort((a, b) => b.current - a.current);
  }, [expenses, thisMonthStr, lastMonthStr]);

  // Achievements
  const achievements = useMemo(() => {
    const list: { id: string; emoji: string; label: string; desc: string }[] = [];
    if (budgetAmount > 0 && totalExpenses < budgetAmount)
      list.push({ id: "budget-keeper", emoji: "🏆", label: "Budget Keeper", desc: "Under budget this month" });
    if (netIncome > 0)
      list.push({ id: "net-positive", emoji: "⭐", label: "Savings Star", desc: "Income exceeds expenses" });
    if (totalIncome > 0 && netIncome / totalIncome > 0.2)
      list.push({ id: "big-saver", emoji: "💰", label: "Big Saver", desc: "Saving 20%+ of income" });
    const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
    if (transactions.filter(t => new Date(t.transactionDate ?? t.createdAt) >= lastWeek).length >= 5)
      list.push({ id: "active-tracker", emoji: "📊", label: "Active Tracker", desc: "5+ transactions this week" });
    if (transactions.length >= 50)
      list.push({ id: "power-user", emoji: "🚀", label: "Power User", desc: "50+ transactions logged" });
    return list;
  }, [transactions, totalExpenses, totalIncome, netIncome, budgetAmount]);

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

  const handleGenerateShare = async () => {
    if (!token) return;
    try {
      setIsGeneratingShare(true);
      const { token: newShareToken } = await shareApi.generate(token);
      setShareToken(newShareToken);
      const url = `${window.location.origin}/share/${newShareToken}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard!");
    } catch { toast.error("Failed to generate share link"); }
    finally { setIsGeneratingShare(false); }
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
          <p className="stat-label">Total Income</p>
          <h2 className="stat-value positive">${totalIncome.toFixed(2)}</h2>
          <p className="stat-sub">All time</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Total Expenses</p>
          <h2 className="stat-value">${totalExpenses.toFixed(2)}</h2>
          <p className="stat-sub">All time</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Net Income</p>
          <h2 className={`stat-value ${netIncome >= 0 ? "positive" : "danger"}`}>${netIncome.toFixed(2)}</h2>
          <p className="stat-sub">Income − Expenses</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Transactions</p>
          <h2 className="stat-value">{transactions.length}</h2>
          <p className="stat-sub">Recorded</p>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0 }}>Monthly Budget</h3>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleGenerateShare()}
            disabled={isGeneratingShare}
          >
            {isGeneratingShare ? "Generating…" : "Share Report"}
          </button>
        </div>
        {shareToken && (
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginBottom: "0.75rem", wordBreak: "break-all" }}>
            Share link: <a href={`/share/${shareToken}`} style={{ color: "#60a5fa" }}>/share/{shareToken}</a>
          </p>
        )}

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
              <strong>${totalExpenses.toFixed(2)}</strong>
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
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleSaveCategoryBudget(cat)}
                    disabled={isSaving || isSavingBudget}
                    style={{ whiteSpace: "nowrap", padding: "0.5rem 1.1rem", fontSize: "0.875rem", flexShrink: 0 }}
                  >
                    {isSaving ? "Saving…" : "Save"}
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

      <section className="card chart-card">
        <p className="eyebrow">Spending Breakdown</p>
        <h3>By Category</h3>
        {categoryChartData.length === 0 ? (
          <p className="empty-state">No expense transactions yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${Number(v ?? 0).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>

      <section className="card mom-card">
        <p className="eyebrow">Month-over-Month</p>
        <h3>Category Comparison</h3>
        {momData.length === 0 ? (
          <p className="empty-state">Not enough data yet.</p>
        ) : (
          <div className="mom-table">
            <div className="mom-header">
              <span>Category</span><span>This Month</span><span>Last Month</span><span>Change</span>
            </div>
            {momData.map(row => (
              <div key={row.category} className="mom-row">
                <span className="mom-cat">{row.category}</span>
                <span>${row.current.toFixed(2)}</span>
                <span>${row.previous.toFixed(2)}</span>
                <span className={row.change === null ? "" : row.change > 0 ? "danger" : "positive"}>
                  {row.change === null ? "—" : `${row.change > 0 ? "+" : ""}${row.change.toFixed(0)}%`}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card achievements-card">
        <p className="eyebrow">Achievements</p>
        <h3>Your Milestones</h3>
        {achievements.length === 0 ? (
          <p className="empty-state">Keep logging transactions to unlock achievements.</p>
        ) : (
          <div className="achievement-grid">
            {achievements.map(a => (
              <div key={a.id} className="achievement-card">
                <span className="achievement-emoji">{a.emoji}</span>
                <p className="achievement-label">{a.label}</p>
                <p className="achievement-desc">{a.desc}</p>
              </div>
            ))}
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
