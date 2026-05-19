import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../assets/logoiq.svg";
import { useTheme } from "../hooks/useTheme";

type AppLayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

function IconDashboard() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  );
}

function IconTransactions() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10V4M3 4L1 6M3 4L5 6" />
      <path d="M11 4v6M11 10L9 8M11 10l2-2" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12V8M6 12V4M10 12V6" />
      <line x1="1" y1="12" x2="13" y2="12" />
    </svg>
  );
}

export default function AppLayout({ userEmail, onLogout }: AppLayoutProps) {
  const { theme, toggle } = useTheme();
  const initial = userEmail?.[0]?.toUpperCase() ?? "?";

  return (
    <main className="dashboard">
      <a href="#main-content" className="skip-nav">Skip to content</a>
      <header className="app-nav">
        {/* LEFT SIDE */}
        <div className="app-nav-left">
          <Link to="/dashboard" className="app-nav-brand">
            <img src={logo} alt="ExpenseIQ Logo" className="nav-logo" />
            <span className="nav-title">ExpenseIQ</span>
          </Link>

          <nav className="app-nav-links" aria-label="Main navigation">
            <NavLink to="/dashboard">
              <IconDashboard />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/transactions">
              <IconTransactions />
              <span>Transactions</span>
            </NavLink>
            <NavLink to="/analytics">
              <IconAnalytics />
              <span>Analytics</span>
            </NavLink>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="app-nav-right">
          <NavLink to="/settings" className="app-nav-user" title="Account settings">
            <span className="user-avatar">{initial}</span>
            <span className="user-email">{userEmail}</span>
          </NavLink>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <button type="button" className="nav-logout" onClick={onLogout} aria-label="Sign out">
            Sign out
          </button>
        </div>
      </header>

      <div id="main-content">
        <Outlet />
      </div>
    </main>
  );
}
