import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { TopBar } from './components/TopBar.js';
import { BottomNav, NavTab } from './components/BottomNav.js';
import { AnnouncementTicker } from './components/AnnouncementTicker.js';
import { AuthModal } from './components/AuthModal.js';
import { NotificationsModal } from './components/NotificationsModal.js';
import { HomeView } from './views/HomeView.js';
import { TasksView } from './views/TasksView.js';
import { InviteView } from './views/InviteView.js';
import { WithdrawView } from './views/WithdrawView.js';
import { ProfileView } from './views/ProfileView.js';
import { AdminView } from './views/AdminView.js';
import { Task } from './types.js';

function MainApp() {
  const { user, settings, isAdmin, refreshUnreadCount, refreshUser, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isInAdminView, setIsInAdminView] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Modals state
  const [authModalState, setAuthModalState] = useState<{
    isOpen: boolean;
    mode: 'login' | 'register' | 'forgot';
  }>({
    isOpen: false,
    mode: 'login'
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleSelectTaskFromHome = (task: Task) => {
    setSelectedTask(task);
    setCurrentTab('tasks');
  };

  const handleTabChange = (tab: NavTab) => {
    setIsInAdminView(false);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080e21] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-amber-500/40 p-0.5 shadow-xl shadow-blue-900/40 bg-slate-900 animate-pulse mb-3">
          <img
            src="/src/assets/images/gp_wallet_logo_1793521411853.jpg"
            alt="GP Wallet BD"
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="font-heading font-extrabold text-lg text-white tracking-tight">
          GP Wallet <span className="text-amber-400">BD</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e21] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-300">
      {/* STICKY TOP APP BAR */}
      <TopBar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
        onToggleAdmin={() => setIsInAdminView(!isInAdminView)}
        isInAdminView={isInAdminView}
      />

      {/* ANNOUNCEMENT TICKER (IF CONFIGURED) */}
      {!isInAdminView && (
        <AnnouncementTicker announcement={settings?.announcement} />
      )}

      {/* MAIN VIEWPORT CONTAINER (Responsive on Android phone, tablet, and desktop) */}
      <main className="flex-1 max-w-2xl lg:max-w-4xl mx-auto w-full px-3.5 sm:px-6 pt-4 pb-20">
        {isInAdminView && isAdmin ? (
          <AdminView onExitAdmin={() => setIsInAdminView(false)} />
        ) : (
          <>
            {currentTab === 'home' && (
              <HomeView
                onNavigate={handleTabChange}
                onSelectTask={handleSelectTaskFromHome}
              />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                initialSelectedTask={selectedTask}
                onClearSelectedTask={() => setSelectedTask(null)}
              />
            )}

            {currentTab === 'invite' && <InviteView />}

            {currentTab === 'withdraw' && <WithdrawView />}

            {currentTab === 'profile' && (
              <ProfileView
                onOpenAdmin={() => setIsInAdminView(true)}
                onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
              />
            )}
          </>
        )}
      </main>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
        pendingTasksCount={user?.pendingTasksCount}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={authModalState.isOpen}
        initialMode={authModalState.mode}
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* NOTIFICATIONS MODAL */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUpdate={() => {
          refreshUnreadCount();
          refreshUser();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
