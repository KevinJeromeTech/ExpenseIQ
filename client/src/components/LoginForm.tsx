import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/logoiq.svg";
import { authApi } from "../services/api";

type AuthFormProps = {
  onLoginSuccess: (token: string, user: { id: number; email: string }) => void;
  showLogo?: boolean;
};

const RETRY_SECONDS = 30;

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError && (err.message === "Failed to fetch" || err.message.includes("NetworkError") || err.message.includes("fetch"));
}

export default function LoginForm({ onLoginSuccess, showLogo = true }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [waking, setWaking] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const retryPayload = useRef<{ email: string; password: string; mode: "login" | "signup" } | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const attemptAuth = async (emailVal: string, passwordVal: string, modeVal: "login" | "signup") => {
    if (modeVal === "signup") {
      await authApi.register(emailVal, passwordVal);
      toast.success("Account created successfully!");
    }
    const { token, user } = await authApi.login(emailVal, passwordVal);
    return { token, user };
  };

  const startRetryCountdown = (emailVal: string, passwordVal: string, modeVal: "login" | "signup") => {
    retryPayload.current = { email: emailVal, password: passwordVal, mode: modeVal };
    setWaking(true);
    setCountdown(RETRY_SECONDS);
    setError("");

    let remaining = RETRY_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        void autoRetry();
      }
    }, 1000);
  };

  const autoRetry = async () => {
    const payload = retryPayload.current;
    if (!payload) return;
    setWaking(false);
    setIsLoading(true);
    try {
      const { token, user } = await attemptAuth(payload.email, payload.password, payload.mode);
      setEmail("");
      setPassword("");
      toast.success(payload.mode === "login" ? "Welcome back!" : "Signed in successfully!");
      onLoginSuccess(token, user);
    } catch (err) {
      if (isNetworkError(err)) {
        // Still down — give the user a manual retry option
        setError("Server is still starting up. Click Sign in to try again.");
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
      retryPayload.current = null;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // If a countdown is running, cancel it and retry immediately
    if (waking) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setWaking(false);
      setCountdown(0);
      void autoRetry();
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      const { token, user } = await attemptAuth(email.trim(), password.trim(), mode);
      setEmail("");
      setPassword("");
      toast.success(mode === "login" ? "Welcome back!" : "Signed in successfully!");
      onLoginSuccess(token, user);
    } catch (err) {
      if (isNetworkError(err)) {
        startRetryCountdown(email.trim(), password.trim(), mode);
      } else {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setError("");
    setEmail("");
    setPassword("");
    setWaking(false);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
    retryPayload.current = null;
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div className={showLogo ? "auth-shell" : "auth-shell auth-shell-embedded"}>
      <div className="auth-card">
        {showLogo && <img src={logo} alt="ExpenseIQ logo" className="login-logo" />}

        <p className="auth-eyebrow">Personal Finance Dashboard</p>

        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to access your expense dashboard."
            : "Start tracking your budget and spending in minutes."}
        </p>

        <form onSubmit={handleAuth} className="auth-form" autoComplete="off">
          <label htmlFor="expenseiq-email">
            Email
            <input
              id="expenseiq-email"
              name="expenseiq-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="off"
              disabled={waking}
            />
          </label>

          <label htmlFor="expenseiq-password">
            Password
            <input
              id="expenseiq-password"
              name="expenseiq-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="new-password"
              disabled={waking}
            />
          </label>

          {waking && (
            <div className="auth-waking">
              <div className="auth-waking-spinner" aria-hidden="true" />
              <div className="auth-waking-text">
                <span className="auth-waking-title">Server is starting up…</span>
                <span className="auth-waking-sub">
                  Retrying automatically in {countdown}s — or click below to retry now.
                </span>
              </div>
            </div>
          )}

          {error && !waking && <p className="auth-error">{error}</p>}

          {mode === "login" && !waking && (
            <Link to="/forgot-password" className="auth-forgot-link">
              Forgot password?
            </Link>
          )}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading
              ? "Connecting…"
              : waking
              ? `Retry now (${countdown}s)`
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        {!waking && (
          <button
            type="button"
            className="auth-switch-button"
            onClick={handleModeSwitch}
          >
            {mode === "login"
              ? "Need an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        )}
      </div>
    </div>
  );
}
