import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Transaction, Withdrawal } from '../types.js';
import { 
  User as UserIcon, 
  KeyRound, 
  LogOut, 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Copy, 
  Check, 
  FileText, 
  Clock, 
  Lock, 
  ShieldCheck, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft,
  Settings
} from 'lucide-react';

interface ProfileViewProps {
  onOpenAdmin: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenAdmin, onOpenAuth }) => {
  const { user, isAdmin, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals' | 'password'>('transactions');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Transactions & Withdrawals lists
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPw, setIsChangingPw] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, activeTab]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const res = await api.transactions.getAll();
        setTransactions(res.transactions);
      } else if (activeTab === 'withdrawals') {
        const res = await api.withdrawals.getHistory();
        setWithdrawals(res.withdrawals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyUserId = () => {
    if (user?.userId) {
      navigator.clipboard.writeText(user.userId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড দুটি মিলছে না!' });
      return;
    }

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
      return;
    }

    setIsChangingPw(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPwMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' });
    } finally {
      setIsChangingPw(false);
    }
  };

  if (!user) {
    return (
      <div className="p-8 rounded-3xl bg-[#0a1329] border border-blue-900/50 text-center space-y-4 my-8">
        <UserIcon className="w-12 h-12 text-slate-500 mx-auto" />
        <h3 className="text-base font-bold text-white">প্রোফাইল দেখতে অনুগ্রহ করে লগইন করুন</h3>
        <p className="text-xs text-slate-400">GP Wallet BD-তে আপনার অ্যাকাউন্ট খুলুন এবং দৈনিক আয় শুরু করুন</p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
        >
          লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-14 animate-in fade-in duration-200">
      {/* PROFILE HEADER CARD */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1b42] to-[#08122c] border border-blue-800/60 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 p-0.5 shadow-lg shadow-blue-900/40">
              <div className="w-full h-full bg-[#09132d] rounded-[14px] flex items-center justify-center font-bold text-lg text-white">
                {user.fullName.charAt(0)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base text-white">{user.fullName}</h2>
                {isAdmin && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-400">@{user.username} {user.email ? `· ${user.email}` : (user.mobile ? `· ${user.mobile}` : '')}</p>
                {user.email && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                    user.emailVerified 
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' 
                      : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                  }`}>
                    {user.emailVerified ? 'ইমেইল ভেরিফাইড' : 'জিমেইল যুক্ত'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <div className="flex items-center gap-1 font-mono text-amber-400">
                  <span>ID: {user.userId}</span>
                  <button onClick={copyUserId} className="hover:text-white" title="কপি ইউজার আইডি">
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <div className="flex items-center gap-1 font-mono text-blue-300">
                  <span>রেফারেল: {user.referralCode}</span>
                  <button onClick={copyReferralCode} className="hover:text-white" title="কপি রেফারেল কোড">
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-slate-900/80 border border-red-500/30 text-rose-300 hover:text-white hover:bg-rose-950 transition-colors"
            title="লগআউট করুন"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* 4 SUMMARY STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-900/40">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30">
            <span className="text-[10px] text-slate-400 block font-medium">বর্তমান ব্যালেন্স</span>
            <span className="text-sm font-extrabold font-mono text-amber-400">৳{user.balance.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30">
            <span className="text-[10px] text-slate-400 block font-medium">মোট আয়</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">৳{user.totalEarnings.toFixed(2)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30">
            <span className="text-[10px] text-slate-400 block font-medium">সম্পন্ন টাস্ক</span>
            <span className="text-sm font-extrabold font-mono text-blue-300">{user.completedTasksCount} টি</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30">
            <span className="text-[10px] text-slate-400 block font-medium">সফল রেফারেল</span>
            <span className="text-sm font-extrabold font-mono text-purple-300">{user.totalSuccessfulReferrals} জন</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>অ্যাডমিন ম্যানেজমেন্ট প্যানেল খুলুন</span>
          </button>
        )}
      </div>

      {/* SUB-TABS: TRANSACTIONS / WITHDRAWALS / CHANGE PASSWORD */}
      <div className="flex items-center gap-2 border-b border-blue-900/40 pb-1">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          লেনদেন হিস্টোরি
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'withdrawals'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          উত্তোলন রেকর্ড
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'password'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          পাসওয়ার্ড পরিবর্তন
        </button>
      </div>

      {/* TAB CONTENT: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">লেনদেন লোড হচ্ছে...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#091226] border border-blue-900/30 text-center text-xs text-slate-400">
              কোনো লেনদেন রেকর্ড নেই
            </div>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#0a1329] border border-blue-900/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{tx.description}</p>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(tx.createdAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold font-mono ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isCredit ? '+' : ''}৳{Math.abs(tx.amount)}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-mono">
                      ব্যালেন্স: ৳{tx.balanceAfter}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB CONTENT: WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">উত্তোলন রেকর্ড লোড হচ্ছে...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#091226] border border-blue-900/30 text-center text-xs text-slate-400">
              কোনো উত্তোলনের রেকর্ড নেই
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-2xl bg-[#0a1329] border border-blue-900/40 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold text-white bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
                      {w.paymentMethod}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{w.accountMobileNumber}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(w.requestedAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-bold font-mono text-amber-400 block">৳{w.amount}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                    w.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                    w.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {w.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: CHANGE PASSWORD */}
      {activeTab === 'password' && (
        <div className="p-5 rounded-3xl bg-[#0a1329] border border-blue-900/50 shadow-md">
          <h3 className="font-heading font-bold text-sm text-white mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন</span>
          </h3>

          {pwMsg && (
            <div className={`p-3 rounded-xl border text-xs mb-4 flex items-center gap-2 ${
              pwMsg.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                : 'bg-red-950/60 border-red-500/40 text-red-200'
            }`}>
              {pwMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
              <span>{pwMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">বর্তমান পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="আপনার বর্তমান পাসওয়ার্ড দিন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">নতুন পাসওয়ার্ড</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষরের নতুন পাসওয়ার্ড"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="পুনরায় নতুন পাসওয়ার্ড দিন"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPw}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md active:scale-98 disabled:opacity-50"
            >
              {isChangingPw ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
