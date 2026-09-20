import React from 'react';
import {
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  PlusCircle,
  Play,
  Heart,
  Trophy,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  StudentProfile,
  StudyTask,
  DailyPrayerRecord,
  PomodoroSession,
  AdSettings,
} from '../../types';
import { DAILY_INSPIRING_QUOTES } from '../../data/seedData';
import { NextPrayerInfo } from '../../services/prayerService';
import { AdSlot } from '../ads/AdSlot';

interface DashboardScreenProps {
  profile: StudentProfile | null;
  tasks: StudyTask[];
  todayPrayerRecord: DailyPrayerRecord | null;
  pomodoroSessions: PomodoroSession[];
  nextPrayer: NextPrayerInfo | null;
  adSettings: AdSettings;
  onNavigate: (tab: string) => void;
  onOpenNewTask: () => void;
  onOpenAdFreeModal: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  profile,
  tasks,
  todayPrayerRecord,
  pomodoroSessions,
  nextPrayer,
  adSettings,
  onNavigate,
  onOpenNewTask,
  onOpenAdFreeModal,
}) => {
  const studentName = profile?.fullName?.split(' ')[0] || 'طالبنا المتفوق';

  // Random daily quote (deterministic based on day of year)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const dailyQuote =
    DAILY_INSPIRING_QUOTES[dayOfYear % DAILY_INSPIRING_QUOTES.length];

  // Today's Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Tasks metrics
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr || !t.isCompleted);
  const completedTasksToday = tasks.filter(
    (t) => t.isCompleted && t.completedAt?.startsWith(todayStr)
  ).length;
  const pendingTasksToday = tasks.filter(
    (t) => !t.isCompleted && (t.dueDate === todayStr || t.priority === 'عالية')
  ).length;
  const allTasksDone = todayTasks.length > 0 && pendingTasksToday === 0;

  // Study hours logged today
  const todaySessions = pomodoroSessions.filter((s) =>
    s.completedAt.startsWith(todayStr)
  );
  const totalMinutesToday = todaySessions.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0
  );
  const studyHoursToday = (totalMinutesToday / 60).toFixed(1);

  // Prayers completed today (out of 5 fard)
  const fardKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let prayersCompleted = 0;
  if (todayPrayerRecord?.completedPrayers) {
    fardKeys.forEach((k) => {
      if (todayPrayerRecord.completedPrayers[k]) prayersCompleted++;
    });
  }

  // Composite Daily Completion Percentage (Weighted: 40% study goal of 60m, 35% prayers, 25% tasks)
  const studyScore = Math.min(100, (totalMinutesToday / 60) * 100);
  const prayerScore = (prayersCompleted / 5) * 100;
  const taskScore =
    todayTasks.length > 0
      ? (completedTasksToday / Math.max(1, completedTasksToday + pendingTasksToday)) * 100
      : 100;
  const overallProgress = Math.round(
    studyScore * 0.4 + prayerScore * 0.35 + taskScore * 0.25
  );

  // Check if ad-free focus mode is active
  const isAdFree = adSettings.noAdsUntil > Date.now();
  const adFreeRemainingMinutes = isAdFree
    ? Math.max(1, Math.round((adSettings.noAdsUntil - Date.now()) / (60 * 1000)))
    : 0;

  // SVG Progress Ring calculations
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="space-y-6 pb-6">
      {/* Welcome & Target College Banner with Calm Emerald-to-Petroleum Gradient */}
      <div className="relative overflow-hidden rounded-3xl border border-secondary-dark bg-gradient-to-l from-secondary-night via-secondary-dark to-primary-dark p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/30 px-2.5 py-0.5 text-xs font-semibold text-primary-light">
                <Sparkles className="h-3.5 w-3.5" />
                {profile?.grade || 'الثانوية العامة المصرية'}
              </span>
              {profile?.track && profile.track !== 'العام المشترك' && (
                <span className="rounded-full bg-secondary-night/70 px-2.5 py-0.5 text-xs text-secondary-container">
                  {profile.track}
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              أهلاً بك، {studentName} 🌟
            </h2>
            <p className="mt-1 text-xs md:text-sm text-surface-variant max-w-xl">
              {profile?.targetGoal
                ? `هدفك الذهبي: ${profile.targetGoal} — استعن بالله ولا تعجز!`
                : 'يومك ملكك، نظّم وقتك، أخلص نيتك، وتفوق في كل دقيقة!'}
            </p>
          </div>

          {/* Ad-Free Mode Status or Trigger */}
          <div className="flex items-center gap-2">
            {isAdFree ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary-dark/60 px-3.5 py-2 text-xs font-semibold text-primary-light">
                <ShieldCheck className="h-4 w-4 text-primary-light" />
                <span>وضع التركيز مفعّل (متبقي {adFreeRemainingMinutes} دقيقة)</span>
              </div>
            ) : (
              <button
                id="dashboard-ad-free-btn"
                onClick={onOpenAdFreeModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent-container px-3 py-2 text-xs font-bold text-accent-dark transition hover:bg-accent/25 active:scale-95 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>وضع التركيز بدون إعلانات (ساعتان)</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background aura with calm emerald & petroleum hues */}
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -top-10 -right-10 h-44 w-44 rounded-full bg-secondary/25 blur-3xl" />
      </div>

      {/* Daily Spiritual & Motivational Quote (Emerald & Petroleum) */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary-container/20 p-4 text-text-main">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
            <Heart className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-relaxed">
              {dailyQuote.text}
            </p>
            <span className="mt-1 block text-[11px] text-text-secondary font-medium">
              — {dailyQuote.source}
            </span>
          </div>
        </div>
      </div>

      {/* All Tasks Completed Motivational Banner (Gold Accent for Achievement) */}
      {allTasksDone && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-container p-4 text-accent-dark shadow-sm animate-fade-in">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-slate-950 font-bold shadow-sm">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">ما شاء الله! أنجزت جميع مهام وواجبات اليوم!</h4>
            <p className="text-xs text-accent-dark/80">
              أحسنت صنعاً وجهداً، خذ استراحة مستحقة أو راجع مذكراتك بذكاء.
            </p>
          </div>
        </div>
      )}

      {/* Primary 3 Metric Blocks + Progress Ring */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Progress Ring Card */}
        <div className="md:col-span-1 rounded-2xl border border-outline bg-surface p-5 shadow-sm flex flex-col items-center justify-center text-center transition-colors">
          <div className="relative flex items-center justify-center">
            <svg className="h-28 w-28 -rotate-90 transform" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-surface-variant"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="text-primary transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-text-main">
                {overallProgress}%
              </span>
              <span className="text-[10px] text-text-secondary font-medium">إنجاز اليوم</span>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-text-main">
            مؤشر التوازن والتفوق
          </p>
          <span className="text-[10px] text-text-secondary">مذاكرة + صلوات + مهام</span>
        </div>

        {/* Next Prayer Countdown Card (Spiritual: Emerald & Petroleum) */}
        <div
          onClick={() => onNavigate('prayers')}
          className="group cursor-pointer rounded-2xl border border-outline bg-surface p-5 shadow-sm transition hover:border-secondary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              الصلاة القادمة
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary-container text-secondary transition group-hover:bg-secondary group-hover:text-white">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-text-main">
              {nextPrayer ? nextPrayer.arabicName : 'صلاة الفجر'}
            </h3>
            <div className="mt-1 flex items-baseline gap-1 text-xs text-text-secondary">
              <span>الموعد:</span>
              <strong className="font-mono text-sm text-text-main">
                {nextPrayer?.time || '--:--'}
              </strong>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-secondary-container px-2.5 py-1 text-xs font-bold text-secondary">
            <span>متبقي: {nextPrayer?.timeRemainingStr || '...'}</span>
          </div>
        </div>

        {/* Remaining Tasks Today (Gold Accent for tasks) */}
        <div
          onClick={() => onNavigate('tasks')}
          className="group cursor-pointer rounded-2xl border border-outline bg-surface p-5 shadow-sm transition hover:border-accent hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              الواجبات والمهام
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-container text-accent-dark transition group-hover:bg-accent group-hover:text-slate-950">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-text-main">
                {pendingTasksToday}
              </h3>
              <span className="text-xs text-text-secondary">مهام متبقية</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              أُنجز منها {completedTasksToday} مهمة اليوم
            </p>
          </div>
          <div className="mt-3 flex items-center text-xs font-semibold text-accent-dark hover:text-accent transition">
            <span>عرض قائمة المهام</span>
            <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
          </div>
        </div>

        {/* Study Time Today */}
        <div
          onClick={() => onNavigate('pomodoro')}
          className="group cursor-pointer rounded-2xl border border-outline bg-surface p-5 shadow-sm transition hover:border-primary hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">
              ساعات المذاكرة اليوم
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-container text-primary transition group-hover:bg-primary group-hover:text-white">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl font-black text-text-main">
                {studyHoursToday}
              </h3>
              <span className="text-xs text-text-secondary">ساعة ({totalMinutesToday} دقيقة)</span>
            </div>
            <p className="mt-1 text-xs text-text-secondary">
              هدف اليوم: 60 دقيقة تركيز
            </p>
          </div>
          <div className="mt-3 w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalMinutesToday / 60) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Buttons (Primary Emerald & Complementary Tokens) */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-text-main">
          إجراءات سريعة للتفوق
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            id="quick-start-pomodoro-btn"
            onClick={() => onNavigate('pomodoro')}
            className="flex items-center gap-2.5 rounded-2xl border border-outline bg-surface p-3.5 text-right transition hover:border-primary hover:bg-primary-container/30 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
              <Play className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">
                ابدأ المذاكرة
              </div>
              <div className="text-[10px] text-text-secondary">مؤقت بومودورو الذكي</div>
            </div>
          </button>

          <button
            id="quick-add-task-btn"
            onClick={onOpenNewTask}
            className="flex items-center gap-2.5 rounded-2xl border border-outline bg-surface p-3.5 text-right transition hover:border-primary hover:bg-primary-container/30 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">
                أضف واجباً
              </div>
              <div className="text-[10px] text-text-secondary">مهمة جديدة للتنظيم</div>
            </div>
          </button>

          <button
            id="quick-ai-summary-btn"
            onClick={() => onNavigate('summaries')}
            className="flex items-center gap-2.5 rounded-2xl border border-outline bg-surface p-3.5 text-right transition hover:border-purple-accent hover:bg-purple-accent/10 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-accent/15 text-purple-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">
                تلخيص ذكي
              </div>
              <div className="text-[10px] text-text-secondary">تلخيص الدروس بـ Gemini</div>
            </div>
          </button>

          <button
            id="quick-prayer-check-btn"
            onClick={() => onNavigate('prayers')}
            className="flex items-center gap-2.5 rounded-2xl border border-outline bg-surface p-3.5 text-right transition hover:border-secondary hover:bg-secondary-container/30 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-secondary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">
                سجل صلاتك
              </div>
              <div className="text-[10px] text-text-secondary">فروض وسنن وأذكار</div>
            </div>
          </button>
        </div>
      </div>

      {/* Adsterra Bottom Banner */}
      <AdSlot type="banner" adSettings={adSettings} />
    </div>
  );
};
