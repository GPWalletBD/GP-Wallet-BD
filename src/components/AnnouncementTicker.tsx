import React from 'react';
import { Megaphone } from 'lucide-react';

interface AnnouncementTickerProps {
  announcement?: string;
}

export const AnnouncementTicker: React.FC<AnnouncementTickerProps> = ({ announcement }) => {
  if (!announcement) return null;

  return (
    <div className="bg-gradient-to-r from-blue-950 via-[#0d1f4a] to-blue-950 border-y border-blue-900/40 px-3 py-2 flex items-center gap-2 overflow-hidden shadow-inner">
      <div className="flex items-center gap-1.5 shrink-0 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full text-xs font-semibold">
        <Megaphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-[11px]">নোটিশ:</span>
      </div>
      <div className="overflow-hidden relative w-full">
        <p className="text-xs text-slate-200 font-medium whitespace-nowrap animate-marquee">
          {announcement}
        </p>
      </div>
    </div>
  );
};
