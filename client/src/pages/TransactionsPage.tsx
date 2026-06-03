import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../contexts/AuthContext";
import { usePreferencesContext } from "../contexts/PreferencesContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import type { Transaction } from "../types";
import { Plus, RefreshCw, Download, Upload, Pencil, Trash2, X, Tag, SlidersHorizontal, Search, Calendar, Sparkles } from "lucide-react";
import Dropdown from "../components/Dropdown";
import EmptyState, { IconReceipt } from "../components/EmptyState";
import { categorizeApi } from "../services/api";

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
  const { fmt } = usePreferencesContext();
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

  const { categories, expenseCategories, incomeCategories, addCategory, removeCategory } = useCategories({ token, onUnauthorized });

  // Form state
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [recurring, setRecurring] = useState("none");
  const [transactionDate, setTransactionDate] = useState(todayStr());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");

  // Category management state
  const [newCategoryName, setNewCategoryName] = useState("");

  // Filter / sort state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d">("all");

  // AI categorization state
  const [isCategorizingAI, setIsCategorizingAI] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const resetForm = useCallback(() => {
    setMerchant("");
    setAmount("");
    setCategory("Shopping");
    setRecurring("none");
    setTransactionDate(todayStr());
    setEditingId(null);
    setNotes("");
    setTransactionType("expense");
    setAiSuggested(false);
  }, []);

  const handleMerchantBlur = useCallback(async () => {
    if (!merchant.trim() || editingId !== null || !token) return;
    setIsCategorizingAI(true);
    try {
      const { category: suggested } = await categorizeApi.suggest(token, merchant, {
        notes: notes || undefined,
        type: transactionType,
      });
      setCategory(suggested);
      setAiSuggested(true);
    } catch {
      // silent — user picks manually
    } finally {
      setIsCategorizingAI(false);
    }
  }, [merchant, notes, transactionType, editingId, token]);

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
    if (dateFilter !== "all") {
      const days = dateFilter === "7d" ? 7 : 30;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
      list = list.filter(t => new Date(t.transactionDate ?? t.createdAt) >= cutoff);
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
  }, [transactions, selectedCategory, searchQuery, sortOption, dateFilter]);

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
      notes: notes || null,
      type: transactionType,
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
    setNotes(t.notes ?? "");
    setTransactionType(t.type === "income" ? "income" : "expense");
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
    const header = "Merchant,Amount,Category,Date,Recurring,Frequency,Notes,Type";
    const rows = transactions.map((t) =>
      [
        `"${t.merchant}"`,
        t.amount.toFixed(2),
        t.category,
        new Date(t.transactionDate ?? t.createdAt).toLocaleDateString(),
        t.isRecurring ? "Yes" : "No",
        t.frequency ?? "",
        `"${t.notes ?? ""}"`,
        t.type ?? "expense",
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

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1);
    let imported = 0;
    for (const line of lines) {
      const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
      const [merchant, amountStr, category, date, , noteVal] = cols;
      const amount = parseFloat(amountStr ?? "");
      if (!merchant || isNaN(amount)) continue;
      try {
        await createTransaction({ merchant, amount, category: category || "Shopping",
          transactionDate: date ? new Date(date).toISOString() : undefined,
          notes: noteVal || null });
        imported++;
      } catch { /* skip bad rows */ }
    }
    toast.success(`Imported ${imported} transaction(s)`);
    e.target.value = "";
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName("");
      toast.success("Category added!");
    } catch { /* handled in hook */ }
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

  const currentCategories = transactionType === "income" ? incomeCategories : expenseCategories;

  return (
    <section className="content-grid">
      <div className="card">
        <h3>{editingId !== null ? "Edit Transaction" : "Add Transaction"}</h3>

        <form className="transaction-form" onSubmit={(e) => void addTransaction(e)}>
          <div className="type-toggle">
            <button
              type="button"
              className={`type-btn ${transactionType === "expense" ? "active expense" : ""}`}
              onClick={() => { setTransactionType("expense"); setCategory(expenseCategories[0]?.name ?? "Shopping"); }}
            >
              Expense
            </button>
            <button
              type="button"
              className={`type-btn ${transactionType === "income" ? "active income" : ""}`}
              onClick={() => { setTransactionType("income"); setCategory(incomeCategories[0]?.name ?? "Salary"); }}
            >
              Income
            </button>
          </div>

          <label>
            Merchant
            <input
              type="text"
              list="merchant-suggestions"
              placeholder="Enter merchant name"
              value={merchant}
              onChange={(e) => { setMerchant(e.target.value); setAiSuggested(false); }}
              onBlur={() => void handleMerchantBlur()}
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
            <span className="category-label-row">
              Category
              {isCategorizingAI && <span className="ai-badge ai-badge--loading"><Sparkles size={11} /> Categorizing…</span>}
              {!isCategorizingAI && aiSuggested && <span className="ai-badge"><Sparkles size={11} /> AI suggested</span>}
            </span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setAiSuggested(false); }}>
              {currentCategories.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Notes (optional)
            <textarea
              placeholder="Add a note…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ resize: "vertical" }}
            />
          </label>

          <label>
            Recurring
            <select value={recurring} onChange={(e) => setRecurring(e.target.value)}>
              <option value="none">One-Time</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </label>

          <button
            type="submit"
            className={`primary-button ${editingId !== null ? "edit-mode" : ""}`}
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
            ) : editingId !== null ? (
              <Pencil size={14} />
            ) : (
              <Plus size={14} />
            )}
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
              <X size={14} />
              Cancel
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={() => void seedDemoTransactions()}
            disabled={isSaving}
          >
            <RefreshCw size={14} />
            Add Demo Transactions
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={exportTransactionsCSV}
            disabled={isLoading}
          >
            <Download size={14} />
            Export CSV
          </button>

          <input
            type="file"
            accept=".csv"
            id="csv-import"
            style={{ display: "none" }}
            onChange={e => void handleCSVImport(e)}
          />
          <button
            type="button"
            className="secondary-button"
            onClick={() => document.getElementById("csv-import")?.click()}
          >
            <Upload size={14} />
            Import CSV
          </button>
        </form>

        <details className="manage-categories">
          <summary>Manage Categories</summary>
          <div className="category-list">
            {categories.map(c => (
              <div key={c.id} className="category-item">
                <span>{c.name}</span>
                <button
                  type="button"
                  className="delete-button small"
                  onClick={() => void removeCategory(c.id)}
                  aria-label={`Remove ${c.name} category`}
                >×</button>
              </div>
            ))}
          </div>
          <div className="category-add">
            <input
              type="text"
              placeholder="New category…"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); void handleAddCategory(); } }}
            />
            <button type="button" className="primary-button small" onClick={() => void handleAddCategory()}>
              <Tag size={12} />
              Add
            </button>
          </div>
        </details>
      </div>

      <section className="card transactions-card">
        <div className="section-header">
          <h3>Recent Transactions</h3>
        </div>

        <div className="filter-bar">
          <div className="filter-bar-top">
            <label className="bulk-checkbox-label">
              <input
                type="checkbox"
                className="row-checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                disabled={isLoading || filteredTransactions.length === 0}
              />
              <span>All</span>
            </label>

            <Dropdown
              value={selectedCategory}
              options={[
                { value: "All", label: "All Categories" },
                ...categories.map(c => ({ value: c.name, label: c.name })),
              ]}
              onChange={setSelectedCategory}
              disabled={isLoading}
              icon={<SlidersHorizontal size={13} />}
            />

            <Dropdown
              value={sortOption}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "highest", label: "Highest Amount" },
                { value: "lowest", label: "Lowest Amount" },
              ]}
              onChange={setSortOption}
              disabled={isLoading}
            />
          </div>

          <div className="filter-bar-bottom">
            <div className="search-wrapper">
              <Search size={14} className="search-icon" />
              <input
                className="search-input"
                type="text"
                placeholder="Search merchant…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
              {searchQuery && (
                <button type="button" className="search-clear" onClick={() => setSearchQuery("")}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="date-chip-group">
              <Calendar size={13} className="date-chip-icon" />
              {(["all", "7d", "30d"] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  className={`date-chip${dateFilter === f ? " active" : ""}`}
                  onClick={() => setDateFilter(f)}
                >
                  {f === "all" ? "All" : f === "7d" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          </div>
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
          <EmptyState icon={<IconReceipt />} title="No transactions yet" subtitle="Add your first transaction to start tracking your spending." />
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

                <div className="transaction-info">
                  <p className="merchant">
                    {t.merchant}
                    {t.type === "income" && <span className="income-badge">Income</span>}
                    {t.isRecurring && (
                      <span className="recurring-inline">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                          <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                        </svg>
                        {t.frequency}
                      </span>
                    )}
                  </p>
                  <div className="transaction-meta">
                    <span className="category-badge" data-category={t.category}>{t.category}</span>
                    <span className="transaction-date">
                      {new Date(t.transactionDate ?? t.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {t.notes && <p className="transaction-note">{t.notes}</p>}
                </div>

                <div className="transaction-right">
                  <p className={`amount${t.type === "income" ? " positive" : ""}`}>
                    {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                  </p>
                  <div className="transaction-actions">
                    <button
                      type="button"
                      className="icon-button edit-icon"
                      onClick={() => startEditing(t)}
                      title="Edit transaction"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button delete-icon"
                      onClick={() => void deleteTransaction(t.id)}
                      title="Delete transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
