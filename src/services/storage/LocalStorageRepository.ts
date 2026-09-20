import { IStorageRepository } from './IStorageRepository';
import {
  StudentProfile,
  StudyTask,
  DailyPrayerRecord,
  PomodoroSession,
  SummaryNote,
  VideoLesson,
  AdSettings,
  AppSettings,
  FullAppData,
} from '../../types';
import { INITIAL_VIDEOS } from '../../data/seedData';

const KEYS = {
  PROFILE: 'ehres_profile_v1',
  TASKS: 'ehres_tasks_v1',
  PRAYERS: 'ehres_prayers_v1',
  POMODORO: 'ehres_pomodoro_v1',
  SUMMARIES: 'ehres_summaries_v1',
  VIDEOS: 'ehres_videos_v1',
  AD_SETTINGS: 'ehres_ad_settings_v1',
  APP_SETTINGS: 'ehres_app_settings_v1',
};

const DEFAULT_AD_SETTINGS: AdSettings = {
  noAdsUntil: 0,
  bannerKey: 'adsterra_banner_placeholder_728x90',
  nativeKey: 'adsterra_native_placeholder_banner',
  directLinkUrl: 'https://www.profitablecpmrate.com/placeholder',
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark', // Eye-friendly comfortable default for students
  notificationsEnabled: false,
  notifyTasks: true,
  notifyPrayers: true,
  notifyPomodoro: true,
  notifyLessons: false,
  selectedCity: 'القاهرة',
  useGeolocation: false,
};

export class LocalStorageRepository implements IStorageRepository {
  // Safe helper to read from localStorage
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return defaultValue;
    }
  }

  // Safe helper to write to localStorage
  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to storage:`, e);
    }
  }

  // Profile
  async getProfile(): Promise<StudentProfile | null> {
    return this.getItem<StudentProfile | null>(KEYS.PROFILE, null);
  }

  async saveProfile(profile: StudentProfile): Promise<void> {
    this.setItem(KEYS.PROFILE, profile);
  }

  async clearProfile(): Promise<void> {
    localStorage.removeItem(KEYS.PROFILE);
  }

  // Tasks
  async getTasks(): Promise<StudyTask[]> {
    return this.getItem<StudyTask[]>(KEYS.TASKS, []);
  }

  async saveTask(task: StudyTask): Promise<void> {
    const tasks = await this.getTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.unshift(task);
    }
    this.setItem(KEYS.TASKS, tasks);
  }

  async updateTask(task: StudyTask): Promise<void> {
    await this.saveTask(task);
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    this.setItem(KEYS.TASKS, filtered);
  }

  // Prayers
  async getPrayerRecord(date: string): Promise<DailyPrayerRecord | null> {
    const records = await this.getAllPrayerRecords();
    return records.find((r) => r.date === date) || null;
  }

  async getAllPrayerRecords(): Promise<DailyPrayerRecord[]> {
    return this.getItem<DailyPrayerRecord[]>(KEYS.PRAYERS, []);
  }

  async togglePrayerStatus(
    date: string,
    prayerId: string,
    completed: boolean
  ): Promise<DailyPrayerRecord> {
    const records = await this.getAllPrayerRecords();
    let recordIndex = records.findIndex((r) => r.date === date);

    let updatedRecord: DailyPrayerRecord;
    if (recordIndex >= 0) {
      updatedRecord = {
        ...records[recordIndex],
        completedPrayers: {
          ...records[recordIndex].completedPrayers,
          [prayerId]: completed,
        },
      };
      records[recordIndex] = updatedRecord;
    } else {
      updatedRecord = {
        date,
        completedPrayers: {
          [prayerId]: completed,
        },
      };
      records.push(updatedRecord);
    }

    this.setItem(KEYS.PRAYERS, records);
    return updatedRecord;
  }

  // Pomodoro
  async getPomodoroSessions(): Promise<PomodoroSession[]> {
    return this.getItem<PomodoroSession[]>(KEYS.POMODORO, []);
  }

  async savePomodoroSession(session: PomodoroSession): Promise<void> {
    const sessions = await this.getPomodoroSessions();
    sessions.unshift(session);
    this.setItem(KEYS.POMODORO, sessions);
  }

  // Summaries
  async getSummaries(): Promise<SummaryNote[]> {
    return this.getItem<SummaryNote[]>(KEYS.SUMMARIES, []);
  }

  async saveSummary(summary: SummaryNote): Promise<void> {
    const list = await this.getSummaries();
    const idx = list.findIndex((s) => s.id === summary.id);
    if (idx >= 0) {
      list[idx] = summary;
    } else {
      list.unshift(summary);
    }
    this.setItem(KEYS.SUMMARIES, list);
  }

  async deleteSummary(summaryId: string): Promise<void> {
    const list = await this.getSummaries();
    this.setItem(
      KEYS.SUMMARIES,
      list.filter((s) => s.id !== summaryId)
    );
  }

  // Videos
  async getVideos(): Promise<VideoLesson[]> {
    const stored = localStorage.getItem(KEYS.VIDEOS);
    if (!stored) {
      // Initialize with seed data on first run
      this.setItem(KEYS.VIDEOS, INITIAL_VIDEOS);
      return INITIAL_VIDEOS;
    }
    return JSON.parse(stored);
  }

  async saveVideo(video: VideoLesson): Promise<void> {
    const list = await this.getVideos();
    list.unshift(video);
    this.setItem(KEYS.VIDEOS, list);
  }

  async deleteVideo(videoId: string): Promise<void> {
    const list = await this.getVideos();
    this.setItem(
      KEYS.VIDEOS,
      list.filter((v) => v.id !== videoId)
    );
  }

  // Ads Configuration & Ad-Free Mode
  async getAdSettings(): Promise<AdSettings> {
    return this.getItem<AdSettings>(KEYS.AD_SETTINGS, DEFAULT_AD_SETTINGS);
  }

  async saveAdSettings(settings: Partial<AdSettings>): Promise<void> {
    const current = await this.getAdSettings();
    this.setItem(KEYS.AD_SETTINGS, { ...current, ...settings });
  }

  async activateAdFreeMode(durationMs: number = 2 * 60 * 60 * 1000): Promise<number> {
    const expiresAt = Date.now() + durationMs;
    await this.saveAdSettings({ noAdsUntil: expiresAt });
    return expiresAt;
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings> {
    return this.getItem<AppSettings>(KEYS.APP_SETTINGS, DEFAULT_APP_SETTINGS);
  }

  async saveAppSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getAppSettings();
    this.setItem(KEYS.APP_SETTINGS, { ...current, ...settings });
  }

  // Full Data Backup & Restore
  async exportAllData(): Promise<FullAppData> {
    return {
      profile: await this.getProfile(),
      tasks: await this.getTasks(),
      prayers: await this.getAllPrayerRecords(),
      pomodoroSessions: await this.getPomodoroSessions(),
      summaries: await this.getSummaries(),
      videos: await this.getVideos(),
      adSettings: await this.getAdSettings(),
      appSettings: await this.getAppSettings(),
      version: '1.0.0',
    };
  }

  async importAllData(data: FullAppData): Promise<void> {
    if (data.profile) this.setItem(KEYS.PROFILE, data.profile);
    if (Array.isArray(data.tasks)) this.setItem(KEYS.TASKS, data.tasks);
    if (Array.isArray(data.prayers)) this.setItem(KEYS.PRAYERS, data.prayers);
    if (Array.isArray(data.pomodoroSessions)) this.setItem(KEYS.POMODORO, data.pomodoroSessions);
    if (Array.isArray(data.summaries)) this.setItem(KEYS.SUMMARIES, data.summaries);
    if (Array.isArray(data.videos)) this.setItem(KEYS.VIDEOS, data.videos);
    if (data.adSettings) this.setItem(KEYS.AD_SETTINGS, data.adSettings);
    if (data.appSettings) this.setItem(KEYS.APP_SETTINGS, data.appSettings);
  }

  async resetAllData(): Promise<void> {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  }
}
