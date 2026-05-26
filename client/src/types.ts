export type Transaction = {
  id: number;
  merchant: string;
  amount: number;
  category: string;
  createdAt: string;
  transactionDate?: string;
  updatedAt?: string;
  userId?: number;
  isRecurring?: boolean;
  frequency?: string | null;
  notes?: string | null;
  type?: "expense" | "income";
};

export type Budget = {
  id: number;
  category: string;
  limit: number;
  month: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: number;
};

export type Insight = {
  type: "positive" | "warning" | "danger";
  message: string;
};

export type InsightsResponse = {
  insights: Insight[];
};

export type Category = {
  id: number;
  name: string;
  userId?: number;
};

export type ShareSnapshot = {
  totalExpenses: number;
  totalIncome: number;
  netIncome: number;
  transactionCount: number;
  budgets: Budget[];
  categoryBreakdown: { name: string; value: number }[];
  recentTransactions: Transaction[];
};