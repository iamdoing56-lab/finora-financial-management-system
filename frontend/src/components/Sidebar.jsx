import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, PieChart,
  Tag, TrendingUp, FileText, Bell, Settings, LogOut,
  Shield, Users, BarChart3, X
} from 'lucide-react';

/**
 * Sidebar Component
 *
 * Desktop: fixed 288px sidebar on the left.
 * Mobile (<768px): slide-out drawer triggered by hamburger button in Navbar.
 *
 * Props:
 *   mobileOpen:   boolean — whether the drawer is visible on mobile
 *   onMobileClose: function — called to close the drawer
 */

// Navigation items for regular USER role
const USER_NAV = [
  {
    group: 'Main',
    items: [
      { to: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
    ],
  },
  {
    group: 'Finances',
    items: [
      { to: '/accounts',      label: 'Accounts',     icon: Wallet },
      { to: '/transactions',  label: 'Transactions', icon: ArrowLeftRight },
      { to: '/budgets',       label: 'Budgets',      icon: PieChart },
      { to: '/categories',    label: 'Categories',   icon: Tag },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { to: '/reports',       label: 'Reports',      icon: FileText },
    ],
  },
  {
    group: 'Other',
    items: [
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings',      label: 'Settings',      icon: Settings },
    ],
  },
];

// Additional navigation items for ADMIN role (appended below user nav)
const ADMIN_NAV = [
  {
    group: 'Admin',
    items: [
      { to: '/admin',              label: 'Admin Dashboard', icon: Shield },
      { to: '/admin/users',        label: 'Users',           icon: Users },
      { to: '/admin/transactions', label: 'All Transactions', icon: ArrowLeftRight },
      { to: '/admin/reports',      label: 'Reports',         icon: BarChart3 },
      { to: '/admin/settings',     label: 'Settings',        icon: Settings },
    ],
  },
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navGroups = isAdmin ? [...USER_NAV, ...ADMIN_NAV] : USER_NAV;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Shared sidebar content used for both desktop and mobile drawer
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#e4e7ff]">
        {/* Logo mark — geometric clover in brand blue */}
        <div className="w-8 h-8 rounded-full bg-[#3361ff] flex items-center justify-center text-white font-bold text-sm select-none">
          F
        </div>
        <div className="flex flex-col">
          <span className="text-headline-md text-[#0e193e] leading-none">Finora</span>
          <span className="text-label-sm text-[#747687] tracking-wider uppercase mt-0.5">Finance OS</span>
        </div>
        {/* Close button (mobile only) */}
        <button
          onClick={onMobileClose}
          className="ml-auto p-2 rounded-full hover:bg-[#ecedff] text-[#747687] md:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group} className="flex flex-col gap-1">
            <span className="px-3 text-label-sm text-[#747687] font-bold tracking-wider uppercase mb-1">
              {group.group}
            </span>
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard' || to === '/admin'}
                onClick={onMobileClose} // close drawer on link click (mobile)
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all min-h-[44px] ${
                    isActive
                      ? 'bg-[#242e55] text-white font-semibold shadow-lg'
                      : 'text-[#434656] hover:bg-[#ecedff] hover:text-[#0e193e]'
                  }`
                }
              >
                <Icon size={20} strokeWidth={2} />
                <span className="text-title-sm">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-[#e4e7ff]">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#f3f2ff]">
          <div className="w-9 h-9 rounded-full bg-[#3361ff] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-title-sm text-[#0e193e] truncate leading-tight">{user?.name}</p>
            <p className="text-label-sm text-[#747687] truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-[#ffdad6] text-[#747687] hover:text-[#ba1a1a] transition-colors flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar (always visible ≥768px) ─────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-white shadow-[1px_0_8px_rgba(0,0,0,0.06)] z-40 flex-col">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer (<768px) ─────────────────────────────────────── */}
      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={onMobileClose}
        >
          <div className="absolute inset-0 bg-[#242e55]/40 backdrop-blur-sm" />
        </div>
      )}

      {/* Slide-out drawer panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 flex flex-col md:hidden
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-hidden={!mobileOpen}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
