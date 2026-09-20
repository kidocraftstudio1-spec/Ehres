import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Bell,
  Download,
  Upload,
  Trash2,
  User,
  MapPin,
  Smartphone,
  Cloud,
  Info,
  CheckCircle2,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import {
  StudentProfile,
  AppSettings,
  GradeLevel,
  StudyTrack,
} from '../../types';
import { POPULAR_CITIES } from '../../data/seedData';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { notificationService } from '../../services/notifications';

interface SettingsScreenProps {
  profile: StudentProfile | null;
  appSettings: AppSettings;
  onUpdateProfile: (profile: StudentProfile) => Promise<void>;
  onUpdateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  onExportData: () => Promise<void>;
  onImportData: (file: File) => Promise<void>;
  onResetAllData: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  profile,
  appSettings,
  onUpdateProfile,
  onUpdateSettings,
  onExportData,
  onImportData,
  onResetAllData,
}) => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermission()
  );
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Profile Edit State
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [grade, setGrade] = useState<GradeLevel>(profile?.grade || 'الصف الثالث الثانوي');
  const [track, setTrack] = useState<StudyTrack>(profile?.track || 'الطب وعلوم الحياة');
  const [schoolName, setSchoolName] = useState(profile?.schoolName || '');
  const [governorate, setGovernorate] = useState(profile?.governorate || 'القاهرة');
  const [targetGoal, setTargetGoal] = useState(profile?.targetGoal || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleToggleTheme = async () => {
    const nextTheme = appSettings.theme === 'dark' ? 'light' : 'dark';
    await onUpdateSettings({ theme: nextTheme });
    showToast(nextTheme === 'dark' ? 'تم تفعيل الوضع الليلي المريح' : 'تم تفعيل الوضع الفاتح');
  };

  const handleRequestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationPermission(notificationService.getPermission());
    if (granted) {
      await onUpdateSettings({ notificationsEnabled: true });
      notificationService.sendNotification('مرحباً بك في إشعارات احرص! 🌟', {
        body: 'تم تفعيل التنبيهات بنجاح لمساعدتك في أوقات الصلاة والمهام الدراسية.',
      });
      showToast('تم تفعيل إشعارات التطبيق بنجاح!');
    } else {
      showToast('تم رفض إذن الإشعارات من المتصفح.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSavingProfile(true);
    const updated: StudentProfile = {
      id: profile?.id || 'profile_' + Date.now(),
      fullName: fullName.trim(),
      grade,
      track: grade === 'الصف الأول الثانوي' ? 'العام المشترك' : track,
      schoolName: schoolName.trim() || undefined,
      governorate: governorate || 'القاهرة',
      targetGoal: targetGoal.trim() || undefined,
      isGuest: false,
      createdAt: profile?.createdAt || new Date().toISOString(),
    };

    await onUpdateProfile(updated);
    setIsSavingProfile(false);
    showToast('تم حفظ بيانات الملف الشخصي بنجاح!');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await onImportData(file);
      showToast('تمت استعادة البيانات بنجاح!');
    } catch (err) {
      alert('فشل استيراد ملف النسخة الاحتياطية. يرجى التأكد من صحة الملف.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-black text-text-main">
          إعدادات المنصة والملف الشخصي
        </h2>
        <p className="text-xs text-text-secondary">
          خصّص تجربتك ومظهر التطبيق ونسخك الاحتياطية بأعلى درجات التحكم
        </p>
      </div>

      {/* Theme & Display Section */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          {appSettings.theme === 'dark' ? (
            <Moon className="h-4 w-4 text-primary" />
          ) : (
            <Sun className="h-4 w-4 text-accent" />
          )}
          <span>المظهر وعرض الشاشة</span>
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-text-main">
              الوضع الليلي (Eye-Safe Dark Mode)
            </div>
            <div className="text-[11px] text-text-secondary">
              مريح للعين ومصمم للمذاكرة وساعات الليل الطويلة
            </div>
          </div>

          <button
            id="theme-toggle-btn"
            onClick={handleToggleTheme}
            className={`relative h-7 w-14 rounded-full transition-colors ${
              appSettings.theme === 'dark' ? 'bg-primary' : 'bg-outline'
            }`}
          >
            <span
              className={`absolute top-1 right-1 h-5 w-5 rounded-full bg-white transition-transform ${
                appSettings.theme === 'dark' ? '-translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* PWA Section */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm space-y-3 transition-colors">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-primary" />
          <span>تثبيت تطبيق الويب (PWA)</span>
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          تثبيت التطبيق يمنحك تجربة تطبيق أصلي على جوالك، ويعمل بدون إنترنت وتنبيهات أسرع
          للصلوات والمهام.
        </p>

        <PWAInstallButton variant="settings" />
      </div>

      {/* Notifications Section */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span>تنبيهات وإشعارات المذاكرة والصلوات</span>
          </h3>

          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestNotifications}
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dark transition"
            >
              تفعيل الإذن الآن
            </button>
          )}
        </div>

        {/* Note mandate */}
        <div className="rounded-2xl border border-primary/20 bg-primary-container p-3.5 text-xs text-primary font-medium">
          💡 <strong>لأفضل تنبيهات</strong>: ثبّت التطبيق على الشاشة الرئيسية وأبقِ
          الإشعارات مفعّلة.
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-text-main">
              تنبيهات مواعيد الأذان والصلوات
            </span>
            <input
              type="checkbox"
              checked={appSettings.notifyPrayers}
              onChange={(e) => onUpdateSettings({ notifyPrayers: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-text-main">
              تنبيهات اقتراب موعد تسليم الواجبات والمهام
            </span>
            <input
              type="checkbox"
              checked={appSettings.notifyTasks}
              onChange={(e) => onUpdateSettings({ notifyTasks: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-semibold text-text-main">
              تنبيهات نهاية جلسات مؤقت بومودورو
            </span>
            <input
              type="checkbox"
              checked={appSettings.notifyPomodoro}
              onChange={(e) => onUpdateSettings({ notifyPomodoro: e.target.checked })}
              className="h-4 w-4 rounded accent-primary"
            />
          </label>
        </div>
      </div>

      {/* Profile Details Edit Form */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <span>تعديل الملف الشخصي والمسار الدراسي</span>
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-text-secondary">
              الاسم الكامل
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-text-main focus:border-primary focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-text-secondary">
                الصف الدراسي
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as any)}
                className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-text-main focus:border-primary focus:outline-none transition"
              >
                <option value="الصف الأول الثانوي" className="bg-surface text-text-main">الصف الأول الثانوي</option>
                <option value="الصف الثاني الثانوي" className="bg-surface text-text-main">الصف الثاني الثانوي</option>
                <option value="الصف الثالث الثانوي" className="bg-surface text-text-main">الصف الثالث الثانوي</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-text-secondary">
                المسار التخصصي
              </label>
              <select
                value={track}
                disabled={grade === 'الصف الأول الثانوي'}
                onChange={(e) => setTrack(e.target.value as any)}
                className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-text-main focus:border-primary focus:outline-none disabled:opacity-50 transition"
              >
                <option value="العام المشترك" className="bg-surface text-text-main">العام المشترك (أولى ثانوي)</option>
                <option value="الطب وعلوم الحياة" className="bg-surface text-text-main">الطب وعلوم الحياة</option>
                <option value="الهندسة وعلوم الحاسب (والذكاء الاصطناعي)" className="bg-surface text-text-main">
                  الهندسة وعلوم الحاسب (والذكاء الاصطناعي)
                </option>
                <option value="إدارة الأعمال" className="bg-surface text-text-main">إدارة الأعمال</option>
                <option value="الآداب والفنون" className="bg-surface text-text-main">الآداب والفنون</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-text-secondary">
                المدرسة / المحافظة
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="مثال: مدرسة المتفوقين"
                className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="mb-1 block font-semibold text-text-secondary">
                الهدف الدراسي أو الكلية المنشودة
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="مثال: كلية الحاسبات والمعلومات"
                className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary-dark shadow-sm transition"
          >
            حفظ تحديثات الملف الشخصي
          </button>
        </form>
      </div>

      {/* Data Backup & Restore Section */}
      <div className="rounded-3xl border border-outline bg-surface p-5 shadow-sm space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-text-main flex items-center gap-2">
          <Download className="h-4 w-4 text-primary" />
          <span>النسخ الاحتياطي واستعادة البيانات (Backup & Restore)</span>
        </h3>
        <p className="text-xs text-text-secondary">
          تصدير جميع مهامك وصلواتك وتلخيصاتك كملف JSON آمن يمكنك نقله لأي جهاز أو استعادته
          لاحقاً.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onExportData}
            className="flex items-center gap-1.5 rounded-xl border border-outline bg-surface-variant px-4 py-2.5 text-xs font-bold text-text-main hover:bg-surface transition"
          >
            <Download className="h-4 w-4" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>

          <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-outline bg-surface-variant px-4 py-2.5 text-xs font-bold text-text-main hover:bg-surface transition">
            <Upload className="h-4 w-4" />
            <span>استعادة نسخة احتياطية</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>

        {/* Cloud Sync Placeholder */}
        <div className="rounded-2xl border border-outline bg-surface-variant p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-container text-secondary">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-text-main">
                المزامنة السحابية (Firebase Cloud Sync)
              </div>
              <div className="text-[11px] text-text-secondary">
                سيتاح قريباً تسجيل الدخول بحساب Google ومزامنة بياناتك عبر مختلف الأجهزة.
              </div>
            </div>
          </div>
          <span className="rounded-md bg-secondary-container px-2.5 py-1 text-[10px] font-bold text-secondary">
            قريباً
          </span>
        </div>
      </div>

      {/* Danger Zone: Reset All Data */}
      <div className="rounded-3xl border border-error/30 bg-error/5 p-5 space-y-3">
        <h3 className="text-sm font-bold text-error flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span>حذف بياناتي والبدء من جديد</span>
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          حذف كافة المهام والمذكرات وسجلات الصلوات والجلسات المحفوظة محلياً على هذا الجهاز.
        </p>
        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-white hover:bg-error/90 shadow-sm transition"
        >
          حذف جميع البيانات
        </button>
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-4 text-xs text-text-secondary">
        <button
          onClick={() => setIsAboutOpen(true)}
          className="hover:text-primary underline transition"
        >
          عن تطبيق احرص • الإصدار 1.0.0
        </button>
        <p className="mt-1 text-[11px] text-text-secondary">
          صُنع بكل فخر لدعم تفوق طلاب الثانوية العامة المصرية 🇪🇬
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-error/40 bg-surface p-6 text-text-main shadow-2xl text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-error/20 text-error">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-text-main">تأكيد حذف جميع البيانات</h3>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              هل أنت متأكد تماماً؟ سيتم مسح كافة الواجبات، الصلوات، المذكرات، وساعات المذاكرة
              المسجلة على هذا الجهاز، ولا يمكن التراجع عن هذه الخطوة.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="rounded-xl bg-surface-variant px-4 py-2.5 text-xs font-bold text-text-main hover:bg-outline/40 transition"
              >
                إلغاء وتراجع
              </button>
              <button
                onClick={async () => {
                  await onResetAllData();
                  setIsResetConfirmOpen(false);
                  window.location.reload();
                }}
                className="rounded-xl bg-error px-4 py-2.5 text-xs font-bold text-white hover:bg-error/90 shadow-md transition"
              >
                نعم، احذف كل شيء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-primary">
                <Compass className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black text-text-main">منصة احْرِصْ للثانوية العامة</h3>
              <p className="text-xs text-primary font-semibold mt-1">
                «رفيقك الذكي للتفوق الدراسي والالتزام الروحي»
              </p>
            </div>

            <div className="my-4 space-y-2 text-xs text-text-secondary leading-relaxed">
              <p>
                تم بناء تطبيق <strong>احرص</strong> خصيصاً لطلاب مرحلة الثانوية العامة
                المصرية وفق معايير النظام الحديث، بهدف الموازنة المثالية بين الجهد
                الدراسي المنظم والبركة الروحية بالصلاة والذكر.
              </p>
              <p>
                جميع أدوات التطبيق مصممة لتكون عازلة للمشتتات وتعمل بكفاءة حتى دون اتصال
                بالإنترنت (PWA) مع تخزين محلي خاص بالكامل.
              </p>
            </div>

            <button
              onClick={() => setIsAboutOpen(false)}
              className="w-full rounded-xl bg-surface-variant py-2.5 text-xs font-bold text-text-main hover:bg-outline/40 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
