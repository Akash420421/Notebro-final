import React, { useState, useRef } from 'react';
import { NoteItem, ChecklistItem } from '../types';
import {
  Pin,
  CheckSquare,
  FileText,
  Trash2,
  MoreHorizontal,
  Folder,
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

  // Format date nicely (Stock Android / iOS style)
  const formatNoteDate = (timestamp: number) => {
    if (!timestamp) return 'Today';
    const now = Date.now();
    const diff = now - timestamp;
    const date = new Date(timestamp);

    // If within today
    if (diff < 86400000 && date.getDate() === new Date().getDate()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // If yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // If this year
    if (date.getFullYear() === new Date().getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
  };

  // Category Icon & Accent helper
  const getCategoryTheme = () => {
    const fn = (folderName || '').toLowerCase();
    if (fn.includes('personal') || fn.includes('home')) {
      return { icon: <Home className="w-3.5 h-3.5 text-purple-600" />, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/70' };
    }
    if (fn.includes('work') || fn.includes('job') || fn.includes('corp')) {
      return { icon: <Briefcase className="w-3.5 h-3.5 text-blue-600" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/70' };
    }
    if (fn.includes('idea') || fn.includes('project')) {
      return { icon: <Lightbulb className="w-3.5 h-3.5 text-amber-600" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70' };
    }
    if (fn.includes('study') || fn.includes('exam') || fn.includes('school')) {
      return { icon: <BookOpen className="w-3.5 h-3.5 text-emerald-600" />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70' };
    }
    return { icon: <FileText className="w-3.5 h-3.5 text-slate-500" />, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200/80' };
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

    // Long-press timer (~450ms)
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

    // If movement is detected, cancel long-press
    if (Math.abs(diffX) > 10 && longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Limit swipe bounds (-100 to 100)
    if (Math.abs(diffX) > 15) {
      setIsSwiping(true);
      setSwipeOffset(Math.max(-90, Math.min(90, diffX)));
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (swipeOffset < -60) {
      // Swiped Left -> Archive / Unarchive (Safe storage preservation)
      if (onToggleArchive) {
        onToggleArchive(note.id);
      } else {
        onDelete(note.id);
      }
    } else if (swipeOffset > 60) {
      // Swiped Right -> Pin / Unpin
      onTogglePin(note.id);
    }

    setTouchStartX(null);
    setSwipeOffset(0);
    setTimeout(() => setIsSwiping(false), 50);
  };

  const handleMouseDown = () => {
    if (isMultiSelectMode) return;
    longPressTimerRef.current = setTimeout(() => {
      if (onLongPress) onLongPress(note);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMultiSelectMode && onLongPress) {
      onLongPress(note);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSwiping) return;
    if (isMultiSelectMode) {
      onToggleSelect(note.id);
    } else {
      onSelect(note);
    }
  };

  // Preview renderer
  const renderPreview = () => {
    const hasImages = note.images && note.images.length > 0;
    const hasSketches = note.sketches && note.sketches.length > 0;

    const mediaPreview = (hasImages || hasSketches) && (
      <div className="my-2 space-y-1.5">
        {hasImages && (
          <div className="rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 aspect-16/9 relative shadow-2xs">
            <img
              src={note.images![0]}
              alt="Photo attachment"
              className="w-full h-full object-cover"
            />
            {note.images!.length > 1 && (
              <span className="absolute bottom-1 right-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                +{note.images!.length - 1}
              </span>
            )}
          </div>
        )}
        {hasSketches && !hasImages && (
          <div className="rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200/80 aspect-16/9 relative p-1.5 flex items-center justify-center">
            <img
              src={note.sketches![0]}
              alt="Hand sketch"
              className="max-h-full max-w-full object-contain"
            />
            {note.sketches!.length > 1 && (
              <span className="absolute bottom-1 right-1.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                +{note.sketches!.length - 1} sketch
              </span>
            )}
          </div>
        )}
      </div>
    );

    if (note.type === 'checklist') {
      const itemsToShow = note.checklistItems.slice(0, 4);
      return (
        <div>
          {mediaPreview}
          <div className="space-y-1.5 my-2">
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
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 fill-emerald-100" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover/item:text-neutral-700" />
                )}
                <span
                  className={`line-clamp-1 leading-snug ${
                    item.completed
                      ? 'line-through text-neutral-400'
                      : 'text-neutral-700 font-medium'
                  }`}
                >
                  {item.text || 'Empty task'}
                </span>
              </div>
            ))}
            {note.checklistItems.length > 4 && (
              <span className="text-[10px] font-semibold text-neutral-400 block pt-0.5">
                +{note.checklistItems.length - 4} more items
              </span>
            )}
          </div>
        </div>
      );
    }

    // Text note markdown-lite preview
    if (!note.body && !hasImages && !hasSketches) {
      if (note.promptBoxes && note.promptBoxes.length > 0) {
        return (
          <div className="my-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs font-mono text-slate-700">
            <span className="text-[10px] font-bold text-indigo-600 block mb-0.5 font-sans">Prompt: {note.promptBoxes[0].title}</span>
            <p className="line-clamp-3 text-[11px] text-slate-600">{note.promptBoxes[0].prompt}</p>
          </div>
        );
      }
      if (note.importantQuestions && note.importantQuestions.length > 0) {
        return (
          <div className="my-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
            <span className="text-[10px] font-bold text-amber-700 block mb-0.5">Q: {note.importantQuestions[0].question}</span>
            <p className="line-clamp-2 text-[11px] text-amber-800/80">{note.importantQuestions[0].answer || 'No answer saved'}</p>
          </div>
        );
      }
      return (
        <p className="text-xs text-neutral-400 italic my-2">No additional text</p>
      );
    }

    // Clean preview string (strips HTML tags and markdown symbols, formats to-do items)
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
          <p className="text-xs text-neutral-600 my-1.5 line-clamp-4 leading-relaxed whitespace-pre-line break-words font-normal">
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
      className="relative group w-full mb-3.5 select-none touch-manipulation [-webkit-touch-callout:none]"
    >
      {/* Background swipe action reveal badges */}
      <div
        className={`absolute inset-0 rounded-3xl flex items-center justify-between px-4 transition-opacity ${
          swipeOffset !== 0 ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`flex items-center gap-1.5 text-xs font-bold ${
            swipeOffset > 0 ? 'text-slate-900' : 'opacity-0'
          }`}
        >
          <Pin className="w-4 h-4 fill-slate-900" />
          <span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-bold ${
            note.isArchived ? 'text-emerald-700' : 'text-amber-700'
          } ${swipeOffset < 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          <span>{note.isArchived ? 'Restore' : 'Archive'}</span>
          {note.isArchived ? (
            <ArchiveRestore className="w-4 h-4" />
          ) : (
            <Archive className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Main Card matching Image 1 */}
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
        className={`relative w-full rounded-2xl p-4 transition-all duration-150 cursor-pointer border flex flex-col justify-between select-none touch-manipulation [-webkit-touch-callout:none] ${
          isSelected
            ? 'bg-[#EAF1FB] border-[#5B86E5] ring-2 ring-[#5B86E5] shadow-md'
            : note.isPinned
            ? 'bg-white border-[#D4E4FA] shadow-[0_4px_16px_rgba(91,134,229,0.08)] hover:border-[#5B86E5] hover:shadow-[0_6px_20px_rgba(91,134,229,0.14)]'
            : 'bg-white border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
        } active:scale-[0.99]`}
      >
        {/* Multi-select checkmark circle */}
        {isMultiSelectMode && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(note.id);
            }}
            className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center border transition-all z-10 ${
              isSelected
                ? 'bg-[#5B86E5] border-[#5B86E5] text-white shadow-xs'
                : 'bg-white/90 border-slate-300 text-transparent'
            }`}
          >
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}

        {/* Top bar: Category Pill with Icon + Pin indicator */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {folderName ? (
              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${theme.bg} ${theme.text} ${theme.border} border`}>
                {theme.icon}
                <span className="truncate max-w-[100px]">{folderName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200/70">
                {note.type === 'checklist' ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#5B86E5]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>General</span>
              </div>
            )}

            {note.isArchived && (
              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                Archived
              </span>
            )}
          </div>

          {note.isPinned && !isMultiSelectMode && (
            <div className="text-[#5B86E5] p-0.5">
              <Pin className="w-3.5 h-3.5 fill-[#5B86E5]" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 break-words">
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
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-2.5">
            {/* Student Mode indicator */}
            {note.mode === 'student' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <GraduationCap className="w-2.5 h-2.5" />
                Student
              </span>
            )}

            {/* Developer Mode indicator */}
            {note.mode === 'developer' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                <Terminal className="w-2.5 h-2.5 text-indigo-600" />
                Developer
              </span>
            )}

            {/* API Keys badge */}
            {note.apiKeys && note.apiKeys.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                <Key className="w-2.5 h-2.5 text-amber-600" />
                {note.apiKeys.length} Key{note.apiKeys.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Prompt Boxes badge */}
            {note.promptBoxes && note.promptBoxes.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                <MessageSquareCode className="w-2.5 h-2.5 text-indigo-600" />
                {note.promptBoxes.length} Prompt{note.promptBoxes.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Spec Files badge */}
            {note.specFiles && note.specFiles.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                <FileCode className="w-2.5 h-2.5 text-emerald-600" />
                {note.specFiles.length} Spec{note.specFiles.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Dev Websites badge */}
            {note.devWebsites && note.devWebsites.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                <Globe className="w-2.5 h-2.5 text-blue-600" />
                {note.devWebsites.length} Portal{note.devWebsites.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Dev Videos badge */}
            {note.devVideos && note.devVideos.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full">
                <Video className="w-2.5 h-2.5 text-rose-600" />
                {note.devVideos.length} Video{note.devVideos.length > 1 ? 's' : ''}
              </span>
            )}

            {/* YouTube Links badge */}
            {note.youtubeLinks && note.youtubeLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
                <Youtube className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                {note.youtubeLinks.length} Video{note.youtubeLinks.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Important Questions badge */}
            {note.importantQuestions && note.importantQuestions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                {note.importantQuestions.length} Imp Q{note.importantQuestions.length > 1 ? 's' : ''}
              </span>
            )}

            {/* Web Resources badge */}
            {note.webLinks && note.webLinks.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-full">
                <Globe className="w-2.5 h-2.5 text-sky-600" />
                {note.webLinks.length} Link{note.webLinks.length > 1 ? 's' : ''}
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
                  className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-200/60 transition cursor-pointer"
                >
                  #{tag.name}
                </span>
              ))}
          </div>
        )}

        {/* Footer: timestamp with clock icon + quick actions */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatNoteDate(note.updatedAt || note.createdAt)}</span>
          </div>

          {/* Quick hover actions for desktop / mouse users */}
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleArchive(note.id);
                }}
                className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-50"
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
              className="p-1 rounded-md text-slate-400 hover:text-[#5B86E5] hover:bg-[#EAF1FB]"
              title={note.isPinned ? 'Unpin' : 'Pin to top'}
            >
              <Pin className={`w-3 h-3 ${note.isPinned ? 'fill-[#5B86E5] text-[#5B86E5]' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
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
