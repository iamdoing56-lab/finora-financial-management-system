/**
 * StatCard Component
 *
 * KPI metric card used on the Dashboard and Admin Dashboard.
 * Matches the Stitch dashboard designs showing Total Balance, Income, Expenses, Net Savings.
 *
 * Props:
 *   title:     string — metric label (e.g. "Total Balance")
 *   value:     string — formatted value (e.g. "$8,425.00")
 *   icon:      Lucide React icon component
 *   trend:     string — optional trend text (e.g. "+12.4%")
 *   trendUp:   boolean — true for positive trend (green), false for negative (red)
 *   variant:   'dark' | 'light'  (default: 'light') — 'dark' = inverse-surface card
 *   className: additional CSS classes
 */
export default function StatCard({ title, value, icon: Icon, trend, trendUp, variant = 'light', className = '' }) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-6 flex flex-col justify-between
        group transition-transform duration-300 hover:-translate-y-1
        ${isDark
          ? 'bg-[#242e55] text-white shadow-xl'
          : 'bg-white text-[#0e193e] shadow-sm border border-[#e4e7ff]/50'
        }
        ${className}
      `}
    >
      {/* Decorative glow */}
      {isDark && (
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#3361ff]/20 blur-2xl pointer-events-none" />
      )}

      <div>
        <div className="flex items-center justify-between">
          {/* Icon */}
          <span className={`p-2.5 rounded-2xl flex items-center justify-center ${
            isDark ? 'bg-[#ffba20] text-[#271900]' : 'bg-[#f3f2ff] text-[#0045e4]'
          }`}>
            {Icon && <Icon size={24} strokeWidth={2} />}
          </span>

          {/* Trend badge */}
          {trend && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-semibold ${
              isDark
                ? 'bg-white/15 text-[#ffba20]'
                : trendUp
                  ? 'bg-[#10b981]/10 text-[#059669]'
                  : 'bg-[#ef4444]/10 text-[#dc2626]'
            }`}>
              {trendUp ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>

        <div className="mt-5">
          <p className={`text-label-md font-medium ${isDark ? 'text-[#b8c4ff]' : 'text-[#747687]'}`}>
            {title}
          </p>
          <p className="text-metric-number tracking-tight mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
