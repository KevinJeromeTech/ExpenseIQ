import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../assets/logoiq.svg";
import { useTheme } from "../hooks/useTheme";

type AppLayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

export default function AppLayout({ userEmail, onLogout }: AppLayoutProps) {
  const { theme, toggle } = useTheme();
  return (
    <main className="dashboard">
      <header className="app-nav">
        {/* LEFT SIDE */}
        <div className="app-nav-left">
          <Link to="/dashboard" className="app-nav-brand">
            <img src={logo} alt="ExpenseIQ Logo" className="nav-logo" />
            <span className="nav-title">ExpenseIQ</span>
          </Link>

          <nav className="app-nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="app-nav-right">
          <NavLink to="/settings" className="app-nav-user" title="Account settings">
            {userEmail}
          </NavLink>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button type="button" className="cancel-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <Outlet />
    </main>
  );
}
