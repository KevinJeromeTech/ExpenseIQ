import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import logo from "../assets/logoiq.svg";
import { useThemeContext } from "../contexts/ThemeContext";
import { usePreferencesContext } from "../contexts/PreferencesContext";
import { useAuthContext } from "../contexts/AuthContext";
import { usersApi } from "../services/api";

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

function IconSignOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
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

function Avatar({ avatarUrl, initial, size = 36 }: { avatarUrl: string; initial: string; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Profile"
        className="nav-avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="nav-avatar-initial" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initial}
    </span>
  );
}

function UserMenu({
  userEmail,
  displayName,
  avatarUrl,
  initial,
  theme,
  toggle,
  onClose,
  onLogout,
}: {
  userEmail: string;
  displayName: string | null | undefined;
  avatarUrl: string;
  initial: string;
  theme: string;
  toggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="nav-user-menu" role="menu">
      {/* Header */}
      <div className="nav-user-menu-header">
        <Avatar avatarUrl={avatarUrl} initial={initial} size={42} />
        <div className="nav-user-menu-info">
          <p className="nav-user-menu-name">{displayName || userEmail.split("@")[0]}</p>
          <p className="nav-user-menu-email">{userEmail}</p>
        </div>
      </div>

      <div className="nav-user-menu-divider" />

      {/* Navigation shortcuts */}
      <NavLink to="/dashboard" className="nav-user-menu-item" role="menuitem" onClick={onClose}>
        <IconDashboard />
        Dashboard
      </NavLink>
      <NavLink to="/transactions" className="nav-user-menu-item" role="menuitem" onClick={onClose}>
        <IconTransactions />
        Transactions
      </NavLink>
      <NavLink to="/analytics" className="nav-user-menu-item" role="menuitem" onClick={onClose}>
        <IconAnalytics />
        Analytics
      </NavLink>

      <div className="nav-user-menu-divider" />

      {/* Settings */}
      <Link to="/settings" className="nav-user-menu-item" role="menuitem" onClick={onClose}>
        <IconSettings />
        Settings
      </Link>

      {/* Theme toggle */}
      <button
        type="button"
        className="nav-user-menu-item"
        role="menuitem"
        onClick={() => { toggle(); onClose(); }}
      >
        <span style={{ fontSize: "15px", lineHeight: 1 }}>{theme === "dark" ? "☀" : "☾"}</span>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      <div className="nav-user-menu-divider" />

      {/* Sign out */}
      <button
        type="button"
        className="nav-user-menu-item signout"
        role="menuitem"
        onClick={() => { onClose(); onLogout(); }}
      >
        <IconSignOut />
        Sign out
      </button>
    </div>
  );
}

export default function AppLayout({ userEmail, onLogout }: AppLayoutProps) {
  const { theme, toggle } = useThemeContext();
  const { prefs } = usePreferencesContext();
  const { token } = useAuthContext();
  const initial = userEmail?.[0]?.toUpperCase() ?? "?";

  const { data: profile } = useQuery({
    queryKey: ["user-profile", token],
    queryFn: () => usersApi.getMe(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDesktopMenu && !showMobileMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setShowDesktopMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDesktopMenu, showMobileMenu]);

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
          {/* Desktop avatar + dropdown */}
          <div className="nav-avatar-wrap" ref={desktopMenuRef}>
            <button
              type="button"
              className="nav-avatar-btn"
              aria-label="Account menu"
              aria-expanded={showDesktopMenu}
              onClick={() => setShowDesktopMenu((v) => !v)}
            >
              <Avatar avatarUrl={prefs.avatarUrl} initial={initial} size={36} />
            </button>

            {showDesktopMenu && (
              <UserMenu
                userEmail={userEmail}
                displayName={profile?.name}
                avatarUrl={prefs.avatarUrl}
                initial={initial}
                theme={theme}
                toggle={toggle}
                onClose={() => setShowDesktopMenu(false)}
                onLogout={onLogout}
              />
            )}
          </div>
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

          <div className="mobile-avatar-wrap" ref={mobileMenuRef}>
            <button
              type="button"
              className="mobile-avatar"
              aria-label="Account menu"
              aria-expanded={showMobileMenu}
              onClick={() => setShowMobileMenu((v) => !v)}
            >
              <Avatar avatarUrl={prefs.avatarUrl} initial={initial} size={34} />
            </button>

            {showMobileMenu && (
              <UserMenu
                userEmail={userEmail}
                displayName={profile?.name}
                avatarUrl={prefs.avatarUrl}
                initial={initial}
                theme={theme}
                toggle={toggle}
                onClose={() => setShowMobileMenu(false)}
                onLogout={onLogout}
              />
            )}
          </div>
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
