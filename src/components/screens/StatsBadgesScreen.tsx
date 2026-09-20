import React, { useMemo } from 'react';
import {
  Trophy,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Sun,
  BookOpen,
  HeartHandshake,
  Star,
} from 'lucide-react';
import {
  StudentProfile,
  StudyTask,
  DailyPrayerRecord,
  PomodoroSession,
  SummaryNote,
  VideoLesson,
  StudentBadge,
} from '../../types';
import { INITIAL_BADGES } from '../../data/seedData';
import { PrayerService } from '../../services/prayerService';

interface StatsBadgesScreenProps {
  profile: StudentProfile | null;
  tasks: StudyTask[];
  prayerRecords: DailyPrayerRecord[];
  pomodoroSessions: PomodoroSession[];
  summaries: SummaryNote[];
  videos: VideoLesson[];
}

export const StatsBadgesScreen: React.FC<StatsBadgesScreenProps> = ({
  profile,
  tasks,
  prayerRecords,
  pomodoroSessions,
  summaries,
  videos,
}) => {
  // Metrics calculation
  const totalStudyMinutes = pomodoroSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalStudyHours = (totalStudyMinutes / 60).toFixed(1);

  const completedTasksCount = tasks.filter((t) => t.isCompleted).length;
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const { todayPercentage, streakDays } = PrayerService.calculateCommitmentStats(prayerRecords);

  // Count Fajr prayers completed in total
  const totalFajrCount = prayerRecords.filter((r) => r.completedPrayers?.['fajr']).length;

  // Check if any day had all 5 prayers + sunan completed
  const hasFullPrayerDay = prayerRecords.some((r) => {
    const fard = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    return fard.every((id) => r.completedPrayers?.[id]);
  });

  // Dynamic Badges unlock evaluation
  const evaluatedBadges: StudentBadge[] = useMemo(() => {
    return INITIAL_BADGES.map((badge) => {
      let isUnlocked = false;

      switch (badge.id) {
        case 'badge_fajr':
          isUnlocked = totalFajrCount >= 3;
          break;
        case 'badge_tasks_10':
          isUnlocked = completedTasksCount >= 10;
          break;
        case 'badge_knowledge_lover':
          isUnlocked = videos.length > 0;
          break;
        case 'badge_study_120':
          isUnlocked = totalStudyMinutes >= 120;
          break;
        case 'badge_streak_hero':
          isUnlocked = streakDays >= 5;
          break;
        case 'badge_prayer_devotion':
          isUnlocked = hasFullPrayerDay;
          break;
        case 'badge_summaries_5':
          isUnlocked = summaries.length >= 5;
          break;
        case 'badge_thanaweya_legend':
          isUnlocked =
            totalStudyMinutes >= 500 && completedTasksCount >= 25 && streakDays >= 7;
          break;
        default:
          isUnlocked = false;
      }

      return {
        ...badge,
        isUnlocked,
      };
    });
  }, [
    totalFajrCount,
    completedTasksCount,
    videos.length,
    totalStudyMinutes,
    streakDays,
    hasFullPrayerDay,
    summaries.length,
  ]);

  const unlockedCount = evaluatedBadges.filter((b) => b.isUnlocked).length;

  // Helper icon selector
  const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const props = {
      className: `h-6 w-6 ${isUnlocked ? 'text-accent' : 'text-text-secondary'}`,
    };
    switch (iconName) {
      case 'Sun':
        return <Sun {...props} />;
      case 'CheckCircle2':
        return <CheckCircle2 {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      case 'Flame':
        return <Flame {...props} />;
      case 'Award':
        return <Award {...props} />;
      case 'HeartHandshake':
        return <HeartHandshake {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'Trophy':
        return <Trophy {...props} />;
      default:
        return <Star {...props} />;
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-text-main">
          الإحصائيات وشارات التفوق
        </h2>
        <p className="text-xs text-text-secondary">
          تتبّع نموك المستمر وافتح أوسمة الفخر والاجتهاد كلما تقدمت في دراستك
        </p>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-3xl border border-outline bg-surface p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">إجمالي المذاكرة</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-text-main">
            {totalStudyHours}{' '}
            <span className="text-xs font-normal text-text-secondary">ساعة</span>
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">{totalStudyMinutes} دقيقة تركيز</p>
        </div>

        <div className="rounded-3xl border border-outline bg-surface p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">إنجاز المهام</span>
            <CheckCircle2 className="h-4 w-4 text-secondary" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-text-main">
            {taskCompletionRate}%
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">
            {completedTasksCount} من {tasks.length} مهام
          </p>
        </div>

        <div className="rounded-3xl border border-outline bg-surface p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">التزام الصلوات</span>
            <Award className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-text-main">
            {todayPercentage}%
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">فروض وسنن مباركة</p>
        </div>

        <div className="rounded-3xl border border-outline bg-surface p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-semibold">سلسلة الاستمرارية</span>
            <Flame className="h-4 w-4 text-warning" />
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-black text-text-main">
            {streakDays}{' '}
            <span className="text-xs font-normal text-text-secondary">أيام</span>
          </div>
          <p className="mt-1 text-[11px] text-text-secondary">حماس وثبات متواصل</p>
        </div>
      </div>

      {/* Badges Section Header */}
      <div className="flex items-center justify-between border-b border-outline pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" />
          <h3 className="text-base font-bold text-text-main">
            أوسمة وشارات الطالب المجتهد
          </h3>
        </div>
        <span className="rounded-full bg-accent-container px-3 py-1 text-xs font-bold text-accent-dark dark:bg-accent/20 dark:text-accent">
          تم فتح {unlockedCount} من {evaluatedBadges.length} شارة
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {evaluatedBadges.map((badge) => (
          <div
            key={badge.id}
            className={`relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 ${
              badge.isUnlocked
                ? 'border-accent/40 bg-accent-container/25 shadow-md shadow-accent/5 dark:bg-accent/10 dark:border-accent/30'
                : 'border-outline/70 bg-surface-variant/40 opacity-70'
            }`}
          >
            <div>
              {/* Badge Icon */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    badge.isUnlocked
                      ? 'bg-accent/20 shadow-lg shadow-accent/15'
                      : 'bg-surface-variant'
                  }`}
                >
                  {renderBadgeIcon(badge.iconName, badge.isUnlocked)}
                </div>

                {badge.isUnlocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    <Sparkles className="h-3 w-3" />
                    مفتوحة
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-variant px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                    <Lock className="h-3 w-3" />
                    مقفلة
                  </span>
                )}
              </div>

              <h4 className="text-sm font-black text-text-main">
                {badge.title}
              </h4>
              <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                {badge.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-outline/60 text-[10px] font-semibold text-text-secondary">
              المطلوب: {badge.requiredMetric}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
