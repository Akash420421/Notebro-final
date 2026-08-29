import React, { useState } from 'react';
import { ProjectItem, NoteItem } from '../../types';
import { AlertTriangle, Trash2, X, FileText } from 'lucide-react';

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: ProjectItem | null;
  notes: NoteItem[];
  onClose: () => void;
  onConfirmDelete: (projectId: string, deleteAssociatedNotes: boolean) => void;
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  project,
  notes,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !project) return null;

  const [deleteNotes, setDeleteNotes] = useState(false);
  const projectNotes = notes.filter((n) => n.projectId === project.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Delete "{project.name || project.title}"?
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              This action cannot be undone. All project tasks, bookmarks, and activity history will be removed.
            </p>
          </div>

          {projectNotes.length > 0 && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{projectNotes.length} associated notes found</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                  <input
                    type="radio"
                    name="delete_notes_option"
                    checked={!deleteNotes}
                    onChange={() => setDeleteNotes(false)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong className="font-semibold block">Keep notes (Recommended)</strong>
                    <span className="text-slate-500 text-[11px] block">
                      Notes will stay in your workspace as standalone notes.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-red-700 pt-1">
                  <input
                    type="radio"
                    name="delete_notes_option"
                    checked={deleteNotes}
                    onChange={() => setDeleteNotes(true)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong className="font-semibold block">Delete associated notes too</strong>
                    <span className="text-red-500/80 text-[11px] block">
                      All {projectNotes.length} notes will be moved to trash.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(project.id, deleteNotes);
                onClose();
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
