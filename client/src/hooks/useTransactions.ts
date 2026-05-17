import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { transactionsApi, ApiError, type CreateTransactionInput, type UpdateTransactionInput } from "../services/api";
import type { Transaction } from "../types";

type Options = { token: string | null; onUnauthorized: () => void };

export function useTransactions({ token, onUnauthorized }: Options) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const data = await transactionsApi.getAll(token);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      toast.error("Failed to load transactions.");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, onUnauthorized]);

  const createTransaction = useCallback(
    (data: CreateTransactionInput) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return transactionsApi.create(token, data);
    },
    [token]
  );

  const updateTransaction = useCallback(
    (id: number, data: UpdateTransactionInput) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return transactionsApi.update(token, id, data);
    },
    [token]
  );

  const removeTransaction = useCallback(
    (id: number) => {
      if (!token) return Promise.reject(new Error("Not authenticated"));
      return transactionsApi.remove(token, id);
    },
    [token]
  );

  return {
    transactions,
    isLoading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    removeTransaction,
  };
}
