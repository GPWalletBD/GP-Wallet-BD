import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { ReferralClaim, ReferralMilestone } from '../types.js';
import { 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Award, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export const InviteView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    referralLink: string;
    totalInvited: number;
    totalSuccessfulReferrals: number;
    totalActiveReferrals?: number;
    totalInactiveReferrals?: number;
    milestones: (ReferralMilestone & {
      currentReferrals: number;
      isEligible: boolean;
      claimStatus: string;
      claimedAt: string | null;
    })[];
    invitedUsers: {
      userId: string;
      fullName: string;
      joinedAt: string;
      completedTasks: number;
      pendingTasks?: number;
      isReferralActive?: boolean;
      referralStatus?: string;
      taskActivityStatus?: string;
      status: string;
    }[];
    claims: ReferralClaim[];
  } | null>(null);

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimMsg, setClaimMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadReferralStats();
  }, [user]);

  const loadReferralStats = async () => {
    setLoading(true);
    try {
      const res = await api.referrals.getStats();
      setReferralData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyLink = () => {
    if (referralData?.referralLink) {
      navigator.clipboard.writeText(referralData.referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `GP Wallet BD-তে যোগ দিয়ে প্রতিদিন টাস্ক সম্পন্ন করে বিকাশ ও নগদে টাকা আয় করুন!\nআমার রেফারেল কোড: ${referralData?.referralCode}\nরেজিস্ট্রেশন লিংক: ${referralData?.referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(
      `GP Wallet BD - টাস্ক পূরণ করে নিশ্চিত আর্নিং!\nরেফারেল কোড: ${referralData?.referralCode}`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralData?.referralLink || '')}&text=${text}`, '_blank');
  };

  const handleClaim = async (milestoneId: number) => {
    setClaimingId(milestoneId);
    setClaimMsg(null);
    try {
      const res = await api.referrals.claimMilestone(milestoneId);
      setClaimMsg({ type: 'success', text: res.message });
      await loadReferralStats();
      await refreshUser();
    } catch (err: any) {
      setClaimMsg({ type: 'error', text: err.message || 'পুরস্কার দাবি ব্যর্থ হয়েছে।' });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* REFERRAL HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-xl bg-slate-900">
        <img
          src="/src/assets/images/banner_referral_gift_1793521412993.jpg"
          alt="Refer & Earn Rewards"
          className="w-full h-40 sm:h-52 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080f24] via-[#080f24]/50 to-transparent p-5 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
              রেফারেল রিওয়ার্ডস
            </span>
            <span className="text-xs text-amber-300 font-semibold">সর্বোচ্চ ৳৭,৫০০+ বোনাস</span>
          </div>
          <h2 className="text-base sm:text-lg font-heading font-extrabold text-white">
            বন্ধুদের ইনভাইট করুন এবং জিতে নিন আকর্ষণীয় ক্যাশ রিওয়ার্ড!
          </h2>
        </div>
      </div>

      {/* REFERRAL CODE & LINK CARD */}
      <div className="p-5 rounded-3xl bg-[#0a1329] border border-blue-900/50 shadow-md space-y-4">
        {/* Referral Code Box */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            আমার রেফারেল কোড (My Referral Code)
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-400 font-mono font-extrabold text-sm sm:text-base tracking-wider flex items-center justify-between">
              <span>{referralData?.referralCode || 'লোড হচ্ছে...'}</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md active:scale-95 shrink-0"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-900" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'কপি হয়েছে' : 'কপি করুন'}</span>
            </button>
          </div>
        </div>

        {/* Referral Link Box */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            আমার রেফারেল লিংক (My Referral Link)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralData?.referralLink || ''}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/50 text-slate-300 text-xs truncate focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md active:scale-95 shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'কপি হয়েছে' : 'লিংক কপি'}</span>
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="pt-2 border-t border-blue-900/30 flex items-center gap-2">
          <button
            onClick={shareToWhatsApp}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp-এ শেয়ার</span>
          </button>
          <button
            onClick={shareToTelegram}
            className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram-এ শেয়ার</span>
          </button>
        </div>
      </div>

      {/* REFERRAL STATS COUNTER - TOTAL, ACTIVE, INACTIVE */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 sm:p-4 rounded-2xl bg-[#091228] border border-blue-900/40 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400 block font-medium">মোট আমন্ত্রিত</span>
          <span className="text-base sm:text-xl font-bold font-heading text-white font-mono">
            {(referralData?.totalInvited ?? 0).toLocaleString('bn-BD')} জন
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#091228] border border-emerald-500/40 flex flex-col items-center justify-center text-center shadow-sm shadow-emerald-500/10">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] text-emerald-300 block font-medium">Active রেফারেল</span>
          <span className="text-base sm:text-xl font-bold font-heading text-emerald-400 font-mono">
            {((referralData?.totalActiveReferrals ?? referralData?.totalSuccessfulReferrals) ?? 0).toLocaleString('bn-BD')} জন
          </span>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#091228] border border-amber-500/40 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] sm:text-[11px] text-amber-300 block font-medium">Inactive রেফারেল</span>
          <span className="text-base sm:text-xl font-bold font-heading text-amber-400 font-mono">
            {(referralData?.totalInactiveReferrals ?? Math.max(0, (referralData?.totalInvited ?? 0) - (referralData?.totalSuccessfulReferrals ?? 0))).toLocaleString('bn-BD')} জন
          </span>
        </div>
      </div>

      {/* CLAIM STATUS ALERT */}
      {claimMsg && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          claimMsg.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : 'bg-red-950/60 border-red-500/40 text-red-200'
        }`}>
          {claimMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span>{claimMsg.text}</span>
        </div>
      )}

      {/* THREE SEPARATE REFERRAL REWARD CARDS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 rounded-full bg-amber-400" />
          <h3 className="font-heading font-bold text-sm text-white">রেফারেল মাইলস্টোন কার্ড সমূহ</h3>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">মাইলস্টোন কার্ড লোড হচ্ছে...</div>
          ) : (
            referralData?.milestones.map((m) => {
              const current = referralData.totalSuccessfulReferrals || 0;
              const progressPct = Math.min(100, Math.round((current / m.requiredReferrals) * 100));
              const isEligible = current >= m.requiredReferrals;
              const isClaimed = m.claimStatus === 'approved';
              const isPending = m.claimStatus === 'pending';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-3xl border transition-all relative overflow-hidden ${
                    isClaimed
                      ? 'bg-[#08152c] border-emerald-500/30 opacity-90'
                      : isEligible
                      ? 'bg-gradient-to-br from-[#0e1f48] to-[#0a1532] border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-[#0a1329] border-blue-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shadow-sm ${
                        isClaimed 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : isEligible 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'bg-blue-950 text-blue-300 border border-blue-800/40'
                      }`}>
                        {m.id === 1 && '১'}
                        {m.id === 2 && '২'}
                        {m.id === 3 && '৩'}
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                          কার্ড {m.id} (মাইলস্টোন)
                        </span>
                        <h4 className="font-heading font-bold text-sm text-white">{m.title}</h4>
                        <span className="text-xs text-slate-400">
                          প্রয়োজন: <strong className="text-slate-200">{m.requiredReferrals} জন</strong> সফল রেফারেল
                        </span>
                      </div>
                    </div>

                    {/* Reward Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold font-heading text-amber-400 font-mono block">
                        ৳{m.rewardAmount.toLocaleString('bn-BD')}
                      </span>
                      <span className="text-[10px] text-slate-400">বোনাস রিওয়ার্ড</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 my-3">
                    <div className="flex justify-between text-[11px] font-medium text-slate-400">
                      <span>অগ্রগতি: {current} / {m.requiredReferrals} জন</span>
                      <span className="font-mono text-amber-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-blue-900/30">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isClaimed ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-amber-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-slate-400">
                      {isClaimed && <span className="text-emerald-400 font-medium">✓ ইতিমধ্যে গ্রহণ করা হয়েছে</span>}
                      {isPending && <span className="text-amber-400 font-medium">⏳ এডমিন যাচাই চলছে</span>}
                      {!isClaimed && !isPending && !isEligible && (
                        <span>আরও {m.requiredReferrals - current} জন রেফারেল প্রয়োজন</span>
                      )}
                      {!isClaimed && !isPending && isEligible && (
                        <span className="text-amber-300 font-semibold">অভিনন্দন! আপনি দাবি করার যোগ্য</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleClaim(m.id)}
                      disabled={!isEligible || isClaimed || isPending || claimingId === m.id}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        isClaimed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 cursor-not-allowed opacity-75'
                          : isPending
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                          : isEligible
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>দাবি সম্পন্ন</span>
                        </>
                      ) : isPending ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>যাচাই হচ্ছে</span>
                        </>
                      ) : (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          <span>{claimingId === m.id ? 'দাবি হচ্ছে...' : 'পুরস্কার দাবি করুন'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* REFERRAL POLICY GUIDELINES */}
      <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40 text-xs space-y-2 text-slate-300">
        <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          রেফারেল নিয়মাবলী ও শর্তসমূহ:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
          <li>প্রতিটি মাইলস্টোন পুরস্কার কেবল একবার দাবি করা যাবে।</li>
          <li>আমন্ত্রিত ব্যবহারকারীকে অবশ্যই কমপক্ষে ১টি ভেরিফাইড টাস্ক সম্পন্ন করতে হবে।</li>
          <li>ভুয়া অ্যাকাউন্ট তৈরি করলে বা একই ডিভাইস দিয়ে একাধিক রেফারেল তৈরি করলে তা স্বয়ংক্রিয়ভাবে বাতিল হবে।</li>
          <li>দাবি জমা দেওয়ার পর অ্যাডমিন যাচাই করে মূল ব্যালেন্সে যোগ করবেন।</li>
        </ul>
      </div>

      {/* INVITED USERS LIST WITH ACTIVE & INACTIVE STATUS */}
      {referralData?.invitedUsers && referralData.invitedUsers.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-white">আমার মাধ্যমে নিবন্ধিত সদস্যবৃন্দ ({referralData.invitedUsers.length} জন):</h4>
            <span className="text-[10px] text-slate-400">১টি অনুমোদিত টাস্কে Active হয়</span>
          </div>
          <div className="space-y-2">
            {referralData.invitedUsers.map((inv) => {
              const isActive = Boolean(inv.isReferralActive || inv.completedTasks > 0);
              return (
                <div key={inv.userId} className="p-3 rounded-2xl bg-[#0a1329] border border-blue-900/40 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 block">{inv.fullName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({inv.userId})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{inv.taskActivityStatus || `সম্পন্ন কাজ: ${inv.completedTasks} টি`}</span>
                      {inv.pendingTasks && inv.pendingTasks > 0 ? (
                        <span className="text-amber-400 font-medium">· পেন্ডিং: {inv.pendingTasks} টি</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Active (সক্রিয়)
                      </span>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          <Clock className="w-3 h-3" />
                          Inactive
                        </span>
                        <span className="text-[9px] text-slate-500 mt-0.5">টাস্ক অনুমোদন প্রয়োজন</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
