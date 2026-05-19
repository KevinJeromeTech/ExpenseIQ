import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuthContext } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";

type DateRange = "7d" | "30d" | "all";

export default function AnalyticsPage() {
  const { token, onUnauthorized } = useAuthContext();
  const { transactions, isLoading } = useTransactions({ token, onUnauthorized });

  const [dateRange, setDateRange] = useState<DateRange>("30d");

  const analyticsTransactions = useMemo(() => {
    if (dateRange === "all") return transactions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (dateRange === "7d" ? 7 : 30));
    return transactions.filter(
      (t) => new Date(t.transactionDate ?? t.createdAt) >= cutoff
    );
  }, [transactions, dateRange]);

  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of analyticsTransactions) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    }
    return Object.entries(totals).map(([category, total]) => ({ category, total }));
  }, [analyticsTransactions]);

  const trendData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const t of analyticsTransactions) {
      const date = new Date(t.transactionDate ?? t.createdAt)
        .toLocaleDateString("en-US", { month: "short", day: "numeric" });
      byDate[date] = (byDate[date] ?? 0) + t.amount;
    }
    return Object.entries(byDate)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }));
  }, [analyticsTransactions]);

  const cumulativeTrendData = useMemo(() => {
    let running = 0;
    return trendData.map(({ date, amount }) => {
      running += amount;
      return { date, total: Math.round(running * 100) / 100 };
    });
  }, [trendData]);

  const categoryPercentages = useMemo(() => {
    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    if (total === 0) return [];
    return categoryChartData
      .map(({ category, total: catTotal }) => ({
        category,
        percent: Math.round((catTotal / total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent);
  }, [analyticsTransactions, categoryChartData]);

  const analyticsInsights = useMemo(() => {
    const insights: string[] = [];
    if (analyticsTransactions.length === 0) return insights;

    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avg = total / analyticsTransactions.length;
    insights.push(`Average transaction: $${avg.toFixed(2)}`);

    if (categoryChartData.length > 0) {
      const top = [...categoryChartData].sort((a, b) => b.total - a.total)[0];
      insights.push(
        `Top category: ${top.category} at $${top.total.toFixed(2)} (${Math.round((top.total / total) * 100)}% of spend)`
      );
    }

    const maxTx = analyticsTransactions.reduce(
      (max, t) => (t.amount > max.amount ? t : max),
      analyticsTransactions[0]
    );
    insights.push(`Largest single purchase: $${maxTx.amount.toFixed(2)} at ${maxTx.merchant}`);

    if (trendData.length >= 2) {
      const last = trendData[trendData.length - 1].amount;
      const prev = trendData[trendData.length - 2].amount;
      const diff = ((last - prev) / Math.max(prev, 0.01)) * 100;
      insights.push(
        `Daily spending ${diff >= 0 ? "up" : "down"} ${Math.abs(diff).toFixed(0)}% compared to the previous day.`
      );
    }

    return insights;
  }, [analyticsTransactions, categoryChartData, trendData]);

  return (
    <>
      <section className="card">
        <div className="section-header">
          <p className="chart-section-label">⚡ Date Range</p>
          <h3>Filter Analytics</h3>
        </div>

        <div className="filter-row">
          <button
            type="button"
            className={`filter-chip ${dateRange === "7d" ? "active" : ""}`}
            onClick={() => setDateRange("7d")}
          >
            Last 7 Days
          </button>

          <button
            type="button"
            className={`filter-chip ${dateRange === "30d" ? "active" : ""}`}
            onClick={() => setDateRange("30d")}
          >
            Last 30 Days
          </button>

          <button
            type="button"
            className={`filter-chip ${dateRange === "all" ? "active" : ""}`}
            onClick={() => setDateRange("all")}
          >
            All Time
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <p className="chart-section-label">🧠 AI Powered</p>
          <h3>Spending Insights</h3>
        </div>

        <div className="insight-list">
          {isLoading ? (
            <p className="empty-state">Loading insights...</p>
          ) : analyticsInsights.length === 0 ? (
            <p className="empty-state">No insights available yet.</p>
          ) : (
            analyticsInsights.map((insight, index) => (
              <div key={index} className="insight-item positive">
                <span className="insight-icon">🧠</span>
                <p>{insight}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="summary-grid">
        {isLoading ? (
          <div className="card">
            <p className="empty-state">Loading category data...</p>
          </div>
        ) : categoryPercentages.length === 0 ? (
          <div className="card">
            <p className="empty-state">No category percentage data yet.</p>
          </div>
        ) : (
          categoryPercentages.map((item, index) => (
            <div key={index} className="card summary-card">
              <p className="card-label">{item.category}</p>
              <h2>{item.percent}%</h2>
            </div>
          ))
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">📈 Trend</p>
          <h3>Daily Spending</h3>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading analytics...</p>
        ) : trendData.length === 0 ? (
          <p className="empty-state">No trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="linear"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">📊 Cumulative</p>
          <h3>Total Spending Over Time</h3>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading analytics...</p>
        ) : cumulativeTrendData.length === 0 ? (
          <p className="empty-state">No cumulative trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="linear"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">🏷️ Breakdown</p>
          <h3>Spending by Category</h3>
        </div>

        {isLoading ? (
          <p className="empty-state">Loading analytics...</p>
        ) : categoryChartData.length === 0 ? (
          <p className="empty-state">No chart data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}
