import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Bell, ShieldCheck, User as UserIcon, LogIn } from 'lucide-react';

interface TopBarProps {
  onOpenNotifications: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onToggleAdmin: () => void;
  isInAdminView: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNotifications,
  onOpenAuth,
  onToggleAdmin,
  isInAdminView
}) => {
  const { user, isAuthenticated, isAdmin, unreadCount } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#080e21]/90 backdrop-blur-md border-b border-blue-900/30 px-4 py-2.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-amber-500/40 shadow-sm shadow-blue-500/20 bg-slate-900 flex items-center justify-center">
            <img 
              src="/src/assets/images/gp_wallet_logo_1793521411853.jpg" 
              alt="GP Wallet BD" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-base tracking-tight text-white">
                GP Wallet <span className="text-amber-400">BD</span>
              </span>
              {isAdmin && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-[10px] font-semibold">
                  অ্যাডমিন
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">বিশ্বস্ত টাস্ক আর্নিং প্ল্যাটফর্ম</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Admin panel navigation button - ONLY rendered for authorized admin */}
          {isAdmin && (
            <button
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                isInAdminView 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">{isInAdminView ? 'ওয়েবসাইট দেখুন' : 'অ্যাডমিন প্যানেল'}</span>
            </button>
          )}

          {/* Notifications Button */}
          {isAuthenticated && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-900/80 border border-blue-900/40 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="বিজ্ঞপ্তি"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User Account / Login Button */}
          {!isAuthenticated ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold text-xs transition-all shadow-sm shadow-amber-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>লগইন</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-blue-900/40">
              <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[100px]">{user?.fullName}</span>
                <span className="text-[10px] text-amber-400 font-mono font-medium">ID: {user?.userId}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
