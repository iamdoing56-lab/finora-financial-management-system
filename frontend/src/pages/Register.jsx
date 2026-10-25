import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  TrendingUp,
  Zap,
  Building,
  Check,
  CheckCircle2,
  AlertCircle,
  BadgePercent,
  CheckCircle,
  Shield,
  Send,
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password complexity checks
  const checks = useMemo(() => {
    return {
      length: password.length >= 8,
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  // Score 0-4 for progress bars
  const strengthScore = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (checks.length) score += 1;
    if (checks.number) score += 1;
    if (checks.symbol) score += 1;
    return score;
  }, [password, checks]);

  const strengthLabel = useMemo(() => {
    if (strengthScore <= 1) return { text: 'Weak password', color: 'text-[#ba1a1a]' };
    if (strengthScore <= 2) return { text: 'Moderate password', color: 'text-[#946900]' };
    if (strengthScore <= 3) return { text: 'Good password', color: 'text-[#0045e4]' };
    return { text: 'Strong password', color: 'text-[#10b981]' };
  }, [strengthScore]);

  const passwordsMatch = confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Full name is required');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Corporate email is required');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!agreeTerms) {
      setErrorMessage('Please accept the Terms of Service to continue');
      return;
    }

    try {
      setLoading(true);
      await authApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });

      setSuccessMessage('Account registered successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      const apiMessage =
        err.response?.data?.message ||
        'Registration failed. Please check your details and try again.';
      setErrorMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECECED] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] relative overflow-x-hidden antialiased">
      {/* ─── Top-Right Decorative Yellow Arc ───────────────────────────── */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full border-[18px] border-[#FFB800]/70 pointer-events-none opacity-90 z-0" />

      {/* ─── Watermark text ────────────────────────────────────────────── */}
      <div className="absolute -left-10 bottom-12 select-none pointer-events-none opacity-20 font-black text-8xl md:text-9xl tracking-widest text-slate-400 z-0">
        FINORA
      </div>

      {/* ─── Top Header Bar ────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFB800] flex items-center justify-center shadow-md shadow-[#FFB800]/30">
              {/* Clover mark */}
              <div className="grid grid-cols-2 gap-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#161616]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#161616]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#161616]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#161616]"></span>
              </div>
            </div>
            <span className="font-extrabold text-2xl text-[#161616] tracking-tight flex items-center">
              Finora
              <span className="w-2 h-2 rounded-full bg-[#FFB800] ml-1"></span>
            </span>

            <div className="hidden sm:flex items-center gap-1.5 ml-3 px-3 py-1 bg-white border border-slate-200/80 rounded-full text-slate-600 shadow-xs text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>Bank-Grade 256-bit Encryption</span>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-semibold px-4 py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-white/80 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-full bg-slate-900 text-white shadow-xs transition-colors"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Main Two-Column Stage ─────────────────────────────────────── */}
      <main className="w-full pt-28 pb-16 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          {/* ─── LEFT COLUMN: Brand Showcase & Live Metrics (5 Cols) ──── */}
          <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6">
            <div className="flex flex-col space-y-2.5">
              <div className="inline-flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-[#ffdea8] text-[#271900] px-3 py-1 rounded-full shadow-xs text-xs font-bold">
                  <span>Hi,</span>
                  <Zap className="w-3.5 h-3.5 text-[#745200]" />
                </div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500">
                  Start Your Journey
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#0e193e] tracking-tight leading-tight">
                Step into modern financial clarity
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ffba20] ml-1"></span>
              </h1>
              <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                Real-time balance monitoring, multi-tier approvals, and lightning-fast domestic
                settlement for your high-growth enterprise.
              </p>
            </div>

            {/* Showcase Card 1: Charcoal Liquid Balance Card Replica */}
            <div className="bg-[#1e293b] text-slate-100 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#3361ff]/20 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffba20] flex items-center justify-center text-[#271900] font-black shadow-md">
                    <span>₹</span>
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-bold">
                      Total Liquid Assets
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#ffba20] text-xs font-semibold">
                      Live Treasury Stream
                      <Zap className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/10 text-xs text-slate-200">
                  7 days
                </div>
              </div>

              {/* Big Balance */}
              <div className="mb-4 relative z-10">
                <div className="text-3xl font-black tracking-tight text-white">
                  ₹4,50,900<span className="text-[#ffba20]">.00</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center text-xs font-semibold text-[#ffba20] bg-white/10 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3 mr-1" /> +14.8%
                  </span>
                  <span className="text-xs text-slate-400">vs previous fiscal week</span>
                </div>
              </div>

              {/* Bar Visualizers */}
              <div className="flex items-end gap-2.5 h-14 pt-2">
                <div className="flex-1 bg-white/20 rounded-full h-7"></div>
                <div className="flex-1 bg-[#ffba20] rounded-full h-12 shadow-sm"></div>
                <div className="flex-1 bg-white/20 rounded-full h-5"></div>
                <div className="flex-1 bg-[#ffba20] rounded-full h-10 shadow-sm"></div>
                <div className="flex-1 bg-white/20 rounded-full h-8"></div>
                <div className="flex-1 bg-white/20 rounded-full h-6"></div>
                <div className="flex-1 bg-[#ffba20] rounded-full h-14 shadow-sm"></div>
              </div>
            </div>

            {/* Showcase Card 2: Dual Metric Perks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffdea8] flex items-center justify-center text-[#745200] shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900 truncate">₹0 Fee</div>
                  <div className="text-xs text-slate-500 truncate">Instant Setup</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/60 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffd9dc] flex items-center justify-center text-[#b71945] shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900 truncate">RBI Verified</div>
                  <div className="text-xs text-slate-500 truncate">100% Compliant</div>
                </div>
              </div>
            </div>

            {/* Showcase Card 3: Amber Growth Banner */}
            <div className="bg-gradient-to-r from-[#ffba20] via-[#ffdea8] to-[#ffba20] text-[#271900] p-4 rounded-2xl shadow-md relative overflow-hidden flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-[#271900]" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold tracking-tight">Let's Grow Together!</div>
                <div className="text-xs font-medium text-[#271900]/80">
                  Automated settlement & smart finance channels.
                </div>
              </div>
            </div>

            {/* Bottom Regulatory Note */}
            <div className="flex items-center gap-2 text-slate-500 text-xs px-1">
              <CheckCircle className="w-4 h-4 text-[#ffba20]" />
              <span>Regulated by Reserve Bank of India framework & UPI 2.0</span>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Pristine Registration Card (7 Cols) ─────── */}
          <div className="w-full lg:col-span-7 bg-white rounded-3xl p-7 sm:p-9 shadow-xl border border-slate-200/70 relative">
            <div className="flex flex-col gap-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ecedff] text-[#0e193e] text-xs font-bold uppercase tracking-wider w-fit mb-1">
                <span className="w-2 h-2 rounded-full bg-[#ffba20]"></span>
                Account Creation
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0e193e] tracking-tight">
                Create your Finora Account
                <span className="inline-block w-2 h-2 rounded-full bg-[#ffba20] ml-1"></span>
              </h2>
              <p className="text-sm text-slate-500">
                Start managing your finances with precision in minutes.
              </p>
            </div>

            {/* Role Notification Pill */}
            <div className="bg-[#f3f2ff] px-4 py-2.5 rounded-2xl mb-5 flex items-center justify-between border border-[#dde1ff]/50">
              <div className="flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-[#0045e4]" />
                <span className="text-xs text-[#0e193e] font-medium">
                  Default Provisioning: <strong className="font-bold">Standard Corporate User</strong>
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#434656] uppercase tracking-wide">
                Tier-1 Access
              </span>
            </div>

            {/* Success Banner */}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#d1fae5] text-[#065f46] flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] flex items-start gap-2.5 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#ba1a1a]">Registration Error</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field 1: Full Name */}
              <div className="flex flex-col space-y-1.5">
                <label
                  htmlFor="register-name"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="register-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#f8fafc] text-slate-900 pl-11 pr-4 py-3 rounded-2xl text-sm border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3361ff]/30 focus:border-[#3361ff] transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Corporate Email */}
              <div className="flex flex-col space-y-1.5">
                <label
                  htmlFor="register-email"
                  className="text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                  Corporate Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="register-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#f8fafc] text-slate-900 pl-11 pr-4 py-3 rounded-2xl text-sm border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3361ff]/30 focus:border-[#3361ff] transition-all"
                  />
                </div>
              </div>

              {/* Field 3: Password + Live Strength Meter */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="register-password"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Password
                  </label>
                  {password && (
                    <span className={`text-xs font-bold ${strengthLabel.color}`}>
                      {strengthLabel.text}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-[#f8fafc] text-slate-900 pl-11 pr-11 py-3 rounded-2xl text-sm border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3361ff]/30 focus:border-[#3361ff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator Bars */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strengthScore >= 1 ? 'bg-[#ffba20]' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strengthScore >= 2 ? 'bg-[#ffba20]' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strengthScore >= 3 ? 'bg-[#ffba20]' : 'bg-slate-200'
                    }`}
                  />
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      strengthScore >= 4 ? 'bg-[#10b981]' : 'bg-slate-200'
                    }`}
                  />
                </div>

                {/* Micro Checklist Badges */}
                <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 transition-colors ${
                      checks.length
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Check className="w-3 h-3" /> 8+ chars
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 transition-colors ${
                      checks.number
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Check className="w-3 h-3" /> 1 number
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 transition-colors ${
                      checks.symbol
                        ? 'bg-[#d1fae5] text-[#065f46]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Check className="w-3 h-3" /> 1 symbol
                  </span>
                </div>
              </div>

              {/* Field 4: Confirm Password */}
              <div className="flex flex-col space-y-1.5">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="register-confirm-password"
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    Confirm Password
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-xs font-semibold inline-flex items-center gap-1 ${
                        passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Passwords match
                        </>
                      ) : (
                        'Passwords do not match'
                      )}
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full bg-[#f8fafc] text-slate-900 pl-11 pr-11 py-3 rounded-2xl text-sm border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3361ff]/30 focus:border-[#3361ff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    I agree to the{' '}
                    <span className="font-semibold text-slate-900 underline">
                      Finora Terms of Service
                    </span>{' '}
                    and{' '}
                    <span className="font-semibold text-slate-900 underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Primary Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-[#271900] bg-gradient-to-r from-[#ffdea8] via-[#ffba20] to-[#ffdea8] hover:opacity-95 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#271900] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Navigation back to sign-in */}
            <div className="text-center pt-5">
              <p className="text-sm text-slate-600">
                Already have an enterprise account?
                <Link
                  to="/login"
                  className="font-bold text-slate-900 hover:text-[#0045e4] transition underline decoration-2 ml-1 cursor-pointer"
                >
                  Sign In
                </Link>
              </p>
            </div>

            {/* Security Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0045e4]" />
                <span>256-bit Bank-grade Security • RBI Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <span className="px-2 py-0.5 rounded-full bg-slate-100">ISO/IEC 27001</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100">PCI-DSS Level 1</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
