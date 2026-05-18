import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { usersApi } from "../services/api";
import type { AuthUser } from "../hooks/useAuth";

type SettingsPageProps = {
  token: string;
  user: AuthUser;
  onDeleteSuccess: () => void;
};

export default function SettingsPage({ token, user, onDeleteSuccess }: SettingsPageProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["user-profile", token],
    queryFn: () => usersApi.getMe(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      usersApi.changePassword(token, { currentPassword, newPassword, confirmPassword }),
    onSuccess: () => {
      toast.success("Password updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update password"),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(token, { password: deletePassword }),
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
        <p className="settings-subtitle">Manage your account and security preferences.</p>
      </div>

      {/* Profile */}
      <div className="card settings-card">
        <h3>Profile</h3>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user.email}</span>
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

      {/* Security */}
      <div className="card settings-card">
        <h3>Security</h3>
        <p className="settings-section-desc">
          Use a strong, unique password. Minimum 8 characters.
        </p>
        <form className="settings-form" onSubmit={handleChangePassword}>
          <label>
            Current Password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </label>
          <label>
            New Password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </label>
          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </label>
          <button
            type="submit"
            className="primary-button"
            disabled={changePasswordMutation.isPending}
            style={{ marginTop: "4px" }}
          >
            {changePasswordMutation.isPending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card settings-card danger-zone-card">
        <h3 className="danger-zone-title">Danger Zone</h3>
        <p className="settings-section-desc">
          Deleting your account permanently removes all transactions and budgets.
          This cannot be undone.
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
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                }}
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
