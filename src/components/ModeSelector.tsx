import React from 'react';
import { AppMode } from '../types';
import { BookOpen, Code, FileText } from 'lucide-react';

interface ModeSelectorProps {
  selectedMode: AppMode | 'all';
  onSelectMode: (mode: AppMode | 'all') => void;
}

interface ModeItem {
  id: AppMode;
  label: string;
  icon: React.ReactNode;
}

export const MODES: ModeItem[] = [
  {
    id: 'normal',
    label: 'Normal',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'student',
    label: 'Student',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: <Code className="w-4 h-4" />,
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/80">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`mode-btn-${mode.id}`}
              onClick={() => onSelectMode(mode.id)}
              className={`py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 text-center transition-all duration-150 cursor-pointer select-none text-xs font-medium ${
                isSelected
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
              title={`Switch to ${mode.label} mode`}
            >
              <span className={isSelected ? 'text-neutral-900' : 'text-neutral-500'}>
                {mode.icon}
              </span>
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
