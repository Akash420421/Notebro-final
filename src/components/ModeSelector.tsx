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
  icon: (isSelected: boolean) => React.ReactNode;
}

export const MODES: ModeItem[] = [
  {
    id: 'normal',
    label: 'Normal',
    icon: (isSelected) => (
      <FileText className={`w-5 h-5 transition-transform ${isSelected ? 'text-white' : 'text-[#2563EB]'}`} />
    ),
  },
  {
    id: 'student',
    label: 'Student',
    icon: (isSelected) => (
      <BookOpen className={`w-5 h-5 transition-transform ${isSelected ? 'text-white' : 'text-[#2563EB]'}`} />
    ),
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: (isSelected) => (
      <Code className={`w-5 h-5 transition-transform ${isSelected ? 'text-white' : 'text-[#2563EB]'}`} />
    ),
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <div key={mode.id} className="flex flex-col items-center">
              <button
                id={`mode-btn-${mode.id}`}
                onClick={() => onSelectMode(mode.id)}
                className={`w-full py-3.5 px-2 rounded-[22px] flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#0B1527] text-white shadow-md'
                    : 'bg-white text-slate-900 border border-slate-200/90 shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:bg-slate-50'
                }`}
                title={`Switch to ${mode.label} mode`}
              >
                <div className="mb-0.5">
                  {mode.icon(isSelected)}
                </div>
                <span
                  className={`font-bold text-xs sm:text-sm leading-tight tracking-tight ${
                    isSelected ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {mode.label}
                </span>
              </button>

              {/* Exact blue indicator underline */}
              <div
                className={`h-1 w-8 rounded-full mt-1.5 transition-all ${
                  isSelected ? 'bg-[#2563EB]' : 'bg-transparent'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
