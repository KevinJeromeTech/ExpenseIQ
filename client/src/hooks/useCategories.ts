import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { categoriesApi } from "../services/api";
import type { Category } from "../types";

type Props = { token: string | null; onUnauthorized: () => void };

const DEFAULT_INCOME_NAMES = ["Salary", "Freelance", "Investment", "Gift", "Other Income"];
const DEFAULT_EXPENSE_NAMES = ["Shopping", "Food", "Transport", "Bills", "Entertainment", "Health", "Education", "Other"];

const DEFAULT_INCOME_CATS: Category[] = DEFAULT_INCOME_NAMES.map((name, i) => ({ id: -(i + 1), name }));
const DEFAULT_EXPENSE_CATS: Category[] = DEFAULT_EXPENSE_NAMES.map((name, i) => ({ id: -(i + 100), name }));

export function useCategories({ token, onUnauthorized }: Props) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const rawExpense = categories.filter(c => !DEFAULT_INCOME_NAMES.includes(c.name));
  const rawIncome = categories.filter(c => DEFAULT_INCOME_NAMES.includes(c.name));

  const expenseCategories = rawExpense.length > 0 ? rawExpense : DEFAULT_EXPENSE_CATS;
  const incomeCategories = rawIncome.length > 0 ? rawIncome : DEFAULT_INCOME_CATS;

  const { mutateAsync: addCategory } = useMutation({
    mutationFn: (name: string) => categoriesApi.create(token!, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err: Error & { status?: number }) => {
      if (err.status === 401) { onUnauthorized(); return; }
      toast.error(err.message ?? "Failed to add category");
    },
  });

  const { mutateAsync: removeCategory } = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(token!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    onError: (err: Error & { status?: number }) => {
      if (err.status === 401) { onUnauthorized(); return; }
      toast.error("Failed to remove category");
    },
  });

  return { categories, expenseCategories, incomeCategories, addCategory, removeCategory };
}
