import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import logo from "../assets/logoiq.svg";
import { usersApi } from "../services/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetToken = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!resetToken) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <img src={logo} alt="ExpenseIQ" className="login-logo" />
          <h1 className="auth-title">Invalid link</h1>
          <p className="auth-subtitle">This reset link is missing a token. Please request a new one.</p>
          <Link to="/forgot-password" className="primary-button" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
            Request Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !confirm) { setError("Both fields are required."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    try {
      setIsLoading(true);
      await usersApi.resetPassword(resetToken, password);
      setDone(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src={logo} alt="ExpenseIQ" className="login-logo" />
        <p className="auth-eyebrow">Password Recovery</p>

        {done ? (
          <>
            <h1 className="auth-title">Password reset!</h1>
            <p className="auth-subtitle">
              Your password has been updated. Redirecting you to login…
            </p>
          </>
        ) : (
          <>
            <h1 className="auth-title">Choose a new password</h1>
            <p className="auth-subtitle">Must be at least 8 characters.</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="new-password">
                New Password
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoFocus
                />
              </label>
              <label htmlFor="confirm-password">
                Confirm Password
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? "Resetting…" : "Reset Password"}
              </button>
            </form>
            <Link to="/forgot-password" className="auth-switch-button" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
              Request a new link instead
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
