import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'settings';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (isInstallable) {
      await install();
    } else {
      setShowIOSGuide(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          id="pwa-header-install-btn"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition active:scale-95"
          title="تثبيت تطبيق احرص على جهازك للعمل بدون إنترنت وتلقي التنبيهات"
        >
          <Download className="h-3.5 w-3.5" />
          <span>ثبّت التطبيق</span>
        </button>

        {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  if (variant === 'banner') {
    return (
      <>
        <div className="relative flex items-center justify-between rounded-2xl border border-primary/30 bg-primary-container p-3.5 text-sm text-text-main transition-colors">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-text-main">ثبّت تطبيق "احرص" على هاتفك</h4>
              <p className="text-xs text-text-secondary">للحصول على تنبيهات الصلوات والمذاكرة وتصفح أسرع دون إنترنت</p>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            className="shrink-0 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-dark transition shadow-sm"
          >
            تثبيت الآن
          </button>
        </div>

        {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  // Settings variant
  return (
    <>
      <button
        id="pwa-settings-install-btn"
        onClick={handleInstallClick}
        className="flex w-full items-center justify-between rounded-2xl border border-outline bg-surface-variant p-3.5 text-right transition hover:bg-surface"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-text-main">تثبيت التطبيق على الشاشة الرئيسية (PWA)</div>
            <div className="text-xs text-text-secondary">يعمل بدون إنترنت وتنبيهات أسرع وأداء فائق</div>
          </div>
        </div>
        <span className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm">
          تثبيت
        </span>
      </button>

      {showIOSGuide && <IOSInstallModal onClose={() => setShowIOSGuide(false)} />}
    </>
  );
};

const IOSInstallModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-outline">
        <h3 className="text-base font-bold text-text-main">تثبيت التطبيق على iPhone / iPad</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-text-secondary hover:text-text-main transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="my-4 space-y-3 text-xs leading-relaxed text-text-secondary">
        <div className="flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-primary">
            1
          </span>
          <p>
            اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari بالأسفل.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-primary">
            2
          </span>
          <p>
            مرّر للأسفل ثم اختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-container font-bold text-primary">
            3
          </span>
          <p>اضغط على <strong>إضافة (Add)</strong> في أعلى الزاوية ليظهر التطبيق كأيقونة على هاتفك!</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="w-full rounded-xl bg-surface-variant py-2.5 text-xs font-semibold text-text-main hover:bg-outline/40 transition"
      >
        حسناً، فهمت
      </button>
    </div>
  </div>
);
