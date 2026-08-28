import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NoteItem,
  FolderItem,
  NoteTag,
  TAG_COLORS,
  ChecklistItem,
  AppMode,
  YoutubeLink,
  WebResourceLink,
  ImportantQuestion,
  ApiKeyItem,
  PromptBoxItem,
  SpecFileItem,
  DevWebsiteCredentialItem,
  DevVideoResourceItem,
} from '../types';
import { SketchCanvasModal } from './SketchCanvasModal';
import { StudentImportantQuestionsSection } from './StudentImportantQuestionsSection';
import { StudentMediaLinksSection } from './StudentMediaLinksSection';
import { DevApiKeysSection } from './DevApiKeysSection';
import { DevPromptBoxesSection } from './DevPromptBoxesSection';
import { DevSpecFilesSection } from './DevSpecFilesSection';
import { DevWebsitesCredentialsSection } from './DevWebsitesCredentialsSection';
import { DevVideoResourcesSection } from './DevVideoResourcesSection';
import {
  ArrowLeft,
  Pin,
  Trash2,
  Folder,
  Tag,
  CheckSquare,
  FileText,
  Plus,
  X,
  Check,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Minus,
  Quote,
  CheckCircle2,
  Circle,
  ChevronDown,
  Image as ImageIcon,
  PenTool,
  Highlighter,
  Camera,
  FolderPlus,
  Strikethrough,
  Palette,
  GraduationCap,
  Youtube,
  Globe,
  Star,
  BookOpen,
  Key,
  MessageSquareCode,
  FileCode,
  Terminal,
  Code,
  Lock,
  Video,
  Loader2,
} from 'lucide-react';

interface NoteEditorProps {
  initialNote?: NoteItem | null;
  initialType?: 'text' | 'checklist' | 'sketch';
  folders: FolderItem[];
  currentFolderId?: string | 'all' | 'uncategorised';
  currentMode?: AppMode;
  onClose: () => void;
  onSave: (note: NoteItem) => void;
  onDelete: (id: string) => void;
  onCreateFolder?: (name: string) => Promise<FolderItem | void> | void;
}

export const HIGHLIGHT_PALETTE = [
  { name: 'Yellow', bg: '#FEF08A', text: '#854D0E', border: '#FDE047', dot: '#EAB308' },
  { name: 'Green', bg: '#BBF7D0', text: '#166534', border: '#86EFAC', dot: '#22C55E' },
  { name: 'Pink', bg: '#FBCFE8', text: '#9D174D', border: '#F472B6', dot: '#EC4899' },
  { name: 'Cyan', bg: '#BAE6FD', text: '#075985', border: '#7DD3FC', dot: '#06B6D4' },
  { name: 'Orange', bg: '#FED7AA', text: '#9A3412', border: '#FDBA74', dot: '#F97316' },
];

const convertMarkdownToRichHtml = (content: string): string => {
  if (!content) return '';
  if (
    content.includes('<p>') ||
    content.includes('<div>') ||
    content.includes('<mark') ||
    content.includes('<b>') ||
    content.includes('<strong>') ||
    content.includes('<ul>') ||
    content.includes('<ol>') ||
    content.includes('<blockquote>') ||
    content.includes('rich-todo-item')
  ) {
    return content;
  }

  // Convert legacy markdown symbols into rich visual HTML
  let converted = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/==([^=]+)==/g, '<mark style="background-color: #FEF08A; color: #854D0E; border-radius: 4px; padding: 1px 4px; font-weight: 500;">$1</mark>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; font-weight: bold; margin: 6px 0;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.5rem; font-weight: bold; margin: 10px 0;">$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid #cbd5e1; padding-left: 10px; margin: 6px 0; color: #64748b; font-style: italic;">$1</blockquote>')
    .replace(/\n/g, '<br/>');

  return converted;
};

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialNote,
  initialType = 'text',
  folders,
  currentFolderId,
  currentMode = 'normal',
  onClose,
  onSave,
  onDelete,
  onCreateFolder,
}) => {
  const isNewNote = !initialNote;
  const isStudentMod = currentMode === 'student' || initialNote?.mode === 'student';
  const isDeveloperMod = currentMode === 'developer' || initialNote?.mode === 'developer';

  // Note Metadata State
  const [noteId] = useState<string>(initialNote ? initialNote.id : `note-${Date.now()}`);
  const [title, setTitle] = useState<string>(initialNote ? initialNote.title : '');
  const [body, setBody] = useState<string>(initialNote ? initialNote.body : '');
  const [images, setImages] = useState<string[]>(initialNote?.images || []);
  const [sketches, setSketches] = useState<string[]>(initialNote?.sketches || []);
  const [folderId, setFolderId] = useState<string | undefined>(
    initialNote
      ? initialNote.folderId
      : currentFolderId && currentFolderId !== 'all' && currentFolderId !== 'uncategorised'
      ? currentFolderId
      : undefined
  );
  const [tags, setTags] = useState<NoteTag[]>(initialNote ? initialNote.tags || [] : []);
  const [isPinned, setIsPinned] = useState<boolean>(initialNote ? initialNote.isPinned : false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Student Mod Rich Fields
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLink[]>(initialNote?.youtubeLinks || []);
  const [webLinks, setWebLinks] = useState<WebResourceLink[]>(initialNote?.webLinks || []);
  const [importantQuestions, setImportantQuestions] = useState<ImportantQuestion[]>(
    initialNote?.importantQuestions || []
  );
  const [studentSubject, setStudentSubject] = useState<string>(initialNote?.studentSubject || '');
  const [isAddingYoutube, setIsAddingYoutube] = useState(false);
  const [isAddingWebLink, setIsAddingWebLink] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Developer Mod Rich Fields
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialNote?.apiKeys || []);
  const [promptBoxes, setPromptBoxes] = useState<PromptBoxItem[]>(initialNote?.promptBoxes || []);
  const [specFiles, setSpecFiles] = useState<SpecFileItem[]>(initialNote?.specFiles || []);
  const [devWebsites, setDevWebsites] = useState<DevWebsiteCredentialItem[]>(
    initialNote?.devWebsites || []
  );
  const [devVideos, setDevVideos] = useState<DevVideoResourceItem[]>(initialNote?.devVideos || []);

  // Developer Mod External Add Triggers
  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [isAddingPromptBox, setIsAddingPromptBox] = useState(false);
  const [isAddingSpecFile, setIsAddingSpecFile] = useState(false);
  const [isAddingDevWebsite, setIsAddingDevWebsite] = useState(false);
  const [isAddingDevVideo, setIsAddingDevVideo] = useState(false);

  // Popups & Modal State
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[3]);
  const [showSketchStudio, setShowSketchStudio] = useState(initialType === 'sketch');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Highlighter Color Selector State
  const [activeHighlightColor, setActiveHighlightColor] = useState(HIGHLIGHT_PALETTE[0]);
  const [showHighlightColorStrip, setShowHighlightColorStrip] = useState(false);

  // References
  const editorRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Continuously track text selection within the rich editor so mobile tap never loses selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Initialize Rich ContentEditable with note content
  useEffect(() => {
    if (editorRef.current) {
      if (initialNote && initialNote.body) {
        editorRef.current.innerHTML = convertMarkdownToRichHtml(initialNote.body);
      } else if (!initialNote && !body) {
        editorRef.current.innerHTML = '';
      }
    }
  }, []);

  // Focus Title or Editor on mount if new
  useEffect(() => {
    if (isNewNote && initialType !== 'sketch') {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isNewNote, initialType]);

  // Derive plain text title if not manually entered
  const getEffectiveTitle = () => {
    if (title.trim()) return title.trim();
    if (editorRef.current) {
      const textContent = editorRef.current.innerText.trim();
      if (textContent) {
        const firstLine = textContent.split('\n')[0].trim();
        if (firstLine) return firstLine.slice(0, 50);
      }
    } else if (body) {
      const clean = body.replace(/<[^>]*>/g, ' ').trim();
      const firstLine = clean.split('\n')[0].trim();
      if (firstLine) return firstLine.slice(0, 50);
    }
    return '';
  };

  // Sync Rich Editor input
  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setBody(html);
      triggerAutoSave();
    }
  }, []);

  // Restore saved selection
  const restoreSelection = () => {
    if (savedSelectionRef.current && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Execute standard formatting commands (Bold, Italic, Underline, Lists, etc.)
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      document.execCommand(command, false, value);
      handleEditorInput();
    }
  };

  // True Rich Highlighter Tool (Immediate apply + toggle)
  const handleApplyHighlight = (customColor?: typeof HIGHLIGHT_PALETTE[0]) => {
    const colorToUse = customColor || activeHighlightColor;
    if (customColor) {
      setActiveHighlightColor(customColor);
    }

    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Check if selected range is already inside a <mark> (toggle off)
    let parentMark: HTMLElement | null = null;
    let node: Node | null = selection.anchorNode;
    while (node && node !== editorRef.current) {
      if (node.nodeName === 'MARK') {
        parentMark = node as HTMLElement;
        break;
      }
      node = node.parentNode;
    }

    if (parentMark) {
      // Remove highlight: replace mark with its text contents
      const parent = parentMark.parentNode;
      while (parentMark.firstChild) {
        parent?.insertBefore(parentMark.firstChild, parentMark);
      }
      parent?.removeChild(parentMark);
      handleEditorInput();
      return;
    }

    if (selection.isCollapsed) {
      // If no text selected, select the current word
      selection.modify('move', 'backward', 'word');
      selection.modify('extend', 'forward', 'word');
    }

    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedContent = range.extractContents();
      const mark = document.createElement('mark');
      mark.style.backgroundColor = colorToUse.bg;
      mark.style.color = colorToUse.text;
      mark.style.padding = '1px 5px';
      mark.style.borderRadius = '4px';
      mark.style.fontWeight = '500';
      mark.appendChild(selectedContent);

      range.insertNode(mark);
      selection.removeAllRanges();

      handleEditorInput();
    }
  };

  // Insert or Toggle In-Note To-Do Checklist Item
  const insertTodoItem = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Append to the bottom if no selection
      const todoDiv = createTodoElement('To-do task...');
      editorRef.current.appendChild(todoDiv);
      handleEditorInput();
      return;
    }

    const range = selection.getRangeAt(0);
    const todoDiv = createTodoElement('');

    range.deleteContents();
    range.insertNode(todoDiv);

    // Focus cursor inside the newly created todo text element
    const textSpan = todoDiv.querySelector('.todo-text') as HTMLElement;
    if (textSpan) {
      textSpan.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(textSpan);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      savedSelectionRef.current = newRange.cloneRange();
    }

    handleEditorInput();
  };

  // Helper to construct clean To-Do DOM Element
  const createTodoElement = (initialText: string = ''): HTMLDivElement => {
    const container = document.createElement('div');
    container.className = 'rich-todo-item flex items-start gap-2 my-1 py-0.5';
    container.setAttribute('data-todo', 'pending');

    const checkbox = document.createElement('span');
    checkbox.className = 'todo-checkbox';
    checkbox.setAttribute('contenteditable', 'false');
    checkbox.setAttribute('data-role', 'todo-checkbox');
    checkbox.innerText = '✓';

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.setAttribute('contenteditable', 'true');
    textSpan.innerText = initialText;

    container.appendChild(checkbox);
    container.appendChild(textSpan);
    return container;
  };

  // Handle Click inside Editor (Toggling Checkbox)
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target.classList.contains('todo-checkbox') ||
        target.getAttribute('data-role') === 'todo-checkbox')
    ) {
      e.preventDefault();
      e.stopPropagation();
      const todoItem = target.closest('.rich-todo-item');
      if (todoItem) {
        const isCompleted = todoItem.classList.contains('completed');
        if (isCompleted) {
          todoItem.classList.remove('completed');
          todoItem.setAttribute('data-todo', 'pending');
        } else {
          todoItem.classList.add('completed');
          todoItem.setAttribute('data-todo', 'completed');
        }
        handleEditorInput();
      }
    }
  };

  // Smart Keyboard Handler for Enter, Backspace in Rich Editor & To-Dos
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const anchor = selection.anchorNode;
    const todoItem = anchor instanceof HTMLElement
      ? anchor.closest('.rich-todo-item')
      : anchor?.parentElement?.closest('.rich-todo-item');

    if (todoItem) {
      const textSpan = todoItem.querySelector('.todo-text') as HTMLElement;
      const textContent = textSpan ? textSpan.innerText.trim() : '';

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        if (!textContent) {
          // Empty todo item: Pressing Enter turns it into a normal paragraph
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          todoItem.parentNode?.replaceChild(p, todoItem);

          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Non-empty todo item: Pressing Enter creates a new To-Do line right after
          const newTodo = createTodoElement('');
          todoItem.parentNode?.insertBefore(newTodo, todoItem.nextSibling);

          const newTextSpan = newTodo.querySelector('.todo-text') as HTMLElement;
          if (newTextSpan) {
            newTextSpan.focus();
            const range = document.createRange();
            range.setStart(newTextSpan, 0);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        handleEditorInput();
        return;
      }

      if (e.key === 'Backspace' && !textContent) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        todoItem.parentNode?.replaceChild(p, todoItem);

        const range = document.createRange();
        range.setStart(p, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        handleEditorInput();
        return;
      }
    }
  };

  // Construct current complete note object
  const buildCurrentNoteObject = (): NoteItem | null => {
    const effectiveTitle = getEffectiveTitle();
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : body;
    const hasContent =
      effectiveTitle ||
      (title && title.trim()) ||
      (currentHtml && currentHtml.trim() && currentHtml !== '<br>') ||
      images.length > 0 ||
      sketches.length > 0 ||
      youtubeLinks.length > 0 ||
      webLinks.length > 0 ||
      importantQuestions.length > 0 ||
      apiKeys.length > 0 ||
      promptBoxes.length > 0 ||
      specFiles.length > 0 ||
      devWebsites.length > 0 ||
      devVideos.length > 0;

    if (!hasContent) return null;

    return {
      id: noteId,
      type: 'text',
      title: title.trim() || effectiveTitle || 'Untitled Note',
      body: currentHtml,
      checklistItems: [],
      images,
      sketches,
      youtubeLinks,
      webLinks,
      importantQuestions,
      studentSubject: studentSubject.trim() || undefined,
      apiKeys,
      promptBoxes,
      specFiles,
      devWebsites,
      devVideos,
      folderId,
      tags,
      isPinned,
      mode: isDeveloperMod
        ? 'developer'
        : isStudentMod
        ? 'student'
        : (initialNote ? initialNote.mode : (currentMode || 'normal')),
      createdAt: initialNote ? initialNote.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
  };

  // Instant Manual Save Function triggered by user button click
  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus('saving');
    const noteToPersist = buildCurrentNoteObject();
    if (noteToPersist) {
      onSave(noteToPersist);
    }
    setSaveStatus('saved');
    setJustSaved(true);
    setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  };

  // Debounced auto-save function
  const triggerAutoSave = () => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const noteToPersist = buildCurrentNoteObject();
      if (noteToPersist) {
        onSave(noteToPersist);
      }
      setSaveStatus('saved');
    }, 500);
  };

  // Auto-save on metadata change
  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    title,
    images,
    sketches,
    youtubeLinks,
    webLinks,
    importantQuestions,
    studentSubject,
    apiKeys,
    promptBoxes,
    specFiles,
    devWebsites,
    devVideos,
    folderId,
    tags,
    isPinned,
  ]);

  // RISK 1: Extra save triggers — blur, visibilitychange, beforeunload
  useEffect(() => {
    const flushSaveNow = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const noteToPersist = buildCurrentNoteObject();
      if (noteToPersist) {
        setSaveStatus('saving');
        onSave(noteToPersist);
        setSaveStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveNow();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      flushSaveNow();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [title, body, images, sketches, youtubeLinks, webLinks, importantQuestions, studentSubject, apiKeys, promptBoxes, specFiles, devWebsites, devVideos, folderId, tags, isPinned]);

  // Handle back button / closing (Immediate synchronous save before unmounting)
  const handleBack = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const noteToPersist = buildCurrentNoteObject();
    if (noteToPersist) {
      onSave(noteToPersist);
    }
    onClose();
  };

  // Image Upload Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvt) => {
          const result = loadEvt.target?.result as string;
          if (result) {
            setImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Sketch Studio Handlers
  const handleSaveSketch = (dataUrl: string) => {
    setSketches((prev) => [...prev, dataUrl]);
  };

  const handleRemoveSketch = (index: number) => {
    setSketches((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Custom Folder Creation handler
  const handleCreateCustomFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderNameInput.trim();
    if (!cleanName) return;

    if (onCreateFolder) {
      const created = await onCreateFolder(cleanName);
      if (created && typeof created === 'object' && created.id) {
        setFolderId(created.id);
      }
    }
    setNewFolderNameInput('');
    setShowFolderPicker(false);
  };

  // Tag Handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim().replace(/^#/, '');
    if (clean && !tags.some((t) => t.name.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, { name: clean, color: selectedTagColor.hex }]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setTags(tags.filter((t) => t.name !== tagName));
  };

  // Active folder name
  const currentFolder = folders.find((f) => f.id === folderId);

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F4EE]/30 backdrop-blur-xl bg-white flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Hidden File Input for Image Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 1. TOP APP BAR - Precision Mobile & Desktop Layout */}
      <div className="w-full px-2.5 sm:px-4 py-2 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Left: Back button & Folder / Subject Selector */}
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <button
            id="editor-back-btn"
            onClick={handleBack}
            className="p-1.5 -ml-1 rounded-full text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0"
            title="Back (Auto-saved)"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Folder Assignment Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowFolderPicker(!showFolderPicker)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF1FB] hover:bg-[#DCE9FA] text-[#3B66CC] transition cursor-pointer border border-[#D4E4FA]/80 shadow-2xs"
            >
              <Folder className="w-3.5 h-3.5 text-[#5B86E5] shrink-0" />
              <span className="truncate max-w-[85px] sm:max-w-[130px]">
                {currentFolder ? currentFolder.name : 'Category'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#5B86E5]/70 shrink-0" />
            </button>

            {/* Folder Dropdown */}
            {showFolderPicker && (
              <div className="absolute left-0 top-9 w-60 sm:w-64 bg-white/98 backdrop-blur-md border border-slate-200 rounded-[20px] shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-2 z-30 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  <span>Select Category</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 my-1">
                  <button
                    onClick={() => {
                      setFolderId(undefined);
                      setShowFolderPicker(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                      !folderId ? 'bg-[#5B86E5] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>Uncategorised</span>
                    {!folderId && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {folders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setFolderId(f.id);
                        setShowFolderPicker(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                        folderId === f.id ? 'bg-[#5B86E5] text-white shadow-xs' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="truncate">{f.name}</span>
                      {folderId === f.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                {/* Create Custom Folder inside Editor */}
                <form
                  onSubmit={handleCreateCustomFolder}
                  className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newFolderNameInput}
                    onChange={(e) => setNewFolderNameInput(e.target.value)}
                    placeholder="+ New category..."
                    className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#5B86E5]"
                  />
                  <button
                    type="submit"
                    disabled={!newFolderNameInput.trim()}
                    className="px-2.5 py-1 bg-[#5B86E5] text-white text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-[#4D78DE] transition cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Explicit Manual Save Button for instant persistence verification */}
          <button
            id="editor-save-btn"
            onClick={handleManualSave}
            className={`px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              saveStatus === 'saving'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : justSaved
                ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
            title="Save note now (Offline-first persistent save)"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800" />
                <span className="text-[11px] sm:text-xs">Saving...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                <span className="text-[11px] sm:text-xs">Saved ✓</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[11px] sm:text-xs">Save</span>
              </>
            )}
          </button>

          {/* Attach Photo Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-2 rounded-full text-slate-600 hover:bg-[#EAF1FB] hover:text-[#5B86E5] active:scale-95 transition cursor-pointer"
            title="Attach Photo / Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Full-Page Sketch Studio Button */}
          <button
            onClick={() => setShowSketchStudio(true)}
            className="p-1.5 sm:p-2 rounded-full text-slate-600 hover:bg-[#FAF0E6] hover:text-amber-600 active:scale-95 transition cursor-pointer"
            title="Open Hand-Drawn Sketch Studio"
          >
            <PenTool className="w-4 h-4 text-amber-500" />
          </button>

          {/* Tags Drawer */}
          <button
            onClick={() => setShowTagPicker(!showTagPicker)}
            className={`p-1.5 sm:p-2 rounded-full transition active:scale-95 cursor-pointer ${
              tags.length > 0 || showTagPicker
                ? 'bg-[#F3EEF9] text-purple-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Manage tags"
          >
            <Tag className="w-4 h-4" />
          </button>

          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 sm:p-2 rounded-full transition active:scale-95 cursor-pointer ${
              isPinned
                ? 'bg-[#5B86E5] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title={isPinned ? 'Unpin note' : 'Pin to top'}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-white' : ''}`} />
          </button>

          {/* Delete Button */}
          {!isNewNote && (
            <button
              onClick={() => {
                onDelete(noteId);
                onClose();
              }}
              className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition cursor-pointer"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tag Picker Drawer */}
      {showTagPicker && (
        <div className="bg-[#FAF0E6]/50 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Note Tags
            </span>
            <button
              onClick={() => setShowTagPicker(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Add tag (e.g. Physics, Term 1, Important)..."
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#5B86E5]"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="px-3 py-1.5 bg-[#5B86E5] text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-[#4D78DE] transition cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Color swatches */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2">
            <span className="text-[10px] text-slate-400 mr-1 shrink-0 font-medium">Color:</span>
            {TAG_COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => setSelectedTagColor(color)}
                style={{ backgroundColor: color.hex }}
                className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                  selectedTagColor.name === color.name
                    ? 'ring-2 ring-[#5B86E5] scale-110'
                    : 'opacity-80 hover:opacity-100'
                }`}
                title={color.name}
              />
            ))}
          </div>

          {/* Tags list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  style={{
                    backgroundColor: `${tag.color}18`,
                    color: tag.color,
                    borderColor: `${tag.color}40`,
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border"
                >
                  #{tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.name)}
                    className="hover:opacity-70 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN NOTE CONTENT AREA */}
      <div className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto space-y-3">
        {/* Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            const noteToPersist = buildCurrentNoteObject();
            if (noteToPersist) {
              setSaveStatus('saving');
              onSave(noteToPersist);
              setSaveStatus('saved');
              setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
          }}
          placeholder="Title"
          className="w-full text-xl sm:text-2xl font-black text-slate-900 placeholder-slate-300 border-none outline-none bg-transparent tracking-tight"
        />

        {/* Display tags */}
        {tags.length > 0 && !showTagPicker && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {tags.map((tag) => (
              <span
                key={tag.name}
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  borderColor: `${tag.color}30`,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Attached Photos Gallery */}
        {images.length > 0 && (
          <div className="space-y-1.5 pt-1 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> Attached Photos ({images.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={`img-${idx}`}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs"
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-200"
                    onClick={() => setPreviewImage(img)}
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hand-Drawn Sketches Gallery */}
        {sketches.length > 0 && (
          <div className="space-y-1.5 pt-1 pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <PenTool className="w-3 h-3 text-amber-500" /> Sketches & Diagrams ({sketches.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {sketches.map((sketch, idx) => (
                <div
                  key={`sketch-${idx}`}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white aspect-4/3 shadow-xs"
                >
                  <img
                    src={sketch}
                    alt={`Sketch ${idx + 1}`}
                    className="w-full h-full object-contain p-2 cursor-pointer hover:scale-105 transition duration-200"
                    onClick={() => setPreviewImage(sketch)}
                  />
                  <button
                    onClick={() => handleRemoveSketch(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                    title="Remove sketch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDENT MOD QUICK ACTION CHIPS ROW */}
        {isStudentMod && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setIsAddingYoutube(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Youtube className="w-3.5 h-3.5 text-red-600" />
              <span>+ YouTube Lecture</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingWebLink(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Reference Link</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingQuestion(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+ Important Q&A</span>
            </button>
          </div>
        )}

        {/* DEVELOPER MOD QUICK ACTION CHIPS ROW */}
        {isDeveloperMod && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setIsAddingApiKey(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>+ API Key</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingPromptBox(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <MessageSquareCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Prompt Box</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingSpecFile(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ PRD / Spec File</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingDevWebsite(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Website & Login</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddingDevVideo(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <Video className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Video Resource</span>
            </button>
          </div>
        )}

        {/* UNIFIED TRUE VISUAL RICH TEXT & IN-NOTE TO-DO WYSIWYG EDITOR */}
        <div className="relative min-h-[220px] flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            onClick={handleEditorClick}
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            onBlur={() => {
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              const noteToPersist = buildCurrentNoteObject();
              if (noteToPersist) {
                setSaveStatus('saving');
                onSave(noteToPersist);
                setSaveStatus('saved');
                setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              }
            }}
            data-placeholder="Start typing your notes here... You can bold, italicize, underline, highlight text in colors, and tap [✓ To-Do List] to insert interactive checklists!"
            className="rich-note-editor flex-1 min-h-[220px] text-base text-slate-800 outline-none leading-relaxed font-normal focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 empty:before:pointer-events-none"
          />
        </div>

        {/* STUDENT MOD RICH MODULES: YouTube Embedded Videos & Web Reference Links */}
        <StudentMediaLinksSection
          youtubeLinks={youtubeLinks}
          webLinks={webLinks}
          onUpdateYoutubeLinks={setYoutubeLinks}
          onUpdateWebLinks={setWebLinks}
          isAddingYoutubeExternal={isAddingYoutube}
          onCloseAddingYoutubeExternal={() => setIsAddingYoutube(false)}
          isAddingWebLinkExternal={isAddingWebLink}
          onCloseAddingWebLinkExternal={() => setIsAddingWebLink(false)}
        />

        {/* STUDENT MOD RICH MODULES: Most Important Questions Card Section */}
        <StudentImportantQuestionsSection
          questions={importantQuestions}
          onChange={setImportantQuestions}
          isAddingNewExternal={isAddingQuestion}
          onCloseAddingNewExternal={() => setIsAddingQuestion(false)}
        />

        {/* DEVELOPER MOD RICH MODULES: API Keys Block Section */}
        {(isDeveloperMod || apiKeys.length > 0) && (
          <DevApiKeysSection
            apiKeys={apiKeys}
            onChange={setApiKeys}
            isAddingExternal={isAddingApiKey}
            onCloseAddingExternal={() => setIsAddingApiKey(false)}
          />
        )}

        {/* DEVELOPER MOD RICH MODULES: Prompt Boxes Block Section */}
        {(isDeveloperMod || promptBoxes.length > 0) && (
          <DevPromptBoxesSection
            promptBoxes={promptBoxes}
            onChange={setPromptBoxes}
            isAddingExternal={isAddingPromptBox}
            onCloseAddingExternal={() => setIsAddingPromptBox(false)}
          />
        )}

        {/* DEVELOPER MOD RICH MODULES: MD/PRD & Spec Files Block Section */}
        {(isDeveloperMod || specFiles.length > 0) && (
          <DevSpecFilesSection
            specFiles={specFiles}
            onChange={setSpecFiles}
            isAddingExternal={isAddingSpecFile}
            onCloseAddingExternal={() => setIsAddingSpecFile(false)}
          />
        )}

        {/* DEVELOPER MOD RICH MODULES: Websites & Credentials Section */}
        {(isDeveloperMod || devWebsites.length > 0) && (
          <DevWebsitesCredentialsSection
            devWebsites={devWebsites}
            onChange={setDevWebsites}
            isAddingExternal={isAddingDevWebsite}
            onCloseAddingExternal={() => setIsAddingDevWebsite(false)}
          />
        )}

        {/* DEVELOPER MOD RICH MODULES: Video Resources & Architecture Tutorials Section */}
        {(isDeveloperMod || devVideos.length > 0) && (
          <DevVideoResourcesSection
            devVideos={devVideos}
            onChange={setDevVideos}
            isAddingExternal={isAddingDevVideo}
            onCloseAddingExternal={() => setIsAddingDevVideo(false)}
          />
        )}
      </div>

      {/* HIGHLIGHT COLOR PALETTE POPUP STRIP */}
      {showHighlightColorStrip && (
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-bottom-1 z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Highlight Color:
            </span>
            <div className="flex items-center gap-2">
              {HIGHLIGHT_PALETTE.map((hc) => (
                <button
                  key={hc.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onTouchStart={(e) => e.preventDefault()}
                  onClick={() => {
                    handleApplyHighlight(hc);
                    setShowHighlightColorStrip(false);
                  }}
                  style={{ backgroundColor: hc.bg, color: hc.text, borderColor: hc.border }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs ${
                    activeHighlightColor.name === hc.name ? 'ring-2 ring-[#5B86E5] scale-105' : 'hover:scale-105'
                  }`}
                >
                  <span
                    style={{ backgroundColor: hc.dot }}
                    className="w-2.5 h-2.5 rounded-full inline-block"
                  />
                  <span>{hc.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowHighlightColorStrip(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. VISUAL RICH FORMATTING RIBBON TOOLBAR */}
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 sm:px-4 py-2 flex items-center justify-start gap-1 select-none overflow-x-auto shrink-0 scrollbar-none z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        {/* Bold */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('bold')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition font-black cursor-pointer shrink-0"
          title="Bold"
        >
          <Bold className="w-4 h-4 stroke-[2.8]" />
        </button>

        {/* Italic */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('italic')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition italic cursor-pointer shrink-0"
          title="Italic"
        >
          <Italic className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Underline */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('underline')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer shrink-0"
          title="Underline"
        >
          <Underline className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Strikethrough */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('strikeThrough')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition cursor-pointer shrink-0"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-1 shrink-0" />

        {/* TRUE INSTANT TEXT HIGHLIGHTER BUTTON */}
        <div className="flex items-center gap-0.5 bg-[#FAF0E6] rounded-xl p-0.5 border border-[#F9DFC5] shrink-0">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => handleApplyHighlight()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-amber-900 hover:bg-white active:scale-95 transition cursor-pointer text-xs font-bold"
            title="Highlight selected text"
          >
            <Highlighter className="w-4 h-4 text-amber-600 stroke-[2.2]" />
            <span className="hidden sm:inline">Highlight</span>
            <span
              style={{ backgroundColor: activeHighlightColor.dot }}
              className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
            />
          </button>

          {/* Color Palette dropdown trigger */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => setShowHighlightColorStrip(!showHighlightColorStrip)}
            className="p-1.5 rounded-lg text-amber-700 hover:text-amber-950 hover:bg-white transition cursor-pointer"
            title="Choose Highlighter Color"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 mx-1 shrink-0" />

        {/* PRIMARY IN-NOTE TO-DO LIST ITEM BUTTON */}
        <button
          id="editor-insert-todo-btn"
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={insertTodoItem}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF8F0] hover:bg-[#D4F4E2] text-emerald-800 border border-[#C2ECD3] rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 shadow-xs"
          title="Insert In-Note To-Do Task with Checkbox"
        >
          <CheckSquare className="w-4 h-4 text-emerald-600 stroke-[2.4]" />
          <span>To-Do List</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 mx-1 shrink-0" />

        {/* Heading 1 */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('formatBlock', '<h2>')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition cursor-pointer font-bold shrink-0"
          title="Heading"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        {/* Bullet List */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertUnorderedList')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Auto-increment Numbered List (1, 2, 3...) */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertOrderedList')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition cursor-pointer font-bold shrink-0"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        {/* Blockquote */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('formatBlock', '<blockquote>')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Quote Block"
        >
          <Quote className="w-4 h-4" />
        </button>

        {/* Divider Line */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertHorizontalRule')}
          className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Divider Line"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* FULL-PAGE SKETCH STUDIO MODAL */}
      <SketchCanvasModal
        isOpen={showSketchStudio}
        onClose={() => setShowSketchStudio(false)}
        onSaveSketch={handleSaveSketch}
      />

      {/* Fullscreen Photo / Sketch Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-70 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

