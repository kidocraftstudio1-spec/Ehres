import React, { useState, useEffect } from 'react';
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
} from './types';
import { storageService } from './services/storage';
import { PrayerService, NextPrayerInfo, PrayerTimings } from './services/prayerService';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AdFreeModal } from './components/ads/AdFreeModal';
import { OnboardingScreen } from './components/screens/OnboardingScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { TasksScreen } from './components/screens/TasksScreen';
import { PrayersScreen } from './components/screens/PrayersScreen';
import { PomodoroScreen } from './components/screens/PomodoroScreen';
import { SummariesScreen } from './components/screens/SummariesScreen';
import { VideosScreen } from './components/screens/VideosScreen';
import { StatsBadgesScreen } from './components/screens/StatsBadgesScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [prayerRecords, setPrayerRecords] = useState<DailyPrayerRecord[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [summaries, setSummaries] = useState<SummaryNote[]>([]);
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [adSettings, setAdSettings] = useState<AdSettings>({
    noAdsUntil: 0,
    bannerKey: 'adsterra_banner_placeholder',
    nativeKey: 'adsterra_native_placeholder',
    directLinkUrl: 'https://www.profitablecpmrate.com/placeholder',
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({
    theme: 'dark',
    notificationsEnabled: false,
    notifyTasks: true,
    notifyPrayers: true,
    notifyPomodoro: true,
    notifyLessons: false,
    selectedCity: 'القاهرة',
    useGeolocation: false,
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAdFreeModalOpen, setIsAdFreeModalOpen] = useState(false);
  const [isQuickNewTaskModalOpen, setIsQuickNewTaskModalOpen] = useState(false);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);

  // Load all data from storage repository on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [
          savedProfile,
          savedTasks,
          savedPrayers,
          savedPomodoro,
          savedSummaries,
          savedVideos,
          savedAdSettings,
          savedAppSettings,
        ] = await Promise.all([
          storageService.getProfile(),
          storageService.getTasks(),
          storageService.getAllPrayerRecords(),
          storageService.getPomodoroSessions(),
          storageService.getSummaries(),
          storageService.getVideos(),
          storageService.getAdSettings(),
          storageService.getAppSettings(),
        ]);

        setProfile(savedProfile);
        setTasks(savedTasks);
        setPrayerRecords(savedPrayers);
        setPomodoroSessions(savedPomodoro);
        setSummaries(savedSummaries);
        setVideos(savedVideos);
        setAdSettings(savedAdSettings);
        setAppSettings(savedAppSettings);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Synchronize Theme class with document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (appSettings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [appSettings.theme]);

  // Next prayer timer ticker for dashboard
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function initPrayerTicker() {
      try {
        const res = await PrayerService.getTimings(
          appSettings.selectedCity,
          appSettings.useGeolocation,
          appSettings.userLat && appSettings.userLng
            ? { lat: appSettings.userLat, lng: appSettings.userLng }
            : undefined
        );

        const updateNext = () => {
          const next = PrayerService.getNextPrayer(res.timings);
          setNextPrayer(next);
        };

        updateNext();
        interval = setInterval(updateNext, 1000);
      } catch (e) {
        console.error('Prayer ticker error:', e);
      }
    }

    initPrayerTicker();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [appSettings.selectedCity, appSettings.useGeolocation, appSettings.userLat, appSettings.userLng]);

  // Handlers for Profile
  const handleCompleteOnboarding = async (newProfile: StudentProfile) => {
    await storageService.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleUpdateProfile = async (updated: StudentProfile) => {
    await storageService.saveProfile(updated);
    setProfile(updated);
  };

  // Handlers for Tasks
  const handleSaveTask = async (task: StudyTask) => {
    await storageService.saveTask(task);
    const updated = await storageService.getTasks();
    setTasks(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    await storageService.deleteTask(taskId);
    const updated = await storageService.getTasks();
    setTasks(updated);
  };

  // Handlers for Prayers
  const handleTogglePrayer = async (prayerId: string, completed: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    await storageService.togglePrayerStatus(today, prayerId, completed);
    const all = await storageService.getAllPrayerRecords();
    setPrayerRecords(all);
  };

  const handleUpdateCity = async (city: string, useGeo: boolean) => {
    await storageService.saveAppSettings({ selectedCity: city, useGeolocation: useGeo });
    setAppSettings((prev) => ({ ...prev, selectedCity: city, useGeolocation: useGeo }));
  };

  // Handlers for Pomodoro
  const handleSavePomodoroSession = async (session: PomodoroSession) => {
    await storageService.savePomodoroSession(session);
    const updated = await storageService.getPomodoroSessions();
    setPomodoroSessions(updated);
  };

  // Handlers for Summaries
  const handleSaveSummary = async (summary: SummaryNote) => {
    await storageService.saveSummary(summary);
    const updated = await storageService.getSummaries();
    setSummaries(updated);
  };

  const handleDeleteSummary = async (summaryId: string) => {
    await storageService.deleteSummary(summaryId);
    const updated = await storageService.getSummaries();
    setSummaries(updated);
  };

  // Handlers for Videos
  const handleSaveVideo = async (video: VideoLesson) => {
    await storageService.saveVideo(video);
    const updated = await storageService.getVideos();
    setVideos(updated);
  };

  const handleDeleteVideo = async (videoId: string) => {
    await storageService.deleteVideo(videoId);
    const updated = await storageService.getVideos();
    setVideos(updated);
  };

  // Handlers for Ads & Ad-Free Mode
  const handleRewardClaimed = async (expiresAt: number) => {
    await storageService.saveAdSettings({ noAdsUntil: expiresAt });
    setAdSettings((prev) => ({ ...prev, noAdsUntil: expiresAt }));
  };

  // Handlers for App Settings
  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    await storageService.saveAppSettings(partial);
    setAppSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleToggleTheme = () => {
    const nextTheme = appSettings.theme === 'dark' ? 'light' : 'dark';
    handleUpdateSettings({ theme: nextTheme });
  };

  // Data Export & Import
  const handleExportData = async () => {
    const data = await storageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ehres-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(reader.result as string) as FullAppData;
        await storageService.importAllData(parsed);
        // Refresh state
        setProfile(await storageService.getProfile());
        setTasks(await storageService.getTasks());
        setPrayerRecords(await storageService.getAllPrayerRecords());
        setPomodoroSessions(await storageService.getPomodoroSessions());
        setSummaries(await storageService.getSummaries());
        setVideos(await storageService.getVideos());
        setAdSettings(await storageService.getAdSettings());
        setAppSettings(await storageService.getAppSettings());
      } catch (err) {
        throw new Error('Invalid JSON backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = async () => {
    await storageService.resetAllData();
    setProfile(null);
    setTasks([]);
    setPrayerRecords([]);
    setPomodoroSessions([]);
    setSummaries([]);
    setVideos([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-night text-primary-light">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 font-bold text-sm tracking-wide text-text-secondary">
          جاري تحميل منصة احرص...
        </p>
      </div>
    );
  }

  // If student hasn't completed onboarding yet, render Onboarding Screen
  if (!profile) {
    return <OnboardingScreen onComplete={handleCompleteOnboarding} />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPrayerRecord = prayerRecords.find((r) => r.date === todayStr) || null;
  const pendingTasksCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-main transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        profile={profile}
        appSettings={appSettings}
        adSettings={adSettings}
        onToggleTheme={handleToggleTheme}
        onOpenAdFreeModal={() => setIsAdFreeModalOpen(true)}
        onNavigate={(tab) => setCurrentTab(tab)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 md:py-8 mb-16 md:mb-6">
        {currentTab === 'dashboard' && (
          <DashboardScreen
            profile={profile}
            tasks={tasks}
            todayPrayerRecord={todayPrayerRecord}
            pomodoroSessions={pomodoroSessions}
            nextPrayer={nextPrayer}
            adSettings={adSettings}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenNewTask={() => setIsQuickNewTaskModalOpen(true)}
            onOpenAdFreeModal={() => setIsAdFreeModalOpen(true)}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksScreen
            tasks={tasks}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            isNewTaskModalOpen={isQuickNewTaskModalOpen}
            onCloseNewTaskModal={() => setIsQuickNewTaskModalOpen(false)}
          />
        )}

        {currentTab === 'prayers' && (
          <PrayersScreen
            todayRecord={todayPrayerRecord}
            allRecords={prayerRecords}
            appSettings={appSettings}
            onTogglePrayer={handleTogglePrayer}
            onUpdateCity={handleUpdateCity}
          />
        )}

        {currentTab === 'pomodoro' && (
          <PomodoroScreen
            sessions={pomodoroSessions}
            onSaveSession={handleSavePomodoroSession}
          />
        )}

        {currentTab === 'summaries' && (
          <SummariesScreen
            summaries={summaries}
            adSettings={adSettings}
            onSaveSummary={handleSaveSummary}
            onDeleteSummary={handleDeleteSummary}
          />
        )}

        {currentTab === 'videos' && (
          <VideosScreen
            videos={videos}
            adSettings={adSettings}
            onSaveVideo={handleSaveVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        )}

        {currentTab === 'stats' && (
          <StatsBadgesScreen
            profile={profile}
            tasks={tasks}
            prayerRecords={prayerRecords}
            pomodoroSessions={pomodoroSessions}
            summaries={summaries}
            videos={videos}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            profile={profile}
            appSettings={appSettings}
            onUpdateProfile={handleUpdateProfile}
            onUpdateSettings={handleUpdateSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Rewarded Ad-Free Modal */}
      <AdFreeModal
        isOpen={isAdFreeModalOpen}
        onClose={() => setIsAdFreeModalOpen(false)}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Offline Status Floating Alert */}
      <OfflineIndicator />

      {/* Bottom Mobile Navigation Bar & Desktop Tabs */}
      <BottomNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        pendingTasksCount={pendingTasksCount}
      />
    </div>
  );
}
