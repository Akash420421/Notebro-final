import React, { useState } from 'react';
import { ProjectItem, NoteItem, FolderItem } from '../../types';
import { formatTimeAgo } from '../../services/projectService';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  ExternalLink,
  Tag,
  Clock,
  FolderMinus,
  Sparkles,
} from 'lucide-react';

interface ProjectNotesTabProps {
  project: ProjectItem;
  notes: NoteItem[];
  folders?: FolderItem[];
  onOpenNote: (note: NoteItem) => void;
  onCreateNote: () => void;
  onTogglePinNote: (noteId: string) => void;
  onRemoveFromProject: (note: NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
}

export const ProjectNotesTab: React.FC<ProjectNotesTabProps> = ({
  project,
  notes,
  folders = [],
  onOpenNote,
  onCreateNote,
  onTogglePinNote,
  onRemoveFromProject,
  onDeleteNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title && n.title.toLowerCase().includes(q)) ||
      (n.body && n.body.toLowerCase().includes(q)) ||
      (n.tags && n.tags.some((t) => t.name.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Notes in Project */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes in this project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Create Note Button */}
        <button
          onClick={onCreateNote}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Note</span>
        </button>
      </div>

      {/* Notes Count Info */}
      <div className="text-xs text-slate-500 px-1 font-semibold flex items-center justify-between">
        <span>
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} in{' '}
          {project.name || project.title}
        </span>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="py-12 px-4 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {searchQuery ? 'No matching notes found' : 'No notes inside this project yet'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Keep all meeting notes, study summaries, research, and ideas neatly organized in this project container.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={onCreateNote}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Note</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredNotes.map((note) => {
            const plainBody = (note.body || '')
              .replace(/<[^>]*>?/gm, '')
              .replace(/[#*`_~]/g, '')
              .trim();

            return (
              <div
                key={note.id}
                onClick={() => onOpenNote(note)}
                className="group relative bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 flex flex-col justify-between shadow-xs hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all cursor-pointer"
              >
                <div>
                  {/* Top Bar: Pin & Unassign Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h4>

                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onTogglePinNote(note.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          note.isPinned
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveFromProject(note)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Remove from project (keep independent note)"
                      >
                        <FolderMinus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this note?')) {
                            onDeleteNote(note.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body preview */}
                  <p className="text-xs text-slate-500 line-clamp-3 mb-3 leading-relaxed">
                    {plainBody || 'Empty note content...'}
                  </p>
                </div>

                {/* Footer tags and time */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {note.tags && note.tags.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.2 rounded-md bg-slate-100 text-slate-600">
                        #{note.tags[0].name}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(note.updatedAt || note.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
