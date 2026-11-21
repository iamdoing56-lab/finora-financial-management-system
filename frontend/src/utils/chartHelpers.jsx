/**
 * chartHelpers.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Recharts data formatters and custom components for the Finora Dashboard.
 *
 * Design system colors:
 *   Income  → #ffba20  (tertiary-fixed-dim / golden)
 *   Expense → #b71945  (secondary / coral-red)
 *   Primary → #0045e4
 *   Surface → #fbf8ff
 */

import React from 'react';

// ─── Design System Tokens ─────────────────────────────────────────────────────
export const COLORS = {
  income: '#ffba20',
  expense: '#b71945',
  expenseLight: '#fd5275',
  primary: '#0045e4',
  primaryContainer: '#3361ff',
  surface: '#fbf8ff',
  surfaceContainer: '#ecedff',
  surfaceContainerLow: '#f3f2ff',
  outline: '#747687',
  onSurface: '#0e193e',
  onSurfaceVariant: '#434656',
  inverseSurface: '#242e55',
  inverseOnSurface: '#efefff',
};

// Default palette for category donut slices when category.color is unavailable
export const CATEGORY_PALETTE = [
  '#ffba20', '#242e55', '#fd5275', '#3361ff',
  '#b8c4ff', '#747687', '#10B981', '#f59e0b',
  '#8b5cf6', '#06b6d4',
];

// ─── 6-Month Trend Formatter ──────────────────────────────────────────────────
/**
 * Converts the backend sixMonthTrend array into Recharts-ready data.
 * @param {Array} trend - Array of { year, month, monthLabel, income, expense }
 * @returns {Array} Recharts data array with { name, income, expense }
 */
export function formatSixMonthData(trend = []) {
  return trend.map((item) => ({
    name: item.monthLabel || formatMonthLabel(item.year, item.month),
    income: parseFloat(item.income) || 0,
    expense: parseFloat(item.expense) || 0,
  }));
}

function formatMonthLabel(year, month) {
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

// ─── Category Pie Data Formatter ──────────────────────────────────────────────
/**
 * Converts the backend categoryBreakdown array into Recharts PieChart data.
 * @param {Array} breakdown - Array of { name, amount, percentage, color }
 * @returns {Array} Recharts data with { name, value, color, percentage }
 */
export function formatCategoryPieData(breakdown = []) {
  return breakdown.map((item, index) => ({
    name: item.name,
    value: parseFloat(item.amount) || 0,
    color: item.color || CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
    percentage: item.percentage || 0,
  }));
}

// ─── Currency Formatter ───────────────────────────────────────────────────────
/**
 * Formats a number as Indian currency (compact for charts).
 * @param {number} value
 * @param {string} currency - symbol like '₹' or '$'
 * @returns {string}
 */
export function formatCurrency(value, currency = '₹') {
  if (value === null || value === undefined || isNaN(value)) return `${currency}0`;
  const abs = Math.abs(value);
  if (abs >= 10_00_000) return `${currency}${(value / 10_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(1)}K`;
  return `${currency}${value.toFixed(0)}`;
}

/**
 * Full currency format with 2 decimal places and Indian number system.
 */
export function formatCurrencyFull(value, currency = '₹') {
  if (value === null || value === undefined || isNaN(value)) return `${currency}0.00`;
  return `${currency}${Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Custom Bar Chart Tooltip ─────────────────────────────────────────────────
/**
 * Custom tooltip component for the Income vs Expense BarChart.
 */
export function BarChartTooltip({ active, payload, label, currency = '₹' }) {
  if (!active || !payload || !payload.length) return null;

  const income = payload.find((p) => p.dataKey === 'income')?.value || 0;
  const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0;
  const net = income - expense;

  return (
    <div className="bg-inverse-surface text-inverse-on-surface rounded-DEFAULT shadow-xl p-3 min-w-[160px] pointer-events-none">
      <p className="font-label-sm text-label-sm text-outline-variant border-b border-white/10 pb-1 mb-2">
        {label}
      </p>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.income }} />
            <span className="text-outline-variant">Income</span>
          </span>
          <span className="font-semibold" style={{ color: COLORS.income }}>
            {formatCurrencyFull(income, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.expenseLight }} />
            <span className="text-outline-variant">Expense</span>
          </span>
          <span className="font-semibold" style={{ color: COLORS.expenseLight }}>
            {formatCurrencyFull(expense, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-xs border-t border-white/10 pt-1 mt-1">
          <span className="text-primary-fixed">Net</span>
          <span
            className="font-bold"
            style={{ color: net >= 0 ? COLORS.income : COLORS.expenseLight }}
          >
            {net >= 0 ? '+' : ''}{formatCurrencyFull(net, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────
/**
 * Custom tooltip component for the Category Spending PieChart.
 */
export function PieChartTooltip({ active, payload, currency = '₹' }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  if (!item) return null;

  return (
    <div className="bg-inverse-surface text-inverse-on-surface rounded-DEFAULT shadow-xl p-3 min-w-[140px] pointer-events-none">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
        <span className="font-label-md text-label-md font-semibold">{item.name}</span>
      </div>
      <p className="font-metric-number text-sm font-bold" style={{ color: item.payload.color }}>
        {formatCurrencyFull(item.value, currency)}
      </p>
      <p className="font-label-sm text-label-sm text-outline-variant">
        {item.payload.percentage}% of spending
      </p>
    </div>
  );
}

// ─── Y-Axis Formatter ─────────────────────────────────────────────────────────
export function yAxisFormatter(value, currency = '₹') {
  return formatCurrency(value, currency);
}
