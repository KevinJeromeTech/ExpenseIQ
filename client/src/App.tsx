import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "./App.css";
import type { Transaction } from "./types";
import { ApiError } from "./services/api";
import { useAuth } from "./hooks/useAuth";
import { useTransactions } from "./hooks/useTransactions";
import { useBudgets } from "./hooks/useBudgets";
import { useInsights } from "./hooks/useInsights";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

type DateRange = "7d" | "30d" | "all";

const DEMO_TRANSACTIONS = [
  { merchant: "Publix", amount: 42.35, category: "Food", daysAgo: 1 },
  { merchant: "Shell", amount: 38.2, category: "Transport", daysAgo: 2 },
  { merchant: "Amazon", amount: 86.99, category: "Shopping", daysAgo: 3 },
  { merchant: "Netflix", amount: 15.49, category: "Entertainment", daysAgo: 5 },
  { merchant: "FPL", amount: 126.75, category: "Bills", daysAgo: 7 },
];

function App() {
  const location = useLocation();
  const { token, user, onLoginSuccess, handleUnauthorized, logout } = useAuth();

  const { transactions, isLoading: isLoadingTransactions, fetchTransactions, createTransaction, updateTransaction, removeTransaction } =
    useTransactions({ token, onUnauthorized: handleUnauthorized });

  const { savedMonthlyLimit, fetchBudgets, saveBudget: saveBudgetApi } =
    useBudgets({ token, onUnauthorized: handleUnauthorized });

  const { insights, fetchInsights } =
    useInsights({ token, onUnauthorized: handleUnauthorized });

  // Transaction form state
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [recurring, setRecurring] = useState("none");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  // Filter / sort state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Budget form: user's draft input; falls back to server-confirmed value when empty
  const [budgetInputValue, setBudgetInputValue] = useState<number | "">("");
  const monthlyBudget = budgetInputValue !== "" ? budgetInputValue : (savedMonthlyLimit ?? "");
  const setMonthlyBudget = setBudgetInputValue;
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  const refreshAll = useCallback(
    () => Promise.all([fetchTransactions(), fetchBudgets(), fetchInsights()]),
    [fetchTransactions, fetchBudgets, fetchInsights]
  );

  useEffect(() => {
    if (!token) return;
    void refreshAll();
    const id = setInterval(() => void refreshAll(), 10_000);
    return () => clearInterval(id);
  }, [token, refreshAll]);

  const resetForm = () => {
    setMerchant("");
    setAmount("");
    setCategory("Shopping");
    setRecurring("none");
    setEditingId(null);
  };

  const handleSaveBudget = async () => {
    if (monthlyBudget === "" || Number(monthlyBudget) <= 0 || isSavingBudget) {
      toast.error("Please enter a valid monthly budget.");
      return;
    }
    try {
      setIsSavingBudget(true);
      await saveBudgetApi({
        category: "Monthly",
        limit: Number(monthlyBudget),
        month: new Date().toISOString().slice(0, 7),
      });
      await Promise.all([fetchBudgets(), fetchInsights()]);
      toast.success("Budget saved!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { handleUnauthorized(); return; }
      toast.error(error instanceof Error ? error.message : "Budget save failed");
    } finally {
      setIsSavingBudget(false);
    }
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!merchant.trim() || !amount || !category || isSavingTransaction) {
      toast.error("Please fill in merchant, amount, and category.");
      return;
    }

    if (editingId === null) {
      const isDuplicate = transactions.some(
        (t) =>
          t.merchant.toLowerCase() === merchant.trim().toLowerCase() &&
          t.amount === Number(amount) &&
          new Date(t.createdAt).toDateString() === new Date().toDateString()
      );
      if (isDuplicate) {
        toast.error("This transaction already exists today.");
        return;
      }
    }

    const payload = {
      merchant: merchant.trim(),
      amount: Number(amount),
      category,
      isRecurring: recurring !== "none",
      frequency: recurring !== "none" ? recurring : null,
    };

    try {
      setIsSavingTransaction(true);

      if (editingId !== null) {
        await updateTransaction(editingId, payload);
      } else {
        await createTransaction(payload);
      }

      toast.success(editingId !== null ? "Transaction updated!" : "Transaction added!");
      resetForm();
      await refreshAll();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { handleUnauthorized(); return; }
      toast.error(error instanceof Error ? error.message : "Transaction failed.");
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const deleteTransaction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await removeTransaction(id);
      await refreshAll();
      toast.success("Transaction deleted.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { handleUnauthorized(); return; }
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingId(t.id);
    setMerchant(t.merchant);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setRecurring(t.isRecurring ? (t.frequency ?? "none") : "none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const seedDemoTransactions = async () => {
    if (isSavingTransaction) return;
    const now = new Date();
    try {
      setIsSavingTransaction(true);
      for (const { merchant, amount, category, daysAgo } of DEMO_TRANSACTIONS) {
        const date = new Date(now);
        date.setDate(now.getDate() - daysAgo);
        await createTransaction({ merchant, amount, category, createdAt: date.toISOString() });
      }
      await refreshAll();
      toast.success("Demo transactions added!");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) { handleUnauthorized(); return; }
      toast.error(error instanceof Error ? error.message : "Demo seed failed");
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const exportTransactionsCSV = () => {
    if (transactions.length === 0) { toast.error("No transactions to export."); return; }
    const headers = ["Merchant", "Amount", "Category", "Date"];
    const rows = transactions.map((t) => [
      t.merchant,
      t.amount.toFixed(2),
      t.category,
      new Date(t.createdAt).toISOString().split("T")[0],
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "expenseiq-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  // ── Derived state ────────────────────────────────────────────────────────────

  const totalSpent = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const budgetAmount = useMemo(() => (savedMonthlyLimit ?? 0), [savedMonthlyLimit]);

  const remainingBudget = useMemo(() => budgetAmount - totalSpent, [budgetAmount, totalSpent]);

  const budgetUsedPercent = useMemo(
    () => (budgetAmount ? Math.min((totalSpent / budgetAmount) * 100, 100) : 0),
    [totalSpent, budgetAmount]
  );

  const budgetStatus = useMemo(() => {
    if (!budgetAmount) return "No budget set";
    if (totalSpent < budgetAmount * 0.75) return "On track";
    if (totalSpent < budgetAmount) return "Getting close";
    return "Over budget";
  }, [totalSpent, budgetAmount]);

  const topCategory = useMemo(() => {
    if (transactions.length === 0) return "N/A";
    const totals: Record<string, number> = {};
    for (const t of transactions) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    return Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0];
  }, [transactions]);

  const monthlyReport = useMemo(() => {
    if (transactions.length === 0) {
      return { totalSpent: 0, transactionCount: 0, topCategory: "N/A", largestPurchase: "N/A", largestAmount: 0, budgetStatus };
    }
    const largest = [...transactions].sort((a, b) => b.amount - a.amount)[0];
    return { totalSpent, transactionCount: transactions.length, topCategory, largestPurchase: largest.merchant, largestAmount: largest.amount, budgetStatus };
  }, [transactions, totalSpent, topCategory, budgetStatus]);

  const filteredTransactions = useMemo(() => {
    const result = transactions.filter(
      (t) =>
        (selectedCategory === "All" || t.category === selectedCategory) &&
        t.merchant.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const comparators: Record<string, (a: Transaction, b: Transaction) => number> = {
      newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      oldest: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      highest: (a, b) => b.amount - a.amount,
      lowest: (a, b) => a.amount - b.amount,
    };
    return result.sort(comparators[sortOption] ?? comparators.newest);
  }, [transactions, selectedCategory, searchQuery, sortOption]);

  const analyticsTransactions = useMemo(() => {
    if (dateRange === "all") return transactions;
    const days = dateRange === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter((t) => new Date(t.createdAt) >= cutoff);
  }, [transactions, dateRange]);

  const categoryChartData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const t of analyticsTransactions) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    return Object.entries(totals).map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }));
  }, [analyticsTransactions]);

  const trendData = useMemo(() => {
    const byDate: Record<string, number> = {};
    for (const t of analyticsTransactions) {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      byDate[date] = (byDate[date] ?? 0) + t.amount;
    }
    return Object.entries(byDate)
      .map(([date, amount]) => ({ date, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsTransactions]);

  const cumulativeTrendData = useMemo(
    () =>
      trendData.reduce<{ date: string; total: number }[]>((acc, item) => {
        const prev = acc[acc.length - 1]?.total ?? 0;
        acc.push({ date: item.date, total: Number((prev + item.amount).toFixed(2)) });
        return acc;
      }, []),
    [trendData]
  );

  const categoryPercentages = useMemo(() => {
    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totals: Record<string, number> = {};
    for (const t of analyticsTransactions) totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    return Object.entries(totals).map(([category, amount]) => ({
      category,
      percent: total ? Number(((amount / total) * 100).toFixed(1)) : 0,
    }));
  }, [analyticsTransactions]);

  const analyticsInsights = useMemo(() => {
    if (analyticsTransactions.length === 0) {
      return ["No transactions found for this selected date range."];
    }
    const total = analyticsTransactions.reduce((sum, t) => sum + t.amount, 0);
    const highest = [...analyticsTransactions].sort((a, b) => b.amount - a.amount)[0];
    const byDate: Record<string, number> = {};
    for (const t of analyticsTransactions) {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      byDate[date] = (byDate[date] ?? 0) + t.amount;
    }
    const topDay = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
    const rangeLabel = dateRange === "7d" ? "the last 7 days" : dateRange === "30d" ? "the last 30 days" : "all time";
    return [
      `You spent $${total.toFixed(2)} during ${rangeLabel}.`,
      `Your largest transaction was $${highest.amount.toFixed(2)} at ${highest.merchant}.`,
      `Your highest spending day was ${topDay[0]} with $${topDay[1].toFixed(2)}.`,
    ];
  }, [analyticsTransactions, dateRange]);

  // ── Auth gate ────────────────────────────────────────────────────────────────

  if (!token || !user) {
    return <LoginForm onLoginSuccess={onLoginSuccess} />;
  }

  // ── Routes ───────────────────────────────────────────────────────────────────

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute token={token}>
            <AppLayout userEmail={user.email} onLogout={logout} />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <DashboardPage
              userEmail={user.email}
              totalSpent={totalSpent}
              transactions={transactions}
              topCategory={topCategory}
              monthlyReport={monthlyReport}
              monthlyBudget={monthlyBudget}
              setMonthlyBudget={setMonthlyBudget}
              budgetAmount={budgetAmount}
              remainingBudget={remainingBudget}
              budgetStatus={budgetStatus}
              budgetUsedPercent={budgetUsedPercent}
              isSavingBudget={isSavingBudget}
              saveBudget={handleSaveBudget}
              insights={insights}
            />
          }
        />

        <Route
          path="/transactions"
          element={
            <TransactionsPage
              merchant={merchant}
              setMerchant={setMerchant}
              amount={amount}
              setAmount={setAmount}
              category={category}
              setCategory={setCategory}
              editingId={editingId}
              setEditingId={setEditingId}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortOption={sortOption}
              setSortOption={setSortOption}
              recurring={recurring}
              setRecurring={setRecurring}
              isSavingTransaction={isSavingTransaction}
              isLoading={isLoadingTransactions}
              addTransaction={addTransaction}
              seedDemoTransactions={seedDemoTransactions}
              exportTransactionsCSV={exportTransactionsCSV}
              filteredTransactions={filteredTransactions}
              startEditing={startEditing}
              deleteTransaction={deleteTransaction}
            />
          }
        />

        <Route
          path="/analytics"
          element={
            <AnalyticsPage
              categoryChartData={categoryChartData}
              trendData={trendData}
              cumulativeTrendData={cumulativeTrendData}
              categoryPercentages={categoryPercentages}
              dateRange={dateRange}
              setDateRange={setDateRange}
              analyticsInsights={analyticsInsights}
              isLoading={isLoadingTransactions}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
