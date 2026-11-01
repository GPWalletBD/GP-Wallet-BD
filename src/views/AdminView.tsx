import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { 
  Task, 
  TaskSubmission, 
  ReferralClaim, 
  Withdrawal, 
  User, 
  WebsiteSettings, 
  ReferralMilestone,
  TaskCategory,
  ProofMethod
} from '../types.js';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Layers, 
  CheckSquare, 
  Gift, 
  Wallet, 
  Users as UsersIcon, 
  Settings as SettingsIcon,
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  ExternalLink,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

type AdminTab = 'dashboard' | 'tasks' | 'submissions' | 'referrals' | 'withdrawals' | 'users' | 'settings';

export const AdminView: React.FC<{ onExitAdmin: () => void }> = ({ onExitAdmin }) => {
  const { user, refreshUser, refreshSettings } = useAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Tasks Management
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);

  // Submissions Data
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectFeedback, setRejectFeedback] = useState<{ id: string; note: string } | null>(null);

  // Referral Claims
  const [claims, setClaims] = useState<ReferralClaim[]>([]);

  // Withdrawals Management
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'Pending' | 'Approved' | 'Processing' | 'Paid' | 'Rejected'>('Pending');
  const [rejectWithdrawalPrompt, setRejectWithdrawalPrompt] = useState<{ id: string; reason: string } | null>(null);

  // Users Management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [balanceAdjustPrompt, setBalanceAdjustPrompt] = useState<{ userId: string; amount: string; reason: string } | null>(null);

  // Settings & Milestones
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings | null>(null);
  const [milestonesForm, setMilestonesForm] = useState<ReferralMilestone[]>([]);

  useEffect(() => {
    loadTabContent();
  }, [currentTab]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 4000);
  };

  const loadTabContent = async () => {
    setLoading(true);
    try {
      if (currentTab === 'dashboard') {
        const res = await api.admin.getDashboard();
        setDashboardData(res);
      } else if (currentTab === 'tasks') {
        const res = await api.admin.getTasks();
        setTasks(res.tasks);
      } else if (currentTab === 'submissions') {
        const res = await api.admin.getSubmissions();
        setSubmissions(res.submissions);
      } else if (currentTab === 'referrals') {
        const res = await api.admin.getReferralClaims();
        setClaims(res.claims);
      } else if (currentTab === 'withdrawals') {
        const res = await api.admin.getWithdrawals();
        setWithdrawals(res.withdrawals);
      } else if (currentTab === 'users') {
        const res = await api.admin.getUsers(userSearchQuery);
        setUsersList(res.users);
      } else if (currentTab === 'settings') {
        const res = await api.admin.getSettings();
        setSettingsForm(res.settings);
        setMilestonesForm(res.milestones);
      }
    } catch (e: any) {
      showMsg('error', e.message || 'ডাটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- TASKS HANDLERS ---------------- //
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || isSavingTask) return;

    if (!editingTask.title || !editingTask.title.trim()) {
      setTaskFormError('অনুগ্রহ করে টাস্কের নাম লিখুন।');
      return;
    }

    if (!editingTask.taskUrl || !editingTask.taskUrl.trim()) {
      setTaskFormError('অনুগ্রহ করে টাস্কের লিংক (Task URL) দিন।');
      return;
    }

    const reward = Number(editingTask.rewardAmount);
    if (isNaN(reward) || reward < 1) {
      setTaskFormError('অনুগ্রহ করে সঠিক পুরস্কারের পরিমাণ দিন (কমপক্ষে ১ টাকা)।');
      return;
    }

    setIsSavingTask(true);
    setTaskFormError(null);

    try {
      if (editingTask.id) {
        await api.admin.updateTask(editingTask.id, {
          ...editingTask,
          rewardAmount: reward,
          isActive: editingTask.isActive !== false
        });
        showMsg('success', 'টাস্ক সফলভাবে আপডেট হয়েছে!');
      } else {
        await api.admin.createTask({
          ...editingTask,
          rewardAmount: reward,
          isActive: editingTask.isActive !== false
        });
        showMsg('success', 'নতুন টাস্ক সফলভাবে তৈরি ও সংরক্ষিত হয়েছে!');
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await loadTabContent();
    } catch (err: any) {
      const msg = err.message || 'টাস্ক সেভ করতে ব্যর্থ হয়েছে।';
      setTaskFormError(msg);
      showMsg('error', msg);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleToggleTaskActive = async (taskId: string, currentActiveStatus: boolean) => {
    try {
      await api.admin.updateTask(taskId, { isActive: !currentActiveStatus });
      showMsg('success', !currentActiveStatus ? 'টাস্ক সক্রিয় (Active) করা হয়েছে।' : 'টাস্ক নিষ্ক্রিয় (Inactive) করা হয়েছে।');
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message || 'স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই টাস্কটি মুছে ফেলতে চান?')) return;
    try {
      await api.admin.deleteTask(taskId);
      showMsg('success', 'টাস্ক মুছে ফেলা হয়েছে।');
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ---------------- SUBMISSION HANDLERS ---------------- //
  const handleReviewSubmission = async (id: string, action: 'approve' | 'reject', feedback?: string) => {
    try {
      await api.admin.reviewSubmission(id, action, feedback);
      showMsg('success', action === 'approve' ? 'টাস্ক অনুমোদিত এবং পুরস্কার ক্রেডিট সম্পন্ন!' : 'টাস্ক সাবমিশন বাতিল করা হয়েছে।');
      setRejectFeedback(null);
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ---------------- REFERRAL CLAIM HANDLERS ---------------- //
  const handleReviewClaim = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.admin.reviewReferralClaim(id, action);
      showMsg('success', action === 'approve' ? 'রেফারেল বোনাস অনুমোদিত ও ক্রেডিট হয়েছে!' : 'রেফারেল বোনাস আবেদন বাতিল করা হয়েছে।');
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ---------------- WITHDRAWAL HANDLERS ---------------- //
  const handleUpdateWithdrawal = async (id: string, status: string, reason?: string) => {
    try {
      await api.admin.updateWithdrawalStatus(id, status, reason);
      showMsg('success', `উত্তোলনের অবস্থা "${status}" করা হয়েছে।`);
      setRejectWithdrawalPrompt(null);
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ---------------- USER MANAGEMENT HANDLERS ---------------- //
  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.getUsers(userSearchQuery);
      setUsersList(res.users);
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleToggleUserStatus = async (targetUserId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.admin.toggleUserStatus(targetUserId, newStatus);
      showMsg('success', `ব্যবহারকারী ${newStatus === 'active' ? 'সক্রিয়' : 'স্থগিত'} করা হয়েছে।`);
      await loadTabContent();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceAdjustPrompt) return;
    try {
      await api.admin.adjustUserBalance(
        balanceAdjustPrompt.userId,
        Number(balanceAdjustPrompt.amount),
        balanceAdjustPrompt.reason
      );
      showMsg('success', 'ব্যালেন্স সমন্বয় সফল হয়েছে এবং লেনদেন তৈরি করা হয়েছে।');
      setBalanceAdjustPrompt(null);
      await loadTabContent();
      if (selectedUserDetails) {
        const updated = await api.admin.getUserDetails(selectedUserDetails.user.userId);
        setSelectedUserDetails(updated);
      }
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleViewUser = async (targetUserId: string) => {
    try {
      const res = await api.admin.getUserDetails(targetUserId);
      setSelectedUserDetails(res);
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // ---------------- SETTINGS HANDLERS ---------------- //
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    try {
      await api.admin.updateSettings(settingsForm);
      await api.admin.updateMilestones(milestonesForm);
      showMsg('success', 'ওয়েবসাইট ও পেমেন্ট সেটিংস সফলভাবে আপডেট হয়েছে!');
      await refreshSettings();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  return (
    <div className="space-y-4 pb-14 animate-in fade-in duration-200">
      {/* ADMIN HEADER */}
      <div className="bg-gradient-to-r from-blue-950 via-[#102353] to-blue-950 border border-amber-500/40 rounded-3xl p-4 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-extrabold text-base text-white">অ্যাডমিন কন্ট্রোল সেন্টার</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                অনুমোদিত অ্যাডমিন
              </span>
            </div>
            <p className="text-xs text-slate-300">
              লগইনকৃত অ্যাডমিন: <span className="text-amber-400 font-mono font-medium">{user?.email || 'supportteambd@gmail.com'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onExitAdmin}
          className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-blue-800/40 font-semibold text-xs transition-colors shrink-0"
        >
          ওয়েবসাইটে ফিরুন
        </button>
      </div>

      {/* FEEDBACK ALERTS */}
      {actionMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          actionMsg.type === 'success' 
            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* TAB NAVIGATION BUTTONS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'dashboard' as AdminTab, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
          { id: 'tasks' as AdminTab, label: 'টাস্ক ম্যানেজমেন্ট', icon: Layers },
          { id: 'submissions' as AdminTab, label: 'টাস্ক সাবমিশন', icon: CheckSquare, badge: dashboardData?.stats?.pendingSubmissions },
          { id: 'referrals' as AdminTab, label: 'রেফারেল দাবি', icon: Gift, badge: dashboardData?.stats?.pendingClaims },
          { id: 'withdrawals' as AdminTab, label: 'উত্তোলন ম্যানেজমেন্ট', icon: Wallet, badge: dashboardData?.stats?.pendingWithdrawals },
          { id: 'users' as AdminTab, label: 'ইউজার ম্যানেজমেন্ট', icon: UsersIcon },
          { id: 'settings' as AdminTab, label: 'সেটিংস ও পেমেন্ট', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#0a1329] text-slate-400 hover:text-white border border-blue-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 1. DASHBOARD TAB */}
      {/* ============================================================== */}
      {currentTab === 'dashboard' && dashboardData && (
        <div className="space-y-4">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0a1329] border border-blue-900/50">
              <span className="text-[11px] text-slate-400 block font-medium">মোট ব্যবহারকারী</span>
              <span className="text-xl font-extrabold font-heading text-white">{dashboardData.stats.totalUsers} জন</span>
              <span className="text-[10px] text-emerald-400 mt-1 block">আজ নতুন: +{dashboardData.stats.newUsersToday} জন</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a1329] border border-amber-500/40">
              <span className="text-[11px] text-amber-300 block font-medium">পেন্ডিং টাস্ক সাবমিশন</span>
              <span className="text-xl font-extrabold font-heading text-amber-400">{dashboardData.stats.pendingSubmissions} টি</span>
              <span className="text-[10px] text-slate-400 mt-1 block">অনুমোদিত: {dashboardData.stats.approvedTasks} টি</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a1329] border border-blue-900/50">
              <span className="text-[11px] text-slate-400 block font-medium">পেন্ডিং উত্তোলন</span>
              <span className="text-xl font-extrabold font-heading text-amber-400">{dashboardData.stats.pendingWithdrawals} টি</span>
              <span className="text-[10px] text-blue-300 mt-1 block">পরিশোধিত: {dashboardData.stats.paidWithdrawals} টি</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0a1329] border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 block font-medium">মোট পেইড পেমেন্ট</span>
              <span className="text-xl font-extrabold font-heading text-emerald-400 font-mono">
                ৳{dashboardData.stats.totalPaidAmount.toLocaleString('bn-BD')}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">বিকাশ ও নগদ</span>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setCurrentTab('submissions')}
              className="p-3 rounded-2xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-left transition-colors"
            >
              <span className="text-xs font-bold text-white block">টাস্ক যাচাই</span>
              <span className="text-[11px] text-amber-400">{dashboardData.stats.pendingSubmissions} টি পেন্ডিং</span>
            </button>
            <button
              onClick={() => setCurrentTab('withdrawals')}
              className="p-3 rounded-2xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-left transition-colors"
            >
              <span className="text-xs font-bold text-white block">উত্তোলন রিভিউ</span>
              <span className="text-[11px] text-amber-400">{dashboardData.stats.pendingWithdrawals} টি পেন্ডিং</span>
            </button>
            <button
              onClick={() => {
                setEditingTask({
                  category: 'youtube',
                  proofMethod: 'whatsapp',
                  rewardAmount: 15,
                  taskUrl: 'https://',
                  proofUrl: 'https://wa.me/8801700000000',
                  isActive: true
                });
                setIsTaskModalOpen(true);
              }}
              className="p-3 rounded-2xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-left transition-colors"
            >
              <span className="text-xs font-bold text-white block">+ নতুন টাস্ক যোগ</span>
              <span className="text-[11px] text-slate-400">টাস্ক পাবলিশ করুন</span>
            </button>
            <button
              onClick={() => setCurrentTab('referrals')}
              className="p-3 rounded-2xl bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/40 text-left transition-colors"
            >
              <span className="text-xs font-bold text-white block">রেফারেল ক্লেইম</span>
              <span className="text-[11px] text-purple-400">{dashboardData.stats.pendingClaims} টি ক্লেইম</span>
            </button>
          </div>

          {/* Recent Audit Logs & Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Audit Logs */}
            <div className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/40 space-y-3">
              <h3 className="font-heading font-bold text-xs text-white">অ্যাডমিন অ্যাকশন লগ (Audit Trail)</h3>
              <div className="space-y-2">
                {dashboardData.recentAuditLogs.slice(0, 5).map((log: any, idx: number) => (
                  <div key={log.id ? `${log.id}-${idx}` : `log-${idx}`} className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-bold text-amber-400">{log.action}</span>
                      <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString('bn-BD')}</span>
                    </div>
                    <p className="text-slate-300">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/40 space-y-3">
              <h3 className="font-heading font-bold text-xs text-white">সাম্প্রতিক লেনদেন</h3>
              <div className="space-y-2">
                {dashboardData.recentTransactions.slice(0, 5).map((tx: any, idx: number) => (
                  <div key={tx.id ? `${tx.id}-${idx}` : `tx-${idx}`} className="p-2.5 rounded-xl bg-slate-900/60 border border-blue-900/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-200 block truncate max-w-[200px]">{tx.description}</span>
                      <span className="text-[10px] text-slate-500 font-mono">User: {tx.userId}</span>
                    </div>
                    <span className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.amount > 0 ? '+' : ''}৳{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TASKS MANAGEMENT TAB */}
      {/* ============================================================== */}
      {currentTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-white">টাস্ক তালিকা ({tasks.length} টি)</h3>
            <button
              onClick={() => {
                setEditingTask({
                  title: '',
                  shortDescription: '',
                  fullDescription: '',
                  instructions: '',
                  category: 'youtube',
                  rewardAmount: 15,
                  taskUrl: 'https://',
                  proofMethod: 'whatsapp',
                  proofUrl: 'https://wa.me/8801700000000',
                  isActive: true
                });
                setIsTaskModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন টাস্ক তৈরি</span>
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t.id} className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/40 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#060c1d] border border-blue-800/40 flex items-center justify-center overflow-hidden shrink-0">
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt={t.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Layers className="w-6 h-6 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40">
                        {t.category}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        প্রুফ: {t.proofMethod}
                      </span>
                      <button
                        onClick={() => handleToggleTaskActive(t.id, t.isActive)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors border ${
                          t.isActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="ক্লিক করে সক্রিয় বা নিষ্ক্রিয় করুন"
                      >
                        {t.isActive ? '● সক্রিয়' : '○ নিষ্ক্রিয়'}
                      </button>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-white">{t.title}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{t.shortDescription}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <span>পুরস্কার: <strong className="text-amber-400 font-mono">৳{t.rewardAmount}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>সম্পন্ন: {t.totalCompleted} জন</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-blue-950/80 border border-blue-800/40 text-blue-300 hover:text-white transition-colors"
                    title="এডিট করুন"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-rose-400 hover:text-white transition-colors"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TASK SUBMISSIONS TAB */}
      {/* ============================================================== */}
      {currentTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-bold text-sm text-white">টাস্ক সাবমিশন ভেরিফিকেশন</h3>
            <div className="flex items-center gap-1">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSubmissionFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    submissionFilter === filter
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#0a1329] text-slate-400 border border-blue-900/40'
                  }`}
                >
                  {filter === 'all' && 'সবগুলো'}
                  {filter === 'pending' && 'পেন্ডিং'}
                  {filter === 'approved' && 'অনুমোদিত'}
                  {filter === 'rejected' && 'বাতিল'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {submissions
              .filter(s => submissionFilter === 'all' ? true : s.status === submissionFilter)
              .map((sub) => (
                <div key={sub.id} className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/50 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {sub.userId}
                        </span>
                        <span className="text-xs font-semibold text-white">{sub.userName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({sub.userMobile})</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-white">{sub.taskTitle}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        জমা দেওয়া হয়েছে: {new Date(sub.submittedAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-amber-400 block">+৳{sub.rewardAmount}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        sub.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                        sub.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {sub.status === 'approved' && 'অনুমোদিত'}
                        {sub.status === 'pending' && 'পেন্ডিং যাচাই'}
                        {sub.status === 'rejected' && 'বাতিল'}
                      </span>
                    </div>
                  </div>

                  {/* Proof Note from user */}
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-blue-900/30 text-xs">
                    <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">ব্যবহারকারীর প্রমাণের নোট / বিবরণ:</span>
                    <p className="text-slate-200">{sub.proofNote || 'কোনো লিখিত নোট দেওয়া হয়নি।'}</p>
                  </div>

                  {/* Actions for Pending */}
                  {sub.status === 'pending' && (
                    <div className="pt-2 border-t border-blue-900/30 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setRejectFeedback({ id: sub.id, note: '' })}
                        className="px-3.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>বাতিল করুন</span>
                      </button>

                      <button
                        onClick={() => handleReviewSubmission(sub.id, 'approve')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>অনুমোদন ও ৳{sub.rewardAmount} ক্রেডিট করুন</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. REFERRAL CLAIMS TAB */}
      {/* ============================================================== */}
      {currentTab === 'referrals' && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-sm text-white">রেফারেল বোনাস দাবি তালিকা ({claims.length} টি)</h3>
          
          <div className="space-y-3">
            {claims.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#091226] border border-blue-900/30 text-center text-xs text-slate-400">
                কোনো রেফারেল পুরস্কার দাবি নেই
              </div>
            ) : (
              claims.map((claim) => (
                <div key={claim.id} className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/40 flex items-start justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {claim.userId}
                      </span>
                      <span className="text-xs font-semibold text-white">{claim.userName}</span>
                    </div>
                    <h4 className="font-heading font-bold text-sm text-white">{claim.milestoneName}</h4>
                    <span className="text-xs text-slate-400">
                      দাবিকালীন সফল রেফারেল: <strong className="text-amber-400">{claim.referralsAtClaim} জন</strong>
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono mt-1">
                      তারিখ: {new Date(claim.claimedAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold font-heading text-amber-400 font-mono block">
                      ৳{claim.rewardAmount}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      claim.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {claim.status}
                    </span>

                    {claim.status === 'pending' && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          onClick={() => handleReviewClaim(claim.id, 'reject')}
                          className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-500/40 text-rose-300 text-xs font-semibold"
                        >
                          বাতিল
                        </button>
                        <button
                          onClick={() => handleReviewClaim(claim.id, 'approve')}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          অনুমোদন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. WITHDRAWALS MANAGEMENT TAB */}
      {/* ============================================================== */}
      {currentTab === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-bold text-sm text-white">উত্তোলন অনুমোদন ও ক্যাশআউট</h3>
            <div className="flex items-center gap-1">
              {(['all', 'Pending', 'Approved', 'Processing', 'Paid', 'Rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setWithdrawalFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    withdrawalFilter === filter
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[#0a1329] text-slate-400 border border-blue-900/40'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {withdrawals
              .filter(w => withdrawalFilter === 'all' ? true : w.status === withdrawalFilter)
              .map((w) => (
                <div key={w.id} className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/50 space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {w.userId}
                        </span>
                        <span className="text-xs font-semibold text-white">{w.userName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase font-bold text-white px-2 py-0.5 rounded bg-blue-950 border border-blue-800/40">
                          {w.paymentMethod}
                        </span>
                        <span className="text-sm font-mono font-bold text-amber-300">{w.accountMobileNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        অনুরোধ সময়: {new Date(w.requestedAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-extrabold font-heading text-amber-400 font-mono block">
                        ৳{w.amount}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        w.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                        w.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions according to status */}
                  {w.status !== 'Paid' && w.status !== 'Rejected' && w.status !== 'Cancelled' && (
                    <div className="pt-2 border-t border-blue-900/30 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => setRejectWithdrawalPrompt({ id: w.id, reason: '' })}
                        className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-rose-300 font-semibold text-xs"
                      >
                        বাতিল ও অর্থ ফেরত (Refund)
                      </button>

                      {w.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateWithdrawal(w.id, 'Approved')}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                        >
                          অনুমোদন (Approve)
                        </button>
                      )}

                      {w.status === 'Approved' && (
                        <button
                          onClick={() => handleUpdateWithdrawal(w.id, 'Processing')}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                        >
                          প্রসেসিং শুরু করুন
                        </button>
                      )}

                      <button
                        onClick={() => handleUpdateWithdrawal(w.id, 'Paid')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                      >
                        ✓ টাকা পাঠানো হয়েছে (Mark as Paid)
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. USERS MANAGEMENT TAB */}
      {/* ============================================================== */}
      {currentTab === 'users' && (
        <div className="space-y-4">
          {/* Search bar */}
          <form onSubmit={handleSearchUsers} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="User ID, নাম, ইউজারনেম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs"
            >
              খুঁজুন
            </button>
          </form>

          {/* User List */}
          <div className="space-y-3">
            {usersList.map((u) => (
              <div key={u.id} className="p-4 rounded-3xl bg-[#0a1329] border border-blue-900/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-amber-400">{u.userId}</span>
                      <h4 className="font-heading font-bold text-sm text-white">{u.fullName}</h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-rose-400'
                      }`}>
                        {u.status === 'active' ? 'সক্রিয়' : 'স্থগিত'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">@{u.username} · {u.mobile} · রেফারেল: {u.referralCode}</p>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                      নিবন্ধন: {new Date(u.createdAt).toLocaleDateString('bn-BD')}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold font-mono text-amber-400 block">
                      ব্যালেন্স: ৳{u.balance}
                    </span>
                    <span className="text-[11px] text-slate-400 block">মোট আয়: ৳{u.totalEarnings}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-900/30 text-[11px] text-slate-300">
                  <div>সম্পন্ন টাস্ক: <strong>{u.completedTasksCount}</strong></div>
                  <div>পেন্ডিং টাস্ক: <strong>{u.pendingTasksCount}</strong></div>
                  <div>রেফারেল: <strong>{u.totalSuccessfulReferrals} জন</strong></div>
                </div>

                {/* User Actions */}
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewUser(u.userId)}
                    className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-800/40 text-blue-300 hover:text-white text-xs font-semibold"
                  >
                    সম্পূর্ণ বিবরণ ও হিস্টোরি
                  </button>

                  <button
                    onClick={() => setBalanceAdjustPrompt({ userId: u.userId, amount: '', reason: '' })}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold"
                  >
                    ব্যালেন্স সমন্বয় (Adjust)
                  </button>

                  <button
                    onClick={() => handleToggleUserStatus(u.userId, u.status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      u.status === 'active' 
                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' 
                        : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {u.status === 'active' ? 'অ্যাকাউন্ট স্থগিত করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* USER DETAILS MODAL */}
          {selectedUserDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-2xl bg-[#0a1329] border border-blue-800/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
                <button
                  onClick={() => setSelectedUserDetails(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="text-base font-bold text-white mb-2">
                  ব্যবহারকারী প্রোফাইল: {selectedUserDetails.user.fullName} ({selectedUserDetails.user.userId})
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="p-3 rounded-xl bg-slate-900/80">ইউজারনেম: @{selectedUserDetails.user.username}</div>
                  <div className="p-3 rounded-xl bg-slate-900/80">ফোন: {selectedUserDetails.user.mobile}</div>
                  <div className="p-3 rounded-xl bg-slate-900/80">ব্যালেন্স: ৳{selectedUserDetails.user.balance}</div>
                  <div className="p-3 rounded-xl bg-slate-900/80">মোট আয়: ৳{selectedUserDetails.user.totalEarnings}</div>
                </div>

                <h4 className="font-bold text-xs text-amber-400 mb-2">লেনদেন রেকর্ড:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar mb-4">
                  {selectedUserDetails.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-2 rounded-lg bg-slate-900/60 text-xs flex justify-between">
                      <span>{tx.description}</span>
                      <span className="font-mono font-bold">{tx.amount > 0 ? '+' : ''}৳{tx.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BALANCE ADJUSTMENT MODAL */}
          {balanceAdjustPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="relative w-full max-w-md bg-[#0a1329] border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-slate-100">
                <button
                  onClick={() => setBalanceAdjustPrompt(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <h3 className="font-heading font-bold text-base text-white mb-1">
                  ব্যালেন্স সমন্বয় (User: {balanceAdjustPrompt.userId})
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  টাকা যোগ করতে ধনাত্মক (যেমন: 50) অথবা কর্তন করতে ঋণাত্মক (যেমন: -50) পরিমাণ লিখুন।
                </p>

                <form onSubmit={handleAdjustBalance} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">সমন্বয়ের পরিমাণ (BDT)</label>
                    <input
                      type="number"
                      required
                      placeholder="যেমন: 100 অথবা -50"
                      value={balanceAdjustPrompt.amount}
                      onChange={(e) => setBalanceAdjustPrompt({ ...balanceAdjustPrompt, amount: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">বাধ্যতামূলক কারণ (Mandatory Reason)</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: টাস্ক বোনাস সমন্বয় / পেন্ডিং রিফান্ড"
                      value={balanceAdjustPrompt.reason}
                      onChange={(e) => setBalanceAdjustPrompt({ ...balanceAdjustPrompt, reason: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                  >
                    সমন্বয় নিশ্চিত করুন
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. SETTINGS & PAYMENT TAB */}
      {/* ============================================================== */}
      {currentTab === 'settings' && settingsForm && (
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0a1329] border border-blue-900/50 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-amber-400" />
              <span>ওয়েবসাইট সাধারণ সেটিংস</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">ওয়েবসাইট নাম</label>
                <input
                  type="text"
                  value={settingsForm.siteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">অফিসিয়াল হোয়াটসঅ্যাপ লিংক</label>
                <input
                  type="text"
                  value={settingsForm.whatsappUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">অফিসিয়াল টেলিগ্রাম চ্যানেল</label>
                <input
                  type="text"
                  value={settingsForm.telegramUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">টেলিগ্রাম সাপোর্ট / হেল্প সেন্টার</label>
                <input
                  type="text"
                  value={settingsForm.helpCenterUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, helpCenterUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">জরুরি ঘোষণা / নোটিশ (Ticker)</label>
              <textarea
                rows={2}
                value={settingsForm.announcement}
                onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs"
              />
            </div>
          </div>

          {/* Payment & Withdrawal Limits */}
          <div className="p-5 rounded-3xl bg-[#0a1329] border border-blue-900/50 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span>পেমেন্ট ও উত্তোলন নীতি সেটিংস</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">সর্বনিম্ন উত্তোলন (BDT)</label>
                <input
                  type="number"
                  value={settingsForm.minWithdrawal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minWithdrawal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">সর্বোচ্চ উত্তোলন (BDT)</label>
                <input
                  type="number"
                  value={settingsForm.maxWithdrawal}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxWithdrawal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">উত্তোলন বিরতি সময় (ঘণ্টায়)</label>
                <input
                  type="number"
                  value={settingsForm.withdrawalIntervalHours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, withdrawalIntervalHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Toggle Payment Methods */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="p-3 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-white">bKash (বিকাশ) সক্রিয়</span>
                <input
                  type="checkbox"
                  checked={settingsForm.bkashEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bkashEnabled: e.target.checked })}
                  className="w-4 h-4 accent-pink-600 rounded"
                />
              </label>

              <label className="p-3 rounded-2xl bg-slate-900/80 border border-blue-900/40 flex items-center justify-between cursor-pointer">
                <span className="text-xs font-semibold text-white">Nagad (নগদ) সক্রিয়</span>
                <input
                  type="checkbox"
                  checked={settingsForm.nagadEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nagadEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>
            </div>
          </div>

          {/* Referral Milestones Configuration */}
          <div className="p-5 rounded-3xl bg-[#0a1329] border border-amber-500/30 space-y-4">
            <h3 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>৩টি রেফারেল মাইলস্টোন কার্ড কনফিগারেশন</span>
            </h3>

            <div className="space-y-3">
              {milestonesForm.map((m, idx) => (
                <div key={m.id} className="p-3 rounded-2xl bg-slate-900/80 border border-blue-900/40 grid grid-cols-3 gap-2 items-center">
                  <span className="text-xs font-bold text-amber-400">কার্ড {m.id}</span>
                  <div>
                    <label className="text-[10px] text-slate-400 block">প্রয়োজনীয় রেফারেল (জন)</label>
                    <input
                      type="number"
                      value={m.requiredReferrals}
                      onChange={(e) => {
                        const copy = [...milestonesForm];
                        copy[idx].requiredReferrals = Number(e.target.value);
                        setMilestonesForm(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-[#060c1d] border border-blue-800 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">পুরস্কারের পরিমাণ (৳)</label>
                    <input
                      type="number"
                      value={m.rewardAmount}
                      onChange={(e) => {
                        const copy = [...milestonesForm];
                        copy[idx].rewardAmount = Number(e.target.value);
                        setMilestonesForm(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-[#060c1d] border border-blue-800 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
          >
            সকল সেটিংস সংরক্ষণ করুন
          </button>
        </form>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0a1329] border border-blue-800/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => {
                setIsTaskModalOpen(false);
                setEditingTask(null);
                setTaskFormError(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-bold text-base text-white mb-2">
              {editingTask.id ? 'টাস্ক এডিট করুন' : 'নতুন টাস্ক তৈরি করুন'}
            </h3>

            {taskFormError && (
              <div className="mb-3 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{taskFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">টাস্কের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingTask.title || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="যেমন: টেলিগ্রাম চ্যানেলে যোগ দিন"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ক্যাটাগরি</label>
                  <select
                    value={editingTask.category || 'youtube'}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="telegram">Telegram</option>
                    <option value="facebook">Facebook</option>
                    <option value="app_registration">App Registration</option>
                    <option value="web_registration">Website Registration</option>
                    <option value="web_visit">Website Visit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">পুরস্কারের পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="যেমন: ১, ১০০, ১০০০ বা যেকোনো পরিমাণ"
                    value={editingTask.rewardAmount !== undefined && editingTask.rewardAmount !== null ? editingTask.rewardAmount : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingTask({
                        ...editingTask,
                        rewardAmount: val === '' ? ('' as any) : Number(val)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">সংক্ষিপ্ত বিবরণ</label>
                <input
                  type="text"
                  value={editingTask.shortDescription || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, shortDescription: e.target.value })}
                  placeholder="যেমন: আমাদের অফিসিয়াল ইউটিউব চ্যানেল সাবস্ক্রাইব করুন"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">বিস্তারিত বিবরণ (ঐচ্ছিক)</label>
                <textarea
                  rows={2}
                  value={editingTask.fullDescription || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, fullDescription: e.target.value })}
                  placeholder="টাস্কের সম্পূর্ণ বিবরণ..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">কাজের পূর্ণ নির্দেশনা (Instructions)</label>
                <textarea
                  rows={2}
                  value={editingTask.instructions || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, instructions: e.target.value })}
                  placeholder="ধাপ ১: লিংকে যান, ধাপ ২: স্ক্রিনশট নিন..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">টাস্কের লিংক (Task URL) *</label>
                <input
                  type="text"
                  required
                  value={editingTask.taskUrl || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, taskUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">প্রমাণ জমার মাধ্যম</label>
                  <select
                    value={editingTask.proofMethod || 'whatsapp'}
                    onChange={(e) => setEditingTask({ ...editingTask, proofMethod: e.target.value as ProofMethod })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="external">অন্যান্য লিংক</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">প্রমাণ জমার লিংক / ফোন</label>
                  <input
                    type="text"
                    value={editingTask.proofUrl || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, proofUrl: e.target.value })}
                    placeholder="https://wa.me/... বা https://t.me/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">টাস্ক লোগো বা ছবির URL (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={editingTask.logoUrl || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-blue-900/60 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-blue-900/60">
                <div>
                  <span className="text-xs font-semibold text-white block">টাস্ক সক্রিয় রাখুন (Active Status)</span>
                  <span className="text-[10px] text-slate-400">সক্রিয় থাকলে ব্যবহারকারীরা হোমপেজে কাজটি দেখতে পাবে</span>
                </div>
                <input
                  type="checkbox"
                  id="task-is-active"
                  checked={editingTask.isActive !== false}
                  onChange={(e) => setEditingTask({ ...editingTask, isActive: e.target.checked })}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingTask}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                    isSavingTask 
                      ? 'bg-amber-500/60 text-slate-900 cursor-not-allowed' 
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-98'
                  }`}
                >
                  {isSavingTask ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>{editingTask.id ? 'টাস্ক আপডেট সম্পন্ন করুন' : 'নতুন টাস্ক সেভ করুন'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT SUBMISSION MODAL */}
      {rejectFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#0a1329] border border-red-500/40 rounded-3xl p-5 shadow-2xl text-slate-100">
            <h4 className="font-heading font-bold text-sm text-white mb-2">টাস্ক বাতিলের কারণ লিখুন</h4>
            <textarea
              rows={2}
              required
              placeholder="যেমন: অস্পষ্ট স্ক্রিনশট / ইউজার আইডি মেলেনি"
              value={rejectFeedback.note}
              onChange={(e) => setRejectFeedback({ ...rejectFeedback, note: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-red-900/60 text-white text-xs mb-3"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectFeedback(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={() => handleReviewSubmission(rejectFeedback.id, 'reject', rejectFeedback.note)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT WITHDRAWAL MODAL */}
      {rejectWithdrawalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#0a1329] border border-red-500/40 rounded-3xl p-5 shadow-2xl text-slate-100">
            <h4 className="font-heading font-bold text-sm text-white mb-1">উত্তোলন বাতিল ও রিফান্ড</h4>
            <p className="text-[11px] text-slate-400 mb-3">বাতিল করলে ব্যবহারকারীর ব্যালেন্সে সমপরিমাণ অর্থ সঙ্গে সঙ্গে ফেরত যোগ হবে।</p>
            <input
              type="text"
              required
              placeholder="বাতিলের কারণ লিখুন..."
              value={rejectWithdrawalPrompt.reason}
              onChange={(e) => setRejectWithdrawalPrompt({ ...rejectWithdrawalPrompt, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-red-900/60 text-white text-xs mb-3"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectWithdrawalPrompt(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold"
              >
                ফিরে যান
              </button>
              <button
                onClick={() => handleUpdateWithdrawal(rejectWithdrawalPrompt.id, 'Rejected', rejectWithdrawalPrompt.reason)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                বাতিল ও রিফান্ড
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
