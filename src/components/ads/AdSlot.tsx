import React, { useEffect, useRef, useState } from 'react';
import { ADSTERRA_CONFIG } from '../../config/ads';
import { AdSettings } from '../../types';

interface AdSlotProps {
  type: 'banner' | 'native';
  adSettings: AdSettings;
  className?: string;
  isFocusSessionActive?: boolean;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  type,
  adSettings,
  className = '',
  isFocusSessionActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Check if ad-free focus mode is active
  const isAdFree = adSettings.noAdsUntil > Date.now();

  // Strict rule: Never display ads if Ad-Free mode is active OR if in an active Pomodoro focus session
  if (isAdFree || isFocusSessionActive) {
    return null;
  }

  useEffect(() => {
    // Attempt to safely mount Adsterra script container without throwing uncaught errors
    try {
      const container = containerRef.current;
      if (!container) return;

      // Check if test script or container is blocked
      const isPlaceholder = adSettings.bannerKey.includes('placeholder');
      if (isPlaceholder) {
        // In development/preview placeholder mode, render a quiet, non-breaking sponsor box
        setIsLoaded(true);
        return;
      }

      // If real script keys are provided, dynamically inject
      const key = type === 'banner' ? adSettings.bannerKey : adSettings.nativeKey;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = `//www.profitablecpmrate.com/${key}/invoke.js`;

      script.onerror = () => {
        // Graceful silent degradation on AdBlock or network block
        setIsAdBlocked(true);
      };

      script.onload = () => {
        setIsLoaded(true);
      };

      container.innerHTML = '';
      container.appendChild(script);

      return () => {
        try {
          if (container) container.innerHTML = '';
        } catch (e) {
          // Silent cleanup
        }
      };
    } catch (e) {
      setIsAdBlocked(true);
    }
  }, [type, adSettings.bannerKey, adSettings.nativeKey]);

  if (isAdBlocked) {
    // Silent fail - return null so UI doesn't break
    return null;
  }

  return (
    <div
      id={`ad-slot-${type}`}
      className={`relative overflow-hidden rounded-2xl border border-outline bg-surface-variant/40 p-2 text-center transition-all ${className}`}
    >
      <div className="mb-1 flex items-center justify-between px-2 text-[10px] font-medium text-text-secondary">
        <span>إعلان مُرعى • منصة التفوق للثانوية العامة</span>
        <span className="rounded bg-surface px-1.5 py-0.5 text-[9px] border border-outline text-text-secondary">
          إعلان
        </span>
      </div>

      <div
        ref={containerRef}
        className="min-h-[50px] w-full flex items-center justify-center text-xs text-text-secondary"
      >
        {/* Adsterra script mounts here or graceful placeholder in development */}
        <div className="flex flex-col items-center justify-center py-2 px-4">
          <div className="text-[11px] font-medium text-text-main">
            مساحة إعلانية لدعم المنصة والمحتوى التعليمي المجاني
          </div>
          <div className="text-[10px] text-text-secondary mt-0.5">
            Adsterra Ad Slot ({type === 'banner' ? 'Banner 728x90' : 'Native Item'})
          </div>
        </div>
      </div>
    </div>
  );
};
