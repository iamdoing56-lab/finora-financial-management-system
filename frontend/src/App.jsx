import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// ─── Page imports (lazy stubs — replaced with real pages in Phase 3+) ────────
// Auth pages (Phase 3)
import Login    from './pages/Login';
import Register from './pages/Register';

// User pages (Phase 3–9) — stub placeholders until implemented
import Dashboard     from './pages/Dashboard';
import Accounts      from './pages/Accounts';
import Transactions  from './pages/Transactions';
import Categories    from './pages/Categories';
import Budgets       from './pages/Budgets';
import Reports       from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings      from './pages/Settings';

// Admin pages (Phase 10) — stub placeholders until implemented
import AdminDashboard   from './pages/AdminDashboard';
import AdminUsers       from './pages/AdminUsers';
import AdminTransactions from './pages/AdminTransactions';
import AdminReports     from './pages/AdminReports';
import AdminSettings    from './pages/AdminSettings';

// ─── Route Guards ─────────────────────────────────────────────────────────────

/**
 * ProtectedRoute — Redirects to /login if the user is not authenticated.
 * Uses AuthContext to check the session state.
 */
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // While checking localStorage session, show nothing (avoids flash)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fbf8ff]">
        <div className="w-8 h-8 border-4 border-[#3361ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render nested routes inside the layout
  return <AppLayout />;
}

/**
 * AdminRoute — Redirects non-admin users to /dashboard.
 * Must be nested inside ProtectedRoute so req.user already exists.
 */
function AdminRoute() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// ─── App Layout (sidebar + navbar shell) ──────────────────────────────────────

/**
 * AppLayout wraps authenticated pages with the Sidebar and Navbar.
 * Manages the mobile drawer open/close state here so both components can share it.
 */
function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Derive a simple page title from the current URL path
  const pageTitle = location.pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' › ') || 'Dashboard';

  return (
    <div className="min-h-screen bg-[#fbf8ff] flex">
      {/* Sidebar (desktop fixed / mobile drawer) */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content area — shifted right on desktop to account for sidebar */}
      <div className="flex-1 md:ml-72 flex flex-col">
        {/* Top navigation bar */}
        <Navbar
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
          pageTitle={pageTitle}
        />

        {/* Page content — padding-top to clear the navbar */}
        <main className="flex-1 pt-16 md:pt-20 px-4 md:px-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Router ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — accessible without authentication */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/accounts"      element={<Accounts />} />
        <Route path="/transactions"  element={<Transactions />} />
        <Route path="/categories"    element={<Categories />} />
        <Route path="/budgets"       element={<Budgets />} />
        <Route path="/reports"       element={<Reports />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings"      element={<Settings />} />

        {/* Admin-only routes — require ADMIN role */}
        <Route element={<AdminRoute />}>
          <Route path="/admin"              element={<AdminDashboard />} />
          <Route path="/admin/users"        element={<AdminUsers />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/reports"      element={<AdminReports />} />
          <Route path="/admin/settings"     element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Catch-all: redirect root and unknown paths */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// ─── Root App Component ────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
