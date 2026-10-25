import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import {
  User,
  Mail,
  Coins,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
} from 'lucide-react';

export default function Settings() {
  const { user, updateUser } = useAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('₹');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency || '₹');
    }
  }, [user]);

  // Handle Profile Update (Name & Currency)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!name.trim()) {
      setProfileError('Full name cannot be blank');
      return;
    }

    try {
      setLoadingProfile(true);
      const res = await authApi.updateProfile({
        name: name.trim(),
        currency,
      });

      if (res.user) {
        updateUser(res.user);
      }
      setProfileSuccess('Profile preferences updated successfully.');
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(
        err.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setLoadingPassword(true);
      await authApi.updateProfile({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(
        err.response?.data?.message || 'Failed to change password. Verify your current password.'
      );
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ─── Header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0e193e] tracking-tight">
          User Settings
        </h1>
        <p className="text-sm text-[#434656] mt-1">
          Manage your personal profile, regional currency display, and account security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* ─── Section 1: Profile & Currency Preferences ───────────────── */}
        <div className="bg-white rounded-3xl border border-[#dde1ff]/70 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#dde1ff]/60">
            <div className="w-10 h-10 rounded-2xl bg-[#dde1ff] flex items-center justify-center text-[#0045e4]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0e193e]">Personal Profile</h2>
              <p className="text-xs text-[#434656]">Update your legal name and currency symbol.</p>
            </div>
          </div>

          {/* Profile Success / Error Alerts */}
          {profileSuccess && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#d1fae5] text-[#065f46] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f3f2ff] text-sm text-[#0e193e] border border-transparent focus:bg-white focus:border-[#3361ff] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656] flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[11px] font-normal text-slate-400">Primary ID</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 text-sm text-slate-500 border border-slate-200 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Currency Preference */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  Preferred Currency Display
                </label>
                <div className="relative flex items-center">
                  <Coins className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-[#f3f2ff] text-sm text-[#0e193e] border border-transparent focus:bg-white focus:border-[#3361ff] focus:outline-none transition-all cursor-pointer appearance-none"
                  >
                    <option value="₹">₹ - Indian Rupee (INR)</option>
                    <option value="$">$ - US Dollar (USD)</option>
                    <option value="€">€ - Euro (EUR)</option>
                    <option value="£">£ - British Pound (GBP)</option>
                    <option value="¥">¥ - Japanese Yen (JPY)</option>
                    <option value="AED">AED - UAE Dirham</option>
                  </select>
                </div>
              </div>

              {/* Assigned Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  Account Role
                </label>
                <div className="flex items-center gap-2 pt-1.5">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      user?.role === 'ADMIN'
                        ? 'bg-[#ffdea8] text-[#745200]'
                        : 'bg-[#dde1ff] text-[#0045e4]'
                    }`}
                  >
                    {user?.role || 'USER'}
                  </span>
                  <span className="text-xs text-[#434656]">
                    {user?.role === 'ADMIN'
                      ? 'Full system oversight & management privileges'
                      : 'Personal treasury & ledger access'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingProfile}
                className="px-5 py-2.5 rounded-full bg-[#0045e4] hover:bg-[#3361ff] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Section 2: Security & Password Update ──────────────────── */}
        <div className="bg-white rounded-3xl border border-[#dde1ff]/70 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-[#dde1ff]/60">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdea8] flex items-center justify-center text-[#745200]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0e193e]">Security & Authentication</h2>
              <p className="text-xs text-[#434656]">
                Change your account password to protect your financial ledger.
              </p>
            </div>
          </div>

          {/* Password Success / Error Alerts */}
          {passwordSuccess && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#d1fae5] text-[#065f46] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Current Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  Current Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f3f2ff] text-sm text-[#0e193e] border border-transparent focus:bg-white focus:border-[#3361ff] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f3f2ff] text-sm text-[#0e193e] border border-transparent focus:bg-white focus:border-[#3361ff] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#434656]">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 absolute left-3.5 text-[#434656] pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#f3f2ff] text-sm text-[#0e193e] border border-transparent focus:bg-white focus:border-[#3361ff] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loadingPassword}
                className="px-5 py-2.5 rounded-full bg-[#161616] hover:bg-black text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loadingPassword ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
