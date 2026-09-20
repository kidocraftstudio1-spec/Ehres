import React from 'react';
import {
  Compass,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { StudentProfile, AdSettings, AppSettings } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  profile: StudentProfile | null;
  appSettings: AppSettings;
  adSettings: AdSettings;
  onToggleTheme: () => void;
  onOpenAdFreeModal: () => void;
  onNavigate: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  appSettings,
  adSettings,
  onToggleTheme,
  onOpenAdFreeModal,
  onNavigate,
}) => {
  const isAdFree = adSettings.noAdsUntil > Date.now();
  const adFreeMinutes = isAdFree
    ? Math.max(1, Math.round((adSettings.noAdsUntil - Date.now()) / (60 * 1000)))
    : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-outline/70 bg-surface/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand Logo & Title */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white shadow-md shadow-primary/20">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-text-main">
                احْرِصْ
              </span>
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-[10px] font-bold text-primary dark:text-primary-light">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-text-secondary font-medium leading-none">
              رفيقك للتفوق والالتزام
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Ad-Free Focus Mode Trigger / Status */}
          {isAdFree ? (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary-container/40 px-2.5 py-1 text-xs font-semibold text-primary dark:text-primary-light"
              title="وضع التركيز مفعّل بدون إعلانات"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>تركيز ({adFreeMinutes} د)</span>
            </div>
          ) : (
            <button
              onClick={onOpenAdFreeModal}
              className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-accent/40 bg-accent-container px-2.5 py-1 text-xs font-bold text-accent-dark hover:bg-accent/20 transition"
              title="شاهد إعلاناً قصيراً للحصول على ساعتين بدون إعلانات"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>بدون إعلانات</span>
            </button>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton variant="header" />

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline bg-surface-variant text-text-main hover:bg-surface transition"
            title={appSettings.theme === 'dark' ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الليلي'}
          >
            {appSettings.theme === 'dark' ? (
              <Sun className="h-4 w-4 text-accent-light" />
            ) : (
              <Moon className="h-4 w-4 text-secondary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
