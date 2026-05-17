import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export type AuthUser = { id: number; email: string };

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      localStorage.removeItem("user");
      return null;
    }
  });

  const onLoginSuccess = useCallback((newToken: string, loggedInUser: AuthUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    toast.error("Session expired. Please log in again.");
  }, [clearSession]);

  return {
    token,
    user,
    isAuthenticated: token !== null && user !== null,
    onLoginSuccess,
    handleUnauthorized,
    logout: clearSession,
  };
}
