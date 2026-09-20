export type GradeLevel = 
  | 'الصف الأول الثانوي'
  | 'الصف الثاني الثانوي'
  | 'الصف الثالث الثانوي';

export type StudyTrack = 
  | 'العام المشترك'
  | 'الطب وعلوم الحياة'
  | 'الهندسة وعلوم الحاسب (والذكاء الاصطناعي)'
  | 'إدارة الأعمال'
  | 'الآداب والفنون';

export const ALL_SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'اللغة الأجنبية الثانية',
  'التربية الدينية الإسلامية',
  'الرياضيات البحتة والتطبيقية',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
  'الجغرافيا',
  'التاريخ',
  'علم النفس والاجتماع',
  'الاقتصاد',
  'المحاسبة وإدارة الأعمال',
  'البرمجة والذكاء الاصطناعي',
] as const;

export type SubjectName = typeof ALL_SUBJECTS[number] | string;

export interface StudentProfile {
  id: string;
  fullName: string;
  grade: GradeLevel;
  track: StudyTrack;
  electiveSubject?: string;
  schoolName?: string;
  governorate?: string;
  targetGoal?: string; // e.g. "كلية الطب البشري - جامعة القاهرة"
  isGuest: boolean;
  createdAt: string;
}

export type TaskPriority = 'عالية' | 'متوسطة' | 'منخفضة';

export interface StudyTask {
  id: string;
  title: string;
  subject: SubjectName;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  reminderMinutes: number; // e.g. 15, 30, 60, 1440
  attachmentName?: string;
  attachmentData?: string; // base64 string
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export type PrayerCategory = 'fard' | 'sunnah' | 'nafl';

export interface PrayerDefinition {
  id: string;
  name: string;
  arabicName: string;
  category: PrayerCategory;
  rakats: number;
  virtue: string;
  duaa: string;
  apiTimingKey?: string; // fajr, dhuhr, asr, maghrib, isha
}

export interface DailyPrayerRecord {
  date: string; // YYYY-MM-DD
  completedPrayers: Record<string, boolean>;
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  subject: SubjectName;
  durationMinutes: number;
  mode: PomodoroMode;
  completedAt: string;
}

export interface SummaryNote {
  id: string;
  title: string;
  subject: SubjectName;
  content: string;
  rawText?: string;
  isAiGenerated: boolean;
  createdAt: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  teacherName: string;
  subject: SubjectName;
  youtubeUrl: string;
  youtubeId: string;
  duration?: string;
  isRecent?: boolean;
  createdAt: string;
}

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  requiredMetric: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

export interface AdSettings {
  noAdsUntil: number; // timestamp ms. If > Date.now(), user is in 2-hour ad-free focus mode
  bannerKey: string;
  nativeKey: string;
  directLinkUrl: string;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  notifyTasks: boolean;
  notifyPrayers: boolean;
  notifyPomodoro: boolean;
  notifyLessons: boolean;
  selectedCity: string;
  useGeolocation: boolean;
  userLat?: number;
  userLng?: number;
}

export interface FullAppData {
  profile: StudentProfile | null;
  tasks: StudyTask[];
  prayers: DailyPrayerRecord[];
  pomodoroSessions: PomodoroSession[];
  summaries: SummaryNote[];
  videos: VideoLesson[];
  adSettings: AdSettings;
  appSettings: AppSettings;
  version: string;
}
