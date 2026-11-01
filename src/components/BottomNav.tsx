import React from 'react';
import { Home, Layers, Gift, Wallet, UserCircle } from 'lucide-react';

export type NavTab = 'home' | 'tasks' | 'invite' | 'withdraw' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  pendingWithdrawalsCount?: number;
  pendingTasksCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  pendingTasksCount = 0
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'হোম', icon: Home },
    { id: 'tasks' as NavTab, label: 'আয়', icon: Layers, badge: pendingTasksCount > 0 ? pendingTasksCount : undefined },
    { id: 'invite' as NavTab, label: 'ইনভাইট', icon: Gift, isHighlight: true },
    { id: 'withdraw' as NavTab, label: 'উত্তোলন', icon: Wallet },
    { id: 'profile' as NavTab, label: 'আমার অ্যাকাউন্ট', icon: UserCircle }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#080e21]/95 backdrop-blur-lg border-t border-blue-900/40 pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex flex-col items-center justify-center py-1 transition-all group min-h-[48px] focus:outline-none"
            >
              {tab.isHighlight && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              )}
              
              <div
                className={`relative flex items-center justify-center transition-transform duration-200 ${
                  isActive ? 'scale-110 -translate-y-0.5' : 'group-active:scale-95 text-slate-400'
                }`}
              >
                <div
                  className={`w-10 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    isActive 
                      ? 'bg-blue-600/20 text-amber-400 border border-amber-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-amber-400' : 'stroke-[1.8]'}`} />
                </div>
                
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 px-1 min-w-[16px] h-4 bg-amber-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors whitespace-nowrap ${
                  isActive ? 'text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <div className="w-4 h-0.5 bg-gradient-to-r from-amber-400 to-blue-400 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
