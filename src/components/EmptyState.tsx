import React from 'react';
import { FileText, Plus, CheckSquare, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  hasFilter: boolean;
  onClearFilter?: () => void;
  onCreateNote: (type: 'text' | 'checklist') => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasFilter,
  onClearFilter,
  onCreateNote,
}) => {
  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Icon illustration container */}
      <div className="w-20 h-20 rounded-[28px] bg-white/90 border border-slate-200/80 flex items-center justify-center text-[#5B86E5] mb-4 shadow-[0_8px_24px_rgba(91,134,229,0.08)]">
        <FileText className="w-9 h-9 stroke-[1.7]" />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1">
        {hasFilter ? 'No matching notes found' : 'No notes yet'}
      </h3>
      <p className="text-xs text-slate-500 max-w-xs leading-relaxed mb-6">
        {hasFilter
          ? 'Try adjusting your search terms, folder selection, or tag filters.'
          : 'Capture your thoughts, daily plans, tasks, or meeting ideas with minimal friction.'}
      </p>

      {hasFilter ? (
        <button
          onClick={onClearFilter}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs transition cursor-pointer"
        >
          Clear filters
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            id="empty-create-text-note"
            onClick={() => onCreateNote('text')}
            className="px-4 py-2.5 bg-[#5B86E5] hover:bg-[#4D78DE] text-white text-xs font-bold rounded-2xl shadow-[0_4px_16px_rgba(91,134,229,0.25)] flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-[#D4E4FA]/40"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
          <button
            id="empty-create-checklist"
            onClick={() => onCreateNote('checklist')}
            className="px-3.5 py-2.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>Checklist</span>
          </button>
        </div>
      )}
    </div>
  );
};
