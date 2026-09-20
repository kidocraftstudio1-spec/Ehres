import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Flame,
  CheckCircle2,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react';
import { PomodoroMode, PomodoroSession, SubjectName, ALL_SUBJECTS } from '../../types';
import { notificationService } from '../../services/notifications';

interface PomodoroScreenProps {
  sessions: PomodoroSession[];
  onSaveSession: (session: PomodoroSession) => Promise<void>;
  onFocusStateChange?: (isActive: boolean) => void;
}

export const PomodoroScreen: React.FC<PomodoroScreenProps> = ({
  sessions,
  onSaveSession,
  onFocusStateChange,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [selectedSubject, setSelectedSubject] = useState<SubjectName>('اللغة العربية');
  const [customFocusMinutes, setCustomFocusMinutes] = useState(25);

  // Time calculation
  const getInitialSeconds = (currentMode: PomodoroMode) => {
    if (currentMode === 'focus') return customFocusMinutes * 60;
    if (currentMode === 'short_break') return 5 * 60;
    return 15 * 60;
  };

  const [totalSeconds, setTotalSeconds] = useState(getInitialSeconds('focus'));
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [completedToast, setCompletedToast] = useState<string | null>(null);

  // Accurate timestamp-based timing
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (onFocusStateChange) {
      onFocusStateChange(isRunning && mode === 'focus');
    }
  }, [isRunning, mode, onFocusStateChange]);

  useEffect(() => {
    const newTotal = getInitialSeconds(mode);
    setTotalSeconds(newTotal);
    setRemainingSeconds(newTotal);
    setIsRunning(false);
    endTimeRef.current = null;
  }, [mode, customFocusMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + remainingSeconds * 1000;
      }

      interval = setInterval(() => {
        if (!endTimeRef.current) return;
        const now = Date.now();
        const diffMs = endTimeRef.current - now;
        const diffSec = Math.max(0, Math.ceil(diffMs / 1000));

        setRemainingSeconds(diffSec);

        if (diffSec <= 0) {
          handleSessionFinished();
        }
      }, 500);
    } else {
      endTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const handleSessionFinished = async () => {
    setIsRunning(false);
    endTimeRef.current = null;

    const durationMin = Math.round(totalSeconds / 60);

    // Vibration API
    notificationService.vibrate([250, 100, 250, 100, 250]);

    if (mode === 'focus') {
      const session: PomodoroSession = {
        id: 'pomo_' + Date.now(),
        subject: selectedSubject,
        durationMinutes: durationMin,
        mode: 'focus',
        completedAt: new Date().toISOString(),
      };
      await onSaveSession(session);

      notificationService.sendNotification('أحسنت يا بطل! 🎯', {
        body: `أتممت جلسة مذاكرة لمدة ${durationMin} دقيقة في مادة ${selectedSubject}. خذ استراحة مستحقة الآن!`,
      });

      setCompletedToast(`أحسنت! أتممت جلسة مذاكرة لمدة ${durationMin} دقيقة في ${selectedSubject} 🎉`);
    } else {
      notificationService.sendNotification('انتهت الاستراحة! ⏰', {
        body: 'جاهز لاستئناف جلسة تركيز جديدة وتثبيت معلوماتك؟',
      });
      setCompletedToast('انتهت الاستراحة! حان وقت التركيز والتفوق من جديد 🚀');
    }

    setTimeout(() => setCompletedToast(null), 5000);
  };

  const handleStart = () => {
    endTimeRef.current = Date.now() + remainingSeconds * 1000;
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    endTimeRef.current = null;
  };

  const handleReset = () => {
    setIsRunning(false);
    endTimeRef.current = null;
    setRemainingSeconds(totalSeconds);
  };

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate Progress percentage
  const progressPercent = Math.max(
    0,
    Math.min(100, ((totalSeconds - remainingSeconds) / totalSeconds) * 100)
  );

  // SVG Ring
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.completedAt.startsWith(todayStr));
  const totalMinutesToday = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const dailyGoalMinutes = 60;
  const dailyGoalPercent = Math.min(100, Math.round((totalMinutesToday / dailyGoalMinutes) * 100));

  return (
    <div className="space-y-6 pb-8">
      {/* Toast Notification */}
      {completedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-5 py-3 text-xs font-bold text-white shadow-2xl animate-bounce">
          <Sparkles className="h-4 w-4" />
          <span>{completedToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text-main">
            مؤقت التركيز والمذاكرة (Pomodoro)
          </h2>
          <p className="text-xs text-text-secondary">
            تخلّص من التشتت والمماطلة وركّز بعمق في جلسات دراسية منتظمة
          </p>
        </div>

        {/* Daily 60-min Goal Metric */}
        <div className="rounded-2xl border border-outline bg-surface p-3 shadow-sm flex items-center gap-3 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1 text-xs font-bold text-text-main">
              <span>{totalMinutesToday} دقيقة</span>
              <span className="text-[10px] text-text-secondary font-normal">/ {dailyGoalMinutes} دقيقة</span>
            </div>
            <div className="mt-1 w-28 bg-surface-variant rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-warning h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setMode('focus')}
          className={`flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
            mode === 'focus'
              ? 'bg-primary text-white shadow-primary/20'
              : 'bg-surface text-text-secondary hover:bg-surface-variant border border-outline'
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>تركيز ومذاكرة ({customFocusMinutes} د)</span>
        </button>

        <button
          onClick={() => setMode('short_break')}
          className={`flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
            mode === 'short_break'
              ? 'bg-secondary text-white shadow-secondary/20'
              : 'bg-surface text-text-secondary hover:bg-surface-variant border border-outline'
          }`}
        >
          <Coffee className="h-4 w-4" />
          <span>استراحة قصيرة (5 د)</span>
        </button>

        <button
          onClick={() => setMode('long_break')}
          className={`flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${
            mode === 'long_break'
              ? 'bg-purple-accent text-white shadow-purple-accent/20'
              : 'bg-surface text-text-secondary hover:bg-surface-variant border border-outline'
          }`}
        >
          <Coffee className="h-4 w-4" />
          <span>استراحة طويلة (15 د)</span>
        </button>
      </div>

      {/* Subject & Custom Focus Duration Selectors (Only when not running and in focus mode) */}
      {mode === 'focus' && !isRunning && (
        <div className="mx-auto max-w-md flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="w-full">
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              المادة الدراسية للجلسة:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-medium text-text-main shadow-sm focus:border-primary focus:outline-none transition"
            >
              {ALL_SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-surface text-text-main">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-36">
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              مدة الجلسة:
            </label>
            <select
              value={customFocusMinutes}
              onChange={(e) => setCustomFocusMinutes(Number(e.target.value))}
              className="w-full rounded-xl border border-outline bg-surface px-3 py-2 text-xs font-medium text-text-main shadow-sm focus:border-primary focus:outline-none transition"
            >
              <option value={15} className="bg-surface text-text-main">15 دقيقة</option>
              <option value={20} className="bg-surface text-text-main">20 دقيقة</option>
              <option value={25} className="bg-surface text-text-main">25 دقيقة (قياسي)</option>
              <option value={30} className="bg-surface text-text-main">30 دقيقة</option>
              <option value={45} className="bg-surface text-text-main">45 دقيقة</option>
              <option value={60} className="bg-surface text-text-main">60 دقيقة</option>
            </select>
          </div>
        </div>
      )}

      {/* Timer Circle */}
      <div className="relative flex flex-col items-center justify-center py-6">
        <div className="relative flex items-center justify-center">
          <svg className="h-64 w-64 md:h-72 md:w-72 -rotate-90 transform" viewBox="0 0 240 240">
            <circle
              cx="120"
              cy="120"
              r={radius}
              className="text-surface-variant stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              className={`transition-all duration-300 ease-linear ${
                mode === 'focus'
                  ? 'text-primary'
                  : mode === 'short_break'
                  ? 'text-secondary'
                  : 'text-purple-accent'
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* Time & Mode Display inside ring */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="font-mono text-5xl md:text-6xl font-black tracking-tight text-text-main">
              {formatTime(remainingSeconds)}
            </span>
            <span className="mt-2 text-xs font-bold text-text-secondary">
              {mode === 'focus' ? `جلسة تركيز في ${selectedSubject}` : 'استراحة استرخاء وراحة'}
            </span>
            {isRunning && (
              <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse">
                <span className="h-2 w-2 rounded-full bg-primary" />
                المؤقت يعمل بنشاط
              </span>
            )}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-6 flex items-center justify-center gap-3">
          {!isRunning ? (
            <button
              id="pomodoro-start-btn"
              onClick={handleStart}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-primary/30 hover:bg-primary-dark active:scale-95 transition"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>ابدأ الآن</span>
            </button>
          ) : (
            <button
              id="pomodoro-pause-btn"
              onClick={handlePause}
              className="flex items-center gap-2 rounded-2xl bg-warning px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-warning/30 hover:bg-warning/90 active:scale-95 transition"
            >
              <Pause className="h-5 w-5 fill-current" />
              <span>إيقاف مؤقت</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="rounded-2xl border border-outline bg-surface p-3.5 text-text-secondary hover:bg-surface-variant hover:text-text-main shadow-sm active:scale-95 transition"
            title="إعادة ضبط المؤقت"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Today's Session History */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm transition-colors">
        <div className="flex items-center justify-between border-b border-outline pb-3">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <Trophy className="h-4 w-4 text-accent" />
            <span>جلسات المذاكرة المنجزة اليوم ({todaySessions.length})</span>
          </h3>
          <span className="text-xs text-text-secondary font-mono">
            إجمالي: {totalMinutesToday} دقيقة
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-secondary">
            لم تسجل أي جلسات مذاكرة اليوم بعد. ابدأ أول 25 دقيقة الآن واصنع الفارق!
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {todaySessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl bg-surface-variant px-3.5 py-2.5 text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="font-bold text-text-main">
                    {s.subject}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <span className="font-semibold text-primary">
                    {s.durationMinutes} دقيقة
                  </span>
                  <span className="text-[10px] text-text-secondary">
                    {new Date(s.completedAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note: In adherence to the strict mandate: NO ads are placed on Pomodoro focus screen */}
    </div>
  );
};
