import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../assets/logoiq.svg";
import { useTheme } from "../hooks/useTheme";

type AppLayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" />
      <rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  );
}

function IconTransactions() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10V4M3 4L1 6M3 4L5 6" />
      <path d="M11 4v6M11 10L9 8M11 10l2-2" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg width="20" height="20" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12V8M6 12V4M10 12V6" />
      <line x1="1" y1="12" x2="13" y2="12" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function AppLayout({ userEmail, onLogout }: AppLayoutProps) {
  const { theme, toggle } = useTheme();
  const initial = userEmail?.[0]?.toUpperCase() ?? "?";

  return (
    <main className="dashboard">
      <a href="#main-content" className="skip-nav">Skip to content</a>

      {/* ── Desktop / tablet top navbar ── */}
      <header className="app-nav">
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

      {/* ── Mobile top bar ── */}
      <header className="mobile-top-bar">
        <Link to="/dashboard" className="app-nav-brand">
          <img src={logo} alt="ExpenseIQ Logo" className="nav-logo" />
          <span className="nav-title">ExpenseIQ</span>
        </Link>

        <div className="mobile-top-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          <NavLink to="/settings" className="mobile-avatar" title="Account settings">
            <span className="user-avatar">{initial}</span>
          </NavLink>
        </div>
      </header>

      {/* ── Page content ── */}
      <div id="main-content" className="main-content">
        <Outlet />
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "mob-tab active" : "mob-tab"}>
          <IconDashboard />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => isActive ? "mob-tab active" : "mob-tab"}>
          <IconTransactions />
          <span>Transactions</span>
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => isActive ? "mob-tab active" : "mob-tab"}>
          <IconAnalytics />
          <span>Analytics</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? "mob-tab active" : "mob-tab"}>
          <IconSettings />
          <span>Account</span>
        </NavLink>
      </nav>
    </main>
  );
}
