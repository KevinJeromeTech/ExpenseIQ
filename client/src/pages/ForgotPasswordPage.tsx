import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logoiq.svg";
import { usersApi } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }

    try {
      setIsLoading(true);
      await usersApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src={logo} alt="ExpenseIQ" className="login-logo" />
        <p className="auth-eyebrow">Password Recovery</p>

        {sent ? (
          <>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              If <strong>{email}</strong> is registered, a reset link is on its way.
              Check your spam folder if you don't see it within a minute.
            </p>
            <Link to="/" className="primary-button" style={{ textAlign: "center", textDecoration: "none", display: "block", marginTop: "8px" }}>
              Back to Login
            </Link>
          </>
        ) : (
          <>
            <h1 className="auth-title">Forgot password?</h1>
            <p className="auth-subtitle">
              Enter the email you signed up with and we'll send you a reset link.
            </p>
            <form className="auth-form" onSubmit={handleSubmit}>
              <label htmlFor="reset-email">
                Email
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoFocus
                />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="primary-button" disabled={isLoading}>
                {isLoading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
            <Link to="/" className="auth-switch-button" style={{ textAlign: "center", textDecoration: "none", display: "block" }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
