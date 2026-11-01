import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { NotificationItem } from '../types.js';
import { X, CheckCheck, Bell, Clock } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#0a1329] border border-blue-900/60 rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">বিজ্ঞপ্তি সমূহ</h3>
              <p className="text-[11px] text-slate-400">আপনার সাম্প্রতিক আপডেট ও নোটিশ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              title="সব পঠিত করুন"
              className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="text-[11px]">পঠিত</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-900/80 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto no-scrollbar flex-1 py-3 space-y-2.5">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">বিজ্ঞপ্তি লোড হচ্ছে...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="text-xs">কোনো নতুন বিজ্ঞপ্তি নেই</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-2xl border transition-all ${
                  notif.isRead 
                    ? 'bg-slate-900/50 border-blue-950/60 text-slate-300' 
                    : 'bg-[#101e42] border-amber-500/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                    {!notif.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(notif.createdAt).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
