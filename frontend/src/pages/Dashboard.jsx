/**
 * Dashboard.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Main Financial Dashboard (US4 — T041 & T042)
 *
 * Features:
 *  • 4 KPI cards: Total Balance, Monthly Income, Monthly Expenses, Net Savings
 *  • 6-month Income vs Expense BarChart (Recharts)
 *  • Category Spending Donut/PieChart (Recharts)
 *  • Recent Transactions list (last 8)
 *  • Budget Alerts (≥70% usage warnings)
 *  • Accounts mini-panel
 *  • Loading skeletons & empty states
 *
 * Design: Stitch — finora_main_user_dashboard
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as PieTooltip, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, AlertTriangle,
  ArrowUpRight, ArrowDownRight, ChevronRight, Inbox, RefreshCw,
  TriangleAlert,
} from 'lucide-react';

import reportsApi from '../api/reportsApi';
import { useAuth } from '../context/AuthContext';
import {
  formatSixMonthData,
  formatCategoryPieData,
  formatCurrencyFull,
  formatCurrency,
  BarChartTooltip,
  PieChartTooltip,
  yAxisFormatter,
  COLORS,
} from '../utils/chartHelpers.jsx';

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-surface-container-high rounded-DEFAULT ${className}`} />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon: Icon, trend, trendLabel, variant = 'light', currency }) {
  const isDark = variant === 'dark';
  const isIncome = variant === 'income';
  const isExpense = variant === 'expense';
  const isSavings = variant === 'savings';

  const cardCls = isDark
    ? 'relative overflow-hidden bg-inverse-surface text-inverse-on-surface p-6 rounded-lg shadow-xl flex flex-col justify-between group transition-transform hover:-translate-y-1'
    : 'bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col justify-between group transition-transform hover:-translate-y-1';

  const iconContainerCls = isDark
    ? 'p-2.5 rounded-2xl bg-tertiary-fixed-dim text-on-tertiary-fixed flex items-center justify-center shadow-md'
    : isIncome
    ? 'p-2.5 rounded-2xl bg-surface-container-low text-primary flex items-center justify-center'
    : isExpense
    ? 'p-2.5 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center'
    : 'p-2.5 rounded-2xl bg-tertiary-fixed text-tertiary-container flex items-center justify-center';

  const trendCls = isDark
    ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest/15 text-tertiary-fixed font-label-sm text-label-sm'
    : isIncome
    ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-primary font-label-sm text-label-sm'
    : isExpense
    ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-secondary font-label-sm text-label-sm'
    : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm';

  const valueCls = isDark
    ? 'font-metric-number text-metric-number tracking-tight mt-1 text-surface-bright'
    : 'font-metric-number text-metric-number tracking-tight mt-1 text-on-surface';

  const labelCls = isDark
    ? 'font-label-md text-label-md text-outline-variant font-medium'
    : 'font-label-md text-label-md text-on-surface-variant font-medium';

  return (
    <div className={cardCls}>
      {isDark && (
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
      )}
      <div>
        <div className="flex items-center justify-between">
          <span className={iconContainerCls}>
            <Icon size={22} />
          </span>
          {trend !== undefined && (
            <span className={trendCls}>
              {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trendLabel || `${trend >= 0 ? '+' : ''}${trend}%`}
            </span>
          )}
        </div>
        <div className="mt-5">
          <p className={labelCls}>{title}</p>
          <h3 className={valueCls}>
            {value}
          </h3>
        </div>
      </div>
      {/* Bottom accent */}
      {isDark && (
        <div className="mt-6 flex items-end gap-1.5 h-7">
          {[3, 5, 7, 4, 6, 5, 7, 3].map((h, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full ${i % 3 === 2 ? 'bg-tertiary-fixed-dim' : i % 3 === 1 ? 'bg-tertiary-fixed-dim' : 'bg-tertiary-fixed-dim/40'}`}
              style={{ height: `${h * 4}px` }}
            />
          ))}
          <span className="text-xs text-outline-variant ml-auto font-label-sm">Live Synced</span>
        </div>
      )}
      {isIncome && (
        <div className="mt-6">
          <svg className="w-full h-8 overflow-visible" fill="none" viewBox="0 0 160 30">
            <path d="M0 24 C 20 22, 40 10, 60 14 C 80 18, 100 6, 120 10 C 140 14, 150 2, 160 3"
              stroke="#0045e4" strokeLinecap="round" strokeWidth="2.5" />
            <circle cx="160" cy="3" fill="#0045e4" r="3.5" />
          </svg>
        </div>
      )}
      {isExpense && (
        <div className="mt-6">
          <svg className="w-full h-8 overflow-visible" fill="none" viewBox="0 0 160 30">
            <path d="M0 8 C 25 10, 45 25, 75 18 C 105 10, 130 24, 160 20"
              stroke="#b71945" strokeLinecap="round" strokeWidth="2.5" />
            <circle cx="160" cy="20" fill="#b71945" r="3.5" />
          </svg>
        </div>
      )}
      {isSavings && (
        <div className="mt-6 flex flex-col gap-1.5">
          <div className="flex justify-between items-center font-label-sm text-label-sm text-on-surface-variant">
            <span>vs Income</span>
            <span className="font-bold text-on-surface">
              {value !== '—' ? 'Net' : '—'}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
            <div className="h-full bg-tertiary-fixed-dim rounded-full" style={{ width: '71%' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Transaction Item ──────────────────────────────────────────────────────────
function TransactionItem({ transaction, currency }) {
  const isIncome = transaction.type === 'INCOME';
  const date = new Date(transaction.date);
  const isToday = new Date().toDateString() === date.toDateString();
  const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();

  const dateLabel = isToday
    ? `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : isYesterday
    ? `Yesterday, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const iconBgCls = isIncome
    ? 'p-2.5 rounded-2xl bg-surface-container-high text-primary flex items-center justify-center'
    : 'p-2.5 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center';

  return (
    <div className="flex items-center justify-between p-3 rounded-DEFAULT hover:bg-surface-container-low transition-colors">
      <div className="flex items-center gap-3.5 min-w-0">
        <span
          className="p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: transaction.category?.color
              ? `${transaction.category.color}22`
              : '#f3f2ff',
            color: transaction.category?.color || '#434656',
          }}
        >
          <span className="material-symbols-outlined text-xl">
            {isIncome ? 'payments' : 'shopping_cart'}
          </span>
        </span>
        <div className="min-w-0">
          <h4 className="font-title-sm text-title-sm text-on-surface truncate">
            {transaction.notes || transaction.category?.name || (isIncome ? 'Income' : 'Expense')}
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {transaction.category?.name || '—'} • {transaction.account?.name || '—'} • {dateLabel}
          </p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <span
          className="font-title-sm text-title-sm font-bold"
          style={{ color: isIncome ? COLORS.primary : COLORS.expense }}
        >
          {isIncome ? '+' : '-'}{formatCurrencyFull(transaction.amount, currency)}
        </span>
        <span className="block font-label-sm text-label-sm text-outline">
          {isIncome ? 'Credited' : 'Debit'}
        </span>
      </div>
    </div>
  );
}

// ─── Budget Alert Item ─────────────────────────────────────────────────────────
function BudgetAlertItem({ alert, currency }) {
  const isExceeded = alert.status === 'EXCEEDED';
  const isNearLimit = alert.status === 'NEAR_LIMIT';

  const bgCls = isExceeded
    ? 'bg-error-container/30 border border-secondary/20'
    : 'bg-tertiary-fixed/20 border border-tertiary-fixed-dim/30';

  const badgeCls = isExceeded
    ? 'px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm flex items-center gap-1'
    : 'px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm';

  const badgeLabel = isExceeded ? 'Exceeded' : isNearLimit ? 'Near Limit' : 'Warning';

  const barColor = isExceeded ? '#b71945' : '#ffba20';
  const barWidth = Math.min(alert.percentage, 100);

  return (
    <div className={`p-3.5 rounded-DEFAULT flex flex-col gap-2 ${bgCls}`}>
      <div className="flex items-center justify-between">
        <span className="font-title-sm text-title-sm text-on-surface flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-base"
            style={{ color: alert.categoryColor }}
          >
            category
          </span>
          {alert.categoryName}
        </span>
        <span className={badgeCls}>
          {isExceeded && <span className="material-symbols-outlined text-xs">warning</span>}
          {badgeLabel}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
        <span className={isExceeded ? 'text-secondary font-bold' : ''}>
          {formatCurrencyFull(alert.spent, currency)} / {formatCurrencyFull(alert.limit, currency)}
        </span>
        <span className={`font-semibold ${isExceeded ? 'text-secondary' : 'text-on-surface'}`}>
          {alert.percentage}%
        </span>
      </div>
    </div>
  );
}

// ─── Account Mini Card ─────────────────────────────────────────────────────────
function AccountMiniCard({ account, currency, index }) {
  const initials = account.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const bgColors = ['bg-primary', 'bg-secondary', 'bg-tertiary-container', 'bg-primary-container'];
  const textColors = ['text-on-primary', 'text-on-secondary', 'text-on-tertiary-container', 'text-on-primary-container'];

  return (
    <div className="p-3.5 rounded-DEFAULT bg-gradient-to-br from-surface-container-low to-surface-container flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${bgColors[index % 4]} ${textColors[index % 4]}`}
          >
            {initials}
          </span>
          <div>
            <h5 className="font-title-sm text-title-sm text-on-surface leading-tight">{account.name}</h5>
            <span className="font-label-sm text-label-sm text-outline capitalize">{account.type?.toLowerCase()}</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline text-base">verified</span>
      </div>
      <div className="flex justify-between items-baseline mt-1">
        <span className="font-label-sm text-label-sm text-on-surface-variant">Balance</span>
        <span className="font-title-sm text-title-sm font-bold text-on-surface">
          {formatCurrencyFull(account.balance, currency)}
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const result = await reportsApi.getDashboardSummary();
      setData(result.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const chartData = data ? formatSixMonthData(data.sixMonthTrend) : [];
  const pieData = data ? formatCategoryPieData(data.categoryBreakdown) : [];
  const topCategory = pieData[0];

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col w-full gap-8">
        {/* Header skeleton */}
        <Skeleton className="h-24 w-full" />
        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-80" />
          <Skeleton className="lg:col-span-5 h-80" />
        </div>
        {/* Lower section skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-6 h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
          <Skeleton className="lg:col-span-3 h-96" />
        </div>
      </div>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="p-4 rounded-full bg-error-container">
          <TriangleAlert size={32} className="text-on-error-container" />
        </div>
        <div className="text-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">Failed to load dashboard</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchDashboard()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-title-sm text-title-sm transition-all hover:bg-primary/90"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  const hasNoData = !data || (
    data.monthlyIncome === 0 &&
    data.monthlyExpenses === 0 &&
    data.accountCount === 0
  );

  return (
    <div className="flex flex-col w-full gap-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-lg shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Financial Health Overview</h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim" />
              {data?.accountCount || 0} account{data?.accountCount !== 1 ? 's' : ''} synced
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            {greeting}, <span className="font-semibold text-on-surface">{user?.name?.split(' ')[0] || 'there'}</span>
            {data?.netSavings > 0 && (
              <>
                {' '}— You have a net surplus of{' '}
                <span className="text-tertiary font-semibold">{formatCurrencyFull(data.netSavings, currency)}</span> this month.
              </>
            )}
            {data?.netSavings < 0 && (
              <>
                {' '}— Expenses exceed income by{' '}
                <span className="text-secondary font-semibold">{formatCurrencyFull(Math.abs(data.netSavings), currency)}</span> this month.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-title-sm text-title-sm transition-all disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Budget Alerts (T042) ───────────────────────────────────────── */}
      {data?.budgetAlerts && data.budgetAlerts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Budget Alerts</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm">
              {data.budgetAlerts.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.budgetAlerts.map((alert) => (
              <BudgetAlertItem key={alert.id} alert={alert} currency={currency} />
            ))}
          </div>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Balance"
          value={formatCurrencyFull(data?.totalBalance || 0, currency)}
          icon={Wallet}
          variant="dark"
          currency={currency}
        />
        <KpiCard
          title="Monthly Income"
          value={formatCurrencyFull(data?.monthlyIncome || 0, currency)}
          icon={TrendingUp}
          variant="income"
          currency={currency}
        />
        <KpiCard
          title="Monthly Expenses"
          value={formatCurrencyFull(data?.monthlyExpenses || 0, currency)}
          icon={TrendingDown}
          variant="expense"
          currency={currency}
        />
        <KpiCard
          title="Net Savings"
          value={
            data
              ? `${data.netSavings >= 0 ? '+' : '-'}${formatCurrencyFull(Math.abs(data.netSavings), currency)}`
              : '—'
          }
          icon={PiggyBank}
          variant="savings"
          currency={currency}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Income vs Expense BarChart (7 cols) */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-6 lg:p-7 rounded-lg shadow-sm flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">Income vs Expense</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                  Last 6 Months
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Month-by-month comparative analysis
              </p>
            </div>
            <div className="flex items-center gap-4 font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.income }} />
                <span className="text-on-surface">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.expenseLight }} />
                <span className="text-on-surface">Expense</span>
              </div>
            </div>
          </div>

          {chartData.length === 0 || chartData.every(d => d.income === 0 && d.expense === 0) ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-on-surface-variant">
              <Inbox size={40} className="text-outline" />
              <p className="font-body-md text-body-md">No transaction data for the last 6 months</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={4}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f3f2ff" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => yAxisFormatter(v, currency)}
                    tick={{ fill: COLORS.onSurfaceVariant, fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
                    axisLine={false}
                    tickLine={false}
                    width={55}
                  />
                  <RechartsTooltip
                    content={<BarChartTooltip currency={currency} />}
                    cursor={{ fill: '#f3f2ff', radius: 4 }}
                  />
                  <Bar dataKey="income" name="Income" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expense" name="Expense" fill={COLORS.expenseLight} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Spending Donut (5 cols) */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-6 lg:p-7 rounded-lg shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Category Spending</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Expense distribution this month</p>
            </div>
            {data?.monthlyExpenses > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md font-bold">
                Total {formatCurrency(data.monthlyExpenses, currency)}
              </div>
            )}
          </div>

          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-on-surface-variant">
              <Inbox size={40} className="text-outline" />
              <p className="font-body-md text-body-md text-center">No expense data this month</p>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="relative flex items-center justify-center">
                <div style={{ width: 208, height: 208 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={2}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <PieTooltip content={<PieChartTooltip currency={currency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Donut center label */}
                {topCategory && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs uppercase font-label-sm text-outline tracking-wider">Top Spend</span>
                    <span className="font-headline-md text-headline-md text-on-surface text-center leading-tight px-2">
                      {topCategory.name.length > 10 ? topCategory.name.slice(0, 10) + '…' : topCategory.name}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">
                      {topCategory.percentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Category Legend Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                {pieData.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-DEFAULT bg-surface-container-low">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-label-sm text-label-sm text-on-surface truncate">{item.name}</span>
                    </div>
                    <span className="font-label-sm text-label-sm font-semibold text-on-surface flex-shrink-0 ml-1">
                      {formatCurrency(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Lower Section: Transactions + Budget Health + Accounts ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Recent Transactions (6 cols) */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live audit ledger of recent activity</p>
            </div>
            <Link
              to="/transactions"
              className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} currency={currency} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
                <Inbox size={40} className="text-outline" />
                <p className="font-body-md text-body-md">No transactions yet</p>
                <Link
                  to="/transactions"
                  className="px-4 py-2 rounded-full bg-primary text-on-primary font-title-sm text-title-sm transition-all hover:bg-primary/90"
                >
                  Add your first transaction
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Budget Health (3 cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Budget Health</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Monthly quotas</p>
            </div>
            {data?.budgetAlerts && data.budgetAlerts.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold">
                {data.budgetAlerts.length} alert{data.budgetAlerts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {data?.budgetAlerts && data.budgetAlerts.length > 0 ? (
              data.budgetAlerts.slice(0, 4).map((alert) => (
                <BudgetAlertItem key={alert.id} alert={alert} currency={currency} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline">task_alt</span>
                <p className="font-body-md text-body-md text-center">All budgets on track</p>
                <Link
                  to="/budgets"
                  className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-label-md text-label-md transition-all hover:bg-surface-container-high"
                >
                  Manage Budgets
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Accounts Overview (3 cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-lg shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Accounts</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {data?.accountCount || 0} connected node{data?.accountCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Link
              to="/accounts"
              className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors"
              title="Manage Accounts"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {data?.accounts && data.accounts.length > 0 ? (
              data.accounts.slice(0, 4).map((account, i) => (
                <AccountMiniCard key={account.id} account={account} currency={currency} index={i} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-on-surface-variant">
                <Inbox size={36} className="text-outline" />
                <p className="font-body-md text-body-md text-center">No accounts yet</p>
                <Link
                  to="/accounts"
                  className="px-4 py-2 rounded-full bg-primary text-on-primary font-title-sm text-title-sm transition-all hover:bg-primary/90"
                >
                  Add Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
