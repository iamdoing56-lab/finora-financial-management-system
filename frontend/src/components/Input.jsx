/**
 * Input Component
 *
 * A styled text input (also works for email, password, number, date).
 * Displays an optional label, an optional helper/error message, and
 * shows a red border when there's an error.
 *
 * Props:
 *   label:     string — label text above the input
 *   error:     string — validation error message (shows in red)
 *   id:        string — HTML id (also links label htmlFor)
 *   className: additional CSS classes
 *   ...props:  any valid input attributes (type, value, onChange, placeholder, etc.)
 */
export default function Input({ label, error, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-label-md text-[#434656] font-medium"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`
          w-full px-4 py-3 rounded-xl
          bg-[#f3f2ff] text-[#0e193e]
          text-body-md
          border-2 transition-colors duration-200
          placeholder:text-[#747687]
          focus:outline-none focus:bg-white
          ${error
            ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20'
            : 'border-transparent focus:border-[#3361ff] focus:ring-2 focus:ring-[#3361ff]/20'
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <p className="text-label-sm text-[#ba1a1a] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}
