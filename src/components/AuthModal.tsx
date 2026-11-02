

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import {
  X, Lock, Phone, User, KeyRound, Sparkles,
  AlertCircle, CheckCircle2, Mail, Send
} from 'lucide-react';
import { isFirebaseConfigured, sendPasswordReset } from '../lib/firebase.js';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register' | 'forgot';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen, initialMode, onClose
}) => {
  const { login, register, loginWithGoogleAccount } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccess(null);

    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setReferralCode(ref.toUpperCase());
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({
        email: loginEmail.trim(),
        password: loginPassword
      });
      onClose();
    } catch (err: any) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে।'
          : err.message || 'লগইন ব্যর্থ হয়েছে।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      if (!isFirebaseConfigured) {
        throw new Error('Firebase কনফিগারেশন পাওয়া যায়নি।');
      }

      await loginWithGoogleAccount(referralCode.trim() || undefined);
      setSuccess('Google দিয়ে সফলভাবে লগইন হয়েছে!');
      setTimeout(onClose, 700);
    } catch (err: any) {
      setError(err.message || 'Google লগইন ব্যর্থ হয়েছে।');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড দুটি মিলছে না।');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: email.trim(),
        fullName,
        username,
        mobile,
        password,
        confirmPassword,
        referralCode: referralCode.trim() || undefined
      });

      setSuccess('রেজিস্ট্রেশন সফল হয়েছে!');
      setTimeout(onClose, 1000);
    } catch (err: any) {
      const message =
        err.code === 'auth/email-already-in-use'
          ? 'এই ইমেইল দিয়ে আগে অ্যাকাউন্ট খোলা হয়েছে।'
          : err.code === 'auth/weak-password'
          ? 'আরও শক্তিশালী পাসওয়ার্ড দিন।'
          : err.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।';

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!forgotEmail.trim().includes('@')) {
      setError('সঠিক ইমেইল ঠিকানা দিন।');
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordReset(forgotEmail.trim());
      setSuccess('পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে।');
    } catch (err: any) {
      setError(err.message || 'রিসেট লিংক পাঠানো যায়নি।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-blue-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0a1329] border border-blue-900/60 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto no-scrollbar">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-amber-500 mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-bold text-white">
            {mode === 'login' && 'অ্যাকাউন্টে লগইন করুন'}
            {mode === 'register' && 'নতুন অ্যাকাউন্ট খুলুন'}
            {mode === 'forgot' && 'পাসওয়ার্ড পুনরুদ্ধার'}
          </h2>

          <p className="text-xs text-slate-400 mt-1">
            GP Wallet BD
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3 mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting}
              className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="font-bold text-blue-600">G</span>
              {isGoogleLoading ? 'Google কানেক্ট হচ্ছে...' : 'Google দিয়ে সাইন ইন করুন'}
            </button>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-blue-900/50" />
              <span className="text-[11px] text-slate-500">অথবা ইমেইল দিয়ে</span>
              <div className="flex-1 h-px bg-blue-900/50" />
            </div>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                ইমেইল ঠিকানা
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="আপনার ইমেইল"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-slate-300">পাসওয়ার্ড</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-amber-400"
                >
                  ভুলে গেছেন?
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড দিন"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>

            <div className="text-center text-xs text-slate-400">
              অ্যাকাউন্ট নেই?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-400 font-semibold"
              >
                নিবন্ধন করুন
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">পূর্ণ নাম</label>
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="আপনার পূর্ণ নাম"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">ইউজারনেম</label>
              <input
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ইউনিক ইউজারনেম"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">ইমেইল ঠিকানা</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">পাসওয়ার্ড</label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">নিশ্চিত করুন</label>
                <input
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="আবার দিন"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-amber-400 mb-1">
                রেফারেল কোড (ঐচ্ছিক)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="রেফারেল কোড"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'প্রসেস হচ্ছে...' : 'নিবন্ধন করুন'}
            </button>

            <div className="text-center text-xs text-slate-400">
              আগে থেকেই অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-400 font-semibold"
              >
                লগইন করুন
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                নিবন্ধিত ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="yourname@gmail.com"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4 inline mr-2" />
              {isSubmitting ? 'পাঠানো হচ্ছে...' : 'রিসেট লিংক পাঠান'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-xs text-amber-400"
            >
              লগইন পাতায় ফিরে যান
            </button>
          </form>
        )}
      </div>
    </div>
  );
  }
