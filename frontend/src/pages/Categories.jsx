import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Lock,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Inbox,
  Coffee,
  Briefcase,
  Home,
  Utensils,
  Car,
  Tv,
  Zap,
  HeartPulse,
  ShoppingBag,
  Laptop,
  GraduationCap,
  Baby,
  Wrench,
  Gift,
  Plane,
} from 'lucide-react';
import categoriesApi from '../api/categoriesApi';
import { useAuth } from '../context/AuthContext';

// Icon options mapping
const ICON_OPTIONS = [
  { id: 'Utensils', name: 'Food / Dining', icon: Utensils },
  { id: 'Home', name: 'Housing / Rent', icon: Home },
  { id: 'Briefcase', name: 'Work / Salary', icon: Briefcase },
  { id: 'Laptop', name: 'Freelance / Tech', icon: Laptop },
  { id: 'Coffee', name: 'Cafe / Snacks', icon: Coffee },
  { id: 'Car', name: 'Transport / Fuel', icon: Car },
  { id: 'Tv', name: 'Entertainment', icon: Tv },
  { id: 'Zap', name: 'Utilities / Bills', icon: Zap },
  { id: 'HeartPulse', name: 'Healthcare', icon: HeartPulse },
  { id: 'ShoppingBag', name: 'Shopping', icon: ShoppingBag },
  { id: 'GraduationCap', name: 'Education', icon: GraduationCap },
  { id: 'Plane', name: 'Travel', icon: Plane },
  { id: 'Gift', name: 'Gifts & Charity', icon: Gift },
  { id: 'Baby', name: 'Family / Childcare', icon: Baby },
  { id: 'Wrench', name: 'Maintenance', icon: Wrench },
];

const COLOR_PALETTE = [
  '#0045e4', // Finora Cobalt
  '#3361ff', // Royal Blue
  '#10B981', // Emerald
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#ffba20', // Golden
  '#b71945', // Crimson
  '#fd5275', // Rose
  '#8B5CF6', // Purple
  '#6366F1', // Indigo
  '#6B7280', // Slate
];

// Helper to choose an icon component based on category name
function getCategoryIcon(name) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('food') || lower.includes('din')) return Utensils;
  if (lower.includes('rent') || lower.includes('hous')) return Home;
  if (lower.includes('sal') || lower.includes('work')) return Briefcase;
  if (lower.includes('free') || lower.includes('tech') || lower.includes('consult')) return Laptop;
  if (lower.includes('trans') || lower.includes('fuel') || lower.includes('car')) return Car;
  if (lower.includes('enter') || lower.includes('stream') || lower.includes('movie')) return Tv;
  if (lower.includes('util') || lower.includes('bill') || lower.includes('elect')) return Zap;
  if (lower.includes('health') || lower.includes('med')) return HeartPulse;
  if (lower.includes('shop') || lower.includes('cloth')) return ShoppingBag;
  if (lower.includes('edu') || lower.includes('school')) return GraduationCap;
  if (lower.includes('trav') || lower.includes('flight')) return Plane;
  if (lower.includes('gift') || lower.includes('charity')) return Gift;
  return Tag;
}

export default function Categories() {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Data State
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Sorting
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'expense' | 'income' | 'custom'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('amount-desc');

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [modalType, setModalType] = useState('EXPENSE');
  const [modalName, setModalName] = useState('');
  const [modalColor, setModalColor] = useState(COLOR_PALETTE[0]);
  const [modalQuota, setModalQuota] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Delete Category Confirmation Modal State
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await categoriesApi.getCategories();
      setCategories(res.categories || []);
      setSummary(res.summary || null);
    } catch (err) {
      console.error('Fetch categories error:', err);
      setError('Failed to load categories. Please verify backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Tab filter
      if (activeTab === 'expense' && cat.type !== 'EXPENSE') return false;
      if (activeTab === 'income' && cat.type !== 'INCOME') return false;
      if (activeTab === 'custom' && cat.origin !== 'custom') return false;

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        if (!cat.name.toLowerCase().includes(query)) return false;
      }

      return true;
    });
  }, [categories, activeTab, search]);

  // Sorted categories
  const sortedCategories = useMemo(() => {
    const list = [...filteredCategories];
    if (sortBy === 'amount-desc') {
      list.sort((a, b) => (b.monthlyAmount || 0) - (a.monthlyAmount || 0));
    } else if (sortBy === 'amount-asc') {
      list.sort((a, b) => (a.monthlyAmount || 0) - (b.monthlyAmount || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'txs') {
      list.sort((a, b) => (b.transactionCount || 0) - (a.transactionCount || 0));
    }
    return list;
  }, [filteredCategories, sortBy]);

  // Group by Income and Expense
  const incomeCategories = useMemo(() => {
    return sortedCategories.filter((c) => c.type === 'INCOME');
  }, [sortedCategories]);

  const expenseCategories = useMemo(() => {
    return sortedCategories.filter((c) => c.type === 'EXPENSE');
  }, [sortedCategories]);

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setModalType('EXPENSE');
    setModalName('');
    setModalColor(COLOR_PALETTE[1]);
    setModalQuota('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    if (cat.isDefault) return; // Cannot edit system defaults
    setEditingCategory(cat);
    setModalType(cat.type);
    setModalName(cat.name);
    setModalColor(cat.color || COLOR_PALETTE[0]);
    setModalQuota('');
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!modalName.trim()) {
      setModalError('Please enter a category name');
      return;
    }

    try {
      setModalSubmitting(true);
      if (editingCategory?.id) {
        await categoriesApi.updateCategory(editingCategory.id, {
          name: modalName.trim(),
          color: modalColor,
        });
      } else {
        await categoriesApi.createCategory({
          name: modalName.trim(),
          type: modalType,
          color: modalColor,
          monthlyLimit: modalQuota ? parseFloat(modalQuota) : undefined,
        });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Save category error:', err);
      const msg = err.response?.data?.message || 'Unable to save category. Please try again.';
      setModalError(msg);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Delete Category Handler (reassigns transactions to Other)
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setDeleteSubmitting(true);
      const res = await categoriesApi.deleteCategory(deletingCategory.id);
      setDeleteSuccessMsg(res.message || 'Category deleted successfully.');
      setDeletingCategory(null);
      fetchCategories();
      setTimeout(() => setDeleteSuccessMsg(''), 6000);
    } catch (err) {
      console.error('Delete category error:', err);
      alert(err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6 pb-12">
      {/* 1. Header & Breadcrumbs Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
            <span className="hover:text-primary transition-colors cursor-pointer">Finances</span>
            <span className="text-outline text-[10px]">/</span>
            <span className="text-on-surface font-bold">Categories & Rules</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Categories &amp; Cashflow Buckets
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold tracking-wide">
              {summary?.totalCategories || categories.length} TOTAL
            </span>
          </div>
          <p className="text-sm text-on-surface-variant max-w-2xl">
            Organize, track, and configure cashflow classifications. Tailor custom spending quotas, view linked transactions, and lock core accounting ledgers.
          </p>
        </div>

        {/* Action Callout */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed text-xs font-bold shadow-[0_8px_20px_-2px_rgba(255,186,32,0.45)] hover:bg-tertiary-fixed transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Success notification banner after deletion reassignment */}
      {deleteSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-between gap-2 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
          <button onClick={() => setDeleteSuccessMsg('')} className="p-1 hover:text-primary">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. KPI Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Classification Pool */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                Classification Pool
              </span>
              <span className="text-xl font-extrabold text-on-surface mt-1">
                {summary?.totalCategories || categories.length} Active
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-low/60 rounded-xl px-3 py-1.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              {summary?.expenseCount ?? 7} Expenses
            </span>
            <span className="text-outline">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-container" />
              {summary?.incomeCount ?? 4} Inflows
            </span>
          </div>
        </div>

        {/* Monthly Inflow Tracked */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                Monthly Inflow Tracked
              </span>
              <span className="text-xl font-extrabold text-on-surface mt-1">
                {currencySymbol}{(summary?.monthlyInflowTracked || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-tertiary-container">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-primary-fixed-variant text-[11px] font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Influx MTD
            </span>
            <span className="text-xs text-on-surface-variant">across {summary?.incomeCount || 0} streams</span>
          </div>
        </div>

        {/* Monthly Outflow Tracked */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                Monthly Outflow Tracked
              </span>
              <span className="text-xl font-extrabold text-on-surface mt-1">
                {currencySymbol}{(summary?.monthlyOutflowTracked || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center gap-2">
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-secondary-container h-full rounded-full transition-all"
                style={{ width: `${summary?.burnRatePercentage || 0}%` }}
              />
            </div>
            <span className="text-[11px] text-on-surface-variant font-bold whitespace-nowrap">
              {summary?.burnRatePercentage || 0}% Burn
            </span>
          </div>
        </div>

        {/* Largest Burn Category */}
        <div className="relative overflow-hidden bg-inverse-surface text-inverse-on-surface rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-primary-fixed-dim font-bold">
                Largest Burn Category
              </span>
              <span className="text-base font-bold mt-1 text-surface-lowest truncate max-w-[160px]">
                {summary?.largestBurnCategory?.name || 'Rent & Housing'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-white/10 text-tertiary-fixed text-[11px] font-bold">
              {summary?.largestBurnCategory?.sharePercentage || 0}% Share
            </span>
          </div>
          <div className="mt-4 pt-3 flex items-baseline justify-between border-t border-white/10">
            <span className="text-lg font-extrabold text-surface">
              {currencySymbol}{(summary?.largestBurnCategory?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-surface-dim">High Burn</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filtering & Search Utility Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high">
        {/* Filter Segment Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Categories <span className="ml-1 text-[11px] font-normal opacity-75">({categories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expense <span className="ml-1 text-[11px] font-normal opacity-75">({summary?.expenseCount ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'income'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Income <span className="ml-1 text-[11px] font-normal opacity-75">({summary?.incomeCount ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Custom ({summary?.customCount ?? 0})
          </button>
        </div>

        {/* Search & Sorting Dropdowns */}
        <div className="flex items-center gap-3 px-2">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories, tags..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-surface rounded-full text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-inner border border-surface-container-high"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-outline hover:text-on-surface"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-surface-container-low text-on-surface-variant text-xs font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer border border-surface-container-high"
            >
              <option value="amount-desc">Sort: Highest Flow</option>
              <option value="amount-asc">Sort: Lowest Flow</option>
              <option value="name">Sort: Alphabetical</option>
              <option value="txs">Sort: Transaction Count</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low" />
                <div className="w-20 h-5 bg-surface-container-low rounded-full" />
              </div>
              <div className="w-32 h-6 bg-surface-container-low rounded" />
              <div className="w-full h-2 bg-surface-container-low rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        // Empty State
        <div className="py-16 px-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-outline mb-3">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-on-surface">No categories match your criteria</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mt-1">
            Try adjusting your search query or create a new custom category.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 px-5 py-2.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed text-xs font-bold shadow-md hover:bg-tertiary-fixed transition-all"
          >
            + Create New Category
          </button>
        </div>
      ) : (
        <>
          {/* SECTION 1: INCOME CATEGORIES */}
          {(activeTab === 'all' || activeTab === 'income' || activeTab === 'custom') && incomeCategories.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high">
                    <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse" />
                    <span className="text-sm text-on-surface font-extrabold">Income Categories</span>
                    <span className="text-xs text-outline font-semibold">({incomeCategories.length})</span>
                  </div>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    Automatic salary split, dividend hooks, &amp; contract invoicing
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-tertiary-container block">
                    {currencySymbol}{(summary?.monthlyInflowTracked || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-outline">total monthly influx</span>
                </div>
              </div>

              {/* Grid of Income Cards (3 columns desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomeCategories.map((cat) => {
                  const IconComponent = getCategoryIcon(cat.name);
                  const isSystem = cat.isDefault;
                  const flowShare = summary?.monthlyInflowTracked > 0
                    ? Math.min(100, Math.round(((cat.monthlyAmount || 0) / summary.monthlyInflowTracked) * 100))
                    : 0;

                  return (
                    <div
                      key={cat.id}
                      className="relative bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between border border-surface-container-high"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${cat.color || '#10B981'}20`,
                                color: cat.color || '#10B981',
                              }}
                            >
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-on-surface">{cat.name}</h3>
                              <span className="inline-flex items-center gap-1 text-[11px] text-tertiary-container font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" /> Inflow
                              </span>
                            </div>
                          </div>

                          {/* System vs Custom Badge */}
                          {isSystem ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-outline text-[11px] font-medium"
                              title="System default classification essential for core accounting ledger"
                            >
                              <Lock className="w-3 h-3" /> System
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-[11px] font-bold">
                              <Sparkles className="w-3 h-3" /> Custom
                            </span>
                          )}
                        </div>

                        {/* Metric Info */}
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <span className="text-[10px] text-outline uppercase tracking-wider block font-bold">
                              Inflow MTD
                            </span>
                            <span className="text-lg font-extrabold text-on-surface">
                              {currencySymbol}{(cat.monthlyAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
                            {cat.transactionCount || 0} Txns
                          </span>
                        </div>

                        {/* Micro Progress Bar */}
                        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className="bg-tertiary-container h-full rounded-full transition-all"
                            style={{ width: `${flowShare}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-3 border-t border-surface-container-high flex items-center justify-between">
                        <span className="text-xs text-outline truncate max-w-[170px]">
                          {isSystem ? 'Core ledger classification' : 'Custom user bucket'}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSystem ? (
                            <span
                              className="p-1.5 text-outline-variant cursor-not-allowed"
                              title="System default category cannot be modified"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                title="Edit category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCategory(cat)}
                                className="p-1.5 rounded-full hover:bg-error-container text-outline hover:text-error transition-colors cursor-pointer"
                                title="Delete category (reassigns to Other)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: EXPENSE CATEGORIES */}
          {(activeTab === 'all' || activeTab === 'expense' || activeTab === 'custom') && expenseCategories.length > 0 && (
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                    <span className="text-sm text-on-surface font-extrabold">Expense Categories</span>
                    <span className="text-xs text-outline font-semibold">({expenseCategories.length})</span>
                  </div>
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    Discretionary burn, operational subscriptions, &amp; monthly necessities
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-secondary block">
                    {currencySymbol}{(summary?.monthlyOutflowTracked || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-outline">total monthly burn</span>
                </div>
              </div>

              {/* Grid of Expense Cards (3 columns desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((cat) => {
                  const IconComponent = getCategoryIcon(cat.name);
                  const isSystem = cat.isDefault;
                  const flowShare = summary?.monthlyOutflowTracked > 0
                    ? Math.min(100, Math.round(((cat.monthlyAmount || 0) / summary.monthlyOutflowTracked) * 100))
                    : 0;

                  return (
                    <div
                      key={cat.id}
                      className="relative bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between border border-surface-container-high"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${cat.color || '#EF4444'}20`,
                                color: cat.color || '#EF4444',
                              }}
                            >
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-on-surface">{cat.name}</h3>
                              <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Outflow
                              </span>
                            </div>
                          </div>

                          {/* System vs Custom Badge */}
                          {isSystem ? (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-outline text-[11px] font-medium"
                              title="System default classification essential for core accounting ledger"
                            >
                              <Lock className="w-3 h-3" /> System
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed-dim text-on-primary-fixed text-[11px] font-bold">
                              <Sparkles className="w-3 h-3" /> Custom
                            </span>
                          )}
                        </div>

                        {/* Metric Info */}
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <span className="text-[10px] text-outline uppercase tracking-wider block font-bold">
                              Outflow MTD
                            </span>
                            <span className="text-lg font-extrabold text-on-surface">
                              {currencySymbol}{(cat.monthlyAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
                            {cat.transactionCount || 0} Txns
                          </span>
                        </div>

                        {/* Micro Progress Bar */}
                        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className="bg-secondary-container h-full rounded-full transition-all"
                            style={{ width: `${flowShare}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="pt-3 border-t border-surface-container-high flex items-center justify-between">
                        <span className="text-xs text-outline truncate max-w-[170px]">
                          {isSystem ? 'Core ledger classification' : 'Custom user bucket'}
                        </span>
                        <div className="flex items-center gap-1">
                          {isSystem ? (
                            <span
                              className="p-1.5 text-outline-variant cursor-not-allowed"
                              title="System default category cannot be modified"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cat)}
                                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                title="Edit category"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCategory(cat)}
                                className="p-1.5 rounded-full hover:bg-error-container text-outline hover:text-error transition-colors cursor-pointer"
                                title="Delete category (reassigns to Other)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-surface-container-high animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-surface-container-low flex items-start justify-between border-b border-surface-container-high">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                  {editingCategory ? 'Update Ledger Bucket' : 'New Ledger Bucket'}
                </span>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Define classification rules and assign visual iconography.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-error-container text-on-error-container flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-error shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. Category Type Selector */}
              {!editingCategory && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-on-surface">Classification Type</label>
                  <div className="grid grid-cols-2 gap-3 p-1 bg-surface-container rounded-xl">
                    <button
                      type="button"
                      onClick={() => setModalType('EXPENSE')}
                      className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        modalType === 'EXPENSE'
                          ? 'bg-secondary text-on-secondary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Expense Outflow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalType('INCOME')}
                      className={`py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        modalType === 'INCOME'
                          ? 'bg-tertiary-container text-on-tertiary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Income Influx</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Category Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Category Name *</label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g., Pet Care, Subscriptions, Fitness & Gym"
                  className="w-full px-4 py-2.5 bg-surface text-on-surface text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-inner border border-surface-container-high"
                  required
                />
              </div>

              {/* 3. Color Palette Accent Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-on-surface">Badge Accent Tone</label>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setModalColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                        modalColor === c ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* 4. Monthly Budget Allocation Target (Optional for Expense) */}
              {modalType === 'EXPENSE' && !editingCategory && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-on-surface">
                      Monthly Spending Limit (Optional)
                    </label>
                    <span className="text-[11px] text-tertiary-container font-semibold">Alerts at 85%</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-on-surface-variant font-bold text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={modalQuota}
                      onChange={(e) => setModalQuota(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full pl-8 pr-4 py-2 bg-surface text-on-surface text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-inner border border-surface-container-high"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-surface-container-high flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-6 py-2.5 rounded-full bg-tertiary-fixed-dim hover:bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold shadow-[0_8px_20px_-2px_rgba(255,186,32,0.45)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting
                    ? 'Saving...'
                    : editingCategory
                    ? 'Update Category'
                    : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Category Confirmation Modal (With Reassignment to 'Other' notice) */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center gap-3 text-secondary">
              <div className="w-10 h-10 rounded-full bg-secondary-fixed/50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-on-surface">Delete Category "{deletingCategory.name}"?</h3>
                <span className="text-xs text-on-surface-variant">
                  Automatic transaction fallback reassignment
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant flex flex-col gap-2">
              <p>
                Deleting this category will <strong className="text-on-surface">not</strong> delete your transactions.
              </p>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All linked transactions will be safely reassigned to the default "Other" category.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteCategory}
                className="px-5 py-2 rounded-full bg-secondary text-on-secondary text-xs font-bold shadow-md hover:bg-secondary/90 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteSubmitting ? 'Deleting...' : 'Confirm & Reassign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
