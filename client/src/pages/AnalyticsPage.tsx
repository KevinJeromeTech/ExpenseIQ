import type { Dispatch, SetStateAction } from "react";
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
  AreaChart,
  Area,
  Legend,
} from "recharts";

type DateRange = "7d" | "30d" | "all";

type AnalyticsPageProps = {
  categoryChartData: { category: string; total: number }[];
  trendData: { date: string; amount: number }[];
  cumulativeTrendData: { date: string; total: number }[];
  categoryPercentages: { category: string; percent: number }[];
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
  analyticsInsights: string[];
  isLoading: boolean;
  merchantFrequency: { merchant: string; count: number; total: number }[];
  heatmapData: { date: string; amount: number }[];
  categoryTrendData: { data: Record<string, string | number>[]; categories: string[] };
  unusualSpendAlerts: { category: string; recentTotal: number; baseline: number; ratio: number }[];
};

const CATEGORY_COLORS: Record<string, string> = {
  Shopping: "#3b82f6",
  Food: "#22c55e",
  Transport: "#f59e0b",
  Bills: "#ef4444",
  Entertainment: "#a855f7",
};

function heatIntensity(amount: number, max: number): string {
  if (amount === 0 || max === 0) return "var(--heatmap-empty)";
  const pct = amount / max;
  if (pct < 0.25) return "var(--heatmap-low)";
  if (pct < 0.5) return "var(--heatmap-mid)";
  if (pct < 0.75) return "var(--heatmap-high)";
  return "var(--heatmap-peak)";
}

export default function AnalyticsPage({
  categoryChartData,
  trendData,
  cumulativeTrendData,
  categoryPercentages,
  dateRange,
  setDateRange,
  analyticsInsights,
  isLoading,
  merchantFrequency,
  heatmapData,
  categoryTrendData,
  unusualSpendAlerts,
}: AnalyticsPageProps) {
  const heatMax = Math.max(...heatmapData.map((d) => d.amount), 1);

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

      {unusualSpendAlerts.length > 0 && (
        <section className="card">
          <div className="section-header">
            <p className="chart-section-label">⚠️ Alert</p>
            <h3>Unusual Spending Detected</h3>
          </div>
          <div className="insight-list">
            {unusualSpendAlerts.map((alert) => (
              <div key={alert.category} className="insight-item danger">
                <span className="insight-icon">🔺</span>
                <p>
                  <strong>{alert.category}</strong> spending is{" "}
                  <strong>{alert.ratio}×</strong> your usual pace — ${alert.recentTotal.toFixed(2)} this
                  week vs. ${alert.baseline.toFixed(2)} typical.
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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

      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">🗓️ Heatmap</p>
          <h3>Daily Spending — Last 12 Weeks</h3>
        </div>
        <div className="heatmap-grid">
          {heatmapData.map((day) => (
            <div
              key={day.date}
              className="heatmap-cell"
              style={{ background: heatIntensity(day.amount, heatMax) }}
              title={`${day.date}: $${day.amount.toFixed(2)}`}
            />
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell" style={{ background: "var(--heatmap-empty)" }} />
          <div className="heatmap-cell" style={{ background: "var(--heatmap-low)" }} />
          <div className="heatmap-cell" style={{ background: "var(--heatmap-mid)" }} />
          <div className="heatmap-cell" style={{ background: "var(--heatmap-high)" }} />
          <div className="heatmap-cell" style={{ background: "var(--heatmap-peak)" }} />
          <span>More</span>
        </div>
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <p className="chart-section-label">🏪 Frequency</p>
          <h3>Top Merchants</h3>
        </div>
        {isLoading ? (
          <p className="empty-state">Loading...</p>
        ) : merchantFrequency.length === 0 ? (
          <p className="empty-state">No merchant data for this range.</p>
        ) : (
          <div className="merchant-freq-list">
            {merchantFrequency.map((m) => (
              <div key={m.merchant} className="merchant-freq-row">
                <span className="merchant-freq-name">{m.merchant}</span>
                <span className="merchant-freq-count">{m.count}×</span>
                <div className="merchant-freq-bar-wrap">
                  <div
                    className="merchant-freq-bar"
                    style={{
                      width: `${(m.count / merchantFrequency[0].count) * 100}%`,
                    }}
                  />
                </div>
                <span className="merchant-freq-total">${m.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
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

      {categoryTrendData.categories.length > 0 && (
        <section className="card chart-card">
          <div className="section-header">
            <p className="chart-section-label">📈 By Category</p>
            <h3>Category Trends Over Time</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={categoryTrendData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-nav)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Legend />
                {categoryTrendData.categories.map((cat) => (
                  <Area
                    key={cat}
                    type="monotone"
                    dataKey={cat}
                    stackId="1"
                    stroke={CATEGORY_COLORS[cat] ?? "#64748b"}
                    fill={CATEGORY_COLORS[cat] ?? "#64748b"}
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-nav)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Line type="linear" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-nav)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Line type="linear" dataKey="total" stroke="#22c55e" strokeWidth={3} dot={false} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--surface-nav)", border: "1px solid var(--border)", borderRadius: "8px" }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}
