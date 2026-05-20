import { useState, useMemo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { usePreferencesContext } from "../contexts/PreferencesContext";
import { useTransactions } from "../hooks/useTransactions";

type DateRange = "7d" | "30d" | "all";

const CATEGORY_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

type TooltipPayload = { value: number; name: string; payload: Record<string, unknown> };

function ChartTooltip({
  active, payload, label, fmt,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  fmt: (n: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      {label && <p className="analytics-tooltip-label">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="analytics-tooltip-value">{fmt(entry.value)}</p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { token, onUnauthorized } = useAuthContext();
  const { fmt } = usePreferencesContext();
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
    return Object.entries(totals)
      .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
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
    return trendData.reduce<{ date: string; total: number }[]>((acc, { date, amount }) => {
      const prev = acc[acc.length - 1]?.total ?? 0;
      acc.push({ date, total: Math.round((prev + amount) * 100) / 100 });
      return acc;
    }, []);
  }, [trendData]);

  const kpis = useMemo(() => {
    const total = analyticsTransactions.reduce((s, t) => s + t.amount, 0);
    const count = analyticsTransactions.length;
    const dayCount = trendData.length || 1;
    const avgPerDay = total / dayCount;
    const highestDay = trendData.reduce((m, d) => (d.amount > m ? d.amount : m), 0);
    const lastTwo = trendData.slice(-2);
    const dayChange =
      lastTwo.length === 2 && lastTwo[0].amount > 0
        ? ((lastTwo[1].amount - lastTwo[0].amount) / lastTwo[0].amount) * 100
        : null;
    return { total, count, avgPerDay, highestDay, dayChange };
  }, [analyticsTransactions, trendData]);

  const analyticsInsights = useMemo(() => {
    const insights: { text: string; type: "positive" | "warning" | "neutral" }[] = [];
    if (analyticsTransactions.length === 0) return insights;

    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avg = total / analyticsTransactions.length;
    insights.push({ text: `Average transaction: ${fmt(avg)}`, type: "neutral" });

    if (categoryChartData.length > 0) {
      const top = categoryChartData[0];
      const pct = Math.round((top.total / total) * 100);
      insights.push({
        text: `Top category: ${top.category} at ${fmt(top.total)} (${pct}% of spend)`,
        type: pct > 50 ? "warning" : "positive",
      });
    }

    const maxTx = analyticsTransactions.reduce(
      (max, t) => (t.amount > max.amount ? t : max),
      analyticsTransactions[0]
    );
    insights.push({ text: `Largest purchase: ${fmt(maxTx.amount)} at ${maxTx.merchant}`, type: "neutral" });

    if (trendData.length >= 2) {
      const last = trendData[trendData.length - 1].amount;
      const prev = trendData[trendData.length - 2].amount;
      const diff = ((last - prev) / Math.max(prev, 0.01)) * 100;
      insights.push({
        text: `Daily spending ${diff >= 0 ? "up" : "down"} ${Math.abs(diff).toFixed(0)}% vs the previous day.`,
        type: diff >= 15 ? "warning" : diff <= -10 ? "positive" : "neutral",
      });
    }

    return insights;
  }, [analyticsTransactions, categoryChartData, trendData, fmt]);

  const isEmpty = !isLoading && analyticsTransactions.length === 0;

  return (
    <>
      {/* ── Filter ── */}
      <section className="card">
        <div className="section-header">
          <p className="chart-section-label">⚡ Date Range</p>
          <h3>Filter Analytics</h3>
        </div>
        <div className="filter-row">
          {(["7d", "30d", "all"] as DateRange[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`filter-chip ${dateRange === r ? "active" : ""}`}
              onClick={() => setDateRange(r)}
            >
              {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </section>

      {/* ── KPI cards ── */}
      <section className="analytics-kpi-grid">
        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Spend</span>
            <TrendingDown size={16} className="kpi-icon danger" />
          </div>
          <p className="kpi-value">{isLoading ? "—" : fmt(kpis.total)}</p>
          <p className="kpi-sub">{kpis.count} transaction{kpis.count !== 1 ? "s" : ""}</p>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Avg / Day</span>
            <Calendar size={16} className="kpi-icon" />
          </div>
          <p className="kpi-value">{isLoading ? "—" : fmt(kpis.avgPerDay)}</p>
          <p className="kpi-sub">across {trendData.length} active day{trendData.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Peak Day</span>
            <TrendingUp size={16} className="kpi-icon warning" />
          </div>
          <p className="kpi-value">{isLoading ? "—" : fmt(kpis.highestDay)}</p>
          <p className="kpi-sub">highest single day</p>
        </div>

        <div className="analytics-kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Day-over-Day</span>
            {kpis.dayChange === null ? (
              <Minus size={16} className="kpi-icon" />
            ) : kpis.dayChange >= 0 ? (
              <ArrowUpRight size={16} className="kpi-icon danger" />
            ) : (
              <ArrowDownRight size={16} className="kpi-icon positive" />
            )}
          </div>
          <p className={`kpi-value${kpis.dayChange === null ? "" : kpis.dayChange >= 0 ? " kpi-danger" : " kpi-positive"}`}>
            {isLoading || kpis.dayChange === null
              ? "—"
              : `${kpis.dayChange >= 0 ? "+" : ""}${kpis.dayChange.toFixed(1)}%`}
          </p>
          <p className="kpi-sub">vs previous day</p>
        </div>
      </section>

      {/* ── AI Insights ── */}
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
            analyticsInsights.map((insight, i) => (
              <div key={i} className={`insight-item ${insight.type}`}>
                <span className="insight-icon">
                  {insight.type === "warning" ? "⚠️" : insight.type === "positive" ? "✅" : "🧠"}
                </span>
                <p>{insight.text}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Donut + Bar side by side ── */}
      <div className="analytics-charts-row">
        <section className="card chart-card">
          <div className="section-header">
            <p className="chart-section-label">🍩 Donut</p>
            <h3>Category Share</h3>
          </div>
          {isLoading ? (
            <p className="empty-state">Loading...</p>
          ) : isEmpty || categoryChartData.length === 0 ? (
            <p className="empty-state">No data yet.</p>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="72%"
                    paddingAngle={3}
                    isAnimationActive
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload as TooltipPayload[]}
                        label={(payload?.[0]?.payload as { category?: string })?.category}
                        fmt={fmt}
                      />
                    )}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="analytics-legend-label">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="card chart-card">
          <div className="section-header">
            <p className="chart-section-label">📊 Breakdown</p>
            <h3>Spending by Category</h3>
          </div>
          {isLoading ? (
            <p className="empty-state">Loading...</p>
          ) : isEmpty || categoryChartData.length === 0 ? (
            <p className="empty-state">No chart data yet.</p>
          ) : (
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => (
                      <ChartTooltip
                        active={active}
                        payload={payload as TooltipPayload[]}
                        label={label as string}
                        fmt={fmt}
                      />
                    )}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} isAnimationActive>
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* ── Daily spending ── */}
      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">📈 Trend</p>
          <h3>Daily Spending</h3>
        </div>
        {isLoading ? (
          <p className="empty-state">Loading analytics...</p>
        ) : isEmpty || trendData.length === 0 ? (
          <p className="empty-state">No trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as TooltipPayload[]}
                      label={label as string}
                      fmt={fmt}
                    />
                  )}
                />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* ── Cumulative ── */}
      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">📊 Cumulative</p>
          <h3>Total Spending Over Time</h3>
        </div>
        {isLoading ? (
          <p className="empty-state">Loading analytics...</p>
        ) : isEmpty || cumulativeTrendData.length === 0 ? (
          <p className="empty-state">No cumulative trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cumulativeTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      payload={payload as TooltipPayload[]}
                      label={label as string}
                      fmt={fmt}
                    />
                  )}
                />
                <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2.5} dot={false} isAnimationActive />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}
