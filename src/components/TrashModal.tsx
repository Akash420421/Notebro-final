import React, { useState } from 'react';
import { NoteItem } from '../types';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Clock,
  Folder,
  FileText,
  CheckSquare,
} from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashedNotes: NoteItem[];
  folderMap?: Map<string, string>;
  onRestoreNote: (note: NoteItem) => void;
  onPermanentDeleteNote: (noteId: string) => void;
  onEmptyTrash: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashedNotes,
  folderMap = new Map(),
  onRestoreNote,
  onPermanentDeleteNote,
  onEmptyTrash,
}) => {
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculateDaysRemaining = (deletedAt?: number) => {
    if (!deletedAt) return 30;
    const elapsedMs = Date.now() - deletedAt;
    const remainingMs = 30 * 24 * 60 * 60 * 1000 - elapsedMs;
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(30, days));
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Recently';
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl text-slate-900 overflow-hidden flex flex-col max-h-[85vh] my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Trash
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {trashedNotes.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Notes are safely retained for 30 days before auto-cleanup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashedNotes.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmEmptyOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer border border-rose-200"
              >
                Empty Trash
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {trashedNotes.length === 0 ? (
            <div className="py-14 text-center space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Trash is empty</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Notes you delete will appear here and remain recoverable for 30 days.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trashedNotes.map((note) => {
                const daysLeft = calculateDaysRemaining(note.deletedAt);
                const folderName = note.folderId ? folderMap.get(note.folderId) : null;

                return (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {note.type === 'checklist' ? (
                          <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {note.title || 'Untitled Note'}
                        </h4>
                        {folderName && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            <Folder className="w-3 h-3 text-slate-400" />
                            {folderName}
                          </span>
                        )}
                      </div>

                      {/* Snippet */}
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {note.type === 'checklist'
                          ? `${note.checklistItems?.length || 0} checklist items`
                          : note.body
                          ? note.body.replace(/<[^>]*>/g, ' ').slice(0, 100)
                          : 'Empty note'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDate(note.deletedAt)}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                            daysLeft <= 5
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {daysLeft === 0 ? 'Purges today' : `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <button
                        type="button"
                        onClick={() => onRestoreNote(note)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(note.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer border border-slate-200"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Notes auto-purge after 30 days.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Permanent Delete */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Delete Permanently?</h4>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              This note will be permanently removed from your storage.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onPermanentDeleteNote(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Empty Trash */}
      {confirmEmptyOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setConfirmEmptyOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Empty Entire Trash?</h4>
                <p className="text-xs text-slate-500">Permanently delete {trashedNotes.length} items.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              All items currently in the trash will be erased immediately.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEmptyOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onEmptyTrash();
                  setConfirmEmptyOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer"
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
