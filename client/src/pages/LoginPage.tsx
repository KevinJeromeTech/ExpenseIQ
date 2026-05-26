import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import logo from "../assets/logoiq.svg";

type LoginPageProps = {
  onLoginSuccess: (token: string, user: { id: number; email: string }) => void;
};

const FEATURES = [
  "Track every expense, effortlessly",
  "Set budgets and get real-time alerts",
  "Beautiful analytics that reveal patterns",
  "Private and secure — your data stays yours",
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className="login-split">
      {/* ── Left branding panel ── */}
      <div className="login-split-left">
        <div className="login-split-left-inner">
          <Link to="/" className="login-back-link login-back-link-light">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to home
          </Link>

          <div className="login-split-brand">
            <img src={logo} alt="ExpenseIQ" className="login-split-logo" />
            <span className="login-split-name">ExpenseIQ</span>
          </div>

          <h2 className="login-split-headline">
            The smarter way<br />to manage money.
          </h2>
          <p className="login-split-sub">
            Join people tracking expenses, hitting savings goals, and finally understanding where their money goes.
          </p>

          <ul className="login-features-list">
            {FEATURES.map((f) => (
              <li key={f} className="login-feature-item">
                <span className="login-feature-check"><CheckIcon /></span>
                {f}
              </li>
            ))}
          </ul>

          <div className="login-split-quote">
            <p className="login-quote-text">"I finally stopped wondering where my paycheck went."</p>
            <p className="login-quote-author">— ExpenseIQ user</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-split-right">
        <Link to="/" className="login-back-link login-back-link-mobile">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </Link>
        <LoginForm onLoginSuccess={onLoginSuccess} showLogo={false} />
      </div>
    </div>
  );
}
