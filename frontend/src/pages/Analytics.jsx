import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  Tag,
  Calendar,
  Download,
  FileText,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
} from 'recharts';

import reportsApi from '../api/reportsApi';
import accountsApi from '../api/accountsApi';
import categoriesApi from '../api/categoriesApi';
import { useAuth } from '../context/AuthContext';
import {
  formatCategoryPieData,
  PieChartTooltip,
  COLORS,
} from '../utils/chartHelpers.jsx';

export default function Analytics() {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Timeframe Filter: '30d' | '90d' | '6m' | '1y' | 'custom'
  const [timeframe, setTimeframe] = useState('6m');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Dropdown Filter selections
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [flowType, setFlowType] = useState('ALL'); // 'ALL' | 'INCOME' | 'EXPENSE'

  // Options
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Data State
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export Loading States (T055)
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Compute active date range based on timeframe
  const activeDateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let start;

    if (timeframe === '30d') {
      start = new Date();
      start.setDate(now.getDate() - 30);
    } else if (timeframe === '90d') {
      start = new Date();
      start.setDate(now.getDate() - 90);
    } else if (timeframe === '1y') {
      start = new Date();
      start.setFullYear(now.getFullYear() - 1);
    } else if (timeframe === 'custom' && customStart && customEnd) {
      return {
        startDate: new Date(customStart + 'T00:00:00').toISOString(),
        endDate: new Date(customEnd + 'T23:59:59').toISOString(),
      };
    } else {
      // 6m (default)
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [timeframe, customStart, customEnd]);

  // ─── Fetch Options ────────────────────────────────────────────────────────
  const fetchOptions = useCallback(async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        accountsApi.getAccounts(),
        categoriesApi.getCategories(),
      ]);
      setAccounts(accRes.data?.accounts || accRes.accounts || []);
      setCategories(catRes.data?.categories || catRes.categories || []);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }, []);

  // ─── Fetch Analytics Data ─────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
      };
      if (selectedAccountId) params.accountId = selectedAccountId;
      if (selectedCategoryId) params.categoryId = selectedCategoryId;

      const res = await reportsApi.getSummary(params);
      if (res.success) {
        setSummaryData(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.response?.data?.message || 'Failed to generate financial analytics');
    } finally {
      setLoading(false);
    }
  }, [activeDateRange, selectedAccountId, selectedCategoryId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ─── Export Triggers (T055) ───────────────────────────────────────────────
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      await reportsApi.exportReport('csv', {
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        accountId: selectedAccountId || undefined,
        categoryId: selectedCategoryId || undefined,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export CSV report');
    } finally {
      setExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      await reportsApi.exportReport('pdf', {
        startDate: activeDateRange.startDate,
        endDate: activeDateRange.endDate,
        accountId: selectedAccountId || undefined,
        categoryId: selectedCategoryId || undefined,
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export PDF report');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleResetFilters = () => {
    setTimeframe('6m');
    setSelectedAccountId('');
    setSelectedCategoryId('');
    setFlowType('ALL');
  };

  // ─── Format Data for Charts ───────────────────────────────────────────────
  const barChartData = useMemo(() => {
    if (!summaryData?.monthlyTrends) return [];
    return summaryData.monthlyTrends.map((t) => ({
      name: t.monthName || t.monthLabel,
      income: t.income,
      expenses: t.expenses,
      savings: t.savings,
    }));
  }, [summaryData]);

  const pieData = useMemo(() => {
    if (!summaryData?.categoryBreakdown) return [];
    return formatCategoryPieData(summaryData.categoryBreakdown);
  }, [summaryData]);

  const topCategory = pieData[0];

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ─── Breadcrumbs & Sub-Header ────────────────────────────────────── */}
      <section className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-xs">
            <span>Finances</span>
            <ChevronRight size={14} className="text-outline" />
            <span className="text-primary font-semibold">Financial Analytics &amp; Intelligence</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Financial Analytics
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            In-depth cashflow breakdown, spending velocity, balance trends, and savings metrics across all connected accounts.
          </p>
        </div>

        {/* Quick Export Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-md text-xs font-semibold transition-all shadow-sm border border-surface-container-high disabled:opacity-60"
          >
            <Download size={15} className="text-outline" />
            <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container font-label-md text-xs font-bold shadow-md transition-all disabled:opacity-60"
          >
            <FileText size={15} />
            <span>{exportingPdf ? 'Exporting...' : 'Export PDF Report'}</span>
          </button>
        </div>
      </section>

      {/* ─── Filter & Control Bar ─────────────────────────────────────────── */}
      <section className="mb-6 p-4 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Select */}
          <div className="flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-container-high">
            <Calendar size={14} className="text-primary" />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-transparent text-xs font-semibold text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Account Filter */}
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-surface-container-low text-xs font-medium text-on-surface px-3 py-2 rounded-full border border-surface-container-high focus:outline-none cursor-pointer"
          >
            <option value="">All Accounts ({accounts.length})</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="bg-surface-container-low text-xs font-medium text-on-surface px-3 py-2 rounded-full border border-surface-container-high focus:outline-none cursor-pointer"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-on-surface-variant hover:text-primary font-label-sm text-xs transition-colors"
          >
            <RefreshCw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Transaction Flow Toggle */}
        <div className="inline-flex p-1 rounded-full bg-surface-container-low border border-surface-container-high self-start lg:self-auto text-xs font-semibold">
          <button
            onClick={() => setFlowType('ALL')}
            className={`px-3 py-1 rounded-full transition-all ${
              flowType === 'ALL'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Flows
          </button>
          <button
            onClick={() => setFlowType('INCOME')}
            className={`px-3 py-1 rounded-full transition-all ${
              flowType === 'INCOME'
                ? 'bg-surface-container-lowest text-emerald-700 shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Income Only
          </button>
          <button
            onClick={() => setFlowType('EXPENSE')}
            className={`px-3 py-1 rounded-full transition-all ${
              flowType === 'EXPENSE'
                ? 'bg-surface-container-lowest text-[#b71945] shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Expenses Only
          </button>
        </div>
      </section>

      {/* ─── 5-Metric Executive Overview Strip ────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Inflow
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="font-metric-number text-xl font-extrabold text-on-surface">
              {currencySymbol}{(summaryData?.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-xs font-bold">
                +{summaryData?.savingsRate || 0}%
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">retention pace</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-4/5 rounded-full" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Outflow
            </span>
            <div className="w-8 h-8 rounded-full bg-rose-50 text-[#b71945] flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <div className="font-metric-number text-xl font-extrabold text-[#b71945]">
              {currencySymbol}{(summaryData?.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-[#b71945] font-label-sm text-xs font-bold">
                {summaryData?.totalIncome > 0
                  ? ((summaryData.totalExpenses / summaryData.totalIncome) * 100).toFixed(1)
                  : 0}%
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">outflow ratio</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-[#b71945] w-3/5 rounded-full" />
          </div>
        </div>

        {/* Net Savings */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Net Savings
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center">
              <PiggyBank size={16} />
            </div>
          </div>
          <div>
            <div className="font-metric-number text-xl font-extrabold text-primary">
              {currencySymbol}{(summaryData?.netSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-label-sm text-xs font-bold">
                {summaryData?.savingsRate || 0}%
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">savings rate</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-1/2 rounded-full" />
          </div>
        </div>

        {/* Avg Daily Burn */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Daily Burn Pace
            </span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low text-outline flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div>
            <div className="font-metric-number text-xl font-extrabold text-on-surface">
              {currencySymbol}{(summaryData?.avgDailyBurn || 0).toLocaleString('en-IN')}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="font-body-sm text-xs text-on-surface-variant">Consolidated rate / day</span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-[#ffba20] w-2/3 rounded-full" />
          </div>
        </div>

        {/* Top Category */}
        <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Top Outflow
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Tag size={16} />
            </div>
          </div>
          <div>
            <div className="font-title-sm text-sm font-bold text-on-surface truncate">
              {summaryData?.topCategory?.category || 'None'}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="font-label-md text-xs font-semibold text-[#b71945]">
                {currencySymbol}{(summaryData?.topCategory?.amount || 0).toLocaleString('en-IN')}
              </span>
              <span className="font-body-sm text-xs text-on-surface-variant">
                • {summaryData?.topCategory?.percentage || 0}%
              </span>
            </div>
          </div>
          <div className="w-full h-1 bg-surface-container-high mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 w-1/3 rounded-full" />
          </div>
        </div>
      </section>

      {/* ─── Grid Row 1: Income vs Expenses & Spending by Category ────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Income vs Expenses Comparison (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
                  1. Income vs. Expenses Comparison
                </h2>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                Multi-month trajectory and net surplus across connected accounts
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#ffba20]" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-[#b71945]" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full h-64">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barGap={6}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e4e7ff" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#747687', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                    tick={{ fill: '#747687', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <RechartsTooltip
                    formatter={(val, name) => [`${currencySymbol}${val.toLocaleString('en-IN')}`, name]}
                    contentStyle={{ backgroundColor: '#242e55', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                  <Bar dataKey="income" name="Income" fill="#ffba20" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expenses" name="Expenses" fill="#b71945" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-outline text-xs">
                No trend data available for this timeframe
              </div>
            )}
          </div>
        </div>

        {/* Right: Spending by Category Donut (5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
                2. Category Distribution
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">Outflow allocation by category</p>
            </div>
            {summaryData?.totalExpenses > 0 && (
              <span className="px-3 py-1 rounded-full bg-rose-50 text-[#b71945] font-label-md text-xs font-bold">
                {currencySymbol}{(summaryData.totalExpenses).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-outline gap-2 text-xs">
              <Inbox size={32} />
              <span>No expense transactions recorded in this period</span>
            </div>
          ) : (
            <>
              {/* Donut Chart with Center Label */}
              <div className="relative flex items-center justify-center">
                <div style={{ width: 190, height: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={56}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <PieTooltip content={<PieChartTooltip currency={currencySymbol} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {topCategory && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-semibold text-outline">Top Spend</span>
                    <span className="font-headline-md text-xs font-bold text-on-surface text-center px-2 truncate max-w-[100px]">
                      {topCategory.name}
                    </span>
                    <span className="font-label-sm text-xs text-[#b71945] font-bold">
                      {topCategory.percentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Category Legend Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieData.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate text-on-surface">{item.name}</span>
                    </div>
                    <span className="font-bold text-on-surface shrink-0 ml-1">
                      {currencySymbol}{item.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Grid Row 2: Cashflow Breakdown & Month-over-Month Growth Table ─ */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-title-sm text-title-sm font-bold text-on-surface">
              3. Month-over-Month Cashflow Breakdown
            </h2>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Inflows, outflows, net capital retention, and savings rate across periods
            </p>
          </div>
          <span className="text-xs text-outline font-semibold">
            {summaryData?.monthlyTrends?.length || 0} Periods
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-surface-container-high">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low text-on-surface font-semibold border-b border-surface-container-high">
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4 text-right">Inflows</th>
                <th className="py-3 px-4 text-right">Outflows</th>
                <th className="py-3 px-4 text-right">Net Savings</th>
                <th className="py-3 px-4 text-right">Retention Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/60">
              {summaryData?.monthlyTrends && summaryData.monthlyTrends.length > 0 ? (
                summaryData.monthlyTrends.map((t, idx) => {
                  const retentionRate = t.income > 0 ? ((t.savings / t.income) * 100).toFixed(1) : '0.0';
                  const isPositive = t.savings >= 0;
                  return (
                    <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-on-surface">
                        {t.monthLabel || `${t.month}/${t.year}`}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-700">
                        +{currencySymbol}{t.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#b71945]">
                        -{currencySymbol}{t.expenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${isPositive ? 'text-primary' : 'text-[#b71945]'}`}>
                        {isPositive ? '+' : ''}{currencySymbol}{t.savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-on-surface">
                        {retentionRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-bold ${
                            isPositive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-[#b71945]'
                          }`}
                        >
                          {isPositive ? 'Surplus' : 'Deficit'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-outline">
                    No cashflow records found for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
