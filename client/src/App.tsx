import { useCallback, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { AuthContext } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { token, user, onLoginSuccess, handleUnauthorized, logout } = useAuth();

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear();
  }, [logout, queryClient]);

  // Public routes (password reset) must be accessible before auth
  if (!token || !user) {
    return (
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginForm onLoginSuccess={onLoginSuccess} />} />
      </Routes>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, onUnauthorized: handleUnauthorized }}>
      <Routes>
        <Route
          element={
            <ProtectedRoute token={token}>
              <AppLayout userEmail={user.email} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage onDeleteSuccess={handleLogout} />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}

export default App;
