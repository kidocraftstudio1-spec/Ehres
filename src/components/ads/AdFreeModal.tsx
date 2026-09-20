import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ADSTERRA_CONFIG } from '../../config/ads';

interface AdFreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed: (expiresAt: number) => void;
}

export const AdFreeModal: React.FC<AdFreeModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(
    ADSTERRA_CONFIG.REWARD_COUNTDOWN_SECONDS
  );
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(ADSTERRA_CONFIG.REWARD_COUNTDOWN_SECONDS);
      setCanClaim(false);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClaim(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = () => {
    const twoHoursMs = ADSTERRA_CONFIG.AD_FREE_DURATION_MS;
    const expiresAt = Date.now() + twoHoursMs;
    onRewardClaimed(expiresAt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">وضع التركيز التام بدون إعلانات</h3>
              <p className="text-xs text-slate-400">ساعتان من المذاكرة الصافية بدون أي مشتتات</p>
            </div>
          </div>
          {canClaim && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Adsterra Simulated Rewarded Slot */}
        <div className="my-5 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/70 p-6 text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            إعلان راعٍ لدعم طلاب الثانوية العامة
          </div>

          <div className="my-4 h-32 w-full max-w-xs rounded-lg border border-dashed border-slate-700/80 bg-slate-900/60 p-4 flex flex-col items-center justify-center">
            <p className="text-sm font-semibold text-slate-200">
              منصة احرص للثانوية العامة المصرية
            </p>
            <p className="mt-1 text-xs text-slate-400">
              استمتع بتجربة دراسية نقية تدعم تفوقك والتزامك الروحي
            </p>
            <span className="mt-3 text-[10px] text-slate-500">
              Adsterra Sponsored Network
            </span>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Clock className="h-4 w-4 text-emerald-400 animate-pulse" />
            {canClaim ? (
              <span className="font-semibold text-emerald-400">
                اكتمل العرض! يمكنك الآن استلام مكافأتك
              </span>
            ) : (
              <span>
                يمكنك التخطي بعد{' '}
                <strong className="font-mono text-base text-amber-400">
                  {secondsRemaining}
                </strong>{' '}
                ثانية
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          {canClaim ? (
            <button
              id="claim-ad-free-reward-btn"
              onClick={handleClaim}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:brightness-110 active:scale-[0.99]"
            >
              <CheckCircle2 className="h-5 w-5" />
              استلام المكافأة (ساعتان بدون إعلانات)
            </button>
          ) : (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-slate-800 py-3 text-sm font-medium text-slate-500"
            >
              جاري تجهيز المكافأة ({secondsRemaining} ث)...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
