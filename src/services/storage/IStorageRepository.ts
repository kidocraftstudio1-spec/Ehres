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

export interface IStorageRepository {
  // Profile
  getProfile(): Promise<StudentProfile | null>;
  saveProfile(profile: StudentProfile): Promise<void>;
  clearProfile(): Promise<void>;

  // Tasks
  getTasks(): Promise<StudyTask[]>;
  saveTask(task: StudyTask): Promise<void>;
  updateTask(task: StudyTask): Promise<void>;
  deleteTask(taskId: string): Promise<void>;

  // Prayers
  getPrayerRecord(date: string): Promise<DailyPrayerRecord | null>;
  getAllPrayerRecords(): Promise<DailyPrayerRecord[]>;
  togglePrayerStatus(date: string, prayerId: string, completed: boolean): Promise<DailyPrayerRecord>;

  // Pomodoro
  getPomodoroSessions(): Promise<PomodoroSession[]>;
  savePomodoroSession(session: PomodoroSession): Promise<void>;

  // Summaries
  getSummaries(): Promise<SummaryNote[]>;
  saveSummary(summary: SummaryNote): Promise<void>;
  deleteSummary(summaryId: string): Promise<void>;

  // Videos
  getVideos(): Promise<VideoLesson[]>;
  saveVideo(video: VideoLesson): Promise<void>;
  deleteVideo(videoId: string): Promise<void>;

  // Ads Configuration & Ad-Free Mode
  getAdSettings(): Promise<AdSettings>;
  saveAdSettings(settings: Partial<AdSettings>): Promise<void>;
  activateAdFreeMode(durationMs: number): Promise<number>; // returns new expiry timestamp

  // App Settings
  getAppSettings(): Promise<AppSettings>;
  saveAppSettings(settings: Partial<AppSettings>): Promise<void>;

  // Full Data Backup & Restore
  exportAllData(): Promise<FullAppData>;
  importAllData(data: FullAppData): Promise<void>;
  resetAllData(): Promise<void>;
}
