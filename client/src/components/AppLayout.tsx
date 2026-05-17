import { NavLink, Outlet, Link } from "react-router-dom";
import logo from "../assets/logoiq.png";

type AppLayoutProps = {
  userEmail: string;
  onLogout: () => void;
};

export default function AppLayout({
  userEmail,
  onLogout,
}: AppLayoutProps) {
  return (
    <main className="dashboard">
      <header className="app-nav">
        {/* LEFT SIDE */}
        <div className="app-nav-left">
          {/* BRAND */}
          <Link to="/dashboard" className="app-nav-brand">
            <img src={logo} alt="ExpenseIQ Logo" className="nav-logo" />
            <span className="nav-title">ExpenseIQ</span>
          </Link>

          {/* NAV LINKS */}
          <nav className="app-nav-links">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="app-nav-right">
          <span className="app-nav-user">{userEmail}</span>
          <button type="button" className="cancel-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <Outlet />
    </main>
  );
}