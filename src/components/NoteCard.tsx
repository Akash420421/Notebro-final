import React, { useState, useRef } from 'react';
import { NoteItem, ChecklistItem } from '../types';
import {
  Pin,
  CheckSquare,
  FileText,
  Trash2,
  Check,
  Circle,
  CheckCircle2,
  Archive,
  ArchiveRestore,
  Youtube,
  Globe,
  Star,
  GraduationCap,
  Key,
  MessageSquareCode,
  FileCode,
  Terminal,
  Video,
  Clock,
  Home,
  Briefcase,
  Lightbulb,
  BookOpen,
} from 'lucide-react';

interface NoteCardProps {
  note: NoteItem;
  folderName?: string;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  onSelect: (note: NoteItem) => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleArchive?: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleChecklistItem?: (noteId: string, itemId: string, e: React.MouseEvent) => void;
  onTagClick?: (tagName: string, e: React.MouseEvent) => void;
  onLongPress?: (note: NoteItem) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folderName,
  isMultiSelectMode,
  isSelected,
  onSelect,
  onToggleSelect,
  onDelete,
  onToggleArchive,
  onTogglePin,
  onToggleChecklistItem,
  onTagClick,
  onLongPress,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format date
  const formatNoteDate = (timestamp: number) => {
    if (!timestamp) return 'Today';
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);

    if (diff < 86400000 && date.getDate() === new Date().getDate()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (date.getFullYear() === new Date().getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
  };

  // Category Icon & Accent helper
  const getCategoryTheme = () => {
    const fn = (folderName || '').toLowerCase();
    if (fn.includes('personal') || fn.includes('home')) {
      return { icon: <Home className="w-3 h-3 text-neutral-600" /> };
    }
    if (fn.includes('work') || fn.includes('job') || fn.includes('corp')) {
      return { icon: <Briefcase className="w-3 h-3 text-neutral-600" /> };
    }
    if (fn.includes('idea') || fn.includes('project')) {
      return { icon: <Lightbulb className="w-3 h-3 text-neutral-600" /> };
    }
    if (fn.includes('study') || fn.includes('exam') || fn.includes('school')) {
      return { icon: <BookOpen className="w-3 h-3 text-neutral-600" /> };
    }
    return { icon: <FileText className="w-3 h-3 text-neutral-500" /> };
  };

  // Derive title if empty
  const displayTitle = () => {
    if (note.title && note.title.trim()) return note.title;
    if (note.type === 'text' && note.body) {
      const firstLine = note.body.split('\n')[0].replace(/^[#*-> ]+/, '').trim();
      if (firstLine) return firstLine;
    }
    if (note.type === 'checklist' && note.checklistItems.length > 0) {
      return note.checklistItems[0].text || 'Untitled checklist';
    }
    return 'Untitled note';
  };

  // Touch & swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isMultiSelectMode) return;
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(false);

    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch (e) {}
        }
        onLongPress(note);
      }
    }, 450);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || isMultiSelectMode) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX;

    if (Math.abs(diffX) > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (diffX > -100 && diffX < 100) {
      setSwipeOffset(diffX);
      setIsSwiping(true);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (swipeOffset > 60) {
      onTogglePin(note.id);
    } else if (swipeOffset < -60 && onToggleArchive) {
      onToggleArchive(note.id);
    }

    setSwipeOffset(0);
    setIsSwiping(false);
    setTouchStartX(null);
  };

  const handleMouseDown = () => {
    if (isMultiSelectMode) return;
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(note);
      }
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMultiSelectMode) {
      e.stopPropagation();
      onToggleSelect(note.id);
    } else {
      onSelect(note);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress(note);
    }
  };

  // Preview renderer
  const renderPreview = () => {
    const hasImages = note.images && note.images.length > 0;
    const hasSketches = note.sketches && note.sketches.length > 0;

    let mediaPreview = null;
    if (hasImages || hasSketches) {
      const firstImage = hasImages ? note.images[0] : note.sketches[0];
      const isSketch = !hasImages && hasSketches;
      mediaPreview = (
        <div className="w-full h-28 sm:h-32 rounded-lg overflow-hidden my-2 bg-neutral-100 border border-neutral-200">
          <img
            src={firstImage}
            alt="Note Attachment Preview"
            className={`w-full h-full ${isSketch ? 'object-contain p-2 bg-white' : 'object-cover'}`}
          />
        </div>
      );
    }

    // Checklist preview
    if (note.type === 'checklist' && note.checklistItems) {
      const itemsToShow = note.checklistItems.slice(0, 4);
      return (
        <div>
          {mediaPreview}
          <div className="space-y-1 my-2">
            {itemsToShow.map((item) => (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleChecklistItem) {
                    onToggleChecklistItem(note.id, item.id, e);
                  }
                }}
                className="flex items-center gap-1.5 text-xs group/item cursor-pointer select-none"
              >
                {item.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover/item:text-neutral-700" />
                )}
                <span
                  className={`line-clamp-1 leading-snug ${
                    item.completed
                      ? 'line-through text-neutral-400'
                      : 'text-neutral-700 font-normal'
                  }`}
                >
                  {item.text || 'Empty task'}
                </span>
              </div>
            ))}
            {note.checklistItems.length > 4 && (
              <span className="text-[10px] font-medium text-neutral-400 block pt-0.5">
                +{note.checklistItems.length - 4} more items
              </span>
            )}
          </div>
        </div>
      );
    }

    // Clean preview string
    let cleanExcerpt = '';
    if (note.body) {
      cleanExcerpt = note.body
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<div[^>]*class="[^"]*rich-todo-item[^"]*completed[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*todo-text[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, '☑ $1\n')
        .replace(/<div[^>]*class="[^"]*rich-todo-item[^"]*"[^>]*>[\s\S]*?<span[^>]*class="[^"]*todo-text[^"]*"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/div>/gi, '☐ $1\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/###/g, '')
        .replace(/[*_#>`]/g, '')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    }

    return (
      <div>
        {mediaPreview}
        {cleanExcerpt && (
          <p className="text-xs text-neutral-600 my-1.5 line-clamp-3 leading-relaxed whitespace-pre-line break-words font-normal">
            {cleanExcerpt}
          </p>
        )}
      </div>
    );
  };

  const theme = getCategoryTheme();

  return (
    <div
      onContextMenu={handleContextMenu}
      className="relative group w-full mb-3 select-none touch-manipulation"
    >
      {/* Background swipe action reveal badges */}
      <div
        className={`absolute inset-0 rounded-xl flex items-center justify-between px-4 transition-opacity ${
          swipeOffset !== 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            swipeOffset > 0 ? 'text-neutral-900' : 'opacity-0'
          }`}
        >
          <Pin className="w-3.5 h-3.5 fill-neutral-900" />
          <span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            note.isArchived ? 'text-neutral-900' : 'text-neutral-700'
          } ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          <span>{note.isArchived ? 'Restore' : 'Archive'}</span>
          {note.isArchived ? (
            <ArchiveRestore className="w-3.5 h-3.5" />
          ) : (
            <Archive className="w-3.5 h-3.5" />
          )}
        </div>
      </div>

      {/* Main Card */}
      <div
        id={`note-card-${note.id}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        className={`relative w-full rounded-xl p-3.5 transition-all duration-150 cursor-pointer border flex flex-col justify-between select-none touch-manipulation ${
          isSelected
            ? 'bg-neutral-50 border-neutral-900 ring-1 ring-neutral-900 shadow-xs'
            : note.isPinned
            ? 'bg-white border-neutral-300 shadow-2xs hover:border-neutral-400'
            : 'bg-white border-neutral-200 shadow-2xs hover:border-neutral-300'
        }`}
      >
        {/* Multi-select checkmark circle */}
        {isMultiSelectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(note.id);
            }}
            className={`absolute top-3 right-3 w-4 h-4 rounded-full flex items-center justify-center border transition-all z-10 ${
              isSelected
                ? 'bg-neutral-900 border-neutral-900 text-white'
                : 'bg-white border-neutral-300 text-transparent'
            }`}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        )}

        {/* Top bar: Mode / Category Pill with Icon + Pin indicator */}
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {note.mode === 'student' ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                <GraduationCap className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="truncate max-w-[120px]">{note.studentSubject || folderName || 'Student'}</span>
              </div>
            ) : note.mode === 'developer' ? (
              <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                <Terminal className="w-3 h-3 text-purple-600 shrink-0" />
                <span className="truncate max-w-[120px]">{folderName || 'Dev'}</span>
              </div>
            ) : folderName ? (
              <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700">
                {theme.icon}
                <span className="truncate max-w-[120px]">{folderName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                {note.type === 'checklist' ? (
                  <CheckSquare className="w-3 h-3 text-neutral-600" />
                ) : (
                  <FileText className="w-3 h-3 text-neutral-500" />
                )}
                <span>General</span>
              </div>
            )}

            {note.isArchived && (
              <span className="text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                Archived
              </span>
            )}
          </div>

          {note.isPinned && !isMultiSelectMode && (
            <div className="text-neutral-800 p-0.5">
              <Pin className="w-3 h-3 fill-neutral-800" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm text-neutral-900 leading-snug line-clamp-2 break-words">
          {displayTitle()}
        </h3>

        {/* Body / Checklist preview */}
        {renderPreview()}

        {/* Tags and mode media pills row */}
        {((note.tags && note.tags.length > 0) ||
          (note.youtubeLinks && note.youtubeLinks.length > 0) ||
          (note.importantQuestions && note.importantQuestions.length > 0) ||
          (note.webLinks && note.webLinks.length > 0) ||
          (note.apiKeys && note.apiKeys.length > 0) ||
          (note.promptBoxes && note.promptBoxes.length > 0) ||
          (note.specFiles && note.specFiles.length > 0) ||
          (note.devWebsites && note.devWebsites.length > 0) ||
          (note.devVideos && note.devVideos.length > 0) ||
          note.mode === 'student' ||
          note.mode === 'developer') && (
          <div className="flex flex-wrap items-center gap-1 mt-1 mb-2">
            {/* API Keys count */}
            {note.apiKeys && note.apiKeys.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <Key className="w-2.5 h-2.5" />
                {note.apiKeys.length} {note.apiKeys.length > 1 ? 'Keys' : 'Key'}
              </span>
            )}

            {/* Prompt Boxes count */}
            {note.promptBoxes && note.promptBoxes.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <MessageSquareCode className="w-2.5 h-2.5" />
                {note.promptBoxes.length} {note.promptBoxes.length > 1 ? 'Prompts' : 'Prompt'}
              </span>
            )}

            {/* Spec Files count */}
            {note.specFiles && note.specFiles.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <FileCode className="w-2.5 h-2.5" />
                {note.specFiles.length} {note.specFiles.length > 1 ? 'Specs' : 'Spec'}
              </span>
            )}

            {/* Dev Websites count */}
            {note.devWebsites && note.devWebsites.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <Globe className="w-2.5 h-2.5" />
                {note.devWebsites.length}
              </span>
            )}

            {/* YouTube / Video Links count */}
            {((note.youtubeLinks && note.youtubeLinks.length > 0) ||
              (note.devVideos && note.devVideos.length > 0)) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <Video className="w-2.5 h-2.5" />
                {(note.youtubeLinks?.length || 0) + (note.devVideos?.length || 0)}
              </span>
            )}

            {/* Formulas count */}
            {note.quickFormulas && note.quickFormulas.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <BookOpen className="w-2.5 h-2.5" />
                {note.quickFormulas.length} {note.quickFormulas.length > 1 ? 'Formulas' : 'Formula'}
              </span>
            )}

            {/* Important Questions count */}
            {note.importantQuestions && note.importantQuestions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <Star className="w-2.5 h-2.5" />
                {note.importantQuestions.length} Q&amp;A
              </span>
            )}

            {/* Web Resources count */}
            {note.webLinks && note.webLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                <Globe className="w-2.5 h-2.5" />
                {note.webLinks.length}
              </span>
            )}

            {/* Standard Tags */}
            {note.tags &&
              note.tags.map((tag) => (
                <span
                  key={tag.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag.name, e);
                  }}
                  className="text-[10px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded transition cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))}
          </div>
        )}

        {/* Footer: timestamp + quick hover actions */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400 font-normal">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>{formatNoteDate(note.updatedAt || note.createdAt)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(note.id);
                }}
                className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                title={note.isArchived ? 'Restore from archive' : 'Archive note'}
              >
                {note.isArchived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              className="p-1 rounded text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
              title={note.isPinned ? 'Unpin' : 'Pin to top'}
            >
              <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-neutral-800 text-neutral-800' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
              title="Delete note"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
