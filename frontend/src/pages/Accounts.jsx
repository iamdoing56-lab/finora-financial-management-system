import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Building2,
  PiggyBank,
  CreditCard,
  Banknote,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Archive,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import accountsApi from '../api/accountsApi';
import AccountModal from '../components/AccountModal';

export default function Accounts() {
  const { user } = useAuth();
  const defaultCurrency = user?.currency || '₹';

  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Sorting
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('highest');

  // Modal control
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('form'); // 'form' | 'details'
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await accountsApi.getAccounts({ status: 'ACTIVE' });
      setAccounts(data.accounts || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Fetch accounts error:', err);
      setError('Unable to load accounts. Please ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter & sort logic
  const filteredAccounts = useMemo(() => {
    let result = [...accounts];

    // Filter by type
    if (selectedType !== 'ALL') {
      result = result.filter((a) => a.type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'highest') return b.balance - a.balance;
      if (sortBy === 'lowest') return a.balance - b.balance;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'activity') return b.transactionCount - a.transactionCount;
      return 0;
    });

    return result;
  }, [accounts, selectedType, searchQuery, sortBy]);

  const openCreateModal = () => {
    setSelectedAccount(null);
    setModalMode('form');
    setModalOpen(true);
  };

  const openEditModal = (acc, e) => {
    e?.stopPropagation();
    setSelectedAccount(acc);
    setModalMode('form');
    setModalOpen(true);
  };

  const openDetailsModal = (acc) => {
    setSelectedAccount(acc);
    setModalMode('details');
    setModalOpen(true);
  };

  const handleArchiveAccount = async (acc, e) => {
    e?.stopPropagation();
    const confirmed = window.confirm(
      `Archive "${acc.name}"? Historical transactions remain in your financial ledger.`
    );
    if (!confirmed) return;

    try {
      await accountsApi.deleteAccount(acc.id);
      fetchAccounts();
    } catch (err) {
      console.error('Failed to archive:', err);
      alert('Failed to archive account. Please try again.');
    }
  };

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'BANK':
        return Building2;
      case 'SAVINGS':
        return PiggyBank;
      case 'CREDIT_CARD':
        return CreditCard;
      case 'CASH':
        return Banknote;
      default:
        return Wallet;
    }
  };

  const getAccountTypeBadge = (type) => {
    switch (type) {
      case 'BANK':
        return { label: 'Bank Account', bg: 'bg-[#dde1ff]', text: 'text-[#0045e4]' };
      case 'SAVINGS':
        return { label: 'Savings Vault', bg: 'bg-[#ffdea8]', text: 'text-[#745200]' };
      case 'CREDIT_CARD':
        return { label: 'Credit Line', bg: 'bg-[#ffd9dc]', text: 'text-[#b71945]' };
      case 'CASH':
        return { label: 'Physical Cash', bg: 'bg-[#d1fae5]', text: 'text-[#065f46]' };
      default:
        return { label: 'Digital Wallet', bg: 'bg-slate-100', text: 'text-slate-700' };
    }
  };

  return (
    <div className="space-y-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ─── Top Header & Primary Action ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0e193e] tracking-tight">
              Accounts & Treasuries
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-[#0045e4]"></span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-account tracking, auto-calculated balances, and ledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAccounts}
            className="p-2.5 rounded-full border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-full bg-[#0045e4] hover:bg-[#3361ff] active:bg-[#0037ba] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#0045e4]/25 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* ─── KPI Metric Bento Row (matching finora_accounts_management) ─ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Net Worth / Total Balance */}
        <div className="bg-[#1e293b] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#ffba20]">
              <Layers className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold mb-1">
              Total Net Worth
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {defaultCurrency}
              {(summary?.totalBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-300 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Across {summary?.activeAccountsCount || accounts.length} active ledgers</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Core Bank & Savings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#dde1ff] flex items-center justify-center text-[#0045e4]">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
              Deposit
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold mb-1">
              Bank & Savings
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0e193e]">
              {defaultCurrency}
              {(summary?.bankSavingsBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Checking & savings pools</p>
          </div>
        </div>

        {/* KPI 3: Available Credit Line */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd9dc] flex items-center justify-center text-[#b71945]">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full">
              Credit Limit
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold mb-1">
              Credit Facilities
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0e193e]">
              {defaultCurrency}
              {(summary?.availableCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Credit card balances</p>
          </div>
        </div>

        {/* KPI 4: Liquid Cash & Wallets */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdea8] flex items-center justify-center text-[#745200]">
              <Banknote className="w-5 h-5" />
            </div>
            <span className="text-xs text-[#745200] font-semibold bg-[#ffdea8]/50 px-2.5 py-0.5 rounded-full">
              Reserve
            </span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400 block font-semibold mb-1">
              Cash & Wallets
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#0e193e]">
              {defaultCurrency}
              {(summary?.cashWallets || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">Physical cash + digital pools</p>
          </div>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Controls Row ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'BANK', label: 'Banks' },
            { id: 'SAVINGS', label: 'Savings' },
            { id: 'CREDIT_CARD', label: 'Credit Cards' },
            { id: 'CASH', label: 'Cash' },
            { id: 'OTHER', label: 'Wallets' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search account name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 text-xs text-slate-900 border border-slate-200 focus:bg-white focus:border-[#0045e4] focus:outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold uppercase text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0045e4] cursor-pointer"
            >
              <option value="highest">Highest Balance</option>
              <option value="lowest">Lowest Balance</option>
              <option value="name">Name (A-Z)</option>
              <option value="activity">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Accounts Grid Cards ────────────────────────────────────── */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-3 border-[#0045e4] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading financial accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 rounded-2xl bg-[#dde1ff] text-[#0045e4] flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Accounts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedType !== 'ALL'
              ? 'No accounts match your current filter criteria. Try clearing filters.'
              : 'Start tracking your balances by creating your first bank, savings, or cash account.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-5 py-2 rounded-full bg-[#0045e4] hover:bg-[#3361ff] text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((acc) => {
            const Icon = getAccountTypeIcon(acc.type);
            const badge = getAccountTypeBadge(acc.type);

            return (
              <div
                key={acc.id}
                onClick={() => openDetailsModal(acc)}
                className="group bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-[#0045e4]/30 transition-all duration-300 flex flex-col justify-between cursor-pointer relative"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0045e4] text-white flex items-center justify-center shadow-md shadow-[#0045e4]/20 group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0045e4] transition-colors">
                          {acc.name}
                        </h3>
                        <p className="text-xs text-slate-400">•••• {acc.id.slice(0, 4)}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Available Balance Box */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                      <span className="uppercase tracking-wider font-semibold text-[10px]">
                        Available Balance
                      </span>
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-[11px]">
                        <ArrowUpRight className="w-3 h-3" /> Reconciled
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {acc.currency}
                      {acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Activity Details */}
                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Volume:</span>
                      <span className="font-semibold text-slate-800">
                        {acc.transactionCount} transactions logged
                      </span>
                    </div>
                    <div className="flex items-center justify-between truncate">
                      <span>Last Activity:</span>
                      <span className="font-semibold text-slate-800 truncate">
                        {acc.lastTransaction
                          ? `${acc.lastTransaction.notes || acc.lastTransaction.categoryName} (${
                              acc.lastTransaction.type === 'INCOME' ? '+' : '-'
                            }${acc.currency}${acc.lastTransaction.amount})`
                          : 'No recent activity'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Synced</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(acc, e)}
                      className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title="Edit Account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleArchiveAccount(acc, e)}
                      className="p-1.5 rounded-full hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition cursor-pointer"
                      title="Archive Account"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetailsModal(acc)}
                      className="ml-1 px-3 py-1 rounded-full bg-[#0045e4]/10 hover:bg-[#0045e4] text-[#0045e4] hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Account Modal (Create / Edit / Details) ───────────────── */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />
    </div>
  );
}
