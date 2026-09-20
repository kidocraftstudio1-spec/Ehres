import React, { useState, useMemo } from 'react';
import {
  Play,
  Plus,
  Video,
  X,
  Trash2,
  ExternalLink,
  Sparkles,
  User,
  Clock,
  Search,
} from 'lucide-react';
import { VideoLesson, SubjectName, ALL_SUBJECTS, AdSettings } from '../../types';
import { AdSlot } from '../ads/AdSlot';

interface VideosScreenProps {
  videos: VideoLesson[];
  adSettings: AdSettings;
  onSaveVideo: (video: VideoLesson) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export const VideosScreen: React.FC<VideosScreenProps> = ({
  videos,
  adSettings,
  onSaveVideo,
  onDeleteVideo,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoLesson | null>(null);

  // Add video form state
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState<SubjectName>('الفيزياء');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [duration, setDuration] = useState('');

  // Extract YouTube ID from full URL or return ID directly
  const extractYoutubeId = (urlOrId: string): string => {
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return match && match[2].length === 11 ? match[2] : 'dQw4w9WgXcQ';
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teacherName.trim() || !youtubeInput.trim()) return;

    const youtubeId = extractYoutubeId(youtubeInput);
    const newVideo: VideoLesson = {
      id: 'vid_' + Date.now(),
      title: title.trim(),
      teacherName: teacherName.trim(),
      subject,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      youtubeId,
      duration: duration.trim() || '45:00',
      isRecent: true,
      createdAt: new Date().toISOString(),
    };

    await onSaveVideo(newVideo);
    setIsAddModalOpen(false);
    setTitle('');
    setTeacherName('');
    setYoutubeInput('');
    setDuration('');
  };

  // Filter videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesSubject = selectedSubject === 'all' || v.subject === selectedSubject;
      const matchesQuery =
        !searchQuery.trim() ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSubject && matchesQuery;
    });
  }, [videos, selectedSubject, searchQuery]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text-main">
            مكتبة شروحات كبار المدرسين
          </h2>
          <p className="text-xs text-text-secondary">
            أفضل مراجعات وشروحات الثانوية العامة في مكان واحد بدون تشتت
          </p>
        </div>

        <button
          id="add-video-lesson-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة شرح أو فيديو جديد</span>
        </button>
      </div>

      {/* Subject Filter Chips & Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedSubject('all')}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
              selectedSubject === 'all'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface text-text-secondary hover:bg-surface-variant border border-outline'
            }`}
          >
            جميع المواد ({videos.length})
          </button>
          {ALL_SUBJECTS.map((s) => {
            const count = videos.filter((v) => v.subject === s).length;
            if (count === 0 && selectedSubject !== s) return null;
            return (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                  selectedSubject === s
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface text-text-secondary hover:bg-surface-variant border border-outline'
                }`}
              >
                {s} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <input
            type="text"
            placeholder="ابحث عن اسم المدرس أو عنوان الدرس (مثال: رضا الفاروق، التفاضل...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-outline bg-surface py-2.5 pr-9 pl-4 text-xs text-text-main placeholder-text-secondary shadow-sm focus:border-primary focus:outline-none transition"
          />
        </div>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline bg-surface/50 py-16 text-center transition-colors">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-variant text-text-secondary">
            <Video className="h-7 w-7" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-text-main">
            لا توجد شروحات مطابقة للبحث
          </h3>
          <p className="mt-1 text-xs text-text-secondary">
            يمكنك إضافة رابط أي فيديو من YouTube لمشاهدته داخل المنصة
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-primary-dark transition"
          >
            إضافة شرح الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-outline bg-surface shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              {/* Thumbnail with Play Overlay */}
              <div
                onClick={() => setPlayingVideo(video)}
                className="relative aspect-video w-full cursor-pointer overflow-hidden bg-secondary-dark"
              >
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to placeholder if thumbnail unavailable
                    (e.target as HTMLImageElement).src = '/pwa-512x512.png';
                  }}
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-colors group-hover:bg-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-white shadow-xl shadow-primary/40 transition-transform group-hover:scale-110">
                    <Play className="h-6 w-6 fill-current mr-0.5" />
                  </div>
                </div>

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                    {video.duration}
                  </div>
                )}

                {/* Recently Added Badge */}
                {video.isRecent && (
                  <div className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    <span>أُضيف حديثاً</span>
                  </div>
                )}
              </div>

              {/* Body Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded-md bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                      {video.subject}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-text-main">
                      <User className="h-3 w-3 text-primary" />
                      <span>{video.teacherName}</span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setPlayingVideo(video)}
                    className="cursor-pointer text-xs font-bold text-text-main line-clamp-2 hover:text-primary transition"
                  >
                    {video.title}
                  </h3>
                </div>

                <div className="mt-4 pt-3 border-t border-outline flex items-center justify-between">
                  <button
                    onClick={() => setPlayingVideo(video)}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>تشغيل الآن</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`هل ترغب في إزالة فيديو "${video.title}"؟`)) {
                        onDeleteVideo(video.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-error/10 hover:text-error transition"
                    title="حذف الفيديو"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* YouTube In-App Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-outline bg-surface shadow-2xl">
            {/* Player Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline">
              <div>
                <span className="rounded bg-primary-container px-2 py-0.5 text-[10px] font-bold text-primary">
                  {playingVideo.subject} • {playingVideo.teacherName}
                </span>
                <h3 className="mt-1 text-sm font-bold text-text-main line-clamp-1">
                  {playingVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPlayingVideo(null)}
                className="rounded-full bg-surface-variant p-2 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Embed Video Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${playingVideo.youtubeId}?autoplay=1&rel=0`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            {/* External YouTube Link fallback */}
            <div className="p-3 bg-surface-variant flex items-center justify-between text-xs text-text-secondary">
              <span>مشاهدة مركزة بدون أي مشتتات جانبية</span>
              <a
                href={playingVideo.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary hover:underline font-bold"
              >
                <span>فتح في تطبيق YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Video Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline pb-3">
              <h3 className="text-base font-bold text-text-main">
                إضافة شرح فيديو جديد
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  عنوان الفيديو أو الدرس <strong className="text-error">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مراجعة الباب الأول في الكيمياء الكهربية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  اسم المدرس أو القناة <strong className="text-error">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ. رضا الفاروق"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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

                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">
                    مدة الفيديو التقريبية
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 45:00"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  رابط الفيديو على YouTube أو ID <strong className="text-error">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: https://www.youtube.com/watch?v=..."
                  value={youtubeInput}
                  onChange={(e) => setYoutubeInput(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs text-text-secondary hover:text-text-main transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-white hover:bg-primary-dark shadow-md shadow-primary/20 transition"
                >
                  إضافة الفيديو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adsterra Bottom Banner */}
      <AdSlot type="banner" adSettings={adSettings} />
    </div>
  );
};
