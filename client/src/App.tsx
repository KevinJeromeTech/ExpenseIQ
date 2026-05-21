import { useCallback, useEffect, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { AuthContext } from "./contexts/AuthContext";
import { usePreferencesContext } from "./contexts/PreferencesContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TransactionsPage = lazy(() => import("./pages/TransactionsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SharePage = lazy(() => import("./pages/SharePage"));

function App() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token, user, onLoginSuccess, handleUnauthorized, logout } = useAuth();
  const { prefs } = usePreferencesContext();

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear();
  }, [logout, queryClient]);

  if (!token || !user) {
    return (
      <Suspense fallback={<div className="page-loading">Loading…</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={onLoginSuccess} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/share/:token" element={<SharePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, onUnauthorized: handleUnauthorized }}>
      <Suspense fallback={<div className="page-loading">Loading…</div>}>
        <Routes>
          <Route path="/share/:token" element={<SharePage />} />
          <Route
            element={
              <ProtectedRoute token={token}>
                <AppLayout userEmail={user.email} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to={prefs.defaultPage} replace />} />
            <Route path="/login" element={<Navigate to={prefs.defaultPage} replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage onDeleteSuccess={handleLogout} />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthContext.Provider>
  );
}

export default App;
