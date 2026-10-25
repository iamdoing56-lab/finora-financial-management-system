/**
 * Badge Component
 *
 * A small pill label used for transaction types, user roles, account status,
 * budget tiers, and notification types.
 *
 * Props:
 *   variant: 'income' | 'expense' | 'admin' | 'user' | 'active' | 'archived' |
 *            'normal' | 'warning' | 'overage' | 'default'
 *   children: badge text
 *   className: additional CSS classes
 */
export default function Badge({ variant = 'default', className = '', children }) {
  const styles = {
    income:   'bg-[#10b981]/10 text-[#059669] border border-[#10b981]/20',
    expense:  'bg-[#ef4444]/10 text-[#dc2626] border border-[#ef4444]/20',
    admin:    'bg-[#dde1ff] text-[#0045e4] border border-[#b8c4ff]',
    user:     'bg-[#ecedff] text-[#434656] border border-[#c4c5d8]',
    active:   'bg-[#10b981]/10 text-[#059669] border border-[#10b981]/20',
    archived: 'bg-[#f3f4f6] text-[#6b7280] border border-[#d1d5db]',
    normal:   'bg-[#10b981]/10 text-[#059669] border border-[#10b981]/20',
    warning:  'bg-[#f59e0b]/10 text-[#d97706] border border-[#f59e0b]/20',
    overage:  'bg-[#ef4444]/10 text-[#dc2626] border border-[#ef4444]/20',
    default:  'bg-[#ecedff] text-[#434656] border border-[#c4c5d8]',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-semibold ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
