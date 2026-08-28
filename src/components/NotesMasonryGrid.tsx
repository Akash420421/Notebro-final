import React from 'react';
import { NoteItem, FolderItem } from '../types';
import { NoteCard } from './NoteCard';
import { Pin } from 'lucide-react';

interface NotesMasonryGridProps {
  notes: NoteItem[];
  folders: FolderItem[];
  isMultiSelectMode: boolean;
  selectedNoteIds: string[];
  onSelectNote: (note: NoteItem) => void;
  onToggleSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleArchiveNote?: (id: string) => void;
  onTogglePinNote: (id: string) => void;
  onToggleChecklistItem?: (noteId: string, itemId: string, e: React.MouseEvent) => void;
  onTagClick?: (tagName: string, e: React.MouseEvent) => void;
  onLongPressNote?: (note: NoteItem) => void;
}

export const NotesMasonryGrid: React.FC<NotesMasonryGridProps> = ({
  notes,
  folders,
  isMultiSelectMode,
  selectedNoteIds,
  onSelectNote,
  onToggleSelectNote,
  onDeleteNote,
  onToggleArchiveNote,
  onTogglePinNote,
  onToggleChecklistItem,
  onTagClick,
  onLongPressNote,
}) => {
  const folderMap = new Map<string, string>();
  folders.forEach((f) => folderMap.set(f.id, f.name));

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  const renderColumns = (items: NoteItem[]) => {
    return (
      <div className="columns-2 sm:columns-2 md:columns-3 lg:columns-4 gap-2.5 sm:gap-3 [column-fill:_balance]">
        {items.map((note) => (
          <div key={note.id} className="break-inside-avoid mb-2.5 sm:mb-3">
            <NoteCard
              note={note}
              folderName={note.folderId ? folderMap.get(note.folderId) : undefined}
              isMultiSelectMode={isMultiSelectMode}
              isSelected={selectedNoteIds.includes(note.id)}
              onSelect={onSelectNote}
              onToggleSelect={onToggleSelectNote}
              onDelete={onDeleteNote}
              onToggleArchive={onToggleArchiveNote}
              onTogglePin={onTogglePinNote}
              onToggleChecklistItem={onToggleChecklistItem}
              onTagClick={onTagClick}
              onLongPress={onLongPressNote}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Pinned Notes section if any */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-0.5">
            <Pin className="w-3 h-3 fill-neutral-400" />
            <span>Pinned ({pinnedNotes.length})</span>
          </div>
          {renderColumns(pinnedNotes)}
        </div>
      )}

      {/* Other Notes Section */}
      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-0.5 pt-1">
              <span>Others</span>
            </div>
          )}
          {renderColumns(otherNotes)}
        </div>
      )}
    </div>
  );
};
