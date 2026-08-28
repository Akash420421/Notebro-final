import React from 'react';
import { Home, LayoutGrid, User } from 'lucide-react';

export type ActiveTab = 'home' | 'projects' | 'profile';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  notesCount?: number;
  projectsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  notesCount = 0,
  projectsCount = 0,
}) => {
  const totalWorkspaceItems = notesCount + projectsCount;

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'projects',
      label: 'Workspace',
      icon: LayoutGrid,
      badge: totalWorkspaceItems > 0 ? totalWorkspaceItems : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-2 sm:px-6 flex items-center justify-around select-none">
      <nav
        id="bottom-app-navigation"
        aria-label="Main Application Navigation"
        className="w-full max-w-md mx-auto flex items-center justify-between gap-1 sm:gap-4"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 4px)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group flex-1 flex flex-col items-center justify-center py-2 px-2.5 sm:px-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 relative ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
              title={tab.label}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />

                {/* Workspace / Items Badge */}
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full leading-tight min-w-[17px] text-center border shadow-xs transition-colors ${
                      isActive
                        ? 'bg-white text-slate-900 border-slate-900'
                        : 'bg-slate-900 text-white border-white'
                    }`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-1 tracking-tight leading-none transition-all ${
                  isActive
                    ? 'font-bold text-white'
                    : 'font-medium text-slate-600 group-hover:text-slate-900'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
