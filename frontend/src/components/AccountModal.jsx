import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  PiggyBank,
  CreditCard,
  Banknote,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertCircle,
  Save,
  Archive,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import accountsApi from '../api/accountsApi';

/**
 * AccountModal
 * Supports two modes:
 *  - 'form' (create or edit account)
 *  - 'details' (bento view of account stats & recent transactions, matching finora_account_details)
 */
export default function AccountModal({
  isOpen,
  onClose,
  mode = 'form', // 'form' | 'details'
  account = null, // null for create, object for edit/details
  onSuccess,
}) {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [initialBalance, setInitialBalance] = useState('');
  const [currency, setCurrency] = useState(currencySymbol);

  // Details view state
  const [detailedAccount, setDetailedAccount] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Action state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = mode === 'form' && !!account;

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (mode === 'form') {
        if (account) {
          setName(account.name || '');
          setType(account.type || 'BANK');
          setCurrency(account.currency || currencySymbol);
          setInitialBalance('');
        } else {
          setName('');
          setType('BANK');
          setCurrency(currencySymbol);
          setInitialBalance('');
        }
      } else if (mode === 'details' && account?.id) {
        fetchAccountDetails(account.id);
      }
    }
  }, [isOpen, mode, account, currencySymbol]);

  const fetchAccountDetails = async (id) => {
    try {
      setLoadingDetails(true);
      const data = await accountsApi.getAccountById(id);
      setDetailedAccount(data.account);
    } catch (err) {
      console.error('Fetch account details error:', err);
      setError('Failed to load full account details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await accountsApi.updateAccount(account.id, {
          name: name.trim(),
          type,
          currency,
        });
      } else {
        await accountsApi.createAccount({
          name: name.trim(),
          type,
          initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
          currency,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Save account error:', err);
      setError(
        err.response?.data?.message || 'Failed to save account. Please check your inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!account?.id) return;
    const confirmArchive = window.confirm(
      `Are you sure you want to archive "${account.name}"? Historical ledger records will be preserved.`
    );
    if (!confirmArchive) return;

    try {
      setLoading(true);
      await accountsApi.deleteAccount(account.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Archive account error:', err);
      setError(err.response?.data?.message || 'Failed to archive account.');
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { value: 'BANK', label: 'Checking / Corporate Bank', icon: Building2, desc: 'Everyday income & payments' },
    { value: 'SAVINGS', label: 'High Yield Savings Vault', icon: PiggyBank, desc: 'Accumulating reserve funds' },
    { value: 'CREDIT_CARD', label: 'Credit Card Facility', icon: CreditCard, desc: 'Borrowing limit & lines' },
    { value: 'CASH', label: 'Physical Cash Reserve', icon: Banknote, desc: 'Petty cash on hand' },
    { value: 'OTHER', label: 'Digital Wallet / UPI Pool', icon: Wallet, desc: 'Prepaid wallets or other' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dde1ff] flex items-center justify-center text-[#0045e4]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0e193e]">
                {mode === 'details'
                  ? account?.name || 'Account Details'
                  : isEdit
                  ? `Edit Account: ${account?.name}`
                  : 'Add New Financial Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'details'
                  ? 'Real-time ledger balance and transaction statistics'
                  : 'Connect cash reserves, banks, and corporate credit lines'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── DETAILS VIEW (finora_account_details) ─── */}
          {mode === 'details' ? (
            loadingDetails ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-8 h-8 border-3 border-[#0045e4] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading ledger details...</p>
              </div>
            ) : detailedAccount ? (
              <div className="space-y-6">
                {/* Bento KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Current Balance */}
                  <div className="bg-[#1e293b] text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
                    <span className="text-xs text-slate-300 font-medium">Current Balance</span>
                    <div className="my-2">
                      <span className="text-2xl font-black tracking-tight">
                        {detailedAccount.currency}
                        {detailedAccount.balance.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Ledger Verified</span>
                    </div>
                  </div>

                  {/* Monthly Inflow */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Monthly Inflow</span>
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-2">
                      <span className="text-xl font-bold text-slate-900">
                        +{detailedAccount.currency}
                        {detailedAccount.currentMonthInflow.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Current calendar month</span>
                  </div>

                  {/* Monthly Outflow */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Monthly Outflow</span>
                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="my-2">
                      <span className="text-xl font-bold text-slate-900">
                        -{detailedAccount.currency}
                        {detailedAccount.currentMonthOutflow.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Current calendar month</span>
                  </div>
                </div>

                {/* Account Details & Status */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Type</span>
                    <span className="font-bold text-slate-800">{detailedAccount.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Status</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                      {detailedAccount.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Transactions</span>
                    <span className="font-bold text-slate-800">{detailedAccount.transactionCount} logged</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Opened On</span>
                    <span className="font-bold text-slate-800">
                      {new Date(detailedAccount.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Recent Account Transactions
                  </h3>
                  {detailedAccount.recentTransactions?.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      No transactions recorded for this account yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {detailedAccount.recentTransactions.map((tx) => (
                        <div key={tx.id} className="p-3.5 bg-white flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                tx.type === 'INCOME'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+' : '-'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">
                                {tx.notes || tx.category?.name || 'Transaction'}
                              </p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(tx.date).toLocaleDateString()} • {tx.category?.name}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold ${
                              tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {tx.type === 'INCOME' ? '+' : '-'}
                            {detailedAccount.currency}
                            {tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null
          ) : (
            /* ─── CREATE / EDIT FORM VIEW ─── */
            <form id="account-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Account Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Salary, SBI Main Checking, Emergency Cash"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-300 focus:bg-white focus:border-[#0045e4] focus:ring-2 focus:ring-[#0045e4]/20 outline-none transition"
                />
              </div>

              {/* Account Type Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {accountTypes.map((item) => {
                    const Icon = item.icon;
                    const isSelected = type === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setType(item.value)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#dde1ff]/40 border-[#0045e4] ring-2 ring-[#0045e4]/20'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#0045e4] text-white' : 'bg-white text-slate-600 shadow-xs'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">{item.label}</p>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Initial Balance (only on Create) */}
              {!isEdit && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Opening / Starting Balance
                    </label>
                    <span className="text-[11px] text-slate-400">Creates opening transaction</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-slate-500 text-sm">
                      {currency}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-300 focus:bg-white focus:border-[#0045e4] focus:ring-2 focus:ring-[#0045e4]/20 outline-none transition"
                    />
                  </div>
                </div>
              )}

              {/* Currency Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-sm border border-slate-300 focus:bg-white focus:border-[#0045e4] outline-none transition cursor-pointer"
                >
                  <option value="₹">₹ - Indian Rupee (INR)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                  <option value="¥">¥ - Japanese Yen (JPY)</option>
                </select>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {mode === 'details' ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleArchive}
                disabled={loading}
                className="px-4 py-2 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive Account</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="account-form"
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-[#0045e4] hover:bg-[#3361ff] text-white text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEdit ? 'Save Changes' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
