export function StatCardSkeleton() {
  return (
    <div className="stat-card sk-card">
      <div className="sk-row">
        <div className="sk-block" style={{ width: 90, height: 11 }} />
        <div className="sk-circle" style={{ width: 18, height: 18 }} />
      </div>
      <div className="sk-block" style={{ width: 110, height: 28, marginTop: 10 }} />
      <div className="sk-block" style={{ width: 60, height: 10, marginTop: 8 }} />
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="analytics-kpi-card sk-card">
      <div className="sk-row">
        <div className="sk-block" style={{ width: 80, height: 10 }} />
        <div className="sk-circle" style={{ width: 16, height: 16 }} />
      </div>
      <div className="sk-block" style={{ width: 100, height: 26, marginTop: 10 }} />
      <div className="sk-block" style={{ width: 70, height: 9, marginTop: 7 }} />
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <div className="sk-chart sk-card" style={{ height }}>
      <div className="sk-chart-bars">
        {[55, 75, 45, 90, 60, 80, 50, 70, 40, 85].map((h, i) => (
          <div key={i} className="sk-bar sk-card" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function InsightRowSkeleton() {
  return (
    <div className="sk-insight-row">
      <div className="sk-circle sk-card" style={{ width: 32, height: 32, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="sk-block sk-card" style={{ width: "80%", height: 11, marginBottom: 6 }} />
        <div className="sk-block sk-card" style={{ width: "55%", height: 10 }} />
      </div>
    </div>
  );
}

export function ReportRowSkeleton() {
  return (
    <div className="sk-report-row">
      <div className="sk-block sk-card" style={{ width: 90, height: 10 }} />
      <div className="sk-block sk-card" style={{ width: 120, height: 10 }} />
    </div>
  );
}
