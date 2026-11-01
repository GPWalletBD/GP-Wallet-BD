import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Task, Transaction } from '../types.js';
import { NavTab } from '../components/BottomNav.js';
import { 
  Wallet, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Users, 
  ArrowUpRight, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ChevronRight, 
  Sparkles,
  ArrowDownLeft,
  Share2,
  ExternalLink
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectTask: (task: Task) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onSelectTask }) => {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [user]);

  const loadHomeData = async () => {
    try {
      const tasksRes = await api.tasks.getAll();
      setTasks(tasksRes.tasks.slice(0, 4));

      if (user) {
        const txRes = await api.transactions.getAll();
        setTransactions(txRes.transactions.slice(0, 5));
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.warn('Error loading home data:', e);
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

  return (
    <div className="space-y-5 pb-8 animate-in fade-in duration-300">
      {/* USER GREETING & ID BAR */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-950/60 to-slate-900/60 border border-blue-900/40 rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/30 flex items-center justify-center font-bold text-white text-base shadow-md shadow-blue-600/20">
            {user?.fullName?.charAt(0) || 'G'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">আসসালামু আলাইকুম,</span>
              <span className="text-xs font-bold text-white truncate max-w-[140px]">{user?.fullName || 'ব্যবহারকারী'}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono font-semibold text-amber-400 tracking-wider">
                ID: {user?.userId || 'GP-----'}
              </span>
              <button
                onClick={copyUserId}
                className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="কপি আইডি"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {user?.status === 'active' ? 'সক্রিয় অ্যাকাউন্ট' : 'স্থগিত'}
          </span>
          <p className="text-[10px] text-slate-500 mt-1">GP Wallet Verified</p>
        </div>
      </div>

      {/* BALANCE CARD (GOLD + NAVY GRADIENT) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e1d44] via-[#10255c] to-[#08112c] border border-amber-500/30 p-5 shadow-xl shadow-blue-950/40">
        {/* Background glow orbs */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
            <div className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>বর্তমান মূল ব্যালেন্স</span>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
              title="ব্যালেন্স লুকান/দেখান"
            >
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-baseline gap-1 my-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-white tracking-tight">
              {showBalance ? `৳${(user?.balance ?? 0).toLocaleString('bn-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '৳ ••••••'}
            </span>
          </div>

          <p className="text-[11px] text-amber-400/90 font-medium">
            উত্তোলনযোগ্য ব্যালেন্স · বিকাশ ও নগদ পেমেন্ট সমর্থিত
          </p>

          {/* Action Buttons inside Card */}
          <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-blue-800/40">
            <button
              onClick={() => onNavigate('withdraw')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>উত্তোলন</span>
            </button>

            <button
              onClick={() => onNavigate('tasks')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 hover:text-white border border-blue-500/40 font-semibold text-xs transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>টাস্ক শুরু</span>
            </button>

            <button
              onClick={() => onNavigate('invite')}
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 border border-slate-700/50 font-semibold text-xs transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>ইনভাইট</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 STAT METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Earnings */}
        <div className="bg-[#0b1633] border border-blue-900/40 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">মোট আয়</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-heading text-white">
            ৳{(user?.totalEarnings ?? 0).toLocaleString('bn-BD')}
          </div>
          <span className="text-[10px] text-emerald-400 mt-1">লাইফটাইম অর্জিত</span>
        </div>

        {/* Completed Tasks */}
        <div className="bg-[#0b1633] border border-blue-900/40 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">সম্পন্ন কাজ</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-heading text-white">
            {(user?.completedTasksCount ?? 0).toLocaleString('bn-BD')} টি
          </div>
          <span className="text-[10px] text-blue-400 mt-1">ভেরিফাইড টাস্ক</span>
        </div>

        {/* Pending Tasks */}
        <div className="bg-[#0b1633] border border-blue-900/40 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">পেন্ডিং কাজ</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-heading text-amber-300">
            {(user?.pendingTasksCount ?? 0).toLocaleString('bn-BD')} টি
          </div>
          <span className="text-[10px] text-amber-400/80 mt-1">যাচাই চলছে</span>
        </div>

        {/* Total Referrals */}
        <div className="bg-[#0b1633] border border-blue-900/40 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium">সফল রেফারেল</span>
            <Users className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-heading text-white">
            {(user?.totalSuccessfulReferrals ?? 0).toLocaleString('bn-BD')} জন
          </div>
          <span className="text-[10px] text-indigo-300 mt-1">বোনাস পাওয়ার যোগ্য</span>
        </div>
      </div>

      {/* PROMO HERO BANNER */}
      <div 
        onClick={() => onNavigate('tasks')}
        className="relative rounded-2xl overflow-hidden cursor-pointer group border border-blue-800/40 shadow-lg"
      >
        <img 
          src="/src/assets/images/banner_task_earn_1793521413540.jpg" 
          alt="Daily Earning Tasks" 
          className="w-full h-32 sm:h-44 object-cover group-hover:scale-102 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-4 flex flex-col justify-end">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
              স্পেশাল অফার
            </span>
            <span className="text-xs text-slate-200 font-semibold">প্রতিদিন ফ্রি টাস্কে আয় করুন</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            ইউটিউব, ফেসবুক ও অ্যাপ রেজিস্ট্রেশন করে নিশ্চিত পেমেন্ট নিন ➔
          </p>
        </div>
      </div>

      {/* LATEST TASKS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 rounded-full bg-amber-400" />
            <h3 className="font-heading font-bold text-sm text-white">সর্বশেষ টাস্ক সমূহ</h3>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 transition-colors"
          >
            <span>সব দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">টাস্ক লোড হচ্ছে...</div>
          ) : tasks.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">বর্তমানে কোনো টাস্ক নেই</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3 rounded-2xl bg-[#0a142c] border border-blue-900/40 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 flex items-center justify-center overflow-hidden shrink-0">
                    {task.logoUrl ? (
                      <img src={task.logoUrl} alt={task.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {task.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      +৳{task.rewardAmount}
                    </span>
                    <span className="block text-[9px] text-slate-400">পুরস্কার</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-900/30 text-slate-300 group-hover:text-amber-300 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4 rounded-full bg-blue-500" />
            <h3 className="font-heading font-bold text-sm text-white">সাম্প্রতিক লেনদেন</h3>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            সব হিস্টোরি
          </button>
        </div>

        <div className="space-y-2">
          {transactions.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#091226] border border-blue-900/30 text-center text-xs text-slate-400">
              এখনো কোনো লেনদেন হয়নি
            </div>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#091226] border border-blue-900/30 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isCredit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-1">{tx.description}</p>
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
      </div>

      {/* QUICK SUPPORT CHANNELS */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 to-[#0e1f44] border border-blue-900/50 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-white">সাহায্য প্রয়োজন?</h4>
          <p className="text-[11px] text-slate-400">যেকোনো প্রশ্ন বা পেমেন্ট সংক্রান্ত তথ্যের জন্য টেলিগ্রামে যোগাযোগ করুন</p>
        </div>
        <a
          href="https://t.me/gpwalletbd_support"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
        >
          <span>টেলিগ্রাম সাপোর্ট</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
