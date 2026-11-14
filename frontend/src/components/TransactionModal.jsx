import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Tag,
  CreditCard,
  Banknote,
  Building2,
  Wallet,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import accountsApi from '../api/accountsApi';
import categoriesApi from '../api/categoriesApi';
import transactionsApi from '../api/transactionsApi';
import { useAuth } from '../context/AuthContext';

const PAYMENT_RAILS = ['UPI', 'Netbanking', 'Card', 'Cash', 'e-NACH'];
const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  editTransaction = null,
}) {
  const { user } = useAuth();
  const currencySymbol = user?.currency || '₹';

  // Form State
  const [type, setType] = useState('EXPENSE');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentRail, setPaymentRail] = useState('UPI');
  const [isRecurring, setIsRecurring] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);

  // Data Options
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Load accounts and categories
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function loadFormPrerequisites() {
      try {
        setLoadingData(true);
        const [accRes, catRes] = await Promise.all([
          accountsApi.getAccounts({ status: 'ACTIVE' }),
          categoriesApi.getCategories(),
        ]);

        if (mounted) {
          const loadedAccounts = accRes.accounts || [];
          const loadedCategories = catRes.categories || [];
          setAccounts(loadedAccounts);
          setCategories(loadedCategories);

          if (editTransaction) {
            setType(editTransaction.type || 'EXPENSE');
            setAmount(editTransaction.amount ? editTransaction.amount.toString() : '');
            setAccountId(editTransaction.account?.id || editTransaction.accountId || '');
            setCategoryId(editTransaction.category?.id || editTransaction.categoryId || '');
            setDate(
              editTransaction.date
                ? new Date(editTransaction.date).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0]
            );
            setNotes(editTransaction.notes || '');
            setIsRecurring(Boolean(editTransaction.isRecurring));
          } else {
            // Default first account if available
            if (loadedAccounts.length > 0 && !accountId) {
              setAccountId(loadedAccounts[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load transaction form data:', err);
      } finally {
        if (mounted) setLoadingData(false);
      }
    }

    loadFormPrerequisites();

    return () => {
      mounted = false;
    };
  }, [isOpen, editTransaction]);

  // Filter categories by selected transaction type
  const availableCategories = useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  // Auto-select category when type changes or categories load
  useEffect(() => {
    if (availableCategories.length > 0) {
      const match = availableCategories.find((c) => c.id === categoryId);
      if (!match) {
        setCategoryId(availableCategories[0].id);
      }
    } else {
      setCategoryId('');
    }
  }, [availableCategories, categoryId]);

  if (!isOpen) return null;

  // Validation
  const validateForm = () => {
    const errs = {};
    const parsedAmount = parseFloat(amount.toString().replace(/,/g, ''));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }
    if (!accountId) {
      errs.accountId = 'Please select a funding account';
    }
    if (!categoryId) {
      errs.categoryId = 'Please select a category';
    }
    if (!date) {
      errs.date = 'Please enter a valid date';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Quick Amount preset increment
  const handleQuickAdd = (preset) => {
    const current = parseFloat(amount.toString().replace(/,/g, '')) || 0;
    const updated = current + preset;
    setAmount(updated.toFixed(2));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: null }));
    }
  };

  // Quick Date presets
  const handleDatePreset = (preset) => {
    const d = new Date();
    if (preset === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setDate(d.toISOString().split('T')[0]);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const cleanAmount = parseFloat(amount.toString().replace(/,/g, ''));
      const payload = {
        accountId,
        categoryId,
        amount: cleanAmount,
        type,
        date: new Date(date).toISOString(),
        notes: notes ? notes.trim() : '',
        isRecurring,
      };

      let result;
      if (editTransaction?.id) {
        result = await transactionsApi.updateTransaction(editTransaction.id, payload);
      } else {
        result = await transactionsApi.createTransaction(payload);
      }

      if (onSuccess) {
        onSuccess(result.transaction || result);
      }

      if (!keepOpen) {
        onClose();
      } else {
        // Reset amount and notes for next entry while keeping modal open
        setAmount('');
        setNotes('');
      }
    } catch (err) {
      console.error('Save transaction failed:', err);
      const msg = err.response?.data?.message || 'Unable to save transaction. Please check your network and try again.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0 || Boolean(serverError);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/40 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          handleSubmit(e);
        }
      }}
    >
      <div
        className="relative w-full max-w-[620px] my-6 bg-surface-container-lowest rounded-2xl shadow-[0_24px_64px_-12px_rgba(14,25,62,0.28)] flex flex-col overflow-hidden transition-all transform scale-100 border border-surface-container-high"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Gradient Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-tertiary-fixed-dim via-primary to-secondary-container" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-3 flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm">
                <Receipt className="w-5 h-5 font-bold" />
              </div>
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight">
                {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Record domestic cashflow, linked bank credits, or discretionary debits.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container text-outline hover:text-on-surface flex items-center justify-center transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {hasErrors && (
          <div className="mx-6 mb-2 p-3.5 rounded-xl bg-error-container text-on-error-container flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="font-bold leading-tight">
                {serverError || 'Please resolve the highlighted fields'}
              </span>
              <span className="text-[11px] opacity-90 mt-0.5">
                Ensure amount is positive, an active funding account and category are chosen.
              </span>
            </div>
          </div>
        )}

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 flex flex-col gap-5 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* 1. Transaction Flow Type Switcher */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-outline uppercase tracking-wider">
              Transaction Flow Type
            </label>
            <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl gap-1.5">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-secondary-fixed text-on-secondary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    type === 'EXPENSE'
                      ? 'bg-secondary-container text-on-secondary'
                      : 'bg-surface-container-highest text-outline'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                </span>
                <span>Debit / Expense</span>
              </button>

              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  type === 'INCOME'
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    type === 'INCOME'
                      ? 'bg-tertiary-container text-on-tertiary'
                      : 'bg-surface-container-highest text-outline'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span>Credit / Income</span>
              </button>
            </div>
          </div>

          {/* 2. Large Financial Amount Input */}
          <div
            className={`flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low transition-all ${
              errors.amount ? 'ring-2 ring-error/50 bg-error-container/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Amount ({currencySymbol}) *
              </label>
              <span className="text-[11px] text-outline flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-tertiary-fixed-dim" /> Domestic Ledger
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-2xl font-extrabold text-on-surface-variant select-none">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
                }}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest text-on-surface text-2xl font-extrabold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-sm tracking-tight"
                required
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-error font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.amount}
              </p>
            )}

            {/* Quick Increment Preset Chips */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-outline font-medium">Quick add:</span>
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className="px-2.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-xs transition-colors"
                >
                  +{currencySymbol}{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Core Transaction Details: Account & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Node Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
                <span>Account / Funding Node *</span>
                <span title="Verified CBS / Netbanking node">
                  <HelpCircle className="w-3.5 h-3.5 text-outline" />
                </span>
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    if (errors.accountId) setErrors((prev) => ({ ...prev, accountId: null }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-10 border border-surface-container-high"
                  required
                >
                  <option value="" disabled>-- Select funding account --</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type}) — {currencySymbol}{acc.balance?.toLocaleString()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-outline pointer-events-none">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              {errors.accountId && (
                <p className="text-xs text-error font-medium">{errors.accountId}</p>
              )}
            </div>

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">
                Category *
              </label>
              <div className="relative">
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    if (errors.categoryId) setErrors((prev) => ({ ...prev, categoryId: null }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-sm shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-10 border border-surface-container-high"
                  required
                >
                  <option value="" disabled>-- Select category --</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.isDefault ? '(Default)' : '(Custom)'}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 text-outline pointer-events-none">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              {errors.categoryId && (
                <p className="text-xs text-error font-medium">{errors.categoryId}</p>
              )}
            </div>
          </div>

          {/* 4. Date Picker with Quick Presets */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface-variant">
                Date & Time *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDatePreset('today')}
                  className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleDatePreset('yesterday')}
                  className="px-2.5 py-0.5 rounded-full bg-surface-container text-outline text-xs font-semibold hover:text-on-surface transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 absolute left-3.5 text-outline pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-lowest text-on-surface text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary border border-surface-container-high"
                required
              />
            </div>
          </div>

          {/* 5. Payment Rail & Beneficiary Details */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">
                Payment Rail / Method
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {PAYMENT_RAILS.map((rail) => (
                  <button
                    key={rail}
                    type="button"
                    onClick={() => setPaymentRail(rail)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                      paymentRail === rail
                        ? 'bg-inverse-surface text-inverse-on-surface shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface border border-surface-container-high'
                    }`}
                  >
                    {rail}
                  </button>
                ))}
              </div>
            </div>

            {/* Payee / Notes input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface-variant">
                  Merchant, Payee & Reimbursement Notes
                </label>
                <span className="text-[11px] text-outline">Optional • GST / UTR</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Swiggy Gourmet, UTR #992144, team lunch client reimbursement"
                rows={2}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none border border-surface-container-high"
              />
            </div>

            {/* Recurring Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> Mark as recurring monthly transaction
              </span>
            </label>
          </div>

          {/* 6. Modal Footer Actions */}
          <div className="pt-3 border-t border-surface-container-high flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {/* Keep Open toggle */}
              {!editTransaction && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepOpen}
                    onChange={(e) => setKeepOpen(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-on-surface-variant font-medium">
                    Keep open for multiple entries
                  </span>
                </label>
              )}
              {editTransaction && <div />}

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || loadingData}
                  className="px-5 py-2.5 rounded-full bg-tertiary-fixed-dim hover:bg-tertiary-fixed text-on-tertiary-fixed text-xs font-bold shadow-[0_8px_20px_-2px_rgba(255,186,32,0.45)] hover:shadow-[0_10px_24px_-2px_rgba(255,186,32,0.55)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Saving...'
                      : editTransaction
                      ? 'Update Transaction'
                      : 'Save Transaction'}
                  </span>
                  <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-on-tertiary-fixed/15 text-on-tertiary-fixed ml-1">
                    ⌘↵
                  </kbd>
                </button>
              </div>
            </div>

            {/* Regulatory Badge */}
            <div className="flex items-center justify-center gap-1 text-center text-outline text-[11px] pt-1">
              <Lock className="w-3 h-3 text-tertiary" />
              <span>Tamper-evident 256-bit SHA audit record created automatically upon ledger commit.</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
