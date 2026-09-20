import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Flame,
  FileText,
  Video,
  Trophy,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';

interface BottomNavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingTasksCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount,
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const primaryTabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'tasks', label: 'المهام', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'prayers', label: 'الصلوات', icon: Clock },
    { id: 'pomodoro', label: 'المؤقت', icon: Flame },
    { id: 'more', label: 'المزيد', icon: MoreHorizontal },
  ];

  const secondaryTabs = [
    { id: 'summaries', label: 'التلخيص الذكي', icon: FileText, desc: 'Gemini AI مذكرات' },
    { id: 'videos', label: 'شروحات المدرسين', icon: Video, desc: 'مكتبة YouTube' },
    { id: 'stats', label: 'الإحصائيات والشارات', icon: Trophy, desc: 'أوسمة التفوق' },
    { id: 'settings', label: 'الإعدادات والملف', icon: Settings, desc: 'النسخ والمظهر' },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'more') {
      setIsMoreMenuOpen(true);
    } else {
      onSelectTab(tabId);
      setIsMoreMenuOpen(false);
    }
  };

  const isSecondaryActive = secondaryTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav
        id="bottom-mobile-nav"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-outline bg-surface/95 px-2 py-1.5 backdrop-blur-lg md:hidden transition-colors"
      >
        <div className="flex items-center justify-around">
          {primaryTabs.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === 'more' ? isSecondaryActive : currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-1 flex-col items-center py-1 transition-colors ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-text-secondary hover:text-text-main'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-slate-950 shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
                <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="mt-0.5 h-1 w-4 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop / Tablet Navigation Bar */}
      <div className="hidden md:flex items-center justify-center border-b border-outline/70 bg-surface/70 transition-colors">
        <div className="flex items-center gap-1 overflow-x-auto py-2 px-4">
          {[
            { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
            { id: 'tasks', label: 'المهام', icon: CheckSquare, badge: pendingTasksCount },
            { id: 'prayers', label: 'الصلوات', icon: Clock },
            { id: 'pomodoro', label: 'مؤقت المذاكرة', icon: Flame },
            { id: 'summaries', label: 'التلخيص الذكي', icon: FileText },
            { id: 'videos', label: 'الشروحات', icon: Video },
            { id: 'stats', label: 'الإحصائيات والشارات', icon: Trophy },
            { id: 'settings', label: 'الإعدادات', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-sm shadow-primary/25'
                    : 'text-text-secondary hover:bg-surface-variant hover:text-text-main'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-accent px-1.5 py-0.2 text-[10px] text-slate-950 font-bold shadow-sm">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile "More" Drawer Modal */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary-night/70 p-0 md:hidden backdrop-blur-sm animate-fade-in">
          <div className="w-full rounded-t-3xl border-t border-outline bg-surface p-6 text-text-main shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline">
              <h3 className="text-sm font-bold text-text-main">أقسام المنصة الإضافية</h3>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="rounded-full p-1 text-text-secondary hover:text-text-main transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`flex flex-col items-start rounded-2xl border p-3.5 text-right transition ${
                      isActive
                        ? 'border-primary bg-primary-container/40 text-primary dark:text-primary-light'
                        : 'border-outline bg-surface-variant text-text-main hover:border-primary/40'
                    }`}
                  >
                    <Icon className="h-5 w-5 mb-2 text-primary" />
                    <span className="text-xs font-bold">{tab.label}</span>
                    <span className="text-[10px] text-text-secondary mt-0.5">{tab.desc}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsMoreMenuOpen(false)}
              className="w-full rounded-xl border border-outline bg-surface-variant py-2.5 text-xs font-semibold text-text-secondary hover:text-text-main transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
};
