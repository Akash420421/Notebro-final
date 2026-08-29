import React from 'react';
import { FileText, Plus, CheckSquare } from 'lucide-react';

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
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center animate-in fade-in duration-150">
      <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-600 flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 stroke-[1.8]" />
      </div>

      <h3 className="text-sm font-semibold text-neutral-900 mb-1">
        {hasFilter ? 'No matching notes found' : 'No notes yet'}
      </h3>
      <p className="text-xs text-neutral-500 max-w-xs leading-relaxed mb-4">
        {hasFilter
          ? 'Try adjusting your search terms, folder selection, or tag filters.'
          : 'Capture your thoughts, ideas, tasks, or resources in one place.'}
      </p>

      {hasFilter ? (
        <button
          onClick={onClearFilter}
          className="px-3.5 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-lg border border-neutral-200 transition cursor-pointer"
        >
          Clear filters
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            id="empty-create-text-note"
            onClick={() => onCreateNote('text')}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
          <button
            id="empty-create-checklist"
            onClick={() => onCreateNote('checklist')}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg border border-neutral-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-neutral-500" />
            <span>Checklist</span>
          </button>
        </div>
      )}
    </div>
  );
};
