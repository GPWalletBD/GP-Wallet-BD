import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Withdrawal, PaymentMethod } from '../types.js';
import { 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Phone,
  AlertTriangle
} from 'lucide-react';

export const WithdrawView: React.FC = () => {
  const { user, settings, refreshUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [accountNumber, setAccountNumber] = useState(user?.mobile || '');
  const [amount, setAmount] = useState<string>('100');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const minWithdrawal = settings?.minWithdrawal ?? 100;
  const maxWithdrawal = settings?.maxWithdrawal ?? 5000;
  const intervalHours = settings?.withdrawalIntervalHours ?? 24;

  useEffect(() => {
    loadWithdrawalHistory();
    if (user?.mobile && !accountNumber) {
      setAccountNumber(user.mobile);
    }
  }, [user]);

  const loadWithdrawalHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.withdrawals.getHistory();
      setWithdrawals(res.withdrawals);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  const handleMaxAmount = () => {
    if (!user) return;
    const capped = Math.min(user.balance, maxWithdrawal);
    setAmount(Math.floor(capped).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < minWithdrawal) {
      setMsg({ type: 'error', text: `সর্বনিম্ন উত্তোলনের পরিমাণ ৳${minWithdrawal}` });
      return;
    }

    if (numAmount > maxWithdrawal) {
      setMsg({ type: 'error', text: `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${maxWithdrawal}` });
      return;
    }

    if ((user?.balance ?? 0) < numAmount) {
      setMsg({ type: 'error', text: 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।' });
      return;
    }

    if (!accountNumber.trim()) {
      setMsg({ type: 'error', text: 'অনুগ্রহ করে সচল মোবাইল নম্বর দিন।' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.withdrawals.submit({
        paymentMethod,
        accountMobileNumber: accountNumber.trim(),
        amount: numAmount
      });
      setMsg({ type: 'success', text: res.message });
      await refreshUser();
      await loadWithdrawalHistory();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'উত্তোলনের আবেদন ব্যর্থ হয়েছে।' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            পেইড (পরিশোধিত)
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            অনুমোদিত
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            প্রক্রিয়াদীন
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            প্রত্যাখ্যাত (টাকা ফেরত)
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
            বাতিল
          </span>
        );
      default: // Pending
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            পেন্ডিং (অপেক্ষমাণ)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* BALANCE & LIMIT SUMMARY CARD */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0e1d44] via-[#10245a] to-[#08122c] border border-blue-800/60 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Wallet className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">উত্তোলনযোগ্য ব্যালেন্স</span>
          </div>
          <span className="text-[11px] text-amber-300 font-medium">
            ২৪ ঘণ্টায় ১ বার উত্তোলন
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white">
            ৳{(user?.balance ?? 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-blue-800/40 text-xs text-slate-300">
          <span>সর্বনিম্ন: <strong className="text-amber-400 font-mono">৳{minWithdrawal}</strong></span>
          <span aria-hidden="true">·</span>
          <span>সর্বোচ্চ: <strong className="text-amber-400 font-mono">৳{maxWithdrawal}</strong></span>
        </div>
      </div>

      {/* FORM ALERTS */}
      {msg && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          msg.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950/60 border-red-500/40 text-red-200'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* WITHDRAWAL FORM */}
      <div className="p-5 rounded-3xl bg-[#0a1329] border border-blue-900/50 shadow-md">
        <h3 className="font-heading font-bold text-sm text-white mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
          <span>টাকা উত্তোলনের আবেদন করুন</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-Only User Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block">ব্যবহারকারী নাম</span>
              <span className="font-semibold text-white truncate block">{user?.fullName || 'N/A'}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block">User ID</span>
              <span className="font-mono font-bold text-amber-400">{user?.userId || 'N/A'}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              পেমেন্ট মাধ্যম নির্বাচন করুন
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* bKash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bkash')}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  paymentMethod === 'bkash'
                    ? 'bg-gradient-to-r from-[#e2136e]/20 to-pink-950/40 border-[#e2136e] shadow-md shadow-pink-900/20'
                    : 'bg-slate-900/80 border-blue-900/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#e2136e] text-white font-black text-xs flex items-center justify-center">
                    bK
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs text-white block">bKash (বিকাশ)</span>
                    <span className="text-[10px] text-pink-300">পার্সোনাল একাউন্ট</span>
                  </div>
                </div>
                {paymentMethod === 'bkash' && (
                  <div className="w-4 h-4 rounded-full bg-[#e2136e] flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* Nagad */}
              <button
                type="button"
                onClick={() => setPaymentMethod('nagad')}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  paymentMethod === 'nagad'
                    ? 'bg-gradient-to-r from-[#f7941d]/20 to-amber-950/40 border-[#f7941d] shadow-md shadow-amber-900/20'
                    : 'bg-slate-900/80 border-blue-900/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f7941d] text-white font-black text-xs flex items-center justify-center">
                    নগদ
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-xs text-white block">Nagad (নগদ)</span>
                    <span className="text-[10px] text-amber-300">পার্সোনাল একাউন্ট</span>
                  </div>
                </div>
                {paymentMethod === 'nagad' && (
                  <div className="w-4 h-4 rounded-full bg-[#f7941d] flex items-center justify-center text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Amount input & presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">উত্তোলনের পরিমাণ (BDT)</label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs text-amber-400 font-semibold hover:underline"
              >
                সর্বোচ্চ ব্যালেন্স
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">৳</span>
              <input
                type="number"
                min={minWithdrawal}
                max={maxWithdrawal}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="পরিমাণ দিন"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick chips */}
            <div className="flex items-center gap-1.5 mt-2">
              {[100, 200, 500, 1000, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetAmount(preset)}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-blue-300 text-xs font-mono font-medium border border-blue-900/40 transition-colors"
                >
                  ৳{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Account Mobile Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} পার্সোনাল মোবাইল নম্বর
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="যেমন: 01812345678"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              সঠিক পার্সোনাল নম্বর দিন। ভুল নম্বরের কারণে পেমেন্ট বিলম্বিত হলে কর্তৃপক্ষ দায়ী নয়।
            </p>
          </div>

          {/* Note on safe reservation */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
            💡 <strong>সংরক্ষণ নীতি:</strong> উত্তোলনের আবেদন সফল হলে আপনার ব্যালেন্স থেকে সমপরিমাণ অর্থ তাৎক্ষণিক সংরক্ষিত থাকবে। কোনো কারণে অনুরোধ বাতিল বা প্রত্যাখ্যাত হলে মূল ব্যালেন্সে স্বয়ংক্রিয়ভাবে অর্থ ফেরত যোগ হবে।
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50"
          >
            {submitting ? 'অনুরোধ পাঠানো হচ্ছে...' : 'উত্তোলন অনুরোধ পাঠান (Submit Request)'}
          </button>
        </form>
      </div>

      {/* WITHDRAWAL HISTORY TABLE / LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 rounded-full bg-blue-500" />
            <h3 className="font-heading font-bold text-sm text-white">আমার উত্তোলনের ইতিহাস</h3>
          </div>
          <span className="text-xs text-slate-400">সর্বমোট: {withdrawals.length} টি</span>
        </div>

        <div className="space-y-2">
          {loadingHistory ? (
            <div className="py-6 text-center text-xs text-slate-400">হিস্টোরি লোড হচ্ছে...</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#091226] border border-blue-900/30 text-center text-xs text-slate-400">
              আপনি এখনো কোনো উত্তোলনের অনুরোধ করেননি
            </div>
          ) : (
            withdrawals.map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-2xl bg-[#0a1329] border border-blue-900/40 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white uppercase px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800/40">
                      {w.paymentMethod}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{w.accountMobileNumber}</span>
                  </div>
                  {getStatusBadge(w.status)}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    <span className="text-base font-extrabold font-heading text-amber-400 font-mono">
                      ৳{w.amount.toLocaleString('bn-BD')}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      {new Date(w.requestedAt).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {w.rejectionReason && (
                    <div className="text-right text-[11px] text-rose-300 max-w-[180px]">
                      কারণ: {w.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
