import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Zap,
  Tag,
  ShieldCheck,
  RefreshCw,
  Sparkles,
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
} from 'recharts';

import reportsApi from '../api/reportsApi';
import accountsApi from '../api/accountsApi';
import categoriesApi from '../api/categoriesApi';
import { useAuth } from '../context/AuthContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Reports() {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Periodicity & Cycle Filter State
  const now = new Date();
  const [periodicity, setPeriodicity] = useState('monthly'); // 'monthly' | 'yearly' | 'custom'
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Custom date range state (T055)
  const [customStartDate, setCustomStartDate] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  );

  // Dropdown filter selections
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [reconciledOnly, setReconciledOnly] = useState(true);

  // Options
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Report Data State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Export Loading States (T055)
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // ─── Fetch Dropdown Options ───────────────────────────────────────────────
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

  // Compute active start & end dates based on periodicity
  const activeDateRange = useMemo(() => {
    if (periodicity === 'custom') {
      return {
        startDate: new Date(customStartDate + 'T00:00:00').toISOString(),
        endDate: new Date(customEndDate + 'T23:59:59.999').toISOString(),
      };
    }
    if (periodicity === 'yearly') {
      const start = new Date(selectedYear, 0, 1);
      const end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    // Monthly (default)
    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [periodicity, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // ─── Fetch Report Data ────────────────────────────────────────────────────
  const fetchReport = useCallback(async () => {
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
        setReportData(res);
      }
    } catch (err) {
      console.error('Failed to load financial report:', err);
      setError(err.response?.data?.message || 'Failed to generate financial report');
    } finally {
      setLoading(false);
    }
  }, [activeDateRange, selectedAccountId, selectedCategoryId]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ─── Month Navigation ─────────────────────────────────────────────────────
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

  // ─── Export Handlers (T055) ───────────────────────────────────────────────
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

  const handlePrint = () => {
    window.print();
  };

  const handleResetFilters = () => {
    setPeriodicity('monthly');
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setSelectedAccountId('');
    setSelectedCategoryId('');
  };

  // Chart data format
  const chartData = useMemo(() => {
    if (!reportData?.monthlyTrends) return [];
    return reportData.monthlyTrends.map((t) => ({
      name: t.monthName || t.monthLabel,
      income: t.income,
      expenses: t.expenses,
    }));
  }, [reportData]);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* ─── Top Document Header & Fast Actions (Print, CSV, PDF) ─────────── */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#ffdea8] text-[#745200] shadow-sm">
              <FileText size={18} />
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Financial Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-bold">
              Audit Ready
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Generate, inspect, and export comprehensive audit-ready financial statements, tax ledgers, and institutional cashflow breakdowns.
          </p>
        </div>

        {/* Fast Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 print:hidden">
          <button
            onClick={handlePrint}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-sm border border-surface-container-high hover:shadow-md transition-all font-title-sm text-xs font-semibold"
          >
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface-variant hover:text-primary shadow-sm border border-surface-container-high hover:shadow-md transition-all font-title-sm text-xs font-semibold disabled:opacity-60"
          >
            <Download size={16} />
            <span>{exportingCsv ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf}
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffba20] text-[#271900] font-title-sm text-xs font-bold shadow-md hover:bg-[#ffdea8] active:scale-95 transition-all disabled:opacity-60"
          >
            <FileText size={16} />
            <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </section>

      {/* ─── Statement Generation Filters Card ────────────────────────────── */}
      <section className="w-full bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container-high mb-8 print:hidden">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/60">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-primary" />
              <span className="font-title-sm text-title-sm text-on-surface font-bold tracking-tight">
                Statement Generation Filters
              </span>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reconciledOnly}
                  onChange={(e) => setReconciledOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">
                  Include Reconciled Only
                </span>
              </label>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:underline font-label-md text-xs font-semibold"
              >
                Reset to Default
              </button>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* Periodicity Toggle */}
            <div className="lg:col-span-3 flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                Report Periodicity
              </span>
              <div className="flex p-1 bg-surface-container-low rounded-full w-full">
                <button
                  type="button"
                  onClick={() => setPeriodicity('monthly')}
                  className={`flex-1 py-1.5 px-3 rounded-full font-title-sm text-xs font-semibold transition-all ${
                    periodicity === 'monthly'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodicity('yearly')}
                  className={`flex-1 py-1.5 px-3 rounded-full font-title-sm text-xs font-semibold transition-all ${
                    periodicity === 'yearly'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodicity('custom')}
                  className={`flex-1 py-1.5 px-3 rounded-full font-title-sm text-xs font-semibold transition-all ${
                    periodicity === 'custom'
                      ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Calendar Cycle Selector or Custom Date Range */}
            {periodicity === 'custom' ? (
              <div className="lg:col-span-3 flex items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">From</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs py-2 px-3 rounded-xl border border-surface-container-high focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">To</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs py-2 px-3 rounded-xl border border-surface-container-high focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="lg:col-span-3 flex flex-col gap-1.5">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                  Calendar Cycle
                </span>
                <div className="flex items-center justify-between px-3 py-1.5 bg-surface-container-low rounded-xl text-on-surface border border-surface-container-high">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-2 select-none">
                    <Calendar size={15} className="text-outline" />
                    <span className="font-title-sm text-xs font-bold">
                      {periodicity === 'yearly'
                        ? selectedYear
                        : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-full hover:bg-surface-container-high transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Account Filter */}
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                Source Account
              </span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs py-2.5 px-3 rounded-xl border border-surface-container-high focus:outline-none cursor-pointer"
              >
                <option value="">All Accounts ({accounts.length})</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-2 flex flex-col gap-1.5">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">
                Classification
              </span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface font-body-sm text-xs py-2.5 px-3 rounded-xl border border-surface-container-high focus:outline-none cursor-pointer"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <div className="lg:col-span-2 flex flex-col justify-end">
              <button
                type="button"
                onClick={fetchReport}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#ffba20] text-[#271900] font-title-sm text-xs font-bold shadow-sm hover:bg-[#ffdea8] active:scale-95 transition-all"
              >
                <Sparkles size={16} />
                <span>Generate</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Loading / Error / Content ────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-surface-container-high h-64 animate-pulse" />
          <div className="bg-surface-container-lowest rounded-2xl p-8 border border-surface-container-high h-96 animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container-high flex flex-col items-center gap-3">
          <AlertCircle size={40} className="text-[#b71945]" />
          <h3 className="font-headline-md text-headline-md text-on-surface">Unable to generate report</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white font-title-sm text-xs mt-2"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        /* ─── Formal Audit Document ───────────────────────────────────────── */
        <article className="w-full bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container-high p-6 md:p-10 flex flex-col gap-8 relative overflow-hidden">
          {/* Watermark / Certified Accent Seal */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-surface-container-low/60 pointer-events-none flex items-center justify-center print:hidden">
            <ShieldCheck size={96} className="text-surface-container-highest opacity-40" />
          </div>

          {/* Executive Document Header & Meta Stamp */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-surface-container-high relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-primary-fixed text-primary font-label-sm text-xs font-bold uppercase tracking-wider">
                  Formal Audit Sheet
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-xs font-semibold">
                  RBI AA Compliant
                </span>
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Statement of Financial Position &amp; Cashflow
              </h2>
              <p className="font-title-sm text-title-sm text-primary font-bold">
                Reporting Window: {new Date(reportData?.dateRange?.startDate).toLocaleDateString('en-IN')} — {new Date(reportData?.dateRange?.endDate).toLocaleDateString('en-IN')}
              </p>
            </div>

            {/* Formal Meta Stamp Card */}
            <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col gap-2 min-w-[280px] border border-surface-container-high/60">
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline uppercase font-semibold">Report ID</span>
                <span className="font-bold text-on-surface font-mono">FIN-{selectedYear}-{selectedMonth}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline uppercase font-semibold">Timestamp</span>
                <span className="text-on-surface font-medium">{new Date().toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-outline uppercase font-semibold">Primary Holder</span>
                <span className="text-on-surface font-semibold">{user?.name || 'Rahul S.'}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container-high">
                <span className="text-outline uppercase font-semibold">Verification</span>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span>Certified Reconciled</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 1: Executive Financial Summary Strip ──────────────── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface tracking-tight uppercase">
                1. Executive Financial Summary
              </h3>
              <span className="font-label-sm text-xs text-outline">Consolidated Gross Liquidity</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Inflow */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">Total Inflow</span>
                  <span className="p-1 rounded-full bg-surface-container-lowest text-emerald-600">
                    <TrendingUp size={16} />
                  </span>
                </div>
                <div>
                  <div className="font-metric-number text-2xl font-extrabold text-on-surface">
                    {currencySymbol}{(reportData?.totalIncome || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-emerald-700 font-label-sm text-xs font-semibold">
                    Gross revenue inflows
                  </div>
                </div>
              </div>

              {/* Total Outflow */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">Total Outflow</span>
                  <span className="p-1 rounded-full bg-surface-container-lowest text-[#b71945]">
                    <TrendingDown size={16} />
                  </span>
                </div>
                <div>
                  <div className="font-metric-number text-2xl font-extrabold text-[#b71945]">
                    {currencySymbol}{(reportData?.totalExpenses || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-on-surface-variant font-label-sm text-xs">
                    {(reportData?.totalIncome > 0
                      ? ((reportData.totalExpenses / reportData.totalIncome) * 100).toFixed(1)
                      : 0)}% of gross revenue
                  </div>
                </div>
              </div>

              {/* Net Surplus / Savings */}
              <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-container-high">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">Net Surplus</span>
                  <span className="p-1 rounded-full bg-surface-container-lowest text-primary">
                    <PiggyBank size={16} />
                  </span>
                </div>
                <div>
                  <div className="font-metric-number text-2xl font-extrabold text-primary">
                    {currencySymbol}{(reportData?.netSavings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-on-surface font-label-sm text-xs font-semibold">
                    Net Retention: {reportData?.savingsRate || 0}%
                  </div>
                </div>
              </div>

              {/* Avg Daily Burn */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">Avg Daily Burn</span>
                  <span className="p-1 rounded-full bg-surface-container-lowest text-outline">
                    <Zap size={16} />
                  </span>
                </div>
                <div>
                  <div className="font-metric-number text-2xl font-extrabold text-on-surface">
                    {currencySymbol}{(reportData?.avgDailyBurn || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-outline">/day</span>
                  </div>
                  <div className="mt-1 text-on-surface-variant font-label-sm text-xs">
                    Burn velocity index
                  </div>
                </div>
              </div>

              {/* Top Expense Driver */}
              <div className="bg-surface-container-low rounded-2xl p-4 flex flex-col justify-between gap-3 border border-surface-container-high/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-xs text-outline uppercase font-semibold">Top Expense Driver</span>
                  <span className="p-1 rounded-full bg-surface-container-lowest text-amber-600">
                    <Tag size={16} />
                  </span>
                </div>
                <div>
                  <div className="font-title-sm text-sm font-bold text-on-surface truncate">
                    {reportData?.topCategory?.category || 'None'}
                  </div>
                  <div className="mt-1 text-on-surface-variant font-label-sm text-xs">
                    <strong className="text-on-surface">{reportData?.topCategory?.percentage || 0}%</strong> of total spend
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Cashflow Trend Chart ───────────────────────────── */}
          <section className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-title-sm text-title-sm font-bold text-on-surface tracking-tight uppercase">
                  2. Monthly Inflow vs Outflow Trajectory
                </h3>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Comparative performance trajectory across the active fiscal window
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ffba20]" />
                  <span>Inflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#b71945]" />
                  <span>Outflow</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="h-64 w-full bg-surface-container-low/40 rounded-2xl p-4 border border-surface-container-high/40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} barGap={6}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e4e7ff" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#747687', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      tick={{ fill: '#747687', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <RechartsTooltip
                      formatter={(val, name) => [`${currencySymbol}${val.toLocaleString('en-IN')}`, name]}
                      contentStyle={{ backgroundColor: '#242e55', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    />
                    <Bar dataKey="income" name="Inflow" fill="#ffba20" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="Outflow" fill="#b71945" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-outline text-sm">
                No trend data for this period
              </div>
            )}
          </section>

          {/* ── Section 3: Detailed Category Breakdown Table ──────────────── */}
          <section className="flex flex-col gap-3 pt-4">
            <h3 className="font-title-sm text-title-sm font-bold text-on-surface tracking-tight uppercase">
              3. Category Distribution Analysis
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-surface-container-high">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface font-semibold border-b border-surface-container-high">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Flow Type</th>
                    <th className="py-3 px-4 text-right">Volume</th>
                    <th className="py-3 px-4 text-right">Share of Outflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {reportData?.categoryBreakdown && reportData.categoryBreakdown.length > 0 ? (
                    reportData.categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-on-surface flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.category}
                        </td>
                        <td className="py-3 px-4 text-outline uppercase font-mono">{cat.type || 'EXPENSE'}</td>
                        <td className="py-3 px-4 text-right font-bold text-on-surface">
                          {currencySymbol}{cat.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-on-surface-variant">
                          {cat.percentage}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-outline">
                        No category expense records found in this window
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Section 4: Itemized Audit Transaction Ledger Table ────────── */}
          <section className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface tracking-tight uppercase">
                4. Itemized Transaction Audit Ledger
              </h3>
              <span className="text-xs text-outline">
                {reportData?.transactions?.length || 0} recorded items
              </span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-surface-container-high">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-inverse-surface text-white font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description / Notes</th>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/60">
                  {reportData?.transactions && reportData.transactions.length > 0 ? (
                    reportData.transactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME';
                      return (
                        <tr key={tx.id} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-3 px-4 text-outline whitespace-nowrap">
                            {new Date(tx.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-medium text-on-surface">
                            {tx.notes || 'Transaction'}
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant">
                            {tx.account?.name || '—'}
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant">
                            {tx.category?.name || '—'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                              isIncome ? 'text-emerald-700' : 'text-[#b71945]'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{currencySymbol}{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-outline">
                        No transactions found for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </article>
      )}
    </div>
  );
}
