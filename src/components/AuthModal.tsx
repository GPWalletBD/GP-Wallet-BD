import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { 
  X, 
  Lock, 
  Phone, 
  User, 
  KeyRound, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Mail, 
  Send
} from 'lucide-react';
import { isFirebaseConfigured, sendPasswordReset } from '../lib/firebase.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register' | 'forgot';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const { login, register, loginWithGoogleAccount } = useAuth();

  // Register state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Login / Reset state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot password state
  const [forgotTab, setForgotTab] = useState<'email' | 'mobile'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccess(null);

    // Auto-detect referral code from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ username: loginIdentifier, password: loginPassword });
      onClose();
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      if (!isFirebaseConfigured) {
        // If Firebase keys are not in .env yet, give clear Bengali notification with instructions
        setError('Firebase কনফিগারেশন কী এখনো .env ফাইলে যুক্ত করা হয়নি। অনুগ্রহ করে Firebase কনসোলের Web App কনফিগারেশন যুক্ত করুন।');
        return;
      }
      await loginWithGoogleAccount(referralCode.trim() || undefined);
      setSuccess('গুগল দিয়ে সফলভাবে লগইন হয়েছে!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      if (err.message === 'FIREBASE_CONFIG_MISSING') {
        setError('Firebase API কী এখনো কনফিগার করা হয়নি। .env ফাইলে VITE_FIREBASE_API_KEY প্রদান করুন।');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে। আবার চেষ্টা করুন।');
      } else {
        setError(err.message || 'গুগল সাইন-ইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না!');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        username,
        mobile,
        password,
        confirmPassword,
        referralCode: referralCode.trim() || undefined
      });
      setSuccess('রেজিস্ট্রেশন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotEmail || !forgotEmail.includes('@')) {
      setError('একটি বৈধ Gmail বা ইমেইল ঠিকানা দিন।');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!isFirebaseConfigured) {
        setError('Firebase Auth কনফিগারেশন সক্রিয় নেই। .env ফাইলে Firebase সেটিংস যুক্ত করুন।');
        return;
      }
      await sendPasswordReset(forgotEmail.trim());
      setSuccess(`পাসওয়ার্ড রিসেট লিংকটি আপনার ইমেইল (${forgotEmail}) ঠিকানায় পাঠানো হয়েছে! অনুগ্রহ করে ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।`);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
      } else {
        setError(err.message || 'পাসওয়ার্ড রিসেট ইমেইল পাঠাতে সমস্যা হয়েছে।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('নতুন পাসওয়ার্ড দুটি মিলছে না!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernameOrMobile: forgotIdentifier,
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(data.message);
      setTimeout(() => {
        setMode('login');
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0a1329] border border-blue-900/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-amber-500 p-0.5 mb-2.5 shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#0a1329] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold font-heading text-white">
            {mode === 'login' && 'অ্যাকাউন্টে লগইন করুন'}
            {mode === 'register' && 'নতুন অ্যাকাউন্ট খুলুন'}
            {mode === 'forgot' && 'পাসওয়ার্ড পুনরুদ্ধার'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'GP Wallet BD-তে আপনার আয়ের যাত্রা শুরু করুন'}
            {mode === 'register' && 'ফ্রিতে একাউন্ট খুলে ৳২০ ওয়েলকাম বোনাস পান!'}
            {mode === 'forgot' && 'ইমেইল বা মোবাইল নম্বরের মাধ্যমে পাসওয়ার্ড পুনরুদ্ধার করুন'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* GOOGLE SIGN IN BUTTON FOR LOGIN & REGISTER MODES */}
        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {/* Google G SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleLoading ? 'গুগলে কানেক্ট হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-blue-900/50"></div>
              <span className="text-[11px] text-slate-500 font-medium">অথবা পাসওয়ার্ড দিয়ে</span>
              <div className="flex-1 h-px bg-blue-900/50"></div>
            </div>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                ব্যবহারকারী নাম অথবা মোবাইল নম্বর
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: shakib75 বা 01812345678"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="আপনার পাসওয়ার্ড দিন"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>

            <div className="pt-2 text-center text-xs text-slate-400">
              একাউন্ট নেই?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-400 font-semibold hover:underline"
              >
                নতুন অ্যাকাউন্ট তৈরি করুন
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">আপনার পূর্ণ নাম</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ সাকিব হাসান"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">ইউনিক ইউজারনেম (Username)</label>
              <input
                type="text"
                required
                placeholder="যেমন: shakib99 (ইংরেজি ছোট অক্ষরে)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">মোবাইল নম্বর (bKash/নগদ)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="যেমন: 01700000000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">নিশ্চিত পাসওয়ার্ড</label>
                <input
                  type="password"
                  required
                  placeholder="পুনরায় পাসওয়ার্ড"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-400/90 mb-1">রেফারেল কোড (ঐচ্ছিক)</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="রেফারেল কোড থাকলে দিন (যেমন: GP75SKB)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-300 placeholder-slate-500 text-xs uppercase focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/40 text-[11px] text-blue-300">
              রেজিস্ট্রেশন সম্পূর্ণ করলেই পাবেন একটি অনন্য User ID এবং একাউন্টে যোগ হবে ৳২০ ফ্রি বোনাস।
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? 'প্রসেস হচ্ছে...' : 'নিবন্ধন করুন'}
            </button>

            <div className="text-center text-xs text-slate-400">
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 font-semibold hover:underline"
              >
                লগইন করুন
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {/* SUB TABS: EMAIL RESET VS MOBILE RESET */}
            <div className="flex rounded-xl bg-slate-900/90 p-1 border border-blue-900/40">
              <button
                type="button"
                onClick={() => setForgotTab('email')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  forgotTab === 'email'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gmail / ইমেইল দিয়ে</span>
              </button>
              <button
                type="button"
                onClick={() => setForgotTab('mobile')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  forgotTab === 'mobile'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>মোবাইল/ইউজারনেম</span>
              </button>
            </div>

            {forgotTab === 'email' ? (
              <form onSubmit={handleEmailPasswordReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    আপনার নিবন্ধিত Gmail / ইমেইল ঠিকানা
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="যেমন: yourname@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    নিবন্ধিত Gmail দিলে সরাসরি Firebase Auth-এর সুরক্ষিত পাসওয়ার্ড রিসেট লিংক আপনার ইনবক্সে চলে যাবে।
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'পাঠানো হচ্ছে...' : 'ইমেইলে রিসেট লিংক পাঠান'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    ব্যবহারকারী নাম অথবা নিবন্ধিত মোবাইল নম্বর
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ইউজারনেম বা মোবাইল নম্বর দিন"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                  <input
                    type="password"
                    required
                    placeholder="নতুন পাসওয়ার্ডটি আবার দিন"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'রিসেট হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                </button>
              </form>
            )}

            <div className="text-center text-xs text-slate-400 pt-2 border-t border-blue-900/40">
              মনে পড়েছে?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 font-semibold hover:underline"
              >
                লগইন পাতায় ফিরে যান
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
