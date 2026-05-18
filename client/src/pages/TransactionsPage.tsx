import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import type { Transaction } from "../types";

const todayStr = () => new Date().toISOString().split("T")[0];

const DEMO_TRANSACTIONS = [
  { merchant: "Whole Foods", amount: 87.43, category: "Food" },
  { merchant: "Uber", amount: 24.5, category: "Transport" },
  { merchant: "Netflix", amount: 15.99, category: "Entertainment" },
  { merchant: "Amazon", amount: 134.0, category: "Shopping" },
  { merchant: "Electric Bill", amount: 95.0, category: "Bills" },
  { merchant: "Chipotle", amount: 12.75, category: "Food" },
  { merchant: "Spotify", amount: 9.99, category: "Entertainment" },
  { merchant: "Shell Gas", amount: 58.2, category: "Transport" },
];

export default function TransactionsPage() {
  const { token, onUnauthorized } = useAuthContext();
  const {
    transactions,
    isLoading,
    isSaving,
    createTransaction,
    updateTransaction,
    removeTransaction,
    bulkDeleteTransactions,
    isBulkDeleting,
  } = useTransactions({ token, onUnauthorized });

  // Form state
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [recurring, setRecurring] = useState("none");
  const [transactionDate, setTransactionDate] = useState(todayStr());
  const [editingId, setEditingId] = useState<number | null>(null);

  // Filter / sort state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const resetForm = useCallback(() => {
    setMerchant("");
    setAmount("");
    setCategory("Shopping");
    setRecurring("none");
    setTransactionDate(todayStr());
    setEditingId(null);
  }, []);

  // Escape key to cancel edit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId !== null) {
        resetForm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId, resetForm]);

  const merchantSuggestions = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.merchant))),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (selectedCategory !== "All") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.merchant.toLowerCase().includes(q));
    }
    switch (sortOption) {
      case "oldest":
        list.sort(
          (a, b) =>
            new Date(a.transactionDate ?? a.createdAt).getTime() -
            new Date(b.transactionDate ?? b.createdAt).getTime()
        );
        break;
      case "highest":
        list.sort((a, b) => b.amount - a.amount);
        break;
      case "lowest":
        list.sort((a, b) => a.amount - b.amount);
        break;
      default: // newest
        list.sort(
          (a, b) =>
            new Date(b.transactionDate ?? b.createdAt).getTime() -
            new Date(a.transactionDate ?? a.createdAt).getTime()
        );
    }
    return list;
  }, [transactions, selectedCategory, searchQuery, sortOption]);

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) {
      toast.error("Merchant and amount are required.");
      return;
    }
    const payload = {
      merchant: merchant.trim(),
      amount: Number(amount),
      category,
      isRecurring: recurring !== "none",
      frequency: recurring !== "none" ? recurring : null,
      transactionDate: new Date(transactionDate).toISOString(),
    };
    try {
      if (editingId !== null) {
        await updateTransaction(editingId, payload);
        toast.success("Transaction updated!");
      } else {
        await createTransaction(payload);
        toast.success("Transaction added!");
      }
      resetForm();
    } catch {
      // error handled in hook
    }
  };

  const startEditing = (t: Transaction) => {
    setEditingId(t.id);
    setMerchant(t.merchant);
    setAmount(String(t.amount));
    setCategory(t.category);
    setRecurring(t.frequency ?? "none");
    const dateStr = (t.transactionDate ?? t.createdAt).split("T")[0];
    setTransactionDate(dateStr);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteTransaction = async (id: number) => {
    try {
      await removeTransaction(id);
      toast.success("Transaction deleted.");
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      // error handled in hook
    }
  };

  const seedDemoTransactions = async () => {
    try {
      for (const demo of DEMO_TRANSACTIONS) {
        await createTransaction({ ...demo, isRecurring: false });
      }
      toast.success("Demo transactions added!");
    } catch {
      // error handled in hook
    }
  };

  const exportTransactionsCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const header = "Merchant,Amount,Category,Date,Recurring,Frequency";
    const rows = transactions.map((t) =>
      [
        `"${t.merchant}"`,
        t.amount.toFixed(2),
        t.category,
        new Date(t.transactionDate ?? t.createdAt).toLocaleDateString(),
        t.isRecurring ? "Yes" : "No",
        t.frequency ?? "",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkDeleteTransactions(Array.from(selectedIds));
      toast.success(`${selectedIds.size} transaction(s) deleted.`);
      clearSelection();
    } catch {
      // error handled in hook
    }
  };

  const allIds = filteredTransactions.map((t) => t.id);
  const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      allIds.forEach(toggleSelected);
    }
  };

  return (
    <section className="content-grid">
      <div className="card">
        <h3>{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h3>

        <form className="transaction-form" onSubmit={(e) => void addTransaction(e)}>
          <label>
            Merchant
            <input
              type="text"
              list="merchant-suggestions"
              placeholder="Enter merchant name"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
            <datalist id="merchant-suggestions">
              {merchantSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label>
            Amount
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <div className="form-group">
            <label htmlFor="transactionDate">Date</label>
            <input
              id="transactionDate"
              type="date"
              className="form-input"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              max={todayStr()}
            />
          </div>

          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Shopping">Shopping</option>
              <option value="Food">Food</option>
              <option value="Transport">Transport</option>
              <option value="Bills">Bills</option>
              <option value="Entertainment">Entertainment</option>
            </select>
          </label>

          <label>
            Recurring
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)}>
              <option value="none">One-Time</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>

          <button
            type="submit"
            className={`primary-button ${editingId !== null ? "edit-mode" : ""}`}
            disabled={isSaving}
          >
            {isSaving
              ? "Processing..."
              : editingId !== null
              ? "Update Transaction"
              : "Add Transaction"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={() => void seedDemoTransactions()}
            disabled={isSaving}
          >
            Add Demo Transactions
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={exportTransactionsCSV}
            disabled={isLoading}
          >
            Export CSV
          </button>
        </form>
      </div>

      <section className="card transactions-card">
        <div className="section-header">
          <h3>Recent Transactions</h3>
        </div>

        <div className="filter-row">
          <label className="bulk-checkbox-label">
            <input
              type="checkbox"
              className="row-checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              disabled={isLoading || filteredTransactions.length === 0}
            />
            All
          </label>

          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isLoading}
          >
            <option value="All">All Categories</option>
            <option value="Shopping">Shopping</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
          </select>

          <select
            className="filter-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            disabled={isLoading}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          <input
            className="search-input"
            type="text"
            placeholder="Search merchant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="bulk-action-bar">
            <span className="bulk-count">{selectedIds.size} selected</span>
            <button
              type="button"
              className="delete-button"
              onClick={() => void handleBulkDelete()}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? "Deleting…" : "Delete Selected"}
            </button>
            <button type="button" className="cancel-button" onClick={clearSelection}>
              Clear
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="transactions-list">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="transaction-row skeleton">
                <div>
                  <div className="skeleton-text short"></div>
                  <div className="skeleton-text long"></div>
                </div>
                <div className="skeleton-text short"></div>
              </div>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Start by adding one 🚀</p>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((t) => (
              <div
                key={t.id}
                className={`transaction-row${selectedIds.has(t.id) ? " selected" : ""}`}
              >
                <label className="bulk-checkbox-label">
                  <input
                    type="checkbox"
                    className="row-checkbox"
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleSelected(t.id)}
                  />
                </label>

                <div style={{ flex: 1 }}>
                  <p className="merchant">{t.merchant}</p>
                  <p className="category-badge" data-category={t.category}>{t.category}</p>
                  <p className="transaction-date">
                    {new Date(t.transactionDate ?? t.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {t.isRecurring && (
                    <p className="recurring-badge">🔁 {t.frequency}</p>
                  )}
                </div>

                <div className="transaction-actions">
                  <p className="amount">${t.amount.toFixed(2)}</p>

                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => startEditing(t)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => void deleteTransaction(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
