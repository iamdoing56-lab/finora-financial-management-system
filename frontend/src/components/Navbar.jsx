import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Navbar Component
 *
 * Top navigation bar. Only rendered inside the authenticated layout.
 *
 * Desktop: shows greeting and quick actions (notifications, add transaction).
 * Mobile: shows hamburger button to open the Sidebar drawer.
 *
 * Props:
 *   onMobileMenuOpen: function — called to open the Sidebar drawer on mobile
 *   pageTitle:        string — current page title displayed in the header
 */
export default function Navbar({ onMobileMenuOpen, pageTitle }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening';

  return (
    <header className="fixed top-0 left-0 md:left-72 right-0 h-16 md:h-20 bg-white/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 px-4 md:px-8 flex items-center justify-between">

      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2.5 rounded-full hover:bg-[#ecedff] text-[#434656] hover:text-[#0e193e] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        {/* Page title / greeting */}
        <div className="flex flex-col">
          {/* Desktop: shows greeting with name */}
          <p className="hidden md:block text-headline-md text-[#0e193e]">
            {greeting}, {user?.name?.split(' ')[0] || 'User'} 👋
          </p>
          {/* Mobile: shows page title */}
          <p className="md:hidden text-title-sm text-[#0e193e] font-semibold">
            {pageTitle || 'Finora'}
          </p>
          <p className="hidden md:block text-body-sm text-[#747687]">
            Welcome back to your financial overview
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications icon */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2.5 rounded-full bg-white text-[#747687] hover:text-[#0e193e] shadow-sm border border-[#e4e7ff] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {/* Unread indicator dot — placeholder; replaced with real count in Phase 9 */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#b71945]" />
        </button>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-[#3361ff] flex items-center justify-center text-white font-bold text-sm cursor-pointer select-none"
          onClick={() => navigate('/settings')}
          title="Go to settings"
        >
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
