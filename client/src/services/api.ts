import type { Transaction, Budget, InsightsResponse } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  method: string,
  { token, body }: { token?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `${method} ${path} failed`);
  }

  return data;
}

export type CreateTransactionInput = {
  merchant: string;
  amount: number;
  category: string;
  isRecurring?: boolean;
  frequency?: string | null;
  createdAt?: string;
};

export type UpdateTransactionInput = Omit<CreateTransactionInput, "createdAt">;

export type CreateBudgetInput = {
  category: string;
  limit: number;
  month: string;
};

export type AuthResponse = {
  token: string;
  user: { id: number; email: string };
  message: string;
};

export const transactionsApi = {
  getAll: (token: string) =>
    request<Transaction[]>("/api/transactions", "GET", { token }),

  create: (token: string, data: CreateTransactionInput) =>
    request<Transaction>("/api/transactions", "POST", { token, body: data }),

  update: (token: string, id: number, data: UpdateTransactionInput) =>
    request<Transaction>(`/api/transactions/${id}`, "PUT", { token, body: data }),

  remove: (token: string, id: number) =>
    request<{ message: string }>(`/api/transactions/${id}`, "DELETE", { token }),
};

export const budgetsApi = {
  getAll: (token: string) =>
    request<Budget[]>("/api/budgets", "GET", { token }),

  save: (token: string, data: CreateBudgetInput) =>
    request<Budget>("/api/budgets", "POST", { token, body: data }),
};

export const insightsApi = {
  get: (token: string) =>
    request<InsightsResponse>("/api/insights", "GET", { token }),
};

export const authApi = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", "POST", {
      body: { email, password },
    }),

  register: (email: string, password: string) =>
    request<{ message: string; userId: number }>("/api/auth/register", "POST", {
      body: { email, password },
    }),
};
