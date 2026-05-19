import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "../services/api";
import { useAuthContext } from "../contexts/AuthContext";
import { usePreferencesContext } from "../contexts/PreferencesContext";
import { CURRENCY_OPTIONS } from "../hooks/usePreferences";
import {
  User, Shield, Sliders, Bell, Trash2, KeyRound, DollarSign,
  LayoutDashboard, List, BarChart2, BellRing, BellOff,
} from "lucide-react";

type SettingsPageProps = {
  onDeleteSuccess: () => void;
};

const PAGE_OPTIONS = [
  { value: "/dashboard",    label: "Dashboard",     Icon: LayoutDashboard },
  { value: "/transactions", label: "Transactions",  Icon: List            },
  { value: "/analytics",    label: "Analytics",     Icon: BarChart2       },
] as const;

export default function SettingsPage({ onDeleteSuccess }: SettingsPageProps) {
  const { token, user } = useAuthContext();
  const { prefs, setPrefs } = usePreferencesContext();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["user-profile", token],
    queryFn: () => usersApi.getMe(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      usersApi.changePassword(token!, { currentPassword, newPassword, confirmPassword }),
    onSuccess: () => {
      toast.success("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update password"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(token!, { password: deletePassword }),
    onSuccess: () => {
      toast.success("Account deleted.");
      onDeleteSuccess();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete account"),
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    changePasswordMutation.mutate();
  };

  const handleDeleteAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Enter your password to confirm.");
      return;
    }
    deleteAccountMutation.mutate();
  };

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <p className="chart-section-label">⚙️ Account</p>
        <h2 className="settings-title">Settings</h2>
        <p className="settings-subtitle">Manage your account, preferences, and security.</p>
      </div>

      {/* ── Profile ─────────────────────────── */}
      <div className="card settings-card">
        <h3 className="settings-section-heading">
          <User size={16} />
          Profile
        </h3>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user?.email}</span>
        </div>
        {profile?.createdAt && (
          <div className="settings-row">
            <span className="settings-label">Member since</span>
            <span className="settings-value">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* ── Financial Preferences ────────────── */}
      <div className="card settings-card">
        <h3 className="settings-section-heading">
          <Sliders size={16} />
          Financial Preferences
        </h3>
        <p className="settings-section-desc">
          Customize how your financial data is displayed.
        </p>

        {/* Currency */}
        <div className="pref-row">
          <div className="pref-label-group">
            <DollarSign size={14} className="pref-icon" />
            <div>
              <p className="pref-title">Currency</p>
              <p className="pref-desc">Symbol shown on all amounts</p>
            </div>
          </div>
          <div className="currency-options">
            {CURRENCY_OPTIONS.map(({ code, symbol, label }) => (
              <button
                key={code}
                type="button"
                title={label}
                className={`currency-chip${prefs.currency === code ? " active" : ""}`}
                onClick={() => { setPrefs({ currency: code }); toast.success(`Currency set to ${label}`); }}
              >
                <span className="currency-symbol">{symbol}</span>
                <span className="currency-code">{code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Default page */}
        <div className="pref-row">
          <div className="pref-label-group">
            <LayoutDashboard size={14} className="pref-icon" />
            <div>
              <p className="pref-title">Default Page</p>
              <p className="pref-desc">Where you land after signing in</p>
            </div>
          </div>
          <div className="page-options">
            {PAGE_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={`page-chip${prefs.defaultPage === value ? " active" : ""}`}
                onClick={() => { setPrefs({ defaultPage: value }); toast.success(`Default page set to ${label}`); }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget alert threshold */}
        <div className="pref-row pref-row-stack">
          <div className="pref-label-group">
            <Bell size={14} className="pref-icon" />
            <div>
              <p className="pref-title">Budget Alert Threshold</p>
              <p className="pref-desc">Warn me when spending reaches this % of my budget</p>
            </div>
          </div>
          <div className="threshold-control">
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={prefs.budgetAlertPct}
              className="threshold-slider"
              onChange={(e) => setPrefs({ budgetAlertPct: Number(e.target.value) })}
            />
            <span className="threshold-value">{prefs.budgetAlertPct}%</span>
          </div>
        </div>
      </div>

      {/* ── Notifications ───────────────────── */}
      <div className="card settings-card">
        <h3 className="settings-section-heading">
          <Bell size={16} />
          Notifications
        </h3>
        <p className="settings-section-desc">
          Control which financial alerts you receive.
        </p>

        <div className="pref-row">
          <div className="pref-label-group">
            {prefs.weeklyDigest ? <BellRing size={14} className="pref-icon" /> : <BellOff size={14} className="pref-icon muted" />}
            <div>
              <p className="pref-title">Weekly Spending Digest</p>
              <p className="pref-desc">Summary of your week's transactions every Monday</p>
            </div>
          </div>
          <button
            type="button"
            className={`toggle-switch${prefs.weeklyDigest ? " on" : ""}`}
            onClick={() => {
              setPrefs({ weeklyDigest: !prefs.weeklyDigest });
              toast.success(prefs.weeklyDigest ? "Digest disabled" : "Digest enabled");
            }}
            aria-pressed={prefs.weeklyDigest}
            aria-label="Toggle weekly digest"
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* ── Security ────────────────────────── */}
      <div className="card settings-card">
        <h3 className="settings-section-heading">
          <Shield size={16} />
          Security
        </h3>
        <p className="settings-section-desc">
          Use a strong, unique password. Minimum 8 characters.
        </p>
        <form className="settings-form" onSubmit={handleChangePassword}>
          <label>
            <span className="form-field-label">
              <KeyRound size={13} />
              Current Password
            </span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
          </label>
          <label>
            <span className="form-field-label">
              <KeyRound size={13} />
              New Password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
            />
          </label>
          <label>
            <span className="form-field-label">
              <KeyRound size={13} />
              Confirm New Password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </label>
          <button
            type="submit"
            className="primary-button"
            disabled={changePasswordMutation.isPending}
            style={{ marginTop: "4px" }}
          >
            <Shield size={14} />
            {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* ── Danger Zone ─────────────────────── */}
      <div className="card settings-card danger-zone-card">
        <h3 className="settings-section-heading danger-zone-title">
          <Trash2 size={16} />
          Danger Zone
        </h3>
        <p className="settings-section-desc">
          Deleting your account permanently removes all transactions and budgets. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            className="danger-button"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        ) : (
          <form className="settings-form" onSubmit={handleDeleteAccount}>
            <label>
              Confirm your password to continue
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
              />
            </label>
            <div className="settings-danger-actions">
              <button
                type="submit"
                className="danger-button"
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? "Deleting…" : "Permanently Delete Account"}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                style={{ marginTop: 0 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
