import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { budgetsApi, ApiError, type CreateBudgetInput } from "../services/api";

type Options = { token: string | null; onUnauthorized: () => void };

export function useBudgets({ token, onUnauthorized }: Options) {
  const queryClient = useQueryClient();

  const { data: budgets = [], error } = useQuery({
    queryKey: ["budgets", token],
    queryFn: () => budgetsApi.getAll(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) onUnauthorized();
  }, [error, onUnauthorized]);

  const savedMonthlyLimit = useMemo(
    () => budgets.find((b) => b.category === "Monthly")?.limit ?? null,
    [budgets]
  );

  const saveMutation = useMutation({
    mutationFn: (data: CreateBudgetInput) => budgetsApi.save(token!, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budgets"] });
      void queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 401) onUnauthorized();
      else toast.error(err.message || "Budget save failed.");
    },
  });

  return {
    budgets,
    savedMonthlyLimit,
    saveBudget: saveMutation.mutateAsync,
    isSavingBudget: saveMutation.isPending,
  };
}
