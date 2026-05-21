import { Link } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import logo from "../assets/logoiq.svg";

type LoginPageProps = {
  onLoginSuccess: (token: string, user: { id: number; email: string }) => void;
};

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className="login-page-wrap">
      <div className="login-page-back">
        <Link to="/" className="login-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to home
        </Link>
      </div>
      <div className="login-page-brand">
        <img src={logo} alt="ExpenseIQ" className="login-page-logo" />
        <span className="login-page-name">ExpenseIQ</span>
      </div>
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
}
