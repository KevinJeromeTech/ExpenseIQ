import type { Transaction, Budget, InsightsResponse, Category, ShareSnapshot } from "../types";

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
  transactionDate?: string;
  notes?: string | null;
  type?: "expense" | "income";
};

export type UpdateTransactionInput = {
  merchant: string;
  amount: number;
  category: string;
  isRecurring?: boolean;
  frequency?: string | null;
  transactionDate?: string;
  notes?: string | null;
  type?: "expense" | "income";
};

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

  bulkDelete: (token: string, ids: number[]) =>
    request<{ message: string }>("/api/transactions/bulk-delete", "POST", {
      token,
      body: { ids },
    }),
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

export type UserProfile = {
  id: number;
  email: string;
  name: string | null;
  birthday: string | null;
  createdAt: string;
};

export const usersApi = {
  getMe: (token: string) =>
    request<UserProfile>("/api/users/me", "GET", { token }),

  updateProfile: (token: string, data: { name?: string; birthday?: string | null }) =>
    request<UserProfile>("/api/users/me", "PUT", { token, body: data }),

  changePassword: (
    token: string,
    data: { currentPassword: string; newPassword: string; confirmPassword: string }
  ) => request<{ message: string }>("/api/users/password", "PUT", { token, body: data }),

  deleteAccount: (token: string, data: { password: string }) =>
    request<{ message: string }>("/api/users/account", "DELETE", { token, body: data }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/api/auth/forgot-password", "POST", { body: { email } }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/api/auth/reset-password", "POST", {
      body: { token, password },
    }),
};

export const categoriesApi = {
  getAll: (token: string) => request<Category[]>("/api/categories", "GET", { token }),
  create: (token: string, name: string) => request<Category>("/api/categories", "POST", { token, body: { name } }),
  remove: (token: string, id: number) => request<{ message: string }>(`/api/categories/${id}`, "DELETE", { token }),
};

export const shareApi = {
  generate: (token: string) => request<{ token: string }>("/api/share/generate", "POST", { token }),
  revoke: (token: string) => request<{ message: string }>("/api/share", "DELETE", { token }),
  getSnapshot: (shareToken: string) => request<ShareSnapshot>(`/api/share/${shareToken}`, "GET"),
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
