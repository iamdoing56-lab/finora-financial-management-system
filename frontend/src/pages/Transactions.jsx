import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Calendar,
  Building2,
  Tag,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Inbox,
  RefreshCw,
  TrendingUp,
  Receipt,
  Wallet,
  Sparkles,
} from 'lucide-react';
import transactionsApi from '../api/transactionsApi';
import accountsApi from '../api/accountsApi';
import categoriesApi from '../api/categoriesApi';
import TransactionModal from '../components/TransactionModal';
import { useAuth } from '../context/AuthContext';

export default function Transactions() {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Data States
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown options
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [flowType, setFlowType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'THIS_MONTH' | 'LAST_30' | 'THIS_YEAR'
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load dropdown lists (accounts and categories) once
  useEffect(() => {
    async function loadPrerequisites() {
      try {
        const [accRes, catRes] = await Promise.all([
          accountsApi.getAccounts({ status: 'ACTIVE' }),
          categoriesApi.getCategories(),
        ]);
        setAccounts(accRes.accounts || []);
        setCategories(catRes.categories || []);
      } catch (err) {
        console.error('Failed to load filter options:', err);
      }
    }
    loadPrerequisites();
  }, []);

  // Compute start/end dates from dateRange filter
  const dateParams = useMemo(() => {
    const now = new Date();
    if (dateRange === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    if (dateRange === 'LAST_30') {
      const start = new Date();
      start.setDate(now.getDate() - 30);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      };
    }
    if (dateRange === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    }
    return {};
  }, [dateRange]);

  // Fetch Transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder,
        ...dateParams,
      };

      if (flowType !== 'ALL') {
        params.type = flowType;
      }
      if (selectedAccountId !== 'all') {
        params.accountId = selectedAccountId;
      }
      if (selectedCategoryId !== 'all') {
        params.categoryId = selectedCategoryId;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await transactionsApi.getTransactions(params);
      setTransactions(res.transactions || []);
      setPagination(res.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Fetch transactions error:', err);
      setError('Unable to load transactions. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, flowType, dateRange, selectedAccountId, selectedCategoryId, search, sortBy, sortOrder, dateParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setFlowType('ALL');
    setDateRange('ALL');
    setSelectedAccountId('all');
    setSelectedCategoryId('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    flowType !== 'ALL' ||
    dateRange !== 'ALL' ||
    selectedAccountId !== 'all' ||
    selectedCategoryId !== 'all';

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  // Handle Success Callback from Modal
  const handleModalSuccess = () => {
    fetchTransactions();
  };

  // Confirm and Execute Delete
  const handleDeleteTransaction = async (id) => {
    try {
      setDeleteLoading(true);
      await transactionsApi.deleteTransaction(id);
      setDeletingId(null);
      fetchTransactions();
    } catch (err) {
      console.error('Delete transaction failed:', err);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions available to export.');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Amount', 'Account', 'Category', 'Notes', 'Recurring'];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.amount,
      `"${t.account?.name || ''}"`,
      `"${t.category?.name || ''}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.isRecurring ? 'Yes' : 'No',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Finora_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* 1. Header Section with Breadcrumbs & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer">Finances</span>
            <span className="text-outline text-[10px]">/</span>
            <span className="text-on-surface">Transactions Management</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Transactions
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              {pagination.total} Total Records
            </span>
          </div>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Audit, filter, and categorize domestic and corporate cashflow across linked accounts via RBI-licensed Account Aggregator rails.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-container-lowest text-on-surface text-xs font-bold shadow-sm hover:bg-surface-container border border-surface-container-high transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-outline" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed text-xs font-bold shadow-[0_8px_20px_-2px_rgba(255,186,32,0.45)] hover:bg-tertiary-fixed transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* 2. Metric Summary Strip (4 KPI Mini Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-outline font-bold">Total Volume</p>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {currencySymbol}{(summary?.totalVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-2.5 text-xs text-on-surface-variant">
            <span>{pagination.total} Total operations</span>
            <span className="inline-flex items-center gap-1 font-bold text-tertiary-container">
              <TrendingUp className="w-3.5 h-3.5" /> Filtered
            </span>
          </div>
        </div>

        {/* Total Inflows */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-outline font-bold">Total Inflows</p>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {currencySymbol}{(summary?.totalInflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-2.5 text-xs text-on-surface-variant">
            <span>Credits recorded</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
              Income Influx
            </span>
          </div>
        </div>

        {/* Total Outflows */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-outline font-bold">Total Outflows</p>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {currencySymbol}{(summary?.totalOutflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-2.5 text-xs text-on-surface-variant">
            <span>Discretionary debits</span>
            <span className="inline-flex items-center gap-1 font-bold text-secondary text-[11px]">
              Active Burn
            </span>
          </div>
        </div>

        {/* Average Ticket Size */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-outline font-bold">Avg Ticket Size</p>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {currencySymbol}{(summary?.avgTicketSize || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 bg-surface-container-low/50 -mx-5 -mb-5 px-5 py-2.5 text-xs text-on-surface-variant">
            <span>Mean transaction</span>
            <span className="text-[11px] font-semibold text-outline">RBI compliant</span>
          </div>
        </div>
      </div>

      {/* 3. Filter & Control Toolbar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-sm border border-surface-container-high">
        {/* Top search & Flow tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search merchant, notes, account or category..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-inner transition-all border border-surface-container-high"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Flow Type Switcher Tabs */}
          <div className="flex items-center p-1 rounded-full bg-surface-container-low overflow-x-auto border border-surface-container-high">
            <button
              type="button"
              onClick={() => {
                setFlowType('ALL');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                flowType === 'ALL'
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Flows
            </button>
            <button
              type="button"
              onClick={() => {
                setFlowType('INCOME');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                flowType === 'INCOME'
                  ? 'bg-surface-container-lowest text-tertiary-container shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Credits (+{currencySymbol})
            </button>
            <button
              type="button"
              onClick={() => {
                setFlowType('EXPENSE');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                flowType === 'EXPENSE'
                  ? 'bg-surface-container-lowest text-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Debits (-{currencySymbol})
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-surface-container-high">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Select */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors focus:outline-none cursor-pointer border border-surface-container-high"
              >
                <option value="ALL">All Dates</option>
                <option value="THIS_MONTH">This Month</option>
                <option value="LAST_30">Last 30 Days</option>
                <option value="THIS_YEAR">This Year</option>
              </select>
              <Calendar className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Account Filter */}
            <div className="relative">
              <select
                value={selectedAccountId}
                onChange={(e) => {
                  setSelectedAccountId(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors focus:outline-none cursor-pointer border border-surface-container-high"
              >
                <option value="all">All Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors focus:outline-none cursor-pointer border border-surface-container-high"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
              <Tag className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('_');
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                className="appearance-none pl-3.5 pr-8 py-1.5 rounded-full bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors focus:outline-none cursor-pointer border border-surface-container-high"
              >
                <option value="date_desc">Sort: Newest First</option>
                <option value="date_asc">Sort: Oldest First</option>
                <option value="amount_desc">Sort: Highest Amount</option>
                <option value="amount_asc">Sort: Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Active Filter Tags & Reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:text-on-surface-variant text-xs font-bold underline underline-offset-2 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Transactions List Container */}
      <div className="relative rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high overflow-hidden">
        {loading ? (
          // Skeleton Loading View
          <div className="p-6 flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-surface-container-low/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                  <div className="flex flex-col gap-2">
                    <div className="w-36 h-4 bg-surface-container-high rounded" />
                    <div className="w-24 h-3 bg-surface-container-high rounded" />
                  </div>
                </div>
                <div className="w-24 h-5 bg-surface-container-high rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          // Empty or No Results State
          <div className="py-16 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline mb-4">
              <Inbox className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">No transactions found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mt-1">
              {hasActiveFilters
                ? 'No records matched your selected search criteria. Try modifying your filters.'
                : 'Your financial vault is currently empty. Record your first transaction to start tracking.'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 rounded-full bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-all"
              >
                Clear all filters
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="mt-4 px-5 py-2.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed text-xs font-bold shadow-md hover:bg-tertiary-fixed transition-all"
              >
                + Add your first transaction
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 4A. RESPONSIVE STACKED CARDS FOR MOBILE (< 768px) — Explicitly required by T034 */}
            <div className="block md:hidden divide-y divide-surface-container-high">
              {transactions.map((tx) => {
                const isIncome = tx.type === 'INCOME';
                return (
                  <div
                    key={tx.id}
                    className="p-4 flex flex-col gap-3 hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Top Row: Merchant/Notes + Amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                            isIncome
                              ? 'bg-tertiary-fixed text-tertiary'
                              : 'bg-secondary-fixed/50 text-secondary'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-on-surface leading-tight">
                            {tx.notes || tx.category?.name || 'Unspecified'}
                          </span>
                          <span className="text-[11px] text-outline">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Prominent Amount */}
                      <span
                        className={`font-extrabold text-base tracking-tight shrink-0 ${
                          isIncome ? 'text-tertiary-container' : 'text-on-surface'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Middle Row: Category badge & Account badge */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Category badge */}
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${tx.category?.color || '#0284C7'}20`,
                            color: tx.category?.color || '#0284C7',
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tx.category?.color || '#0284C7' }}
                          />
                          {tx.category?.name || 'Uncategorized'}
                        </span>

                        {/* Account badge */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px]">
                          <Building2 className="w-3 h-3 text-primary" />
                          {tx.account?.name}
                        </span>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(tx)}
                          className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant"
                          aria-label="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(tx.id)}
                          className="p-1.5 rounded-full hover:bg-error-container text-outline hover:text-error"
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4B. FULL DATA TABLE FOR TABLET & DESKTOP (>= 768px) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead>
                  <tr className="bg-surface-container-low text-outline text-[11px] uppercase tracking-wider select-none border-b border-surface-container-high">
                    <th className="py-3.5 px-4 font-bold">Date & Time</th>
                    <th className="py-3.5 px-4 font-bold">Merchant / Notes</th>
                    <th className="py-3.5 px-4 font-bold">Category</th>
                    <th className="py-3.5 px-4 font-bold">Account Node</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Amount ({currencySymbol})</th>
                    <th className="py-3.5 px-4 text-center font-bold w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high">
                  {transactions.map((tx) => {
                    const isIncome = tx.type === 'INCOME';
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-surface-container-low/50 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          <span className="font-semibold text-on-surface block">
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-outline">
                            {new Date(tx.date).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Merchant / Description */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isIncome
                                  ? 'bg-tertiary-fixed text-tertiary'
                                  : 'bg-secondary-fixed/40 text-secondary'
                              }`}
                            >
                              {isIncome ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-on-surface truncate group-hover:text-primary transition-colors">
                                {tx.notes || tx.category?.name || 'Ledger Entry'}
                              </span>
                              {tx.isRecurring && (
                                <span className="text-[10px] text-primary flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" /> Auto-recurring
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${tx.category?.color || '#0284C7'}18`,
                              color: tx.category?.color || '#0284C7',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tx.category?.color || '#0284C7' }}
                            />
                            {tx.category?.name || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Account */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface text-xs font-medium">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span>{tx.account?.name || 'Account'}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-primary" /> Settled
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-extrabold text-sm">
                          <span
                            className={`inline-flex items-center gap-0.5 justify-end ${
                              isIncome ? 'text-tertiary-container' : 'text-on-surface'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {currencySymbol}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(tx)}
                              className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              title="Edit transaction"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(tx.id)}
                              className="p-1.5 rounded-full hover:bg-error-container text-outline hover:text-error transition-colors cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-surface-container-low/40 border-t border-surface-container-high flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
              <div>
                Showing{' '}
                <span className="font-bold text-on-surface">
                  {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
                </span>{' '}
                to{' '}
                <span className="font-bold text-on-surface">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-bold text-on-surface">{pagination.total}</span> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>

                <span className="px-2 font-bold text-on-surface">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high disabled:opacity-40 text-on-surface font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center gap-3 text-error">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Delete Transaction?</h3>
                <p className="text-xs text-on-surface-variant">
                  This will reverse its balance impact on your account ledger atomically.
                </p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl">
              Are you sure you want to permanently delete this transaction? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => handleDeleteTransaction(deletingId)}
                className="px-5 py-2 rounded-full bg-secondary text-on-secondary text-xs font-bold shadow-md hover:bg-secondary/90 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleModalSuccess}
        editTransaction={editingTransaction}
      />
    </div>
  );
}
