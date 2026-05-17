import { useState } from "react";
import toast from "react-hot-toast";
import logo from "../assets/logoiq.png";
import { authApi } from "../services/api";

type AuthFormProps = {
  onLoginSuccess: (token: string, user: { id: number; email: string }) => void;
};

export default function LoginForm({ onLoginSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error("Email and password are required");
      }

      if (mode === "signup") {
        await authApi.register(email.trim(), password.trim());
        toast.success("Account created successfully!");
      }

      const { token, user } = await authApi.login(email.trim(), password.trim());

      setEmail("");
      setPassword("");

      toast.success(mode === "login" ? "Welcome back!" : "Signed in successfully!");
      onLoginSuccess(token, user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setError("");
    setEmail("");
    setPassword("");
    setMode((prev) => (prev === "login" ? "signup" : "login"));
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <img src={logo} alt="ExpenseIQ logo" className="login-logo" />

        <h1 className="auth-title">
          {mode === "login" ? "Welcome to ExpenseIQ" : "Create your account"}
        </h1>

        <p className="auth-subtitle">
          {mode === "login"
            ? "Sign in to access your personal expense dashboard."
            : "Create an account to start tracking your budget and spending."}
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
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="primary-button" disabled={isLoading}>
            {isLoading
              ? mode === "login"
                ? "Signing in..."
                : "Creating account..."
              : mode === "login"
              ? "Login"
              : "Sign Up"}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch-button"
          onClick={handleModeSwitch}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}