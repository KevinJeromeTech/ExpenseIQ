import { useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { budgetsApi, ApiError, type CreateBudgetInput } from "../services/api";
import type { Budget } from "../types";

type Options = { token: string | null; onUnauthorized: () => void };

export function useBudgets({ token, onUnauthorized }: Options) {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // The server-confirmed monthly limit — used for calculations, not form input
  const savedMonthlyLimit = useMemo(
    () => budgets.find((b) => b.category === "Monthly")?.limit ?? null,
    [budgets]
  );

  const fetchBudgets = useCallback(async () => {
    if (!token) return;
    try {
      const data = await budgetsApi.getAll(token);
      setBudgets(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      toast.error("Failed to load budgets.");
      setBudgets([]);
    }
  }, [token, onUnauthorized]);

  const saveBudget = useCallback(
    (data: CreateBudgetInput) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return budgetsApi.save(token, data);
    },
    [token]
  );

  return { budgets, savedMonthlyLimit, fetchBudgets, saveBudget };
}
