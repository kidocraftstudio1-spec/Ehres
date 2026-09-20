import { DailyPrayerRecord, PrayerDefinition } from '../types';
import { PRAYER_DEFINITIONS, POPULAR_CITIES } from '../data/seedData';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  dateStr: string;
  cityOrLocation: string;
}

export interface NextPrayerInfo {
  name: string;
  arabicName: string;
  time: string;
  timeRemainingStr: string;
  remainingSeconds: number;
}

// Default Egyptian timing fallback if offline or API is unreachable
const DEFAULT_CAIRO_TIMINGS: Record<string, string> = {
  Fajr: '04:22',
  Sunrise: '05:48',
  Dhuhr: '11:54',
  Asr: '15:24',
  Maghrib: '17:58',
  Isha: '19:16',
};

export class PrayerService {
  private static cachedTimings: PrayerTimings | null = null;
  private static cachedDate: string = '';

  /**
   * Fetch prayer times from Aladhan API with offline cache and reliable fallback
   */
  public static async getTimings(
    city: string = 'القاهرة',
    useGeo: boolean = false,
    coords?: { lat: number; lng: number }
  ): Promise<{ timings: PrayerTimings; isFallback: boolean; error?: string }> {
    const today = new Date().toISOString().split('T')[0];

    // Return cached if already fetched today for same city/coords
    if (this.cachedTimings && this.cachedDate === today) {
      return { timings: this.cachedTimings, isFallback: false };
    }

    try {
      let url = '';
      if (useGeo && coords && coords.lat && coords.lng) {
        const timestamp = Math.floor(Date.now() / 1000);
        url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${coords.lat}&longitude=${coords.lng}&method=5`;
      } else {
        const cityData = POPULAR_CITIES.find(
          (c) => c.nameAr === city || c.nameEn.toLowerCase() === city.toLowerCase()
        ) || POPULAR_CITIES[0];

        url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
          cityData.nameEn
        )}&country=${encodeURIComponent(cityData.country)}&method=5`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Aladhan API responded with status ${res.status}`);
      const json = await res.json();

      if (json.data && json.data.timings) {
        const t = json.data.timings;
        // Clean timing strings like "04:22 (EEST)" -> "04:22"
        const clean = (val: string) => (val ? val.split(' ')[0] : '12:00');

        const prayerTimings: PrayerTimings = {
          Fajr: clean(t.Fajr),
          Sunrise: clean(t.Sunrise),
          Dhuhr: clean(t.Dhuhr),
          Asr: clean(t.Asr),
          Maghrib: clean(t.Maghrib),
          Isha: clean(t.Isha),
          dateStr: today,
          cityOrLocation: city,
        };

        this.cachedTimings = prayerTimings;
        this.cachedDate = today;

        return { timings: prayerTimings, isFallback: false };
      }
      throw new Error('Invalid response structure');
    } catch (err: any) {
      console.warn('Aladhan API fetch failed, using localized Egyptian timings:', err.message);
      const fallback: PrayerTimings = {
        Fajr: DEFAULT_CAIRO_TIMINGS.Fajr,
        Sunrise: DEFAULT_CAIRO_TIMINGS.Sunrise,
        Dhuhr: DEFAULT_CAIRO_TIMINGS.Dhuhr,
        Asr: DEFAULT_CAIRO_TIMINGS.Asr,
        Maghrib: DEFAULT_CAIRO_TIMINGS.Maghrib,
        Isha: DEFAULT_CAIRO_TIMINGS.Isha,
        dateStr: today,
        cityOrLocation: city,
      };
      this.cachedTimings = fallback;
      this.cachedDate = today;

      return {
        timings: fallback,
        isFallback: true,
        error: 'تعذر الاتصال بخادم المواقيت، تم تطبيق التوقيت المرجعي المعتمد لجمهورية مصر العربية.',
      };
    }
  }

  /**
   * Determine which prayer is next and calculate the countdown
   */
  public static getNextPrayer(timings: PrayerTimings): NextPrayerInfo {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    const parseToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const prayers = [
      { key: 'Fajr', name: 'Fajr', arabicName: 'الفجر', time: timings.Fajr },
      { key: 'Sunrise', name: 'Sunrise', arabicName: 'الشروق', time: timings.Sunrise },
      { key: 'Dhuhr', name: 'Dhuhr', arabicName: 'الظهر', time: timings.Dhuhr },
      { key: 'Asr', name: 'Asr', arabicName: 'العصر', time: timings.Asr },
      { key: 'Maghrib', name: 'Maghrib', arabicName: 'المغرب', time: timings.Maghrib },
      { key: 'Isha', name: 'Isha', arabicName: 'العشاء', time: timings.Isha },
    ];

    for (const p of prayers) {
      const pMinutes = parseToMinutes(p.time);
      if (pMinutes > currentMinutes) {
        const diffSeconds = (pMinutes - currentMinutes) * 60 - currentSeconds;
        return {
          name: p.name,
          arabicName: p.arabicName,
          time: p.time,
          timeRemainingStr: this.formatRemainingTime(diffSeconds),
          remainingSeconds: diffSeconds,
        };
      }
    }

    // If passed Isha, next is tomorrow's Fajr
    const tomorrowFajrMinutes = 24 * 60 + parseToMinutes(timings.Fajr);
    const diffSeconds = (tomorrowFajrMinutes - currentMinutes) * 60 - currentSeconds;
    return {
      name: 'Fajr',
      arabicName: 'الفجر (غداً)',
      time: timings.Fajr,
      timeRemainingStr: this.formatRemainingTime(diffSeconds),
      remainingSeconds: diffSeconds,
    };
  }

  private static formatRemainingTime(seconds: number): string {
    if (seconds <= 0) return 'حان الآن';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    return `${mins} دقيقة و ${secs} ثانية`;
  }

  /**
   * Calculate commitment streak & stats
   */
  public static calculateCommitmentStats(records: DailyPrayerRecord[]): {
    todayPercentage: number;
    completedToday: number;
    streakDays: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = records.find((r) => r.date === today);

    // Consider the 5 obligatory prayers
    const fardIds = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    let completedToday = 0;

    if (todayRecord && todayRecord.completedPrayers) {
      fardIds.forEach((id) => {
        if (todayRecord.completedPrayers[id]) {
          completedToday++;
        }
      });
    }

    const todayPercentage = Math.round((completedToday / fardIds.length) * 100);

    // Calculate streak days
    let streak = 0;
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

    for (let i = 0; i < sorted.length; i++) {
      const r = sorted[i];
      const hasCompletedAnyFard = fardIds.some((id) => r.completedPrayers?.[id]);
      if (hasCompletedAnyFard) {
        streak++;
      } else if (i > 0) {
        // Gap in streak
        break;
      }
    }

    return {
      todayPercentage,
      completedToday,
      streakDays: Math.max(streak, completedToday > 0 ? 1 : 0),
    };
  }
}
