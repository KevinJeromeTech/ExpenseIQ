import type { Transaction } from "../types";

type TransactionsPageProps = {
  merchant: string;
  setMerchant: React.Dispatch<React.SetStateAction<string>>;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  category: string;
  setCategory: React.Dispatch<React.SetStateAction<string>>;
  recurring: string;
  setRecurring: React.Dispatch<React.SetStateAction<string>>;
  editingId: number | null;
  setEditingId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  sortOption: string;
  setSortOption: React.Dispatch<React.SetStateAction<string>>;
  isSavingTransaction: boolean;
  isLoading: boolean;
  addTransaction: (e: React.FormEvent) => Promise<void>;
  seedDemoTransactions: () => Promise<void>;
  exportTransactionsCSV: () => void;
  filteredTransactions?: Transaction[];
  startEditing: (transaction: Transaction) => void;
  deleteTransaction: (id: number) => Promise<void>;
  selectedIds: Set<number>;
  toggleSelected: (id: number) => void;
  clearSelection: () => void;
  handleBulkDelete: () => Promise<void>;
  isBulkDeleting: boolean;
  merchantSuggestions: string[];
};

export default function TransactionsPage({
  merchant,
  setMerchant,
  amount,
  setAmount,
  category,
  setCategory,
  recurring,
  setRecurring,
  editingId,
  setEditingId,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  sortOption,
  setSortOption,
  isSavingTransaction,
  isLoading,
  addTransaction,
  seedDemoTransactions,
  exportTransactionsCSV,
  filteredTransactions = [],
  startEditing,
  deleteTransaction,
  selectedIds,
  toggleSelected,
  clearSelection,
  handleBulkDelete,
  isBulkDeleting,
  merchantSuggestions,
}: TransactionsPageProps) {
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

        <form className="transaction-form" onSubmit={addTransaction}>
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
            disabled={isSavingTransaction}
          >
            {isSavingTransaction
              ? "Processing..."
              : editingId !== null
              ? "Update Transaction"
              : "Add Transaction"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setEditingId(null);
                setMerchant("");
                setAmount("");
                setCategory("Shopping");
                setRecurring("none");
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="cancel-button"
            onClick={seedDemoTransactions}
            disabled={isSavingTransaction}
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
              onClick={handleBulkDelete}
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
                    {new Date(t.createdAt).toLocaleDateString("en-US", {
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
