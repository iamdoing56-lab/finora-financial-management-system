import React from 'react';

/**
 * Dynamic Budget Progress Bar Component (T046)
 *
 * Tier coloring rules:
 *   - Normal   (<70%)    → Emerald Green (#10B981 / bg-emerald-500)
 *   - Warning  (70-100%) → Amber / Golden (#ffba20 / bg-amber-500)
 *   - Exceeded (>100%)   → Crimson / Coral Red (#b71945 / bg-rose-600)
 *
 * Props:
 *   @param {number} percentage - Percentage spent against limit (e.g. 68.5, 114.2)
 *   @param {string} status - 'NORMAL' | 'WARNING' | 'EXCEEDED'
 *   @param {string} height - Tailwind height class, e.g. 'h-2' or 'h-2.5' (default: 'h-2.5')
 *   @param {string} className - Additional CSS classes
 *   @param {boolean} showLabel - Whether to display percentage text beside the bar
 */
export default function BudgetProgressBar({
  percentage = 0,
  status = 'NORMAL',
  height = 'h-2.5',
  className = '',
  showLabel = false,
}) {
  const numericPct = typeof percentage === 'number' ? percentage : parseFloat(percentage) || 0;

  // Determine effective status if not explicitly passed
  let resolvedStatus = status;
  if (!resolvedStatus) {
    if (numericPct > 100) resolvedStatus = 'EXCEEDED';
    else if (numericPct >= 70) resolvedStatus = 'WARNING';
    else resolvedStatus = 'NORMAL';
  }

  // Bar fill color
  let barColorCls = 'bg-emerald-500';
  let trackColorCls = 'bg-surface-container-high';
  let textBadgeCls = 'text-emerald-600';

  if (resolvedStatus === 'EXCEEDED' || numericPct > 100) {
    barColorCls = 'bg-[#b71945]'; // secondary / crimson
    trackColorCls = 'bg-[#ffd9dc]'; // secondary-fixed
    textBadgeCls = 'text-[#b71945] font-bold';
  } else if (resolvedStatus === 'WARNING' || numericPct >= 70) {
    barColorCls = 'bg-[#ffba20]'; // tertiary-fixed-dim / golden amber
    trackColorCls = 'bg-surface-container-high';
    textBadgeCls = 'text-amber-600 font-bold';
  }

  // Visual width is capped at 100%
  const clampedWidth = Math.min(Math.max(numericPct, 0), 100);

  return (
    <div className={`w-full flex items-center gap-2 ${className}`}>
      <div
        className={`w-full ${trackColorCls} rounded-full ${height} overflow-hidden relative shadow-inner`}
        role="progressbar"
        aria-valuenow={numericPct}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={`${barColorCls} h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs whitespace-nowrap ${textBadgeCls}`}>
          {numericPct.toFixed(1)}%
        </span>
      )}
    </div>
  );
}
