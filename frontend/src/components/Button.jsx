/**
 * Button Component
 *
 * Reusable button with multiple variants matching the Stitch design system.
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'ghost' | 'danger'  (default: 'primary')
 *   size:    'sm' | 'md' | 'lg'                             (default: 'md')
 *   loading: boolean — shows a spinner and disables the button
 *   disabled: boolean
 *   className: additional CSS classes
 *   children: button label/content
 *   ...props: any other valid button attributes (onClick, type, etc.)
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  // Base styles shared by all variants
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variant-specific styles
  const variants = {
    primary:   'bg-[#3361ff] text-white hover:bg-[#0037ba] focus:ring-[#3361ff] shadow-md hover:shadow-lg',
    secondary: 'bg-[#ecedff] text-[#0045e4] hover:bg-[#dde1ff] focus:ring-[#0045e4]',
    ghost:     'bg-transparent text-[#434656] hover:bg-[#ecedff] hover:text-[#0e193e] focus:ring-[#c4c5d8]',
    danger:    'bg-[#ba1a1a] text-white hover:bg-[#93000a] focus:ring-[#ba1a1a] shadow-md',
  };

  // Size-specific styles
  const sizes = {
    sm: 'px-4 py-1.5 text-[13px] leading-[18px]',
    md: 'px-5 py-2.5 text-[14px] leading-[20px]',
    lg: 'px-7 py-3 text-[16px] leading-[22px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
