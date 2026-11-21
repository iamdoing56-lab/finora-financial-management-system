import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  PlusCircle,
  Lightbulb,
  ShieldCheck,
  Flame,
  Wallet,
  Calendar,
  X,
  Sparkles,
  Inbox,
  RefreshCw,
} from 'lucide-react';

import budgetsApi from '../api/budgetsApi';
import categoriesApi from '../api/categoriesApi';
import { useAuth } from '../context/AuthContext';
import BudgetProgressBar from '../components/BudgetProgressBar';
import TransactionModal from '../components/TransactionModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Budgets() {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Current Date & Active Month Navigation
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Data State
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search & Sort State
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'normal' | 'warning' | 'exceeded'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('utilization'); // 'utilization' | 'budget' | 'name'

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    monthlyLimit: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Log Transaction Modal
  const [quickLogCategory, setQuickLogCategory] = useState(null);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // ─── Fetch Categories ───────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.getCategories();
      const allCats = res.data?.categories || res.categories || [];
      // Prefer expense categories for budgets
      const expenseCats = allCats.filter((c) => c.type === 'EXPENSE' || !c.type);
      setCategories(expenseCats.length > 0 ? expenseCats : allCats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // ─── Fetch Budgets ──────────────────────────────────────────────────────────
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await budgetsApi.getBudgets({
        month: selectedMonth,
        year: selectedYear,
      });

      if (res.success) {
        setBudgets(res.budgets || []);
        setSummary(res.summary || null);
      }
    } catch (err) {
      console.error('Failed to load budgets:', err);
      setError(err.response?.data?.message || 'Failed to load budgets data');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // ─── Month Navigation Handlers ──────────────────────────────────────────────
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // ─── Modal Openers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingBudget(null);
    setFormData({
      categoryId: categories[0]?.id || '',
      monthlyLimit: '15000',
      month: selectedMonth,
      year: selectedYear,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      monthlyLimit: budget.monthlyLimit.toString(),
      month: budget.month,
      year: budget.year,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // ─── Save Budget (Create or Update) ─────────────────────────────────────────
  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.categoryId) {
      setFormError('Please select an expense category');
      return;
    }

    const limitNum = parseFloat(formData.monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setFormError('Please enter a valid monthly limit greater than 0');
      return;
    }

    try {
      setSaving(true);
      if (editingBudget) {
        await budgetsApi.updateBudget(editingBudget.id, {
          monthlyLimit: limitNum,
          month: parseInt(formData.month, 10),
          year: parseInt(formData.year, 10),
        });
      } else {
        await budgetsApi.createBudget({
          categoryId: formData.categoryId,
          monthlyLimit: limitNum,
          month: parseInt(formData.month, 10),
          year: parseInt(formData.year, 10),
        });
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete Budget ──────────────────────────────────────────────────────────
  const handleDeleteBudget = async (id) => {
    try {
      setIsDeleting(true);
      await budgetsApi.deleteBudget(id);
      setDeletingId(null);
      fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete budget');
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Quick Log for Category ─────────────────────────────────────────────────
  const handleQuickLog = (budget) => {
    setQuickLogCategory({
      id: budget.categoryId,
      name: budget.category?.name,
    });
    setIsQuickLogOpen(true);
  };

  // ─── Filter & Sort Calculations ─────────────────────────────────────────────
  const filteredBudgets = useMemo(() => {
    let result = [...budgets];

    // Filter by tier status
    if (activeFilter === 'normal') {
      result = result.filter((b) => b.status === 'NORMAL');
    } else if (activeFilter === 'warning') {
      result = result.filter((b) => b.status === 'WARNING');
    } else if (activeFilter === 'exceeded') {
      result = result.filter((b) => b.status === 'EXCEEDED');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.category?.name?.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'utilization') {
        return b.percentage - a.percentage;
      }
      if (sortBy === 'budget') {
        return b.monthlyLimit - a.monthlyLimit;
      }
      if (sortBy === 'name') {
        return (a.category?.name || '').localeCompare(b.category?.name || '');
      }
      return 0;
    });

    return result;
  }, [budgets, activeFilter, searchQuery, sortBy]);

  // Exceeded budgets for overage banner
  const exceededBudgets = useMemo(
    () => budgets.filter((b) => b.status === 'EXCEEDED'),
    [budgets]
  );
  const warningBudgets = useMemo(
    () => budgets.filter((b) => b.status === 'WARNING'),
    [budgets]
  );

  // Highest burn category for recommendation
  const topBurnBudget = useMemo(() => {
    if (!budgets.length) return null;
    return [...budgets].sort((a, b) => b.percentage - a.percentage)[0];
  }, [budgets]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ─── Breadcrumbs & Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm uppercase tracking-wider">
            <span>Finances</span>
            <ChevronRight size={14} className="text-outline" />
            <span className="text-primary font-semibold">Budgets &amp; Spending Limits</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Budgets Management</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-container-highest text-on-primary-fixed-variant font-label-md text-label-md font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {summary?.counts?.total || budgets.length} Active Budgets
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Set, track, and optimize monthly spending caps across expense categories with real-time overdraft guardrails.
          </p>
        </div>

        {/* Controls / Action Pills */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Month Navigator */}
          <div className="flex items-center bg-surface-container-lowest rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-surface-container-high px-1.5 py-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1.5 px-3 select-none">
              <Calendar size={15} className="text-primary" />
              <span className="font-title-sm text-title-sm text-on-surface whitespace-nowrap">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Health Score Pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-title-sm text-title-sm shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <Sparkles size={16} className="text-amber-500" />
            <span>
              Health Score: <strong className="text-amber-600">{summary?.healthScore ?? 100}%</strong>
            </span>
          </div>

          {/* Primary CTA: Create Budget */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffba20] text-[#271900] font-title-sm text-title-sm font-bold shadow-[0_8px_20px_-2px_rgba(255,186,32,0.4)] hover:bg-[#ffdea8] transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* ─── Overdraft & Overage Alerts Banner ────────────────────────────── */}
      {exceededBudgets.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#ffd9dc] border border-[#b71945]/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[#400011]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#b71945] text-white flex items-center justify-center shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 className="font-title-sm text-title-sm font-bold">
                ⚠️ Overdraft Guardrail Alert: {exceededBudgets.length} Category Exceeded
              </h4>
              <p className="font-body-sm text-body-sm opacity-90">
                {exceededBudgets.map((b) => `${b.category?.name} (+${currencySymbol}${b.overage?.toLocaleString('en-IN')})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveFilter('exceeded')}
            className="px-4 py-1.5 rounded-full bg-[#b71945] text-white font-title-sm text-xs font-semibold hover:bg-[#910031] transition-all shrink-0 self-start md:self-auto"
          >
            Review Overspend
          </button>
        </div>
      )}

      {/* ─── KPI Overview Grid (4 Cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Total Monthly Limit */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Total Monthly Limit
              </span>
              <span className="font-metric-number text-metric-number text-on-surface mt-1">
                {currencySymbol}{(summary?.totalMonthlyLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-surface-container-low text-primary flex items-center justify-center">
              <Wallet size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 bg-surface-container-low/60 rounded-xl px-3 py-1.5">
            <span className="text-primary font-bold text-xs">●</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Across {budgets.length} categorized spending limits
            </span>
          </div>
        </div>

        {/* Card 2: Total Spent Outflow */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Total Spent Outflow
              </span>
              <span className="font-metric-number text-metric-number text-[#b71945] mt-1">
                {currencySymbol}{(summary?.totalSpent || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#ffd9dc] text-[#b71945] flex items-center justify-center">
              <Flame size={22} />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between items-center font-label-sm text-label-sm">
              <span className="text-on-surface-variant font-medium">Allocation Burn</span>
              <span className="text-[#b71945] font-bold">
                {summary?.burnRate || 0}% Used
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#b71945] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(summary?.burnRate || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Safe Buffer */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Remaining Safe Buffer
              </span>
              <span className="font-metric-number text-metric-number text-primary mt-1">
                {currencySymbol}{(summary?.totalRemaining || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-[#dde1ff] text-primary flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 bg-surface-container-low/60 rounded-xl px-3 py-1.5">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              <strong className="text-on-surface">{currencySymbol}{summary?.dailySafeSpend || 0}/day</strong> safe spend ({summary?.daysLeft || 0} days left)
            </span>
          </div>
        </div>

        {/* Card 4: Budget Health Split */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-outline uppercase tracking-wider">
                Budget Health Split
              </span>
              <span className="font-metric-number text-metric-number text-on-surface mt-1">
                {budgets.length} Total
              </span>
            </div>
            <div className="w-11 h-11 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center">
              <PieChartIcon size={22} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-4">
            <div className="bg-emerald-50 rounded-xl px-2 py-1.5 text-center">
              <div className="font-label-sm text-label-sm text-emerald-700 font-bold">
                {summary?.counts?.normal || 0} Normal
              </div>
              <span className="font-label-sm text-label-sm text-emerald-600/70">&lt;70%</span>
            </div>
            <div className="bg-amber-50 rounded-xl px-2 py-1.5 text-center">
              <div className="font-label-sm text-label-sm text-amber-700 font-bold">
                {summary?.counts?.warning || 0} Warning
              </div>
              <span className="font-label-sm text-label-sm text-amber-600/70">70-100%</span>
            </div>
            <div className="bg-rose-50 rounded-xl px-2 py-1.5 text-center">
              <div className="font-label-sm text-label-sm text-rose-700 font-bold">
                {summary?.counts?.exceeded || 0} Over
              </div>
              <span className="font-label-sm text-label-sm text-rose-600/70">&gt;100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filter, Search, and Sorting Bar ──────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full font-title-sm text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'all'
                ? 'bg-inverse-surface text-inverse-on-surface shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            All Budgets ({budgets.length})
          </button>
          <button
            onClick={() => setActiveFilter('normal')}
            className={`px-4 py-1.5 rounded-full font-title-sm text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'normal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            On Track &lt;70% ({summary?.counts?.normal || 0})
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-4 py-1.5 rounded-full font-title-sm text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'warning'
                ? 'bg-[#ffba20] text-[#271900] shadow-sm font-bold'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            Near Limit 70-100% ({summary?.counts?.warning || 0})
          </button>
          <button
            onClick={() => setActiveFilter('exceeded')}
            className={`px-4 py-1.5 rounded-full font-title-sm text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === 'exceeded'
                ? 'bg-[#b71945] text-white shadow-sm'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            Exceeded &gt;100% ({summary?.counts?.exceeded || 0})
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-full sm:w-64">
            <Search size={16} className="absolute left-3 text-outline" />
            <input
              type="text"
              placeholder="Search budget category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm text-body-sm focus:outline-none focus:bg-surface-container transition-all"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-container-low text-on-surface-variant font-label-md text-xs px-3.5 py-2 rounded-full focus:outline-none cursor-pointer border-none"
          >
            <option value="utilization">Sort: Highest Utilization</option>
            <option value="budget">Sort: Highest Budget</option>
            <option value="name">Sort: Category Name</option>
          </select>
        </div>
      </div>

      {/* ─── Loading Skeleton ────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container-high h-64 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container-high flex flex-col items-center gap-3">
          <AlertCircle size={40} className="text-[#b71945]" />
          <h3 className="font-headline-md text-headline-md text-on-surface">Unable to load budgets</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
          <button
            onClick={fetchBudgets}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white font-title-sm text-xs mt-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : filteredBudgets.length === 0 ? (
        /* Empty State */
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center border border-surface-container-high flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline">
            <Inbox size={32} />
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">No budgets found</h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1">
              {searchQuery || activeFilter !== 'all'
                ? 'No budgets match your current search or filter criteria.'
                : `You haven't established any category budgets for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} yet.`}
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#ffba20] text-[#271900] font-title-sm text-title-sm font-bold shadow-md hover:bg-[#ffdea8] transition-all"
          >
            <Plus size={18} />
            <span>+ Create Budget for {MONTH_NAMES[selectedMonth - 1]}</span>
          </button>
        </div>
      ) : (
        /* ─── Category Budget Cards Grid ─────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredBudgets.map((b) => {
            const isExceeded = b.status === 'EXCEEDED';
            const isWarning = b.status === 'WARNING';
            const categoryColor = b.category?.color || '#0045e4';

            // Card highlight border for exceeded state
            const cardBorderCls = isExceeded
              ? 'border-[#fd5275]/40 shadow-[0_10px_30px_-4px_rgba(253,82,117,0.12)]'
              : 'border-surface-container-high shadow-sm';

            return (
              <div
                key={b.id}
                className={`bg-surface-container-lowest rounded-2xl p-6 border ${cardBorderCls} flex flex-col justify-between relative group hover:shadow-lg transition-all`}
              >
                <div className="flex flex-col gap-3">
                  {/* Header: Icon, Title, Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-lg text-white shadow-sm"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {b.category?.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-headline-md text-title-sm font-bold text-on-surface truncate">
                          {b.category?.name || 'Category'}
                        </h3>
                        <span className="font-body-sm text-body-sm text-outline">
                          Active monthly cap
                        </span>
                      </div>
                    </div>

                    {/* Tier Status Badge */}
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#b71945] text-white font-label-sm text-xs font-bold shadow-sm shrink-0">
                        <AlertCircle size={12} />
                        ⚠️ {b.percentage}% Exceeded
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffba20] text-[#271900] font-label-sm text-xs font-bold shrink-0">
                        <AlertTriangle size={12} />
                        {b.percentage}% Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-xs font-bold shrink-0">
                        <CheckCircle2 size={12} />
                        {b.percentage}% Normal
                      </span>
                    )}
                  </div>

                  {/* Metric Details */}
                  <div className="flex justify-between items-baseline mt-3">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-outline">Spent / Limit</span>
                      <span className={`font-title-sm text-title-sm font-bold ${isExceeded ? 'text-[#b71945]' : 'text-on-surface'}`}>
                        {currencySymbol}{b.spent?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}{' '}
                        <span className="font-normal text-outline text-body-sm">
                          / {currencySymbol}{b.monthlyLimit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-outline">
                        {isExceeded ? 'Exceeded by' : 'Available'}
                      </span>
                      <span
                        className={`font-title-sm text-title-sm font-bold ${
                          isExceeded
                            ? 'text-[#b71945] font-extrabold'
                            : isWarning
                            ? 'text-amber-600'
                            : 'text-primary'
                        }`}
                      >
                        {isExceeded
                          ? `${currencySymbol}${b.overage?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : `${currencySymbol}${b.remaining?.toLocaleString('en-IN', { minimumFractionDigits: 2 })} left`}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar (T046) */}
                  <BudgetProgressBar
                    percentage={b.percentage}
                    status={b.status}
                    height="h-2.5"
                  />

                  {/* Secondary Footprint Details */}
                  <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-xs bg-surface-container-low/60 rounded-xl px-3 py-2 mt-1">
                    <span className="truncate">{b.transactionCount || 0} transactions logged</span>
                    <span className="font-medium text-outline whitespace-nowrap">
                      • Daily avg: {currencySymbol}{Math.round((b.spent || 0) / (now.getDate() || 1))}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-surface-container-high/60">
                  <button
                    onClick={() => handleQuickLog(b)}
                    className="text-primary hover:text-primary-container font-title-sm text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle size={16} />
                    <span>Quick Log</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      aria-label="Edit budget"
                      title="Edit monthly limit"
                      className="p-2 rounded-full hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      aria-label="Delete budget"
                      title="Delete budget"
                      className="p-2 rounded-full hover:bg-rose-50 text-outline hover:text-[#b71945] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Bottom Recommendation & Optimization Banner ─────────────────── */}
      {topBurnBudget && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ffdea8] text-[#745200] flex items-center justify-center shrink-0">
              <Lightbulb size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                Finora Predictive Spending Guardrail
              </span>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                Your <strong>{topBurnBudget.category?.name}</strong> category is currently at{' '}
                <strong className={topBurnBudget.percentage > 100 ? 'text-[#b71945]' : 'text-amber-600'}>
                  {topBurnBudget.percentage}%
                </strong>{' '}
                utilization with {currencySymbol}{topBurnBudget.spent?.toLocaleString('en-IN')} logged.
              </p>
            </div>
          </div>
          <button
            onClick={() => openEditModal(topBurnBudget)}
            className="px-5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-sm text-xs font-semibold transition-all shrink-0"
          >
            Adjust Threshold
          </button>
        </div>
      )}

      {/* ─── Create / Edit Budget Modal ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5 border border-surface-container-high">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  {editingBudget ? 'Edit Spending Cap' : 'Create Monthly Budget'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Establish spending guardrails for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-outline transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-[#b71945] text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="flex flex-col gap-4">
              {/* Category Select */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-on-surface font-semibold">
                  Expense Category
                </label>
                <select
                  disabled={Boolean(editingBudget)}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full bg-surface-container-low text-on-surface text-sm px-4 py-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Spending Cap */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-xs text-on-surface font-semibold">
                  Monthly Spending Cap ({currencySymbol})
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 font-bold text-outline">{currencySymbol}</span>
                  <input
                    type="number"
                    step="any"
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface font-bold text-lg border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                {/* Quick Add Chips */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-outline">Quick add:</span>
                  {[2000, 5000, 10000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const current = parseFloat(formData.monthlyLimit) || 0;
                        setFormData({ ...formData, monthlyLimit: (current + amt).toString() });
                      }}
                      className="px-2.5 py-0.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant font-semibold text-xs transition-colors"
                    >
                      +{currencySymbol}{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month & Year Select */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-xs text-on-surface font-semibold">
                    Target Month
                  </label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value, 10) })}
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-xs text-on-surface font-semibold">
                    Financial Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                    className="w-full bg-surface-container-low text-on-surface text-sm px-3.5 py-2.5 rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container-high/60 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-title-sm text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#ffba20] text-[#271900] font-title-sm text-xs font-bold shadow-md hover:bg-[#ffdea8] transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ──────────────────────────────────── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest rounded-3xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 border border-surface-container-high">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-[#b71945] flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Delete Budget?</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Are you sure you want to remove this category budget cap? Existing transaction history will remain intact.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface font-title-sm text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteBudget(deletingId)}
                className="px-5 py-2 rounded-full bg-[#b71945] text-white font-title-sm text-xs font-bold hover:bg-[#910031] transition-all disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quick Log Transaction Modal ──────────────────────────────────── */}
      {isQuickLogOpen && (
        <TransactionModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          onSuccess={() => {
            setIsQuickLogOpen(false);
            fetchBudgets();
          }}
          editTransaction={
            quickLogCategory
              ? { categoryId: quickLogCategory.id, type: 'EXPENSE' }
              : null
          }
        />
      )}
    </div>
  );
}
