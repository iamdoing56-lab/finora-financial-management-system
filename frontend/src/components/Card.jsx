/**
 * Card Component
 *
 * A clean, elevated surface container matching the Stitch design system.
 *
 * Props:
 *   className: additional CSS classes
 *   padding: 'none' | 'sm' | 'md' | 'lg'  (default: 'md')
 *   children: card content
 *   ...props: any other valid div attributes
 */
export default function Card({ className = '', padding = 'md', children, ...props }) {
  const paddings = {
    none: '',
    sm:   'p-4',
    md:   'p-6',
    lg:   'p-8',
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-[#e4e7ff]/50 ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
