import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Paperclip,
  Search,
  Filter,
  ArrowUpDown,
  X,
  Sparkles,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { StudyTask, TaskPriority, ALL_SUBJECTS, SubjectName } from '../../types';
import { notificationService } from '../../services/notifications';

interface TasksScreenProps {
  tasks: StudyTask[];
  onSaveTask: (task: StudyTask) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  isNewTaskModalOpen?: boolean;
  onCloseNewTaskModal?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  onSaveTask,
  onDeleteTask,
  isNewTaskModalOpen = false,
  onCloseNewTaskModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'subject'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(isNewTaskModalOpen);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectName>('اللغة العربية');
  const [priority, setPriority] = useState<TaskPriority>('متوسطة');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('20:00');
  const [reminderMinutes, setReminderMinutes] = useState(60);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [attachmentData, setAttachmentData] = useState<string | undefined>(undefined);
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);

  // Sync prop modal
  React.useEffect(() => {
    if (isNewTaskModalOpen) {
      handleOpenCreate();
    }
  }, [isNewTaskModalOpen]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTitle('');
    setSubject('اللغة العربية');
    setPriority('متوسطة');
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('20:00');
    setReminderMinutes(60);
    setAttachmentName(undefined);
    setAttachmentData(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: StudyTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setSubject(task.subject);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '20:00');
    setReminderMinutes(task.reminderMinutes || 60);
    setAttachmentName(task.attachmentName);
    setAttachmentData(task.attachmentData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onCloseNewTaskModal) onCloseNewTaskModal();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف كبير جداً، الحد الأقصى 5 ميجابايت.');
      return;
    }

    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: StudyTask = {
      id: editingTask ? editingTask.id : 'task_' + Date.now(),
      title: title.trim(),
      subject,
      priority,
      dueDate,
      dueTime,
      reminderMinutes,
      attachmentName,
      attachmentData,
      isCompleted: editingTask ? editingTask.isCompleted : false,
      completedAt: editingTask ? editingTask.completedAt : undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
    };

    await onSaveTask(newTask);

    // Schedule notification for reminder if supported
    if (!newTask.isCompleted && newTask.dueDate && newTask.dueTime) {
      const dueTimestamp = new Date(`${newTask.dueDate}T${newTask.dueTime}`).getTime();
      const reminderTimestamp = dueTimestamp - reminderMinutes * 60 * 1000;
      notificationService.scheduleAlert(
        `تذكير بمهمة: ${newTask.title}`,
        `متبقي على موعد تسليم ${newTask.subject} ${reminderMinutes} دقيقة!`,
        reminderTimestamp,
        `task-${newTask.id}`
      );
    }

    handleCloseModal();
  };

  const handleToggleComplete = async (task: StudyTask) => {
    const nowCompleted = !task.isCompleted;
    const updated: StudyTask = {
      ...task,
      isCompleted: nowCompleted,
      completedAt: nowCompleted ? new Date().toISOString() : undefined,
    };

    await onSaveTask(updated);

    if (nowCompleted) {
      // Trigger festive confetti & vibration
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6'],
      });
      notificationService.vibrate([150, 75, 150]);

      setSuccessToast('مبروك! أنجزت مهمة جديدة 🎉');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  // Check if due within 3 hours
  const isUrgent = (task: StudyTask) => {
    if (task.isCompleted || !task.dueDate) return false;
    const taskTime = task.dueTime || '23:59';
    const dueTimestamp = new Date(`${task.dueDate}T${taskTime}`).getTime();
    const diffHours = (dueTimestamp - Date.now()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 3;
  };

  const isOverdue = (task: StudyTask) => {
    if (task.isCompleted || !task.dueDate) return false;
    const taskTime = task.dueTime || '23:59';
    const dueTimestamp = new Date(`${task.dueDate}T${taskTime}`).getTime();
    return dueTimestamp < Date.now();
  };

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      if (filter === 'pending') return !t.isCompleted;
      if (filter === 'completed') return t.isCompleted;
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityScore = { عالية: 3, متوسطة: 2, منخفضة: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority];
      }
      if (sortBy === 'subject') {
        return a.subject.localeCompare(b.subject, 'ar');
      }
      // default: date
      const dateA = new Date(`${a.dueDate}T${a.dueTime || '00:00'}`).getTime();
      const dateB = new Date(`${b.dueDate}T${b.dueTime || '00:00'}`).getTime();
      return dateA - dateB;
    });
  }, [tasks, filter, sortBy, searchQuery]);

  return (
    <div className="space-y-5 pb-8">
      {/* Toast Banner */}
      {successToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-2xl animate-bounce">
          <Sparkles className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header & New Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-text-main">
            المهام والواجبات الدراسية
          </h2>
          <p className="text-xs text-text-secondary">
            نظّم دروسك وواجباتك اليومية بذكاء وانطلق نحو القمة
          </p>
        </div>

        <button
          id="add-new-task-btn"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark active:scale-95 transition"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة واجب / مهمة جديدة</span>
        </button>
      </div>

      {/* Filters, Search & Sort Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-2xl border border-outline bg-surface p-3 shadow-sm transition-colors">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-variant p-1 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-surface text-text-main shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            الكل ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filter === 'pending'
                ? 'bg-surface text-primary font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            معلقة ({tasks.filter((t) => !t.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filter === 'completed'
                ? 'bg-surface text-secondary font-bold shadow-sm'
                : 'text-text-secondary hover:text-text-main'
            }`}
          >
            مكتملة ({tasks.filter((t) => t.isCompleted).length})
          </button>
        </div>

        {/* Search Input & Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="بحث في المهام والمواد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-outline bg-surface-variant py-1.5 pr-8 pl-3 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-text-secondary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-outline bg-surface-variant px-2.5 py-1.5 text-xs font-medium text-text-main focus:border-primary focus:outline-none"
            >
              <option value="date" className="bg-surface text-text-main">تاريخ التسليم</option>
              <option value="priority" className="bg-surface text-text-main">الأولوية</option>
              <option value="subject" className="bg-surface text-text-main">المادة الدراسية</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-outline bg-surface/50 py-16 text-center transition-colors">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-primary">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-text-main">
            لا توجد مهام مطابقة هنا
          </h3>
          <p className="mt-1 text-xs text-text-secondary max-w-xs">
            أنت جاهز لإضافة مهام جديدة وتنظيم أسبوعك الدراسي بكل دقة
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition"
          >
            إضافة مهمة الآن
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const urgent = isUrgent(task);
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
                className={`group relative flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                  task.isCompleted
                    ? 'border-outline/60 bg-surface-variant/40 text-text-secondary'
                    : urgent
                    ? 'border-warning/50 bg-warning/10 shadow-sm'
                    : overdue
                    ? 'border-error/40 bg-error/10'
                    : 'border-outline bg-surface hover:border-primary/40 shadow-sm'
                }`}
              >
                {/* Checkbox and Title details */}
                <div className="flex items-start gap-3 flex-1">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 shrink-0 rounded-full transition-transform active:scale-90"
                    title={task.isCompleted ? 'تحديد كغير مكتملة' : 'إكمال المهمة'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-outline hover:text-primary transition" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          task.isCompleted
                            ? 'line-through text-text-secondary'
                            : 'text-text-main'
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Subject Tag */}
                      <span className="rounded-md bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                        {task.subject}
                      </span>

                      {/* Priority Tag */}
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          task.priority === 'عالية'
                            ? 'bg-error/15 text-error'
                            : task.priority === 'متوسطة'
                            ? 'bg-warning/15 text-warning'
                            : 'bg-surface-variant text-text-secondary'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {/* Urgent Alert Badge */}
                      {urgent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          موعد التسليم وشيك (أقل من 3 ساعات)
                        </span>
                      )}

                      {/* Overdue Badge */}
                      {overdue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-error/20 px-2 py-0.5 text-[10px] font-bold text-error">
                          فات موعد التسليم
                        </span>
                      )}
                    </div>

                    {/* Metadata line: Due Date, Time, Attachment */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{task.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.dueTime}</span>
                      </div>

                      {task.attachmentName && (
                        <button
                          onClick={() => {
                            if (task.attachmentData) {
                              setPreviewAttachment(task.attachmentData);
                            }
                          }}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">
                            {task.attachmentName}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 self-end md:self-center">
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-variant hover:text-text-main transition"
                    title="تعديل المهمة"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة؟')) {
                        onDeleteTask(task.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-text-secondary hover:bg-error/10 hover:text-error transition"
                    title="حذف المهمة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] max-w-2xl overflow-auto rounded-2xl border border-outline bg-surface p-4 text-text-main shadow-2xl">
            <button
              onClick={() => setPreviewAttachment(null)}
              className="absolute left-3 top-3 rounded-full bg-surface-variant p-1.5 text-text-main hover:bg-surface transition"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pt-8">
              {previewAttachment.startsWith('data:image') ? (
                <img
                  src={previewAttachment}
                  alt="مرفق المهمة"
                  className="max-h-[70vh] rounded-xl object-contain mx-auto"
                />
              ) : (
                <div className="p-8 text-center text-text-main">
                  <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                  <p className="text-sm">تم إرفاق ملف مستند بالمهمة</p>
                  <a
                    href={previewAttachment}
                    download="attachment"
                    className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow hover:bg-primary-dark"
                  >
                    تنزيل الملف
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-night/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline pb-3">
              <h3 className="text-base font-bold text-text-main">
                {editingTask ? 'تعديل المهمة الدراسية' : 'إضافة واجب / مهمة جديدة'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              {/* Task Title */}
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  عنوان المهمة أو الواجب <strong className="text-error">*</strong>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حل تدريبات المعاصر في التفاضل صفحة 45"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3.5 py-2.5 text-xs text-text-main placeholder-text-secondary focus:border-primary focus:outline-none"
                />
              </div>

              {/* Subject & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">
                    المادة الدراسية
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                  >
                    {ALL_SUBJECTS.map((s) => (
                      <option key={s} value={s} className="bg-surface text-text-main">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">الأولوية</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                  >
                    <option value="عالية" className="bg-surface text-text-main">عالية (ضروري وعاجل)</option>
                    <option value="متوسطة" className="bg-surface text-text-main">متوسطة</option>
                    <option value="منخفضة" className="bg-surface text-text-main">منخفضة</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-text-secondary">
                    وقت الاستحقاق
                  </label>
                  <input
                    type="time"
                    required
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Reminder minutes */}
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  تذكيري قبل موعد التسليم بـ:
                </label>
                <select
                  value={reminderMinutes}
                  onChange={(e) => setReminderMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-outline bg-surface-variant px-3 py-2 text-xs text-text-main focus:border-primary focus:outline-none"
                >
                  <option value={15} className="bg-surface text-text-main">15 دقيقة</option>
                  <option value={30} className="bg-surface text-text-main">30 دقيقة</option>
                  <option value={60} className="bg-surface text-text-main">ساعة واحدة</option>
                  <option value={1440} className="bg-surface text-text-main">يوم كامل (24 ساعة)</option>
                </select>
              </div>

              {/* File / Image Attachment */}
              <div>
                <label className="mb-1 block font-semibold text-text-secondary">
                  إرفاق صورة أو ورقة الواجب (Base64 محفوظ محلياً)
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-outline bg-surface-variant/50 p-3 hover:border-primary/50 transition">
                    <ImageIcon className="h-4 w-4 text-text-secondary" />
                    <span className="text-text-secondary truncate max-w-[200px]">
                      {attachmentName || 'انقر لاختيار صورة أو ملف (حد أقصى 5MB)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {attachmentName && (
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentName(undefined);
                        setAttachmentData(undefined);
                      }}
                      className="rounded-lg p-2 text-error hover:bg-surface-variant transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-text-secondary hover:text-text-main transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary-dark transition"
                >
                  {editingTask ? 'حفظ التعديلات' : 'إضافة المهمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
