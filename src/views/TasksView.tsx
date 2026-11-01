import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Task, TaskCategory, ProofMethod } from '../types.js';
import { 
  Sparkles, 
  ExternalLink, 
  Send, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Share2, 
  Youtube, 
  Globe, 
  Smartphone, 
  Check, 
  Copy,
  Info
} from 'lucide-react';

interface TasksViewProps {
  initialSelectedTask?: Task | null;
  onClearSelectedTask?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ 
  initialSelectedTask = null, 
  onClearSelectedTask 
}) => {
  const { user, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<(Task & { userSubmissionStatus: string; userSubmissionId: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTask, setActiveTask] = useState<(Task & { userSubmissionStatus?: string }) | null>(initialSelectedTask);
  
  // Submission modal state
  const [proofNote, setProofNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (initialSelectedTask) {
      setActiveTask(initialSelectedTask);
    }
  }, [initialSelectedTask]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.tasks.getAll();
      setTasks(res.tasks);
      if (activeTask) {
        const fresh = res.tasks.find(t => t.id === activeTask.id);
        if (fresh) setActiveTask(fresh);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'সবগুলো' },
    { id: 'youtube', label: 'ইউটিউব' },
    { id: 'telegram', label: 'টেলিগ্রাম' },
    { id: 'facebook', label: 'ফেসবুক' },
    { id: 'app_registration', label: 'অ্যাপ রেজিস্ট্রেশন' },
    { id: 'web_registration', label: 'ওয়েবসাইট সাইন আপ' },
    { id: 'web_visit', label: 'ওয়েব ভিজিট' }
  ];

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(t => t.category === selectedCategory);

  const handleOpenTaskDetails = (task: Task & { userSubmissionStatus?: string }) => {
    setActiveTask(task);
    setProofNote('');
    setSubmissionSuccess(null);
    setSubmissionError(null);
  };

  const handleCloseTaskDetails = () => {
    setActiveTask(null);
    if (onClearSelectedTask) onClearSelectedTask();
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;
    setSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(null);

    try {
      const res = await api.tasks.submitProof(activeTask.id, proofNote);
      setSubmissionSuccess(res.message);
      await loadTasks();
      await refreshUser();
      setTimeout(() => {
        handleCloseTaskDetails();
      }, 2000);
    } catch (err: any) {
      setSubmissionError(err.message || 'প্রমাণ জমা দিতে সমস্যা হয়েছে।');
    } finally {
      setSubmitting(false);
    }
  };

  const copyText = (text: string, type: 'task' | 'user') => {
    navigator.clipboard.writeText(text);
    if (type === 'task') {
      setCopiedTaskId(true);
      setTimeout(() => setCopiedTaskId(false), 2000);
    } else {
      setCopiedUserId(true);
      setTimeout(() => setCopiedUserId(false), 2000);
    }
  };

  // Helper to open proof submission messenger (WhatsApp / Telegram) with prepopulated message
  const getProofExternalUrl = (task: Task) => {
    const message = encodeURIComponent(
      `GP Wallet BD Task Proof Submission\n` +
      `User ID: ${user?.userId}\n` +
      `User Name: ${user?.fullName}\n` +
      `Task ID: ${task.id}\n` +
      `Task: ${task.title}\n` +
      `Reward: ৳${task.rewardAmount}\n` +
      `এখানে স্ক্রিনশট সংযুক্ত করুন।`
    );

    if (task.proofMethod === 'whatsapp') {
      // Check if proofUrl already is wa.me
      if (task.proofUrl.includes('wa.me')) {
        return `${task.proofUrl}?text=${message}`;
      }
      return `https://wa.me/?text=${message}`;
    }

    if (task.proofMethod === 'telegram') {
      return task.proofUrl;
    }

    return task.proofUrl;
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-950 via-[#0e214d] to-blue-950 border border-blue-900/40 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-base text-white">টাস্ক সম্পন্ন করে আয় করুন</h2>
            <p className="text-xs text-slate-300">প্রতিটি কাজ শেষ করে স্ক্রিনশট ও আইডি প্রমাণ হিসেবে জমা দিন</p>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER BUTTONS */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border border-blue-900/40'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* TASK LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">টাস্ক তালিকা লোড হচ্ছে...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#091226] border border-blue-900/30 text-center text-slate-400">
            <Info className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs">এই ক্যাটাগরিতে বর্তমানে কোনো টাস্ক নেই।</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const status = task.userSubmissionStatus;
            return (
              <div
                key={task.id}
                className="p-4 rounded-3xl bg-[#0a142c] border border-blue-900/40 hover:border-blue-700/60 shadow-lg shadow-black/20 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#060c1d] border border-blue-800/50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                      {task.logoUrl ? (
                        <img 
                          src={task.logoUrl} 
                          alt={task.title} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <Sparkles className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/40">
                          {task.category.replace('_', ' ')}
                        </span>
                        
                        {/* Status badge */}
                        {status === 'approved' && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            সম্পন্ন (অনুমোদিত)
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            পেন্ডিং ভেরিফিকেশন
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            বাতিল হয়েছে
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-sm text-white line-clamp-1">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {task.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-extrabold font-mono shadow-sm">
                      ৳{task.rewardAmount}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">পুরস্কার</span>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-slate-500 font-mono">আইডি: {task.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-blue-300 font-medium">সম্পন্ন করেছেন: {task.totalCompleted} জন</span>
                  </div>

                  <button
                    onClick={() => handleOpenTaskDetails(task)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-900/30 active:scale-95"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* TASK DETAILS & PROOF SUBMISSION MODAL */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0a1329] border border-blue-800/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Close button */}
            <button
              onClick={handleCloseTaskDetails}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-4 mb-4 pr-8">
              <div className="w-14 h-14 rounded-2xl bg-[#060c1d] border border-amber-500/40 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                {activeTask.logoUrl ? (
                  <img src={activeTask.logoUrl} alt={activeTask.title} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <Sparkles className="w-7 h-7 text-amber-400" />
                )}
              </div>
              <div>
                <span className="inline-block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-0.5">
                  টাস্ক ক্যাটাগরি: {activeTask.category}
                </span>
                <h3 className="text-base font-bold font-heading text-white leading-snug">
                  {activeTask.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                    পুরস্কার: ৳{activeTask.rewardAmount}
                  </span>
                  <span className="text-xs text-slate-400">
                    সফলভাবে সম্পন্ন: {activeTask.totalCompleted} বার
                  </span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4 my-4">
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-900/50">
                <h4 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-400" />
                  কাজের বিবরণ ও নির্দেশনা:
                </h4>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {activeTask.instructions || activeTask.fullDescription}
                </p>
              </div>

              {/* ACTION 1: OPEN LINK */}
              <div className="p-3.5 rounded-2xl bg-[#0e1c3e] border border-blue-800/40 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">ধাপ ১: কাজ শুরু করুন</span>
                  <span className="text-[11px] text-slate-400">নিচের লিংকে ক্লিক করে টাস্কের পেজে যান</span>
                </div>
                <a
                  href={activeTask.taskUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <span>লিংক খুলুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* ACTION 2: SEND PROOF VIA CONFIGURED METHOD (WHATSAPP / TELEGRAM / EXTERNAL) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10224d] to-[#0a1532] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    {activeTask.proofMethod === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4 text-blue-400" />}
                    ধাপ ২: প্রমাণ (স্ক্রিনশট) প্রেরণ করুন
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950 text-blue-300 border border-blue-800/40 uppercase font-semibold">
                    {activeTask.proofMethod.toUpperCase()} ভেরিফিকেশন
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  টাস্কের স্ক্রিনশট নিন। স্ক্রিনশটের সাথে অবশ্যই নিচের <strong className="text-amber-400">User ID</strong> এবং <strong className="text-amber-400">Task ID</strong> লিখে অ্যাডমিনকে পাঠান:
                </p>

                {/* Copy ID helpers */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-blue-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">আপনার User ID</span>
                      <span className="font-mono font-bold text-white text-xs">{user?.userId || 'N/A'}</span>
                    </div>
                    <button
                      onClick={() => copyText(user?.userId || '', 'user')}
                      className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-slate-300 transition-colors"
                      title="কপি করুন"
                    >
                      {copiedUserId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-blue-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">টাস্ক ID</span>
                      <span className="font-mono font-bold text-white text-xs truncate max-w-[90px]">{activeTask.id}</span>
                    </div>
                    <button
                      onClick={() => copyText(activeTask.id, 'task')}
                      className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-slate-300 transition-colors"
                      title="কপি করুন"
                    >
                      {copiedTaskId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <a
                  href={getProofExternalUrl(activeTask)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    activeTask.proofMethod === 'whatsapp'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {activeTask.proofMethod === 'whatsapp' ? (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>হোয়াটসঅ্যাপে স্ক্রিনশট ও আইডি পাঠান</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>টেলিগ্রামে স্ক্রিনশট ও আইডি পাঠান</span>
                    </>
                  )}
                </a>
              </div>

              {/* ACTION 3: IN-APP SUBMISSION RECORD */}
              <form onSubmit={handleSubmitProof} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ধাপ ৩: সিস্টেমে সাবমিশন নিশ্চিত করুন (নোট / প্রমাণের বিবরণ)
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="যেমন: আমি টেলিগ্রামে সাবস্ক্রাইব করেছি এবং হোয়াটসঅ্যাপে স্ক্রিনশট পাঠিয়েছি।"
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900/90 border border-blue-900/60 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {submissionError && (
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{submissionError}</span>
                  </div>
                )}

                {submissionSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{submissionSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-98 disabled:opacity-50"
                >
                  {submitting ? 'সাবমিট হচ্ছে...' : 'প্রমাণ সাবমিট করুন (Submit Proof)'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
