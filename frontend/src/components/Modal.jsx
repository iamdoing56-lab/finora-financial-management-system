import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 *
 * A centered overlay modal with backdrop blur.
 * On mobile (<768px): renders as a bottom sheet / full-width card.
 * On desktop: centered dialog.
 *
 * Props:
 *   isOpen:   boolean — controls visibility
 *   onClose:  function — called when backdrop or X button is clicked
 *   title:    string — modal heading
 *   size:     'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 *   children: modal body content
 */
export default function Modal({ isOpen, onClose, title, size = 'md', children }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-[#242e55]/40 backdrop-blur-sm" />

      {/* Modal panel — stop click propagation so clicking inside doesn't close */}
      <div
        className={`relative w-full ${widths[size]} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e4e7ff]">
          <h2 className="text-headline-md text-[#0e193e]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#ecedff] text-[#747687] hover:text-[#0e193e] transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
