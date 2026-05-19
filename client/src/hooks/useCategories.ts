import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { categoriesApi } from "../services/api";
import type { Category } from "../types";

type Props = { token: string | null; onUnauthorized: () => void };

export function useCategories({ token, onUnauthorized }: Props) {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const expenseCategories = categories.filter(c =>
    !["Salary","Freelance","Investment","Gift","Other Income"].includes(c.name)
  );
  const incomeCategories = categories.filter(c =>
    ["Salary","Freelance","Investment","Gift","Other Income"].includes(c.name)
  );

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
