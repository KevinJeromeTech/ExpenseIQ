import { Link } from "react-router-dom";
import logo from "../assets/logoiq.svg";

function IconChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-4 4 4 4-6" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: IconChart,
    title: "Real-time Analytics",
    desc: "Beautiful charts that reveal exactly where your money goes — by category, by month, by trend.",
  },
  {
    Icon: IconTag,
    title: "Smart Categorization",
    desc: "Organize every transaction with custom categories. Build a system that matches how you actually spend.",
  },
  {
    Icon: IconBell,
    title: "Budget Alerts",
    desc: "Set monthly limits and get notified before you overspend. Stay on track without the stress.",
  },
  {
    Icon: IconShield,
    title: "Private & Secure",
    desc: "Your financial data stays yours. No selling, no sharing — just a secure personal finance tool.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* ── Nav ── */}
      <header className="landing-nav">
        <div className="landing-nav-brand">
          <img src={logo} alt="ExpenseIQ Logo" className="landing-nav-logo" />
          <span className="landing-nav-title">ExpenseIQ</span>
        </div>
        <div className="landing-nav-actions">
          <Link to="/login" className="landing-nav-signin">Sign in</Link>
          <Link to="/login" className="landing-cta-btn landing-cta-btn-sm">Get Started</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" aria-hidden="true" />
        <div className="landing-hero-content">
          <div className="landing-badge">Personal Finance, Simplified</div>
          <h1 className="landing-headline">
            Your finances,<br />
            <span className="landing-headline-accent">finally under control.</span>
          </h1>
          <p className="landing-subhead">
            Track every expense, set smart budgets, and understand your spending
            patterns — all in one clean, private app.
          </p>
          <div className="landing-hero-actions">
            <Link to="/login" className="landing-cta-btn">
              Start for Free
            </Link>
            <Link to="/login" className="landing-ghost-btn">
              Sign in
            </Link>
          </div>
        </div>

        {/* Floating stat cards */}
        <div className="landing-hero-stats" aria-hidden="true">
          <div className="landing-stat-card">
            <span className="landing-stat-value">$2,840</span>
            <span className="landing-stat-label">Monthly budget</span>
            <div className="landing-stat-bar">
              <div className="landing-stat-bar-fill" style={{ width: "68%" }} />
            </div>
            <span className="landing-stat-pct">68% used</span>
          </div>
          <div className="landing-stat-card landing-stat-card-alt">
            <span className="landing-stat-label">Top category</span>
            <span className="landing-stat-value landing-stat-value-sm">Food & Dining</span>
            <span className="landing-stat-amount">$486 this month</span>
          </div>
          <div className="landing-stat-card">
            <span className="landing-stat-label">Saved vs last month</span>
            <span className="landing-stat-value landing-stat-value-green">+$340</span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="landing-section-label">Why ExpenseIQ</div>
        <h2 className="landing-section-title">Everything you need to manage money well</h2>
        <div className="landing-features-grid">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <Icon />
              </div>
              <h3 className="landing-feature-title">{title}</h3>
              <p className="landing-feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-banner-glow" aria-hidden="true" />
        <h2 className="landing-cta-banner-title">Ready to take control of your spending?</h2>
        <p className="landing-cta-banner-sub">Join ExpenseIQ and start making smarter financial decisions today.</p>
        <Link to="/login" className="landing-cta-btn landing-cta-btn-lg">
          Create Your Free Account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <img src={logo} alt="ExpenseIQ" className="landing-footer-logo" />
          <span className="landing-footer-name">ExpenseIQ</span>
        </div>
        <p className="landing-footer-copy">© {new Date().getFullYear()} ExpenseIQ. All rights reserved.</p>
      </footer>
    </div>
  );
}
