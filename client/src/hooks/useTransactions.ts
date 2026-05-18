import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  transactionsApi,
  ApiError,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from "../services/api";

type Options = { token: string | null; onUnauthorized: () => void };

export function useTransactions({ token, onUnauthorized }: Options) {
  const queryClient = useQueryClient();

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transactions", token],
    queryFn: () => transactionsApi.getAll(token!),
    enabled: !!token,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!error) return;
    if (error instanceof ApiError && error.status === 401) onUnauthorized();
    else toast.error("Failed to load transactions.");
  }, [error, onUnauthorized]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    void queryClient.invalidateQueries({ queryKey: ["insights"] });
  };

  const handleError = (err: Error) => {
    if (err instanceof ApiError && err.status === 401) onUnauthorized();
    else toast.error(err.message || "Operation failed.");
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateTransactionInput) =>
      transactionsApi.create(token!, data),
    onSuccess: invalidateAll,
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionInput }) =>
      transactionsApi.update(token!, id, data),
    onSuccess: invalidateAll,
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => transactionsApi.remove(token!, id),
    onSuccess: invalidateAll,
    onError: handleError,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => transactionsApi.bulkDelete(token!, ids),
    onSuccess: invalidateAll,
    onError: handleError,
  });

  return {
    transactions,
    isLoading,
    isSaving:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    createTransaction: createMutation.mutateAsync,
    updateTransaction: (id: number, data: UpdateTransactionInput) =>
      updateMutation.mutateAsync({ id, data }),
    removeTransaction: deleteMutation.mutateAsync,
    bulkDeleteTransactions: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
  };
}
