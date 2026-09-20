import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-indicator"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-2xl bg-accent px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xl border border-accent-dark/20 backdrop-blur-sm animate-pulse"
      dir="rtl"
    >
      <WifiOff className="h-4 w-4" />
      <span>أنت تعمل في وضع عدم الاتصال (Offline) — جميع بياناتك محفوظة بأمان محلياً.</span>
    </div>
  );
};
