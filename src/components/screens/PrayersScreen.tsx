import React, { useState, useEffect } from 'react';
import {
  Heart,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Circle,
  Navigation,
  Flame,
  Award,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { DailyPrayerRecord, PrayerCategory, PrayerDefinition, AppSettings } from '../../types';
import { PRAYER_DEFINITIONS, POPULAR_CITIES } from '../../data/seedData';
import { PrayerService, PrayerTimings, NextPrayerInfo } from '../../services/prayerService';
import { notificationService } from '../../services/notifications';

interface PrayersScreenProps {
  todayRecord: DailyPrayerRecord | null;
  allRecords: DailyPrayerRecord[];
  appSettings: AppSettings;
  onTogglePrayer: (prayerId: string, completed: boolean) => Promise<void>;
  onUpdateCity: (city: string, useGeo: boolean) => Promise<void>;
}

export const PrayersScreen: React.FC<PrayersScreenProps> = ({
  todayRecord,
  allRecords,
  appSettings,
  onTogglePrayer,
  onUpdateCity,
}) => {
  const [tab, setTab] = useState<'all' | 'fard' | 'sunnah' | 'nafl'>('all');
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState(appSettings.selectedCity || 'القاهرة');
  const [duaaModalContent, setDuaaModalContent] = useState<{
    prayerName: string;
    duaa: string;
    virtue: string;
  } | null>(null);

  // Fetch timings
  useEffect(() => {
    let isMounted = true;

    async function loadTimings() {
      try {
        const res = await PrayerService.getTimings(
          selectedCity,
          appSettings.useGeolocation,
          appSettings.userLat && appSettings.userLng
            ? { lat: appSettings.userLat, lng: appSettings.userLng }
            : undefined
        );
        if (isMounted) {
          setTimings(res.timings);
          setIsFallback(res.isFallback);
          if (res.error) setErrorMessage(res.error);
          else setErrorMessage(null);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadTimings();

    return () => {
      isMounted = false;
    };
  }, [selectedCity, appSettings.useGeolocation, appSettings.userLat, appSettings.userLng]);

  // Next prayer ticker
  useEffect(() => {
    if (!timings) return;

    const updateCountdown = () => {
      const next = PrayerService.getNextPrayer(timings);
      setNextPrayer(next);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  // Stats
  const { todayPercentage, completedToday, streakDays } =
    PrayerService.calculateCommitmentStats(allRecords);

  const handleCityChange = async (newCity: string) => {
    setSelectedCity(newCity);
    await onUpdateCity(newCity, false);
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('خاصية تحديد الموقع غير مدعومة في متصفحك.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setErrorMessage(null);
        await onUpdateCity('موقعي الحالي', true);
      },
      (err) => {
        setErrorMessage(
          'تم رفض إذن الوصول للموقع الجغرافي. يمكنك اختيار مدينتك يدوياً من القائمة بسهولة.'
        );
      }
    );
  };

  const handleToggle = async (def: PrayerDefinition) => {
    const isCompletedNow = !todayRecord?.completedPrayers?.[def.id];
    await onTogglePrayer(def.id, isCompletedNow);

    if (isCompletedNow) {
      notificationService.vibrate([100, 50, 100]);
      // Open acceptance duaa modal
      setDuaaModalContent({
        prayerName: def.arabicName,
        duaa: def.duaa,
        virtue: def.virtue,
      });
    }
  };

  // Filter prayers by category
  const displayedPrayers = PRAYER_DEFINITIONS.filter((p) => {
    if (tab === 'all') return true;
    return p.category === tab;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Location Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text-main">
            مواقيت الصلاة والمتابعة الروحية
          </h2>
          <p className="text-xs text-text-secondary">
            «أَحَبُّ الأَعْمَالِ إِلَى اللهِ الصَّلَاةُ عَلَى وَقْتِهَا» — بركة وقتك ونور بصيرتك
          </p>
        </div>

        {/* City Selector & Geolocation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-outline bg-surface px-3 py-1.5 text-xs text-text-main shadow-sm transition-colors">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <select
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bg-transparent font-medium focus:outline-none text-text-main"
            >
              {POPULAR_CITIES.map((c) => (
                <option key={c.nameAr} value={c.nameAr} className="bg-surface text-text-main">
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleUseGeolocation}
            className="flex items-center gap-1 rounded-xl border border-outline bg-surface p-2 text-xs font-semibold text-text-main hover:bg-surface-variant shadow-sm transition"
            title="تحديد الموقع التلقائي عبر GPS"
          >
            <Navigation className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Geolocation Denied / Fallback Message */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-text-main">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Prayer Countdown & Commitment Stats (Emerald & Petroleum Themed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Prayer Card */}
        <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-secondary-dark bg-gradient-to-br from-primary-dark via-secondary-dark to-secondary-night p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/30 px-3 py-1 text-xs font-semibold text-primary-light">
                <Clock className="h-3.5 w-3.5" />
                الصلاة القادمة
              </div>
              <h3 className="mt-2 text-3xl font-black tracking-tight">
                {nextPrayer ? nextPrayer.arabicName : 'صلاة الفجر'}
              </h3>
              <p className="mt-1 text-xs text-surface-variant">
                الموعد المحدد:{' '}
                <strong className="font-mono text-base text-secondary-container">
                  {nextPrayer?.time || '--:--'}
                </strong>
              </p>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-surface-variant/80 font-medium">الوقت المتبقي للأذان</span>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-black text-accent">
                {nextPrayer?.timeRemainingStr || '...'}
              </div>
              <span className="mt-1 text-[11px] text-primary-light/90">
                تأهب للوضوء والصلاة في وقتها
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-primary/25 blur-3xl" />
        </div>

        {/* Commitment Streak & Percentage */}
        <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">
                مؤشر الالتزام اليومي
              </span>
              <Award className="h-4 w-4 text-primary" />
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-text-main">
                {todayPercentage}%
              </span>
              <span className="text-xs text-text-secondary">({completedToday} من 5 فروض)</span>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-surface-variant overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700"
                style={{ width: `${todayPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-outline flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-accent-dark font-bold">
              <Flame className="h-4 w-4 text-accent" />
              <span>سلسلة الالتزام: {streakDays} أيام متتالية</span>
            </div>
            <span className="text-[10px] text-text-secondary">ثبتك الله وزادك نوراً</span>
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setTab('all')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === 'all'
              ? 'bg-primary text-white shadow-sm shadow-primary/25'
              : 'border border-outline bg-surface text-text-secondary hover:text-text-main hover:bg-surface-variant'
          }`}
        >
          الكل ({PRAYER_DEFINITIONS.length})
        </button>
        <button
          onClick={() => setTab('fard')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === 'fard'
              ? 'bg-primary text-white shadow-sm shadow-primary/25'
              : 'border border-outline bg-surface text-text-secondary hover:text-text-main hover:bg-surface-variant'
          }`}
        >
          الفروض الخمس (5)
        </button>
        <button
          onClick={() => setTab('sunnah')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === 'sunnah'
              ? 'bg-primary text-white shadow-sm shadow-primary/25'
              : 'border border-outline bg-surface text-text-secondary hover:text-text-main hover:bg-surface-variant'
          }`}
        >
          السنن الرواتب (12 ركعة)
        </button>
        <button
          onClick={() => setTab('nafl')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
            tab === 'nafl'
              ? 'bg-primary text-white shadow-sm shadow-primary/25'
              : 'border border-outline bg-surface text-text-secondary hover:text-text-main hover:bg-surface-variant'
          }`}
        >
          النوافل والوتر (الضحى والوتر وقيام الليل)
        </button>
      </div>

      {/* Prayer Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {displayedPrayers.map((def) => {
          const isDone = todayRecord?.completedPrayers?.[def.id] || false;
          const timingValue = def.apiTimingKey && timings ? timings[def.apiTimingKey as keyof PrayerTimings] : null;

          return (
            <div
              key={def.id}
              className={`relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                isDone
                  ? 'border-primary/40 bg-primary-container/30'
                  : 'border-outline bg-surface hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(def)}
                    className="mt-0.5 shrink-0 rounded-full transition active:scale-90"
                    title={isDone ? 'تراجع عن التسجيل' : 'تسجيل إتمام الصلاة'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-6 w-6 text-primary fill-primary-container" />
                    ) : (
                      <Circle className="h-6 w-6 text-outline hover:text-primary transition" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm font-black ${
                          isDone
                            ? 'text-primary dark:text-primary-light'
                            : 'text-text-main'
                        }`}
                      >
                        {def.arabicName}
                      </h4>
                      <span className="rounded-md bg-surface-variant px-1.5 py-0.5 text-[10px] font-bold text-text-secondary">
                        {def.rakats} ركعات
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {def.virtue}
                    </p>
                  </div>
                </div>

                {timingValue && (
                  <div className="shrink-0 text-left">
                    <span className="font-mono text-xs font-bold text-text-main">
                      {timingValue}
                    </span>
                    <span className="block text-[9px] text-text-secondary">توقيت الأذان</span>
                  </div>
                )}
              </div>

              {/* Acceptance Duaa preview when checked */}
              {isDone && (
                <div className="mt-3 rounded-xl bg-primary-container/40 p-2 text-xs font-medium text-primary-dark dark:text-primary-light">
                  ✨ {def.duaa}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acceptance Duaa Modal */}
      {duaaModalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/40 bg-surface p-6 text-text-main shadow-2xl text-center animate-fade-in">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-primary">
              <Sparkles className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-black text-primary dark:text-primary-light">
              تقبّل الله صلاتك وطاعتك!
            </h3>
            <p className="mt-1 text-xs text-text-secondary font-semibold">
              {duaaModalContent.prayerName}
            </p>

            <div className="my-4 rounded-2xl border border-outline bg-surface-variant p-4 text-xs leading-relaxed text-text-main">
              <p className="font-medium italic text-primary dark:text-primary-light mb-2">
                «{duaaModalContent.duaa}»
              </p>
              <p className="text-[11px] text-text-secondary border-t border-outline pt-2">
                {duaaModalContent.virtue}
              </p>
            </div>

            <button
              onClick={() => setDuaaModalContent(null)}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white shadow-lg hover:bg-primary-dark transition"
            >
              آمين يا رب العالمين
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
