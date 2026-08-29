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
      <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
            Quick Actions
          </h3>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
            >
              View all
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* 1. New Note */}
          <button
            type="button"
            onClick={onNewNote}
            className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200/70 transition">
              <FileText className="w-4 h-4" />
            </div>
            <span className="mt-1.5 text-xs font-medium text-neutral-700 group-hover:text-neutral-900 truncate max-w-full">
              New Note
            </span>
          </button>

          {/* 2. New Project */}
          <button
            type="button"
            onClick={onNewProject}
            className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200/70 transition">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="mt-1.5 text-xs font-medium text-neutral-700 group-hover:text-neutral-900 truncate max-w-full">
              New Project
            </span>
          </button>

          {/* 3. New Tag */}
          <button
            type="button"
            onClick={() => setIsTagModalOpen(true)}
            className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200/70 transition">
              <Tag className="w-4 h-4" />
            </div>
            <span className="mt-1.5 text-xs font-medium text-neutral-700 group-hover:text-neutral-900 truncate max-w-full">
              New Tag
            </span>
          </button>

          {/* 4. Import */}
          <button
            type="button"
            onClick={onImport}
            className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-neutral-50 transition cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 flex items-center justify-center group-hover:bg-neutral-200/70 transition">
              <Download className="w-4 h-4" />
            </div>
            <span className="mt-1.5 text-xs font-medium text-neutral-700 group-hover:text-neutral-900 truncate max-w-full">
              Import
            </span>
          </button>
        </div>
      </div>

      {/* Quick Tag Creation Modal */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Create Tag</h3>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTagSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tag Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-xs">
                    #
                  </span>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="ideas, study, project..."
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-900 bg-neutral-50/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTagModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition shadow-2xs"
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
