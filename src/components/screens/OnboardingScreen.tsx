import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowLeft,
  User,
  BookOpen,
  MapPin,
  Target,
  CloudOff,
  Compass,
} from 'lucide-react';
import { GradeLevel, StudyTrack, StudentProfile, ALL_SUBJECTS } from '../../types';

interface OnboardingScreenProps {
  onComplete: (profile: StudentProfile) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<GradeLevel>('الصف الثالث الثانوي');
  const [track, setTrack] = useState<StudyTrack>('الطب وعلوم الحياة');
  const [electiveSubject, setElectiveSubject] = useState<string>('البرمجة والذكاء الاصطناعي');
  const [schoolName, setSchoolName] = useState('');
  const [governorate, setGovernorate] = useState('القاهرة');
  const [targetGoal, setTargetGoal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isFirstGrade = grade === 'الصف الأول الثانوي';
  const isSecondGrade = grade === 'الصف الثاني الثانوي';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 3) {
      setErrorMsg('يرجى إدخال الاسم بالكامل (3 أحرف على الأقل).');
      return;
    }

    const profile: StudentProfile = {
      id: 'profile_' + Date.now(),
      fullName: fullName.trim(),
      grade,
      track: isFirstGrade ? 'العام المشترك' : track,
      electiveSubject: isSecondGrade ? electiveSubject : undefined,
      schoolName: schoolName.trim() || undefined,
      governorate: governorate || 'القاهرة',
      targetGoal: targetGoal.trim() || undefined,
      isGuest: false,
      createdAt: new Date().toISOString(),
    };

    onComplete(profile);
  };

  const handleContinueAsGuest = () => {
    const guestProfile: StudentProfile = {
      id: 'guest_' + Date.now(),
      fullName: 'طالب متفوق',
      grade: 'الصف الثالث الثانوي',
      track: 'الطب وعلوم الحياة',
      governorate: 'القاهرة',
      targetGoal: 'كلية الأحلام',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    onComplete(guestProfile);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-text-main transition-colors" dir="rtl">
      <div className="w-full max-w-xl rounded-3xl border border-outline bg-surface p-6 md:p-8 shadow-2xl transition-colors">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 text-white">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text-main">
            مرحباً بك في منصة <span className="text-primary">احْرِصْ</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            رفيقك الذكي للتفوق الدراسي والالتزام الروحي لطلاب الثانوية العامة (النظام الحديث)
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-container px-3.5 py-1 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>بياناتك محفوظة محلياً على جهازك بأعلى خصوصية وأمان</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-xs text-error">
              {errorMsg}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-text-main">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>الاسم الكامل <strong className="text-error">*</strong></span>
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              placeholder="مثال: أحمد محمد مصطفى"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              className="w-full rounded-xl border border-outline bg-surface-variant px-4 py-2.5 text-sm text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
            />
          </div>

          {/* Grade Level */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-text-main">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              <span>الصف الدراسي <strong className="text-error">*</strong></span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['الصف الأول الثانوي', 'الصف الثاني الثانوي', 'الصف الثالث الثانوي'] as GradeLevel[]).map(
                (g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                      grade === g
                        ? 'border-primary bg-primary-container text-primary shadow-sm'
                        : 'border-outline bg-surface-variant text-text-secondary hover:text-text-main hover:border-outline/80'
                    }`}
                  >
                    {g.replace(' الثانوي', '')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Track (For Grade 2 and 3) */}
          {!isFirstGrade ? (
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-text-main">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span>المسار التخصصي <strong className="text-error">*</strong></span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    'الطب وعلوم الحياة',
                    'الهندسة وعلوم الحاسب (والذكاء الاصطناعي)',
                    'إدارة الأعمال',
                    'الآداب والفنون',
                  ] as StudyTrack[]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrack(t)}
                    className={`rounded-xl border p-2.5 text-right text-xs font-bold transition-all ${
                      track === t
                        ? 'border-primary bg-primary-container text-primary shadow-sm'
                        : 'border-outline bg-surface-variant text-text-secondary hover:text-text-main hover:border-outline/80'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-outline bg-surface-variant p-3 text-xs text-text-secondary">
              📌 الصف الأول الثانوي مرحلة عامة موحدة بجميع المواد الأساسية.
            </div>
          )}

          {/* Elective Subject for Grade 2 */}
          {isSecondGrade && (
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-text-main">
                <BookOpen className="h-3.5 w-3.5 text-accent" />
                <span>المادة الاختيارية (خاص بالصف الثاني الثانوي)</span>
              </label>
              <select
                value={electiveSubject}
                onChange={(e) => setElectiveSubject(e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface-variant px-4 py-2.5 text-sm text-text-main focus:border-primary focus:outline-none transition"
              >
                <option value="البرمجة والذكاء الاصطناعي" className="bg-surface text-text-main">البرمجة والذكاء الاصطناعي</option>
                <option value="علم النفس والاجتماع" className="bg-surface text-text-main">علم النفس والاجتماع</option>
                <option value="المحاسبة وإدارة الأعمال" className="bg-surface text-text-main">المحاسبة وإدارة الأعمال</option>
                <option value="اللغة الأجنبية الثانية" className="bg-surface text-text-main">اللغة الأجنبية الثانية (فرنساوي / ألماني / إيطالي)</option>
              </select>
            </div>
          )}

          {/* Optional Info: School / Governorate & Dream Goal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <MapPin className="h-3 w-3 text-text-secondary" />
                <span>المحافظة / المدرسة (اختياري)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: الجيزة - مدرسة السعيدية"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                <Target className="h-3 w-3 text-accent" />
                <span>هدفك أو الكلية المنشودة (اختياري)</span>
              </label>
              <input
                type="text"
                placeholder="مثال: هندسة عين شمس، طب قصر العيني"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>

          {/* Cloud Sync Notice (Placeholder for Firebase) */}
          <div className="rounded-xl border border-outline bg-surface-variant p-3 flex items-center justify-between text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <CloudOff className="h-4 w-4 text-text-secondary" />
              <span>تسجيل الدخول والمزامنة السحابية (قريباً عبر Firebase)</span>
            </div>
            <span className="rounded bg-surface px-2 py-0.5 text-[10px] text-text-secondary border border-outline font-semibold">
              قريباً
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2">
            <button
              id="submit-onboarding-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary-dark active:scale-[0.99] transition"
            >
              <span>انطلق وابدأ رحلة التفوق</span>
              <ArrowLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full py-2 text-xs font-medium text-text-secondary hover:text-text-main transition"
            >
              المتابعة كزائر بأقل بيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
