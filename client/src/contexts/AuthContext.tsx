import { createContext, useContext } from "react";

type AuthUser = { id: number; email: string };

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  onUnauthorized: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthContext.Provider");
  return ctx;
}
