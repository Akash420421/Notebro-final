import React, { useState } from 'react';
import { FileText, FolderPlus, Tag, Download, X, Plus } from 'lucide-react';

interface QuickActionsProps {
  onNewNote: () => void;
  onNewProject: () => void;
  onNewTag?: (tagName: string) => void;
  onImport: () => void;
  onViewAll?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNewNote,
  onNewProject,
  onNewTag,
  onImport,
  onViewAll,
}) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreateTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagName.trim().replace(/^#/, '');
    if (trimmed && onNewTag) {
      onNewTag(trimmed);
      setNewTagName('');
      setIsTagModalOpen(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
            Quick Actions
          </h3>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition cursor-pointer"
            >
              View all
            </button>
          )}
        </div>

        {/* 4-Item Action Grid matching exact structure in Light Mode */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* 1. New Note */}
          <button
            type="button"
            onClick={onNewNote}
            className="group flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 transition duration-150 cursor-pointer active:scale-95 text-center"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/90 flex items-center justify-center shadow-2xs group-hover:bg-purple-100/80 group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-full">
              New Note
            </span>
          </button>

          {/* 2. New Project */}
          <button
            type="button"
            onClick={onNewProject}
            className="group flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 transition duration-150 cursor-pointer active:scale-95 text-center"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/90 flex items-center justify-center shadow-2xs group-hover:bg-blue-100/80 group-hover:scale-105 transition">
              <FolderPlus className="w-5 h-5" />
            </div>
            <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-full">
              New Project
            </span>
          </button>

          {/* 3. New Tag */}
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="group flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 transition duration-150 cursor-pointer active:scale-95 text-center"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/90 flex items-center justify-center shadow-2xs group-hover:bg-emerald-100/80 group-hover:scale-105 transition">
              <Tag className="w-5 h-5" />
            </div>
            <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-full">
              New Tag
            </span>
          </button>

          {/* 4. Import */}
          <button
            type="button"
            onClick={onImport}
            className="group flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl hover:bg-slate-50 transition duration-150 cursor-pointer active:scale-95 text-center"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/90 flex items-center justify-center shadow-2xs group-hover:bg-amber-100/80 group-hover:scale-105 transition">
              <Download className="w-5 h-5" />
            </div>
            <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 group-hover:text-slate-900 truncate max-w-full">
              Import
            </span>
          </button>
        </div>
      </div>

      {/* Quick Tag Creation Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Create New Tag</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTagSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="ideas, study, project..."
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Tag</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
