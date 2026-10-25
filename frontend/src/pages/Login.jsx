import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Wallet,
  Send,
  CheckCircle,
  AlertCircle,
  Sparkles,
  User,
  Shield,
  BadgeCheck,
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick fill helper for presentation/demo
  const handleQuickFill = (type) => {
    setErrorMessage('');
    if (type === 'admin') {
      setEmail('admin@finora.app');
      setPassword('Admin@123456');
    } else {
      setEmail('rahul.sharma@finora.in');
      setPassword('FinoraSecure@2025');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const data = await authApi.login({ email, password });

      // Save token and user in context + localStorage
      login(data.token, data.user);

      // Route based on role
      if (data.user?.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      const apiMessage =
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.';
      setErrorMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] text-[#0e193e] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden">
      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fbf8ff]/85 backdrop-blur-xl border-b border-[#e4e7ff]/70 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          {/* Logo & Security Pill */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0045e4] to-[#3361ff] flex items-center justify-center shadow-md shadow-[#0045e4]/25">
              {/* Finora 4-circle clover emblem */}
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              </div>
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-[#0e193e] flex items-center">
              Finora
              <span className="w-2 h-2 rounded-full bg-[#0045e4] ml-1"></span>
            </span>

            <div className="hidden sm:flex items-center gap-1.5 ml-4 px-3 py-1 bg-[#e4e7ff]/60 border border-[#c4c5d8]/40 rounded-full text-[#434656] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#0045e4]" />
              <span>Bank-Grade 256-bit Encryption</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-[#3361ff] text-white font-semibold text-sm shadow-sm transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-full text-[#434656] hover:text-[#0e193e] hover:bg-[#e4e7ff]/50 font-semibold text-sm transition-all"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Ambient Backdrop Glows ────────────────────────────────────── */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#0045e4]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full bg-[#dde1ff]/60 blur-3xl pointer-events-none" />

      {/* ─── Main Two-Column Stage ─────────────────────────────────────── */}
      <main className="w-full pt-28 pb-16 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          {/* ─── LEFT COLUMN: Brand Showcase & Metric Cards (5 Cols) ──── */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6">
            {/* Unified Treasury Platform Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e4e7ff]/70 text-[#434656] w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#3361ff] animate-pulse"></span>
              <span className="text-xs font-bold tracking-wider uppercase">
                Unified Treasury Platform
              </span>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-[#0e193e] tracking-tight leading-tight">
                Financial clarity for modern enterprises.
              </h2>
              <p className="text-sm text-[#434656] mt-2.5 leading-relaxed">
                Real-time balance monitoring, compliant multi-tier approvals, and
                lightning-fast domestic settlement.
              </p>
            </div>

            {/* Showcase Stat Card 1: Liquid Assets with Sparkline */}
            <div className="p-5 rounded-2xl bg-white border border-[#dde1ff]/60 shadow-lg shadow-[#0045e4]/5 flex flex-col gap-2 transform hover:-translate-y-0.5 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#434656]">
                  <Wallet className="w-5 h-5 text-[#0045e4]" />
                  <span className="text-xs font-semibold">Daily Total Liquid Assets</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e4e7ff] text-[#0045e4] text-xs font-bold">
                  +14.2%
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold tracking-tight text-[#0e193e]">
                  ₹3,75,400<span className="text-lg text-[#434656]">.00</span>
                </span>
              </div>
              {/* Sparkline curve */}
              <div className="w-full h-9 mt-1">
                <svg className="w-full h-full text-[#0045e4]" fill="none" viewBox="0 0 240 32">
                  <path
                    d="M0 24 C40 24, 60 12, 100 16 C140 20, 160 6, 200 8 C220 10, 230 4, 240 2"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M0 24 C40 24, 60 12, 100 16 C140 20, 160 6, 200 8 C220 10, 230 4, 240 2 L240 32 L0 32 Z"
                    fill="currentColor"
                    fillOpacity="0.08"
                  />
                </svg>
              </div>
            </div>

            {/* Showcase Stat Card 2: Recent Dispatch */}
            <div className="p-4 rounded-2xl bg-[#f3f2ff] border border-[#dde1ff]/50 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#dde1ff] flex items-center justify-center text-[#0045e4]">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0e193e]">HDFC Corporate Pool</p>
                  <p className="text-xs text-[#434656]">Scheduled UPI Payout • #FT9812</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#0e193e]">- ₹12,500</span>
                <span className="block text-xs font-semibold text-[#745200]">Processing</span>
              </div>
            </div>

            {/* RBI Regulatory Badge */}
            <div className="flex items-center gap-2 text-[#434656] text-xs pt-1">
              <BadgeCheck className="w-4 h-4 text-[#0045e4]" />
              <span>Regulated by Reserve Bank of India framework guidelines</span>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Authentication Card Hub (7 Cols) ───────── */}
          <div className="w-full lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-xl p-7 sm:p-10 flex flex-col gap-5 relative">
              {/* Top Card Header */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3361ff]"></span>
                    <span className="text-xs font-extrabold tracking-widest uppercase text-[#434656]">
                      Portal Access
                    </span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0e193e] tracking-tight">
                  Sign in to Finora
                </h1>
                <p className="text-sm text-[#434656]">
                  Manage your finances with seamless precision
                  <span className="text-[#0045e4] font-black">.</span>
                </p>
              </div>

              {/* Demo Quick Fill Box */}
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#0045e4]" />
                    Demo Quick Fill
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Presentation ready</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('user')}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#dde1ff] text-slate-800 text-xs font-semibold shadow-xs border border-slate-300 hover:border-[#3361ff] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#0045e4]" />
                    <span>User: rahul.sharma@finora.in</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin')}
                    className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#ffdea8] text-slate-800 text-xs font-semibold shadow-xs border border-slate-300 hover:border-[#d97706] transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#d97706]" />
                    <span>Admin: admin@finora.app</span>
                  </button>
                </div>
              </div>

              {/* Error Alert Banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-rose-700">Authentication Failed</p>
                    <p className="text-xs text-rose-600 mt-0.5 leading-snug">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Email Field */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email-input"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Corporate Email or Username
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      id="email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul.sharma@finora.in"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 border border-slate-300 focus:bg-white focus:outline-none focus:border-[#0045e4] focus:ring-2 focus:ring-[#0045e4]/20 shadow-xs transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password-input"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 border border-slate-300 focus:bg-white focus:outline-none focus:border-[#0045e4] focus:ring-2 focus:ring-[#0045e4]/20 shadow-xs transition-all"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Help */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#0045e4] accent-[#0045e4] cursor-pointer"
                    />
                    <span className="text-slate-600 hover:text-slate-900">Remember this device</span>
                  </label>
                  <span className="text-[#0045e4] font-semibold hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#0045e4] hover:bg-[#3361ff] active:bg-[#0037ba] text-white font-bold text-sm shadow-md shadow-[#0045e4]/30 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Finora</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Alternative Registration Link */}
              <div className="text-center pt-1 text-sm text-[#434656]">
                <span>Don't have an enterprise account? </span>
                <Link
                  to="/register"
                  className="font-bold text-[#0045e4] hover:underline cursor-pointer"
                >
                  Create an Account
                </Link>
              </div>

              {/* Bottom Security Footer */}
              <div className="pt-3 border-t border-[#dde1ff]/60 flex flex-col items-center gap-2 text-[#434656] text-xs text-center">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0045e4]" />
                  <span>256-bit Bank-grade Security • RBI & UPI Compliant Architecture</span>
                </div>
                <div className="flex items-center gap-3 text-[#434656]/70 text-[11px] font-semibold">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-[#745200]" />
                    ISO/IEC 27001
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#745200]" />
                    PCI-DSS Level 1
                  </span>
                </div>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}
