import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NoteItem,
  FolderItem,
  ProjectItem,
  NoteTag,
  TAG_COLORS,
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
import { NoteResourcesManager } from './NoteResourcesManager';
import { useKeyboardViewport } from '../hooks/useKeyboardViewport';
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
  List,
  ListOrdered,
  Minus,
  Quote,
  ChevronDown,
  Image as ImageIcon,
  PenTool,
  Highlighter,
  Palette,
  Key,
  MessageSquareCode,
  FileCode,
  Globe,
  Video,
  HelpCircle,
  Link2,
  Loader2,
  Layers,
  MoreVertical,
  GraduationCap,
  Code,
  BookOpen,
  Calculator,
} from 'lucide-react';

interface NoteEditorProps {
  initialNote?: NoteItem | null;
  initialType?: 'text' | 'checklist' | 'sketch';
  folders: FolderItem[];
  projects?: ProjectItem[];
  currentFolderId?: string | 'all' | 'uncategorised';
  currentProjectId?: string;
  currentMode?: AppMode | 'all';
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

const STUDENT_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Literature',
  'Economics',
  'Psychology',
  'Engineering',
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
  projects = [],
  currentFolderId,
  currentProjectId,
  currentMode = 'normal',
  onClose,
  onSave,
  onDelete,
  onCreateFolder,
}) => {
  const isNewNote = !initialNote;

  // Keyboard & Viewport Tracking for Mobile Soft Keyboard awareness
  const { viewportHeight, viewportTop } = useKeyboardViewport();

  // Note Mode State (Normal | Student | Developer)
  const [noteMode, setNoteMode] = useState<AppMode>(
    initialNote?.mode || (currentMode === 'all' ? 'normal' : currentMode) || 'normal'
  );
  const [showModePicker, setShowModePicker] = useState(false);

  // Student specific metadata
  const [studentSubject, setStudentSubject] = useState<string>(initialNote?.studentSubject || '');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [quickFormulas, setQuickFormulas] = useState<string[]>(initialNote?.quickFormulas || []);

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
  const [projectId, setProjectId] = useState<string | undefined>(
    initialNote?.projectId || currentProjectId
  );
  const [tags, setTags] = useState<NoteTag[]>(initialNote ? initialNote.tags || [] : []);
  const [isPinned, setIsPinned] = useState<boolean>(initialNote ? initialNote.isPinned : false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Rich Resources State
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLink[]>(initialNote?.youtubeLinks || []);
  const [webLinks, setWebLinks] = useState<WebResourceLink[]>(initialNote?.webLinks || []);
  const [importantQuestions, setImportantQuestions] = useState<ImportantQuestion[]>(
    initialNote?.importantQuestions || []
  );
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialNote?.apiKeys || []);
  const [promptBoxes, setPromptBoxes] = useState<PromptBoxItem[]>(initialNote?.promptBoxes || []);
  const [specFiles, setSpecFiles] = useState<SpecFileItem[]>(initialNote?.specFiles || []);
  const [devWebsites, setDevWebsites] = useState<DevWebsiteCredentialItem[]>(
    initialNote?.devWebsites || []
  );
  const [devVideos, setDevVideos] = useState<DevVideoResourceItem[]>(initialNote?.devVideos || []);

  // UI Popups & Menus
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[3]);
  const [showSketchStudio, setShowSketchStudio] = useState(initialType === 'sketch');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeAddResourceModal, setActiveAddResourceModal] = useState<string | null>(null);

  // Highlighter Color Selector State
  const [activeHighlightColor, setActiveHighlightColor] = useState(HIGHLIGHT_PALETTE[0]);
  const [showHighlightColorStrip, setShowHighlightColorStrip] = useState(false);

  // References
  const editorRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Track selection
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

  // Initialize Rich ContentEditable
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

  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setBody(html);
      triggerAutoSave();
    }
  }, []);

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

  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      restoreSelection();
      document.execCommand(command, false, value);
      handleEditorInput();
    }
  };

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
      const parent = parentMark.parentNode;
      while (parentMark.firstChild) {
        parent?.insertBefore(parentMark.firstChild, parentMark);
      }
      parent?.removeChild(parentMark);
      handleEditorInput();
      return;
    }

    if (selection.isCollapsed) {
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

  const insertTodoItem = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const todoDiv = createTodoElement('To-do task...');
      editorRef.current.appendChild(todoDiv);
      handleEditorInput();
      return;
    }

    const range = selection.getRangeAt(0);
    const todoDiv = createTodoElement('');

    range.deleteContents();
    range.insertNode(todoDiv);

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

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const anchor = selection.anchorNode;
    const todoItem =
      anchor instanceof HTMLElement
        ? anchor.closest('.rich-todo-item')
        : anchor?.parentElement?.closest('.rich-todo-item');

    if (todoItem) {
      const textSpan = todoItem.querySelector('.todo-text') as HTMLElement;
      const textContent = textSpan ? textSpan.innerText.trim() : '';

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();

        if (!textContent) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          todoItem.parentNode?.replaceChild(p, todoItem);

          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
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
      quickFormulas.length > 0 ||
      studentSubject.trim() ||
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
      studentSubject: noteMode === 'student' ? studentSubject.trim() || undefined : undefined,
      quickFormulas: quickFormulas.length > 0 ? quickFormulas : undefined,
      apiKeys,
      promptBoxes,
      specFiles,
      devWebsites,
      devVideos,
      folderId,
      projectId,
      tags,
      isPinned,
      mode: noteMode,
      createdAt: initialNote ? initialNote.createdAt : Date.now(),
      updatedAt: Date.now(),
    };
  };

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
    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  };

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

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    title,
    noteMode,
    studentSubject,
    quickFormulas,
    images,
    sketches,
    youtubeLinks,
    webLinks,
    importantQuestions,
    apiKeys,
    promptBoxes,
    specFiles,
    devWebsites,
    devVideos,
    folderId,
    projectId,
    tags,
    isPinned,
  ]);

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

  const handleSaveSketch = (dataUrl: string) => {
    setSketches((prev) => [...prev, dataUrl]);
  };

  const handleRemoveSketch = (index: number) => {
    setSketches((prev) => prev.filter((_, idx) => idx !== index));
  };

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

  const currentFolder = folders.find((f) => f.id === folderId);
  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <div
      className="fixed left-0 right-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-150"
      style={{
        top: `${viewportTop}px`,
        height: viewportHeight > 0 ? `${viewportHeight}px` : '100dvh',
        maxHeight: viewportHeight > 0 ? `${viewportHeight}px` : '100dvh',
      }}
    >
      {/* Hidden File Input for Image Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 1. TOP APP BAR - Responsive, Mode-Aware, Zero Mobile Overlap */}
      <div className="w-full px-2.5 sm:px-5 py-2 sm:py-2.5 bg-white border-b border-neutral-200/80 flex items-center justify-between sticky top-0 z-20 shrink-0 gap-1.5 min-w-0">
        {/* Left: Back button & Mode / Category pills */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1 overflow-x-auto scrollbar-none py-0.5">
          <button
            id="editor-back-btn"
            onClick={handleBack}
            className="p-1.5 -ml-1 rounded-lg text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition cursor-pointer shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Mode Switcher Pill */}
          <div className="relative shrink-0">
            <button
              onClick={() => {
                setShowModePicker(!showModePicker);
                setShowFolderPicker(false);
                setShowProjectPicker(false);
                setShowSubjectPicker(false);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                noteMode === 'student'
                  ? 'bg-blue-50/80 border-blue-200 text-blue-700 hover:bg-blue-100/70'
                  : noteMode === 'developer'
                  ? 'bg-purple-50/80 border-purple-200 text-purple-700 hover:bg-purple-100/70'
                  : 'bg-neutral-100/80 border-neutral-200 text-neutral-700 hover:bg-neutral-200/70'
              }`}
              title="Change note mode"
            >
              {noteMode === 'student' ? (
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : noteMode === 'developer' ? (
                <Code className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              )}
              <span className="capitalize">{noteMode === 'developer' ? 'Dev' : noteMode}</span>
              <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
            </button>

            {/* Mode Selection Dropdown */}
            {showModePicker && (
              <div
                className="absolute left-0 top-9 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95"
                onClick={() => setShowModePicker(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Note Mode
                </div>
                <button
                  type="button"
                  onClick={() => setNoteMode('normal')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    noteMode === 'normal'
                      ? 'bg-neutral-900 text-white'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <div>
                      <div className="font-semibold">Normal Note</div>
                      <div className="text-[10px] opacity-75">Clean general notes & tasks</div>
                    </div>
                  </div>
                  {noteMode === 'normal' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setNoteMode('student')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition mt-0.5 ${
                    noteMode === 'student'
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-blue-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <div>
                      <div className="font-semibold">Student Note</div>
                      <div className="text-[10px] opacity-75">Lectures, Q&A, formulas & study</div>
                    </div>
                  </div>
                  {noteMode === 'student' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setNoteMode('developer')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition mt-0.5 ${
                    noteMode === 'developer'
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-purple-50 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    <div>
                      <div className="font-semibold">Developer Note</div>
                      <div className="text-[10px] opacity-75">API keys, prompts, specs & portals</div>
                    </div>
                  </div>
                  {noteMode === 'developer' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Student Subject Picker (If in Student Mode) */}
          {noteMode === 'student' && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowSubjectPicker(!showSubjectPicker);
                  setShowFolderPicker(false);
                  setShowProjectPicker(false);
                  setShowModePicker(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  studentSubject
                    ? 'bg-blue-100/70 text-blue-900 border-blue-300'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
                title="Academic Subject"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate max-w-[70px] sm:max-w-[120px]">
                  {studentSubject || 'Subject'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {showSubjectPicker && (
                <div className="absolute left-0 top-9 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                    Academic Subject
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-0.5 my-1">
                    <button
                      onClick={() => {
                        setStudentSubject('');
                        setShowSubjectPicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        !studentSubject ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span>None / General</span>
                      {!studentSubject && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {STUDENT_SUBJECTS.map((subj) => (
                      <button
                        key={subj}
                        onClick={() => {
                          setStudentSubject(subj);
                          setShowSubjectPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                          studentSubject === subj ? 'bg-blue-600 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <span>{subj}</span>
                        {studentSubject === subj && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Custom Subject Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (customSubjectInput.trim()) {
                        setStudentSubject(customSubjectInput.trim());
                        setCustomSubjectInput('');
                        setShowSubjectPicker(false);
                      }
                    }}
                    className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={customSubjectInput}
                      onChange={(e) => setCustomSubjectInput(e.target.value)}
                      placeholder="Custom subject..."
                      className="flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-xs outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={!customSubjectInput.trim()}
                      className="px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-md disabled:opacity-40 hover:bg-neutral-800 transition"
                    >
                      Set
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Folder Assignment (Visible on desktop/larger screens; moved to Options menu on mobile) */}
          <div className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => {
                setShowFolderPicker(!showFolderPicker);
                setShowProjectPicker(false);
                setShowModePicker(false);
                setShowSubjectPicker(false);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 transition cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate max-w-[70px] sm:max-w-[120px]">
                {currentFolder ? currentFolder.name : 'Category'}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>

            {/* Desktop Folder Dropdown */}
            {showFolderPicker && (
              <div className="absolute left-0 top-9 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Category
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                  <button
                    onClick={() => {
                      setFolderId(undefined);
                      setShowFolderPicker(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                      !folderId ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
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
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        folderId === f.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span className="truncate">{f.name}</span>
                      {folderId === f.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleCreateCustomFolder}
                  className="mt-2 pt-2 border-t border-neutral-100 flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newFolderNameInput}
                    onChange={(e) => setNewFolderNameInput(e.target.value)}
                    placeholder="New category..."
                    className="flex-1 px-2 py-1 bg-neutral-50 border border-neutral-200 rounded-md text-xs outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    disabled={!newFolderNameInput.trim()}
                    className="px-2.5 py-1 bg-neutral-900 text-white text-xs font-medium rounded-md disabled:opacity-40 hover:bg-neutral-800 transition"
                  >
                    Add
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Project Assignment (if projects exist) */}
          {projects && projects.length > 0 && (
            <div className="relative shrink-0">
              <button
                onClick={() => {
                  setShowProjectPicker(!showProjectPicker);
                  setShowFolderPicker(false);
                  setShowModePicker(false);
                  setShowSubjectPicker(false);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  currentProject
                    ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                    : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate max-w-[70px] sm:max-w-[120px]">
                  {currentProject ? currentProject.name || currentProject.title : 'Project'}
                </span>
                <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {showProjectPicker && (
                <div className="absolute left-0 top-9 w-60 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-40 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                    Project
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                    <button
                      onClick={() => {
                        setProjectId(undefined);
                        setShowProjectPicker(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                        !projectId ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      <span>Standalone (No Project)</span>
                      {!projectId && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProjectId(p.id);
                          setShowProjectPicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                          projectId === p.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span>{p.icon || '📁'}</span>
                          <span>{p.name || p.title}</span>
                        </span>
                        {projectId === p.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Add Resource Contextual Action */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition cursor-pointer shadow-2xs"
              title="Add items to note"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Add</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {showAddMenu && (
              <div
                className="absolute right-0 top-9 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
                onClick={() => setShowAddMenu(false)}
              >
                {/* 1. STUDENT MODE TAILORED OPTIONS */}
                {noteMode === 'student' && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Student Tools
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('video')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      <span>YouTube / Lecture Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('question')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Important Q&A / Flashcard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('formula')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Key Formula / Equation</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('weblink')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Link2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Study Link / Research Paper</span>
                    </button>
                    <div className="border-t border-neutral-100 my-1" />
                  </>
                )}

                {/* 2. DEVELOPER MODE TAILORED OPTIONS */}
                {noteMode === 'developer' && (
                  <>
                    <div className="px-3 py-1 text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                      <Code className="w-3 h-3" /> Developer Tools
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('apikey')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Key className="w-3.5 h-3.5 text-purple-600" />
                      <span>API Key & Secret</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('prompt')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <MessageSquareCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>Prompt & AI Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('spec')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <FileCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>PRD & Spec Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('website')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-purple-600" />
                      <span>Website & Login Portal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('video')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Video className="w-3.5 h-3.5 text-purple-600" />
                      <span>Dev Video / Tutorial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAddResourceModal('weblink')}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                    >
                      <Link2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Tech Doc / Repo Link</span>
                    </button>
                    <div className="border-t border-neutral-100 my-1" />
                  </>
                )}

                {/* 3. GENERAL MEDIA & DRAWING OPTIONS */}
                <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Media & Visuals
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Attach Photo / Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSketchStudio(true)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                >
                  <PenTool className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Draw Hand Sketch</span>
                </button>
                {noteMode === 'normal' && (
                  <button
                    type="button"
                    onClick={() => setActiveAddResourceModal('weblink')}
                    className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2.5"
                  >
                    <Link2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Reference Link</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Save Status / Button */}
          <button
            id="editor-save-btn"
            onClick={handleManualSave}
            className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition inline-flex items-center gap-1 cursor-pointer border shrink-0 ${
              saveStatus === 'saving'
                ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
                : justSaved
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
            }`}
            title="Save note"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
                <span className="hidden sm:inline">Saving</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Saved</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>

          {/* Pin Button */}
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-1.5 rounded-lg transition cursor-pointer border shrink-0 ${
              isPinned
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800'
            }`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-600' : ''}`} />
          </button>

          {/* 3-Dot Options Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50 transition cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMoreMenu && (
              <div
                className="absolute right-0 top-9 w-48 bg-white border border-neutral-200 rounded-xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95"
                onClick={() => setShowMoreMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowFolderPicker(true);
                    setShowMoreMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Category</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-normal truncate max-w-[80px] bg-neutral-100 px-1.5 py-0.5 rounded">
                    {currentFolder ? currentFolder.name : 'None'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowTagPicker(!showTagPicker)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                >
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Manage Tags</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSketchStudio(true)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-100 flex items-center gap-2"
                >
                  <PenTool className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Sketch Studio</span>
                </button>
                {!isNewNote && (
                  <>
                    <div className="border-t border-neutral-100 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(noteId);
                        onClose();
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Delete Note</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tag Drawer */}
      {showTagPicker && (
        <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-600">Tags</span>
            <button
              onClick={() => setShowTagPicker(false)}
              className="text-neutral-400 hover:text-neutral-700 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleAddTag} className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="New tag..."
              className="flex-1 px-2.5 py-1 bg-white border border-neutral-200 rounded-md text-xs outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={!newTagInput.trim()}
              className="px-3 py-1 bg-neutral-900 text-white text-xs font-medium rounded-md disabled:opacity-40 hover:bg-neutral-800 transition cursor-pointer"
            >
              Add
            </button>
          </form>

          {/* Tags list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md bg-neutral-200/70 text-neutral-800"
                >
                  #{tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.name)}
                    className="hover:opacity-70 ml-0.5 text-neutral-500 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MAIN NOTE CONTENT CANVAS */}
      <div className="flex-1 px-3.5 sm:px-8 py-4 sm:py-6 max-w-4xl w-full mx-auto overflow-y-auto overflow-x-hidden space-y-3 sm:space-y-4">
        {/* Title Input */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            noteMode === 'student'
              ? 'Lecture / Study Note Title'
              : noteMode === 'developer'
              ? 'Architecture / Feature Note Title'
              : 'Title'
          }
          className="w-full text-xl sm:text-2xl font-bold text-neutral-900 placeholder-neutral-300 border-none outline-none bg-transparent"
        />

        {/* Student Subject Badge & Display Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
          {noteMode === 'student' && studentSubject && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <GraduationCap className="w-3 h-3" />
              {studentSubject}
            </span>
          )}

          {tags.length > 0 &&
            !showTagPicker &&
            tags.map((tag) => (
              <span
                key={tag.name}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600"
              >
                #{tag.name}
              </span>
            ))}
        </div>

        {/* Attached Photos Gallery */}
        {images.length > 0 && (
          <div className="space-y-1.5 pt-1 pb-2">
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> Attached Photos ({images.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {images.map((img, idx) => (
                <div
                  key={`img-${idx}`}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-video"
                >
                  <img
                    src={img}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition"
                    onClick={() => setPreviewImage(img)}
                  />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-neutral-900/70 hover:bg-neutral-900 text-white transition cursor-pointer"
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
            <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5" /> Sketches ({sketches.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {sketches.map((sketch, idx) => (
                <div
                  key={`sketch-${idx}`}
                  className="relative group rounded-xl overflow-hidden border border-neutral-200 bg-white aspect-4/3"
                >
                  <img
                    src={sketch}
                    alt={`Sketch ${idx + 1}`}
                    className="w-full h-full object-contain p-2 cursor-pointer hover:opacity-95 transition"
                    onClick={() => setPreviewImage(sketch)}
                  />
                  <button
                    onClick={() => handleRemoveSketch(idx)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-neutral-900/70 hover:bg-neutral-900 text-white transition cursor-pointer"
                    title="Remove sketch"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISUAL RICH TEXT & IN-NOTE TO-DO EDITOR */}
        <div className="relative min-h-[200px] flex flex-col">
          <div
            ref={editorRef}
            contentEditable
            onClick={handleEditorClick}
            onInput={handleEditorInput}
            onKeyDown={handleEditorKeyDown}
            data-placeholder={
              noteMode === 'student'
                ? 'Type your lecture summary, key concepts, or homework notes...'
                : noteMode === 'developer'
                ? 'Document technical requirements, architecture notes, or instructions...'
                : 'Start typing your note here...'
            }
            className="rich-note-editor flex-1 min-h-[200px] text-sm sm:text-base text-neutral-800 outline-none leading-relaxed font-normal empty:before:content-[attr(data-placeholder)] empty:before:text-neutral-300 empty:before:pointer-events-none"
          />
        </div>

        {/* UNIFIED RESOURCES & ATTACHMENTS MANAGER (ONLY RENDERS IF RESOURCES EXIST) */}
        <NoteResourcesManager
          apiKeys={apiKeys}
          promptBoxes={promptBoxes}
          specFiles={specFiles}
          devWebsites={devWebsites}
          devVideos={devVideos}
          youtubeLinks={youtubeLinks}
          webLinks={webLinks}
          importantQuestions={importantQuestions}
          quickFormulas={quickFormulas}
          onUpdateApiKeys={setApiKeys}
          onUpdatePromptBoxes={setPromptBoxes}
          onUpdateSpecFiles={setSpecFiles}
          onUpdateDevWebsites={setDevWebsites}
          onUpdateDevVideos={setDevVideos}
          onUpdateYoutubeLinks={setYoutubeLinks}
          onUpdateWebLinks={setWebLinks}
          onUpdateImportantQuestions={setImportantQuestions}
          onUpdateQuickFormulas={setQuickFormulas}
          activeAddType={activeAddResourceModal}
          onCloseAddType={() => setActiveAddResourceModal(null)}
        />
      </div>

      {/* HIGHLIGHT COLOR PALETTE POPUP */}
      {showHighlightColorStrip && (
        <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center justify-between gap-2 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500">Color:</span>
            <div className="flex items-center gap-2">
              {HIGHLIGHT_PALETTE.map((hc) => (
                <button
                  key={hc.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleApplyHighlight(hc);
                    setShowHighlightColorStrip(false);
                  }}
                  style={{ backgroundColor: hc.bg, color: hc.text, borderColor: hc.border }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition ${
                    activeHighlightColor.name === hc.name ? 'ring-2 ring-neutral-900' : ''
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
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. VISUAL RICH FORMATTING RIBBON TOOLBAR */}
      <div className="bg-white border-t border-neutral-200 px-2.5 sm:px-6 py-2 flex items-center justify-start gap-1 select-none overflow-x-auto shrink-0 scrollbar-none z-20">
        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('bold')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('italic')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('underline')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1 shrink-0" />

        {/* Text Highlighter */}
        <div className="flex items-center gap-0.5 bg-neutral-50 rounded-md p-0.5 border border-neutral-200 shrink-0">
          <button
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleApplyHighlight()}
            className="flex items-center gap-1 px-2 py-1 rounded text-neutral-700 hover:bg-white transition cursor-pointer text-xs font-medium"
            title="Highlight text"
          >
            <Highlighter className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Highlight</span>
            <span
              style={{ backgroundColor: activeHighlightColor.dot }}
              className="w-2 h-2 rounded-full inline-block"
            />
          </button>
          <button
            onPointerDown={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowHighlightColorStrip(!showHighlightColorStrip)}
            className="p-1 rounded text-neutral-500 hover:text-neutral-800 hover:bg-white transition"
            title="Choose color"
          >
            <Palette className="w-3 h-3" />
          </button>
        </div>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1 shrink-0" />

        {/* To-Do List Item Button */}
        <button
          id="editor-insert-todo-btn"
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertTodoItem}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 rounded-md text-xs font-medium transition cursor-pointer shrink-0"
          title="Insert In-Note Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5 text-neutral-600" />
          <span>Task</span>
        </button>

        <div className="w-[1px] h-4 bg-neutral-200 mx-1 shrink-0" />

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('formatBlock', '<h2>')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Heading"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertUnorderedList')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertOrderedList')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('formatBlock', '<blockquote>')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Quote Block"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => executeFormat('insertHorizontalRule')}
          className="p-1.5 rounded-md text-neutral-700 hover:bg-neutral-100 transition cursor-pointer shrink-0"
          title="Divider Line"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Category Selection Modal (Triggered via ⋮ Options on mobile) */}
      {showFolderPicker && (
        <div
          className="fixed inset-0 z-60 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:hidden animate-in fade-in duration-150"
          onClick={() => setShowFolderPicker(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-4 border border-neutral-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100 mb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-neutral-600" />
                <h3 className="text-sm font-semibold text-neutral-900">Select Category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFolderPicker(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 my-1 pr-0.5">
              <button
                type="button"
                onClick={() => {
                  setFolderId(undefined);
                  setShowFolderPicker(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                  !folderId ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700 bg-neutral-50'
                }`}
              >
                <span>Uncategorised</span>
                {!folderId && <Check className="w-4 h-4" />}
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setFolderId(f.id);
                    setShowFolderPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                    folderId === f.id ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-100 text-neutral-700 bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  {folderId === f.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleCreateCustomFolder}
              className="mt-3 pt-3 border-t border-neutral-100 flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newFolderNameInput}
                onChange={(e) => setNewFolderNameInput(e.target.value)}
                placeholder="New category..."
                className="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs outline-none focus:border-neutral-900"
              />
              <button
                type="submit"
                disabled={!newFolderNameInput.trim()}
                className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition shrink-0 cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SKETCH STUDIO MODAL */}
      <SketchCanvasModal
        isOpen={showSketchStudio}
        onClose={() => setShowSketchStudio(false)}
        onSaveSketch={handleSaveSketch}
      />

      {/* Fullscreen Photo / Sketch Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-70 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
