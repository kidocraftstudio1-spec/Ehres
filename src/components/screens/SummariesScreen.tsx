import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Share2,
  Printer,
  Copy,
  Trash2,
  X,
  Check,
  FileText,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { SummaryNote, SubjectName, ALL_SUBJECTS, AdSettings } from '../../types';
import { AdSlot } from '../ads/AdSlot';

interface SummariesScreenProps {
  summaries: SummaryNote[];
  adSettings: AdSettings;
  onSaveSummary: (summary: SummaryNote) => Promise<void>;
  onDeleteSummary: (summaryId: string) => Promise<void>;
}

export const SummariesScreen: React.FC<SummariesScreenProps> = ({
  summaries,
  adSettings,
  onSaveSummary,
  onDeleteSummary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'ai' | 'manual'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [readingSummary, setReadingSummary] = useState<SummaryNote | null>(null);

  // Form state
  const [isAiMode, setIsAiMode] = useState(true);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectName>('الفيزياء');
  const [rawText, setRawText] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleOpenCreate = (useAi: boolean = true) => {
    setIsAiMode(useAi);
    setTitle('');
    setSubject('الفيزياء');
    setRawText('');
    setManualContent('');
    setApiError(null);
    setIsCreateModalOpen(true);
  };

  const handleAiSummarize = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      setApiError('يرجى إدخال نص الدرس أو جزء منه بحد أدنى 10 أحرف للتلخيص.');
      return;
    }

    setIsLoadingAi(true);
    setApiError(null);

    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          title: title.trim() || undefined,
          text: rawText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'تعذر معالجة التلخيص من الخادم.');
      }

      const data = await response.json();

      const newSummary: SummaryNote = {
        id: 'sum_' + Date.now(),
        title: title.trim() || `${subject}: ${data.title || 'ملخص الدرس'}`,
        subject,
        content: data.summary,
        rawText,
        isAiGenerated: true,
        createdAt: new Date().toISOString(),
      };

      await onSaveSummary(newSummary);
      setIsLoadingAi(false);
      setIsCreateModalOpen(false);
      setReadingSummary(newSummary);
    } catch (err: any) {
      console.error(err);
      setIsLoadingAi(false);
      setApiError(err.message || 'حدث خطأ في الاتصال بالخادم، يرجى المحاولة مرة أخرى.');
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !manualContent.trim()) return;

    const newSummary: SummaryNote = {
      id: 'sum_' + Date.now(),
      title: title.trim(),
      subject,
      content: manualContent.trim(),
      isAiGenerated: false,
      createdAt: new Date().toISOString(),
    };

    await onSaveSummary(newSummary);
    setIsCreateModalOpen(false);
  };

  const handleShare = async (summary: SummaryNote) => {
    const shareText = `📌 ${summary.title} (${summary.subject})\n\n${summary.content}\n\n— ملخص عبر تطبيق احرص للثانوية العامة`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: summary.title,
          text: shareText,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopiedId(summary.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = (summary: SummaryNote) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html lang="ar" dir="rtl">
        <head>
          <title>${summary.title} - احرص</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; line-height: 1.8; color: #1e293b; }
            h1 { color: #0f172a; border-bottom: 2px solid #10b981; padding-bottom: 12px; }
            .badge { background: #e2e8f0; padding: 4px 10px; border-radius: 6px; font-size: 14px; font-weight: bold; }
            .content { margin-top: 24px; white-space: pre-wrap; font-size: 15px; }
            .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h1>${summary.title}</h1>
          <span class="badge">${summary.subject}</span>
          <div class="content">${summary.content}</div>
          <div class="footer">تم إنشاء هذه المذكرة عبر تطبيق احرص للثانوية العامة المصرية</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredSummaries = useMemo(() => {
    let list = summaries;
    if (activeTab === 'ai') list = list.filter((s) => s.isAiGenerated);
    if (activeTab === 'manual') list = list.filter((s) => !s.isAiGenerated);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [summaries, activeTab, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Create Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text-main">
            المذكرات والتلخيص الذكي
          </h2>
          <p className="text-xs text-text-secondary">
            لخّص دروس الثانوية المعقدة بضغطة زر واحدة عبر نموذج Gemini الذكي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="create-ai-summary-btn"
            onClick={() => handleOpenCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-purple-accent px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-accent/20 hover:brightness-110 active:scale-95 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>تلخيص ذكي بـ Gemini</span>
          </button>

          <button
            onClick={() => handleOpenCreate(false)}
            className="flex items-center gap-1.5 rounded-xl border border-outline bg-surface px-3.5 py-2.5 text-xs font-bold text-text-main hover:bg-surface-variant shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>مذكرة يدوية</span>
          </button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-outline bg-surface p-3 shadow-sm transition-colors">
        <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-surface text-text-main shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            الكل ({summaries.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'ai'
                ? 'bg-surface text-purple-accent font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            تلخيص AI ({summaries.filter((s) => s.isAiGenerated).length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeTab === 'manual'
                ? 'bg-surface text-text-main shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            يدوي ({summaries.filter((s) => !s.isAiGenerated).length})
          </button>
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <input
            type="text"
            placeholder="بحث في المذكرات والمفاهيم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-outline bg-surface-variant py-1.5 pr-8 pl-3 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
          />
        </div>
      </div>

      {/* Summaries List */}
      {filteredSummaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline bg-surface/50 py-16 text-center transition-colors">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-accent/15 text-purple-accent">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-text-main">
            لا توجد تلخيصات محفوظة هنا
          </h3>
          <p className="mt-1 text-xs text-text-secondary max-w-xs">
            الصق أي نص من كتاب الوزارة أو المذكرات ودع رفيقك الذكي يستخرج لك صلب الموضوع
          </p>
          <button
            onClick={() => handleOpenCreate(true)}
            className="mt-4 rounded-xl bg-purple-accent px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition"
          >
            جرّب التلخيص الذكي الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSummaries.map((summary, idx) => (
            <React.Fragment key={summary.id}>
              {/* Native Ad Slot between 2nd and 3rd item */}
              {idx === 2 && (
                <div className="col-span-full">
                  <AdSlot type="native" adSettings={adSettings} />
                </div>
              )}

              <div className="flex flex-col justify-between rounded-3xl border border-outline bg-surface p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-surface-variant px-2.5 py-1 text-[10px] font-bold text-text-secondary">
                      {summary.subject}
                    </span>

                    {summary.isAiGenerated && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-accent/15 px-2 py-0.5 text-[10px] font-bold text-purple-accent">
                        <Sparkles className="h-3 w-3" />
                        تلخيص ذكي
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2.5 text-base font-black text-text-main line-clamp-2">
                    {summary.title}
                  </h3>

                  <div className="mt-2 text-xs text-text-secondary line-clamp-4 leading-relaxed whitespace-pre-line font-normal">
                    {summary.content}
                  </div>
                </div>

                {/* Footer Toolbar */}
                <div className="mt-4 pt-3 border-t border-outline flex items-center justify-between">
                  <button
                    onClick={() => setReadingSummary(summary)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>قراءة التلخيص كاملاً</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShare(summary)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-variant hover:text-text-main transition"
                      title="مشاركة أو نسخ التلخيص"
                    >
                      {copiedId === summary.id ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Share2 className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handlePrint(summary)}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-variant hover:text-text-main transition"
                      title="طباعة أو تصدير PDF"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من رغبتك في حذف هذا التلخيص؟')) {
                          onDeleteSummary(summary.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-text-secondary hover:bg-error/10 hover:text-error transition"
                      title="حذف التلخيص"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Reading Modal */}
      {readingSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline pb-3">
              <div>
                <span className="rounded-lg bg-primary-container px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {readingSummary.subject}
                </span>
                <h3 className="mt-1 text-lg font-black text-text-main">
                  {readingSummary.title}
                </h3>
              </div>
              <button
                onClick={() => setReadingSummary(null)}
                className="rounded-lg p-1.5 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="my-4 rounded-2xl bg-surface-variant p-5 text-sm leading-relaxed text-text-main whitespace-pre-line border border-outline">
              {readingSummary.content}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline">
              <span className="text-[11px] text-text-secondary">
                تاريخ الإنشاء: {new Date(readingSummary.createdAt).toLocaleDateString('ar-EG')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare(readingSummary)}
                  className="flex items-center gap-1.5 rounded-xl border border-outline bg-surface-variant px-3 py-1.5 text-xs font-bold text-text-main hover:bg-surface transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>مشاركة</span>
                </button>
                <button
                  onClick={() => handlePrint(readingSummary)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-dark transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>تصدير وطباعة PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / AI Summarize Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-accent/20 text-purple-accent">
                  {isAiMode ? <Sparkles className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <h3 className="font-bold text-text-main">
                  {isAiMode ? 'التلخيص الذكي للدروس (Gemini)' : 'تدوين مذكرة دراسية يدوية'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {apiError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/40 bg-error/10 p-3 text-xs text-error">
                <AlertCircle className="h-4 w-4 shrink-0 text-error mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Subject */}
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  المادة الدراسية
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none transition"
                >
                  {ALL_SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-surface text-text-main">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  عنوان الدرس أو المذكرة (اختياري في التلخيص الذكي)
                </label>
                <input
                  type="text"
                  placeholder="مثال: قوانين كيرشوف وتوزيع الجهود"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
              </div>

              {/* AI Content or Manual Content */}
              {isAiMode ? (
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-text-secondary">
                    <span>نص الدرس أو الملاحظات المراد تلخيصها</span>
                    <span className="text-[10px] text-purple-accent">
                      سيتم تلخيص المفاهيم والقوانين ونصيحة الامتحان
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="الصق هنا شرح المعلم، نص صفحة الكتاب، أو ملاحظاتك، وسيقوم المساعد الذكي بتنسيقها واستخراج أهم التريكات..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant p-3 text-xs leading-relaxed text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">
                    محتوى المذكرة
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="اكتب تلخيصك وملاحظاتك بأسلوبك..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant p-3 text-xs leading-relaxed text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                  />
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                {isAiMode ? (
                  <button
                    id="submit-ai-summarize-btn"
                    type="button"
                    disabled={isLoadingAi}
                    onClick={handleAiSummarize}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-accent py-3 text-xs font-bold text-white shadow-lg shadow-purple-accent/30 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition"
                  >
                    {isLoadingAi ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري التلخيص بواسطة رفيقك الذكي...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>ابدأ التلخيص الذكي للدرس</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-white shadow-md hover:bg-primary-dark transition"
                  >
                    <span>حفظ المذكرة</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adsterra Bottom Banner */}
      <AdSlot type="banner" adSettings={adSettings} />
    </div>
  );
};
