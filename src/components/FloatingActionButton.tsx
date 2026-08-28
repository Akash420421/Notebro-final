import React, { useState, useEffect, useRef } from 'react';
import { Plus, CheckSquare, FileText, PenTool } from 'lucide-react';

interface FloatingActionButtonProps {
  onCreateNote: (type: 'text' | 'checklist' | 'sketch') => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCreateNote,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (type: 'text' | 'checklist' | 'sketch') => {
    setIsOpen(false);
    onCreateNote(type);
  };

  return (
    <>
      {/* Subtle backdrop overlay when open to prevent clicking underneath & allow quick dismiss */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/15 backdrop-blur-[1px] z-25 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Positioned safely above the bottom navigation bar (bottom-20 is above sticky footer) */}
      <div
        ref={containerRef}
        className="absolute bottom-20 right-4 z-30 flex flex-col items-end gap-2.5 select-none"
      >
        {/* Expanded Options on Click with Smooth Slide/Fade Animation */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-200 ease-out">
            {/* Sketch / Doodle Option */}
            <button
              id="fab-create-sketch-btn"
              onClick={() => handleSelect('sketch')}
              className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 pl-4 pr-3 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-700 hover:bg-[#F3EEF9] dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Hand Sketch / Doodle
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Draw with pen & colors</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#F3EEF9] dark:bg-purple-950/60 text-[#8B5CF6] dark:text-purple-300 border border-[#E6D7FA] dark:border-purple-800 flex items-center justify-center shadow-xs">
                <PenTool className="w-4 h-4 stroke-[2.2]" />
              </div>
            </button>

            {/* Checklist Note Option */}
            <button
              id="fab-create-checklist-btn"
              onClick={() => handleSelect('checklist')}
              className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 pl-4 pr-3 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-700 hover:bg-[#FAF0E6] dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  New Checklist
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">To-do list & tasks</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] dark:bg-amber-950/60 text-[#F59E0B] dark:text-amber-300 border border-[#F9DFC5] dark:border-amber-800 flex items-center justify-center shadow-xs">
                <CheckSquare className="w-4 h-4 stroke-[2.2]" />
              </div>
            </button>

            {/* Plain Text Note Option */}
            <button
              id="fab-create-text-note-btn"
              onClick={() => handleSelect('text')}
              className="flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-slate-100 pl-4 pr-3 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-slate-200/80 dark:border-slate-700 hover:bg-[#EAF1FB] dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#5B86E5] dark:group-hover:text-blue-400">
                  New Note
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Plain text & formatting</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-[#EAF1FB] dark:bg-blue-950/60 text-[#5B86E5] dark:text-blue-300 border border-[#D4E4FA] dark:border-blue-800 flex items-center justify-center shadow-xs">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
            </button>
          </div>
        )}

        {/* Main Soft Royal Blue Action Button with 45° Rotation Animation */}
        <button
          id="fab-main-create-btn"
          onClick={toggleMenu}
          aria-expanded={isOpen}
          aria-label="Create note or checklist"
          className={`w-13 h-13 rounded-2xl shadow-[0_8px_24px_rgba(91,134,229,0.35)] flex items-center justify-center transition-all duration-300 ease-out cursor-pointer active:scale-90 ${
            isOpen
              ? 'bg-[#5B86E5] text-white rotate-45 ring-4 ring-[#EAF1FB] shadow-2xl scale-105'
              : 'bg-[#5B86E5] hover:bg-[#4D78DE] text-white hover:scale-105'
          }`}
          title={isOpen ? 'Close' : 'Create new note'}
        >
          <div
            className={`transition-transform duration-300 ease-out flex items-center justify-center ${
              isOpen ? 'rotate-90' : 'rotate-0'
            }`}
          >
            <Plus className="w-6 h-6 stroke-[2.7]" />
          </div>
        </button>
      </div>
    </>
  );
};

