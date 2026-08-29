import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppMode, NoteItem, FolderItem, ProjectItem, AppBranding, AuthUser } from './types';
import { dbService } from './services/db';
import { subscribeToAuth } from './services/firebase';
import { firestoreSyncService } from './services/firestoreSync';
import { StorageProtectionBanner } from './components/StorageProtectionBanner';
import { AkNotesFileStructure } from './services/fileBackupService';
import { adminService } from './services/adminService';
import { ADS_SLIDES, INITIAL_PROJECTS } from './data/sampleData';
import { ModeSelector } from './components/ModeSelector';
import { SearchBar } from './components/SearchBar';
import { FolderChips } from './components/FolderChips';
import { AdsBanner } from './components/AdsBanner';
import { SkeletonNotesLoader } from './components/SkeletonLoader';
import { NotesMasonryGrid } from './components/NotesMasonryGrid';
import { EmptyState } from './components/EmptyState';
import { NoteEditor } from './components/NoteEditor';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { ProjectDetailView } from './components/projects/ProjectDetailView';
import { OldProjectsList } from './components/OldProjectsList';
import { MultiSelectActionBar } from './components/MultiSelectActionBar';
import { UndoSnackbar } from './components/UndoSnackbar';
import { FloatingActionButton } from './components/FloatingActionButton';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { ProfileView } from './components/ProfileView';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { NotesFileModal } from './components/NotesFileModal';
import { AuthModal } from './components/AuthModal';
import { TrashModal } from './components/TrashModal';
import { FeedbackModal } from './components/FeedbackModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SecretAdminAccessModal } from './components/SecretAdminAccessModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { QuickActions } from './components/QuickActions';
import { Plus, Smartphone, Monitor, User as UserIcon, Zap, Download } from 'lucide-react';

export default function App() {
  // State for notes & folders from IndexedDB
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [isLoading, setIsLoading] = useState(true);
  const [branding, setBranding] = useState<AppBranding>(adminService.getBranding());

  useEffect(() => {
    const unsubBrand = adminService.subscribeBranding((b) => {
      setBranding(b);
    });
    return () => {
      unsubBrand();
    };
  }, []);

  // Authentication & Cloud Sync
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [customAvatar, setCustomAvatar] = useState<string>(() => {
    return localStorage.getItem('projectnotes_custom_photo_url') || '';
  });
  const [customName, setCustomName] = useState<string>(() => {
    return localStorage.getItem('projectnotes_custom_display_name') || '';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotesFileModalOpen, setIsNotesFileModalOpen] = useState(false);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSecretPromptOpen, setIsSecretPromptOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check standalone mode and listen for PWA install prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      const handleAppInstalled = () => {
        setDeferredPrompt(null);
        setIsStandalone(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
  }, []);

  const logoClickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoClickCountRef = useRef<number>(0);

  // Brand interaction listener
  const handleBrandInteraction = () => {
    logoClickCountRef.current += 1;
    if (logoClickTimeoutRef.current) {
      clearTimeout(logoClickTimeoutRef.current);
    }

    if (logoClickCountRef.current >= 10) {
      logoClickCountRef.current = 0;
      setIsSecretPromptOpen(true);
      return;
    }

    logoClickTimeoutRef.current = setTimeout(() => {
      logoClickCountRef.current = 0;
    }, 3500);
  };

  // Filter & Mode state
  const [selectedMode, setSelectedMode] = useState<AppMode | 'all'>('normal');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'uncategorised' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Modals state
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [newNoteInitialType, setNewNoteInitialType] = useState<'text' | 'checklist' | 'sketch'>('text');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  // Undo deletion snackbar state
  const [undoState, setUndoState] = useState<{
    message: string;
    deletedNotes?: NoteItem[];
    deletedProject?: ProjectItem;
  } | null>(null);

  // Responsive frame toggle
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Load data from IndexedDB on startup
  useEffect(() => {
    async function loadData() {
      try {
        const [loadedNotes, loadedFolders, loadedProjects] = await Promise.all([
          dbService.getAllNotes(),
          dbService.getAllFolders(),
          dbService.getAllProjects(),
        ]);
        setNotes(loadedNotes || []);
        setFolders(loadedFolders || []);
        setProjects(loadedProjects || []);
      } catch (err) {
        console.error('Failed to load data from IndexedDB', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Default clean system/light UI
    document.documentElement.classList.remove('dark');

    // Auto-request browser notification permission on launch
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    // First-visit sign up prompt
    const hasSeenWelcome = localStorage.getItem('notebro_welcome_prompt');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        setIsAuthModalOpen(true);
        localStorage.setItem('notebro_welcome_prompt', 'true');
      }, 500);
    }

    // Listen for custom profile changes from profile tab
    const handleStorageChange = () => {
      const savedPhoto = localStorage.getItem('projectnotes_custom_photo_url');
      const savedName = localStorage.getItem('projectnotes_custom_display_name');
      if (savedPhoto !== null) setCustomAvatar(savedPhoto);
      if (savedName !== null) setCustomName(savedName);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const lastAuthUidRef = useRef<string | null | undefined>(undefined);

  // Listen to Auth state & Cloud Sync
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      const prevUid = lastAuthUidRef.current;
      const currentUid = user?.uid || null;
      lastAuthUidRef.current = currentUid;

      setCurrentUser(user);

      if (user) {
        if (user.photoURL) setCustomAvatar(user.photoURL);
        if (user.displayName) setCustomName(user.displayName);

        // If user changed accounts (from previous user to another user)
        if (prevUid !== undefined && prevUid !== null && prevUid !== currentUid) {
          await dbService.clearAllData();
          setNotes([]);
          setFolders([]);
          setProjects(INITIAL_PROJECTS);
        }
      } else {
        // User logged out / signed out
        if (prevUid !== undefined && prevUid !== null) {
          await dbService.clearAllData();
          setNotes([]);
          setFolders([]);
          setProjects(INITIAL_PROJECTS);
          setCustomAvatar('');
          setCustomName('');
          try {
            localStorage.removeItem('project_notes_cache');
            localStorage.removeItem('projects_cache');
            localStorage.removeItem('folders_cache');
            localStorage.removeItem('projectnotes_custom_display_name');
            localStorage.removeItem('projectnotes_custom_photo_url');
            localStorage.removeItem('projectnotes_custom_bio');
          } catch (_) {}
        }
      }

      firestoreSyncService.attachUser(
        user,
        async (remoteNotes) => {
          if (remoteNotes && remoteNotes.length > 0) {
            setNotes((prev) => {
              // Merge local notes with remote notes by ID to prevent overwriting un-synced offline edits
              const mergedMap = new Map<string, NoteItem>();
              prev.forEach((n) => mergedMap.set(n.id, n));
              remoteNotes.forEach((rn) => mergedMap.set(rn.id, rn));
              const merged = Array.from(mergedMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              try {
                localStorage.setItem('project_notes_cache', JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
            for (const n of remoteNotes) {
              await dbService.saveNote(n);
            }
          }
        },
        async (remoteFolders) => {
          if (remoteFolders && remoteFolders.length > 0) {
            setFolders((prev) => {
              const folderMap = new Map<string, FolderItem>();
              prev.forEach((f) => folderMap.set(f.id, f));
              remoteFolders.forEach((rf) => folderMap.set(rf.id, rf));
              return Array.from(folderMap.values());
            });
            for (const f of remoteFolders) {
              await dbService.saveFolder(f);
            }
          }
        },
        async (remoteProjects) => {
          if (remoteProjects && remoteProjects.length > 0) {
            setProjects((prev) => {
              const projMap = new Map<string, ProjectItem>();
              prev.forEach((p) => projMap.set(p.id, p));
              remoteProjects.forEach((rp) => projMap.set(rp.id, rp));
              const mergedProj = Array.from(projMap.values());
              try {
                localStorage.setItem('projects_cache', JSON.stringify(mergedProj));
              } catch (e) {}
              return mergedProj;
            });
            for (const p of remoteProjects) {
              await dbService.saveProject(p);
            }
          }
        }
      );
    });

    return unsubscribe;
  }, []);

  // Save notes changes
  const handleSaveNote = async (updatedNote: NoteItem) => {
    const noteWithUser: NoteItem = {
      ...updatedNote,
      userId: updatedNote.userId || currentUser?.uid || undefined,
      user_id: updatedNote.user_id || currentUser?.uid || undefined,
    };

    setNotes((prev) => {
      const exists = prev.some((n) => n.id === noteWithUser.id);
      const newNotes = exists
        ? prev.map((n) => (n.id === noteWithUser.id ? noteWithUser : n))
        : [noteWithUser, ...prev];
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(newNotes));
        if (currentUser?.uid) {
          localStorage.setItem(`user_notes_cache_${currentUser.uid}`, JSON.stringify(newNotes));
        }
      } catch (e) {}
      return newNotes;
    });
    await dbService.saveNote(noteWithUser);
    await firestoreSyncService.syncNote(noteWithUser);
  };

  // Delete note - Moved to 30-Day Trash Backup
  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find((n) => n.id === id);
    if (!noteToDelete) return;

    const trashedNote: NoteItem = {
      ...noteToDelete,
      isDeleted: true,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? trashedNote : n));
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    await dbService.saveNote(trashedNote);
    firestoreSyncService.syncNote(trashedNote);

    setUndoState({
      message: `Note moved to 30-Day Trash`,
      deletedNotes: [noteToDelete],
    });
  };

  // Restore note from Trash
  const handleRestoreNote = async (trashedNote: NoteItem) => {
    const restored: NoteItem = {
      ...trashedNote,
      isDeleted: false,
      deletedAt: undefined,
      updatedAt: Date.now(),
    };
    await handleSaveNote(restored);
  };

  // Permanent Delete single note
  const handlePermanentDeleteNote = async (noteId: string) => {
    setNotes((prev) => {
      const filtered = prev.filter((n) => n.id !== noteId);
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    await dbService.deleteNote(noteId);
    firestoreSyncService.syncDeleteNote(noteId);
  };

  // Empty entire Trash
  const handleEmptyTrash = async () => {
    const trashed = notes.filter((n) => n.isDeleted);
    setNotes((prev) => {
      const activeOnly = prev.filter((n) => !n.isDeleted);
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(activeOnly));
      } catch (e) {}
      return activeOnly;
    });
    for (const n of trashed) {
      await dbService.deleteNote(n.id);
      firestoreSyncService.syncDeleteNote(n.id);
    }
  };

  // Toggle Pin on note
  const handleTogglePinNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned, updatedAt: Date.now() };
    await handleSaveNote(updated);
  };

  // Toggle Archive on note (Safe storage preservation)
  const handleToggleArchiveNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const willArchive = !note.isArchived;
    const updated = { ...note, isArchived: willArchive, updatedAt: Date.now() };
    await handleSaveNote(updated);
    setUndoState({
      message: willArchive ? 'Note moved to Archive' : 'Note restored from archive',
      deletedNotes: [note],
    });
  };

  // Toggle checklist item
  const handleToggleChecklistItem = async (
    noteId: string,
    itemId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const updatedChecklist = note.checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updated = {
      ...note,
      checklistItems: updatedChecklist,
      updatedAt: Date.now(),
    };
    await handleSaveNote(updated);
  };

  // Save Project
  const handleSaveProject = async (newProjData: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: ProjectItem = {
      tasks: [],
      files: [],
      links: [],
      tags: [],
      ...newProjData,
      id: `proj-${Date.now()}`,
      userId: currentUser?.uid || undefined,
      user_id: currentUser?.uid || undefined,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      activities:
        newProjData.activities && newProjData.activities.length > 0
          ? newProjData.activities
          : [
              {
                id: `act-${Date.now()}`,
                projectId: `proj-${Date.now()}`,
                action: 'created',
                description: `Created project "${newProjData.name || newProjData.title}"`,
                timestamp: Date.now(),
              },
            ],
    };

    setProjects((prev) => {
      const updated = [newProject, ...prev];
      try {
        localStorage.setItem('projects_cache', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    await dbService.saveProject(newProject);
    await firestoreSyncService.syncProject(newProject);
  };

  // Duplicate Project
  const handleDuplicateProject = async (proj: ProjectItem) => {
    const newId = `proj-${Date.now()}`;
    const duplicated: ProjectItem = {
      ...proj,
      id: newId,
      title: `${proj.title || proj.name} (Copy)`,
      name: proj.name ? `${proj.name} (Copy)` : undefined,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      activities: [
        {
          id: `act-${Date.now()}`,
          projectId: newId,
          action: 'created',
          description: `Duplicated project from "${proj.title || proj.name}"`,
          timestamp: Date.now(),
        },
      ],
    };
    await handleSaveProject(duplicated);
  };

  // Delete project from detail view with optional cascading note deletion
  const handleDeleteProjectFromDetail = async (id: string, deleteAssociatedNotes?: boolean) => {
    if (deleteAssociatedNotes) {
      const associatedNotes = notes.filter((n) => n.projectId === id);
      for (const note of associatedNotes) {
        await handleDeleteNote(note.id);
      }
    } else {
      const associatedNotes = notes.filter((n) => n.projectId === id);
      for (const note of associatedNotes) {
        await handleSaveNote({ ...note, projectId: undefined, updatedAt: Date.now() });
      }
    }
    await handleDeleteProject(id);
    setSelectedProject(null);
  };

  // Create new note directly linked inside a project
  const handleCreateNoteInProject = (projId: string) => {
    setNewNoteInitialType('text');
    setEditingNote({
      id: `note-${Date.now()}`,
      type: 'text',
      title: '',
      body: '',
      projectId: projId,
      checklistItems: [],
      tags: [],
      images: [],
      sketches: [],
      isPinned: false,
      mode: selectedMode === 'all' ? 'normal' : selectedMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsCreatingNewNote(true);
  };

  // Update existing Project
  const handleUpdateProject = async (updatedProject: ProjectItem) => {
    const projectWithUser: ProjectItem = {
      ...updatedProject,
      userId: updatedProject.userId || currentUser?.uid || undefined,
      user_id: updatedProject.user_id || currentUser?.uid || undefined,
    };

    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === projectWithUser.id ? projectWithUser : p));
      try {
        localStorage.setItem('projects_cache', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSelectedProject(projectWithUser);
    await dbService.saveProject(projectWithUser);
    await firestoreSyncService.syncProject(projectWithUser);
  };

  // Delete Project with undo
  const handleDeleteProject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const projToDelete = projects.find((p) => p.id === id);
    if (!projToDelete) return;

    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem('projects_cache', JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });

    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }

    await dbService.deleteProject(id);
    await firestoreSyncService.syncDeleteProject(id);

    setUndoState({
      message: `Project "${projToDelete.title}" deleted`,
      deletedProject: projToDelete,
    });
  };

  // Toggle Pin on Project
  const handleTogglePinProject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;

    const updated = { ...proj, isPinned: !proj.isPinned, updatedAt: 'Just now' };
    await handleUpdateProject(updated);
  };

  // Undo delete
  const handleUndo = async () => {
    if (!undoState) return;
    if (undoState.deletedNotes) {
      for (const note of undoState.deletedNotes) {
        await handleSaveNote(note);
      }
    }
    if (undoState.deletedProject) {
      await handleUpdateProject(undoState.deletedProject);
    }
    setUndoState(null);
  };

  // Folder management
  const handleCreateFolder = async (name: string): Promise<FolderItem> => {
    const newFolder: FolderItem = {
      id: `folder-${Date.now()}`,
      userId: currentUser?.uid || undefined,
      user_id: currentUser?.uid || undefined,
      name,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    await dbService.saveFolder(newFolder);
    await firestoreSyncService.syncFolder(newFolder);
    setSelectedFolderId(newFolder.id);
    return newFolder;
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    const updated = { ...folder, name: newName };
    setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)));
    await dbService.saveFolder(updated);
    await firestoreSyncService.syncFolder(updated);
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folderToDelete = folders.find((f) => f.id === folderId);
    if (!folderToDelete) return;

    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: undefined } : n))
    );
    await dbService.deleteFolder(folderId);
    firestoreSyncService.syncDeleteFolder(folderId);
    if (selectedFolderId === folderId) {
      setSelectedFolderId('all');
    }
  };

  // Multi-select handlers
  const handleStartMultiSelect = (note: NoteItem) => {
    setIsMultiSelectMode(true);
    setSelectedNoteIds([note.id]);
  };

  const handleToggleSelectNote = (id: string) => {
    if (selectedNoteIds.includes(id)) {
      const updated = selectedNoteIds.filter((item) => item !== id);
      setSelectedNoteIds(updated);
      if (updated.length === 0) {
        setIsMultiSelectMode(false);
      }
    } else {
      setSelectedNoteIds([...selectedNoteIds, id]);
    }
  };

  const handleCancelMultiSelect = () => {
    setIsMultiSelectMode(false);
    setSelectedNoteIds([]);
  };

  const handleDeleteSelected = async () => {
    const toDelete = notes.filter((n) => selectedNoteIds.includes(n.id));
    const trashedList: NoteItem[] = [];

    setNotes((prev) => {
      const updated = prev.map((n) => {
        if (selectedNoteIds.includes(n.id)) {
          const tr = {
            ...n,
            isDeleted: true,
            deletedAt: Date.now(),
            updatedAt: Date.now(),
          };
          trashedList.push(tr);
          return tr;
        }
        return n;
      });
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    for (const item of trashedList) {
      await dbService.saveNote(item);
      firestoreSyncService.syncNote(item);
    }

    setUndoState({
      message: `${selectedNoteIds.length} notes moved to 30-day Trash`,
      deletedNotes: toDelete,
    });
    handleCancelMultiSelect();
  };

  const handleTogglePinSelected = async () => {
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    const allPinned = selectedNotes.every((n) => n.isPinned);
    const targetPin = !allPinned;

    for (const n of selectedNotes) {
      await handleSaveNote({ ...n, isPinned: targetPin, updatedAt: Date.now() });
    }
    handleCancelMultiSelect();
  };

  const handleArchiveSelected = async () => {
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    const allArchived = selectedNotes.every((n) => n.isArchived);
    const targetArchived = !allArchived;

    for (const n of selectedNotes) {
      await handleSaveNote({ ...n, isArchived: targetArchived, updatedAt: Date.now() });
    }
    setUndoState({
      message: targetArchived
        ? `${selectedNoteIds.length} notes archived`
        : `${selectedNoteIds.length} notes restored`,
      deletedNotes: selectedNotes,
    });
    handleCancelMultiSelect();
  };

  const handleMoveSelectedToFolder = async (folderId: string | undefined) => {
    const selectedNotes = notes.filter((n) => selectedNoteIds.includes(n.id));
    for (const n of selectedNotes) {
      await handleSaveNote({ ...n, folderId, updatedAt: Date.now() });
    }
    handleCancelMultiSelect();
  };

  // Trashed notes for 30-day backup
  const trashedNotes = useMemo(() => notes.filter((n) => n.isDeleted), [notes]);
  const activeNotes = useMemo(() => notes.filter((n) => !n.isDeleted), [notes]);
  const folderMap = useMemo(() => new Map(folders.map((f) => [f.id, f.name])), [folders]);

  // Folder counts in current active mode
  const folderCounts = useMemo(() => {
    const unarchivedNotes = activeNotes.filter((n) => {
      if (n.isArchived) return false;
      if (selectedMode !== 'all' && n.mode && n.mode !== selectedMode) return false;
      return true;
    });

    const counts: Record<string, number> = {
      all: unarchivedNotes.length,
      uncategorised: 0,
      archived: activeNotes.filter((n) => n.isArchived && (selectedMode === 'all' || !n.mode || n.mode === selectedMode)).length,
    };

    folders.forEach((f) => {
      counts[f.id] = 0;
    });

    unarchivedNotes.forEach((n) => {
      if (n.folderId && counts[n.folderId] !== undefined) {
        counts[n.folderId]++;
      } else {
        counts['uncategorised']++;
      }
    });

    return counts;
  }, [activeNotes, folders, selectedMode]);

  // If active selected folder count dropped to 0, automatically reset to 'all'
  useEffect(() => {
    if (selectedFolderId !== 'all' && selectedFolderId !== 'uncategorised' && selectedFolderId !== 'archived') {
      if ((folderCounts[selectedFolderId] || 0) === 0) {
        setSelectedFolderId('all');
      }
    }
  }, [folderCounts, selectedFolderId]);

  // Unique tags
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    activeNotes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t.name)));
    projects.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [activeNotes, projects]);

  // Filtered Projects for Old Projects carousel
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      if (selectedMode !== 'all' && proj.mode !== selectedMode) {
        return false;
      }
      if (selectedTag && !proj.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = proj.title.toLowerCase().includes(q);
        const mSub = proj.subtitle?.toLowerCase().includes(q);
        const mDesc = proj.description.toLowerCase().includes(q);
        const mTag = proj.tags?.some((t) => t.toLowerCase().includes(q));
        if (!mTitle && !mSub && !mDesc && !mTag) return false;
      }
      return true;
    });
  }, [projects, selectedMode, selectedTag, searchQuery]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return activeNotes.filter((note) => {
      if (selectedMode !== 'all' && note.mode && note.mode !== selectedMode) {
        return false;
      }
      if (selectedFolderId === 'archived') {
        if (!note.isArchived) return false;
      } else {
        if (note.isArchived) return false;
        if (selectedFolderId === 'uncategorised') {
          if (note.folderId) return false;
        } else if (selectedFolderId !== 'all') {
          if (note.folderId !== selectedFolderId) return false;
        }
      }
      if (selectedTag) {
        if (!note.tags || !note.tags.some((t) => t.name.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesBody = note.body.toLowerCase().includes(query);
        const matchesChecklist = note.checklistItems?.some((item) =>
          item.text.toLowerCase().includes(query)
        );
        const matchesTag = note.tags?.some((t) => t.name.toLowerCase().includes(query));
        if (!matchesTitle && !matchesBody && !matchesChecklist && !matchesTag) {
          return false;
        }
      }
      return true;
    });
  }, [activeNotes, selectedMode, selectedFolderId, selectedTag, searchQuery]);

  const allSelectedPinned = useMemo(() => {
    const sel = activeNotes.filter((n) => selectedNoteIds.includes(n.id));
    return sel.length > 0 && sel.every((n) => n.isPinned);
  }, [activeNotes, selectedNoteIds]);

  // Handle .aknotes or JSON import from modals
  const handleImportNotesPackage = async (importedNotes: NoteItem[], importedFolders?: FolderItem[]) => {
    setNotes((prev) => {
      const mergedMap = new Map<string, NoteItem>();
      prev.forEach((n) => mergedMap.set(n.id, n));
      importedNotes.forEach((n) => mergedMap.set(n.id, n));
      return Array.from(mergedMap.values());
    });

    for (const n of importedNotes) {
      await dbService.saveNote(n);
      firestoreSyncService.syncNote(n);
    }

    if (importedFolders && importedFolders.length > 0) {
      setFolders((prev) => {
        const fMap = new Map<string, FolderItem>();
        prev.forEach((f) => fMap.set(f.id, f));
        importedFolders.forEach((f) => fMap.set(f.id, f));
        return Array.from(fMap.values());
      });
      for (const f of importedFolders) {
        await dbService.saveFolder(f);
        firestoreSyncService.syncFolder(f);
      }
    }
  };

  const handleImportFileStructure = (data: AkNotesFileStructure) => {
    if (data.notes) {
      handleImportNotesPackage(data.notes, data.folders);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-neutral-900 flex flex-col items-center justify-start antialiased py-0 sm:py-6 selection:bg-neutral-900 selection:text-white">
      {/* RISK 2/3/4: Storage Persistence, Incognito, Low Space, Write Error Banners */}
      <StorageProtectionBanner onOpenBackupModal={() => setIsBackupModalOpen(true)} />

      {/* Viewport Container */}
      <div
        className={`w-full bg-white flex flex-col justify-between shadow-xl transition-all duration-300 relative ${
          isMobileFrame
            ? 'max-w-[420px] min-h-[850px] rounded-[44px] border-[12px] border-neutral-900 ring-8 ring-neutral-200/80 my-2 overflow-hidden'
            : 'w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-screen sm:min-h-[880px] sm:my-3 sm:rounded-3xl sm:border sm:border-neutral-200/90 sm:shadow-2xl overflow-hidden'
        }`}
      >
        {/* Clean iOS / Linear Top Header */}
        <header className="w-full h-14 sm:h-15 px-4 sm:px-6 flex items-center justify-between border-b border-[#E5E7EB] bg-white sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Custom App Mark / Brand Logo - 10 clicks unlocks hidden control panel */}
            <button
              type="button"
              onClick={handleBrandInteraction}
              className="w-9 h-9 rounded-lg bg-[#111827] flex items-center justify-center text-white shrink-0 shadow-none overflow-hidden border border-slate-200 cursor-pointer active:scale-95 transition select-none"
              title="Note Bro"
            >
              {branding.logoUrl || '/app-logo.png' ? (
                <img
                  src={branding.logoUrl || '/app-logo.png'}
                  alt={branding.appName || 'Logo'}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <span className="font-bold text-xs leading-none select-none tracking-tight">NB</span>
              )}
            </button>
            {/* Title stack, vertically centered with the mark */}
            <div className="flex flex-col justify-center select-none">
              <h1 className="text-[17px] font-semibold tracking-[-0.2px] text-[#111827] leading-tight">
                {branding.appName || 'Note Bro'}
              </h1>
              <span className="text-[12px] text-[#9CA3AF] font-normal leading-tight">
                Workspace
              </span>
            </div>
          </div>

          {/* Right: Header Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Install App Button (Visible when not in standalone mode) */}
            {!isStandalone && (
              <button
                type="button"
                id="header-install-app-btn"
                onClick={() => setIsInstallModalOpen(true)}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl sm:rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shrink-0 active:scale-95 text-xs font-bold"
                title="Install Note Bro App (Full Screen Native Mode)"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden xs:inline text-[11px] font-semibold">Install App</span>
              </button>
            )}

            {/* Profile Button */}
            <button
              type="button"
              id="header-profile-btn"
              onClick={() => setActiveTab('profile')}
              className="w-9 h-9 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] flex items-center justify-center transition cursor-pointer border border-[#E5E7EB] shrink-0 active:scale-95 overflow-hidden"
              title="Open Profile & Cloud Sync"
            >
              {customAvatar || currentUser?.photoURL ? (
                <img
                  src={customAvatar || currentUser?.photoURL || ''}
                  alt={customName || currentUser?.displayName || 'User'}
                  className="w-9 h-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (customName || currentUser?.displayName) ? (
                <span className="text-xs font-semibold text-[#111827]">
                  {(customName || currentUser?.displayName || 'U').charAt(0).toUpperCase()}
                </span>
              ) : currentUser?.email ? (
                <span className="text-xs font-semibold text-[#111827]">
                  {currentUser.email.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon className="w-4 h-4 text-[#6B7280]" />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Main Viewport */}
        <main className={`flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-5 overflow-y-auto pb-32 sm:pb-36 ${activeTab === 'profile' ? 'bg-[#F5F5F7]' : 'bg-white'}`}>
          {selectedProject ? (
            <ProjectDetailView
              project={selectedProject}
              notes={notes}
              folders={folders}
              onBack={() => setSelectedProject(null)}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProjectFromDetail}
              onOpenNote={(note) => setEditingNote(note)}
              onCreateNote={handleCreateNoteInProject}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onDuplicateProject={handleDuplicateProject}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  {/* 1. Top Mode Switcher (Normal | Student | Developer | Build) */}
                  <section id="mode-switcher-section">
                    <ModeSelector
                      selectedMode={selectedMode}
                      onSelectMode={setSelectedMode}
                    />
                  </section>

                  {/* 2. Full-Width Search Bar */}
                  <section id="search-section">
                    <SearchBar
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      selectedMode={selectedMode}
                      onSelectMode={setSelectedMode}
                      selectedTag={selectedTag}
                      onSelectTag={setSelectedTag}
                      availableTags={availableTags}
                    />
                  </section>

                  {/* Quick Actions (Adapted directly in Light Theme from requested UI) */}
                  <section id="quick-actions-section">
                    <QuickActions
                      onNewNote={() => {
                        setNewNoteInitialType('text');
                        setIsCreatingNewNote(true);
                      }}
                      onNewProject={() => {
                        setIsNewProjectModalOpen(true);
                      }}
                      onNewTag={(newTagName) => {
                        setSelectedTag(newTagName);
                      }}
                      onImport={() => {
                        setIsNotesFileModalOpen(true);
                      }}
                      onViewAll={() => {
                        setActiveTab('projects');
                      }}
                    />
                  </section>

                  {/* 3. Category / Folder Chips */}
                  <section id="folder-chips-section">
                    <FolderChips
                      folders={folders}
                      selectedFolderId={selectedFolderId}
                      onSelectFolder={setSelectedFolderId}
                      onCreateFolder={handleCreateFolder}
                      onRenameFolder={handleRenameFolder}
                      onDeleteFolder={handleDeleteFolder}
                      folderCounts={folderCounts}
                    />
                  </section>

                  {/* 4. Ads / Tips Banner Carousel (Controlled via Admin Panel, Default: Hidden) */}
                  {branding.showAdsBanner && (
                    <section id="ads-banner-section">
                      <AdsBanner slides={ADS_SLIDES} />
                    </section>
                  )}

                  {/* Active tag filter banner if filtered */}
                  {selectedTag && (
                    <div className="flex items-center justify-between bg-[#F2F4F7] px-3.5 py-2 rounded-xl text-xs">
                      <span className="font-semibold text-neutral-700">
                        Filtered by tag: <strong className="text-neutral-900">#{selectedTag}</strong>
                      </span>
                      <button
                        onClick={() => setSelectedTag(null)}
                        className="text-neutral-500 hover:text-neutral-900 font-bold text-[11px] cursor-pointer"
                      >
                        Clear tag
                      </button>
                    </div>
                  )}

                  {/* 5. Notes Area (2-Column Masonry Grid, Skeleton Loader, or Centered Empty State) */}
                  <section id="notes-grid-section">
                    {isLoading ? (
                      <SkeletonNotesLoader />
                    ) : filteredNotes.length > 0 ? (
                      <NotesMasonryGrid
                        notes={filteredNotes}
                        folders={folders}
                        isMultiSelectMode={isMultiSelectMode}
                        selectedNoteIds={selectedNoteIds}
                        onSelectNote={(note) => setEditingNote(note)}
                        onToggleSelectNote={handleToggleSelectNote}
                        onDeleteNote={handleDeleteNote}
                        onToggleArchiveNote={handleToggleArchiveNote}
                        onTogglePinNote={handleTogglePinNote}
                        onToggleChecklistItem={handleToggleChecklistItem}
                        onTagClick={(tag) => setSelectedTag(tag === selectedTag ? null : tag)}
                        onLongPressNote={handleStartMultiSelect}
                      />
                    ) : (
                      <EmptyState
                        hasFilter={Boolean(searchQuery || selectedTag || selectedFolderId !== 'all')}
                        onClearFilter={() => {
                          setSearchQuery('');
                          setSelectedTag(null);
                          setSelectedFolderId('all');
                        }}
                        onCreateNote={(type) => {
                          setNewNoteInitialType(type);
                          setIsCreatingNewNote(true);
                        }}
                      />
                    )}
                  </section>
                </>
              )}

              {/* Workspace Tab: Full Projects & Notes Explorer */}
              {activeTab === 'projects' && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-neutral-900">All Projects & Notes</h2>
                      <p className="text-xs text-neutral-500">
                        {projects.length} projects • {notes.length} notes
                      </p>
                    </div>
                    <button
                      onClick={() => setIsNewProjectModalOpen(true)}
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Project</span>
                    </button>
                  </div>

                  {/* Old Projects in Workspace */}
                  <OldProjectsList
                    projects={projects}
                    onSelectProject={(p) => setSelectedProject(p)}
                    onDeleteProject={handleDeleteProject}
                    onTogglePin={handleTogglePinProject}
                  />

                  {/* Notes in Workspace */}
                  <div className="pt-2">
                    <h3 className="text-sm font-bold text-neutral-900 mb-2">Saved Notes</h3>
                    <NotesMasonryGrid
                      notes={activeNotes}
                      folders={folders}
                      isMultiSelectMode={isMultiSelectMode}
                      selectedNoteIds={selectedNoteIds}
                      onSelectNote={(note) => setEditingNote(note)}
                      onToggleSelectNote={handleToggleSelectNote}
                      onDeleteNote={handleDeleteNote}
                      onToggleArchiveNote={handleToggleArchiveNote}
                      onTogglePinNote={handleTogglePinNote}
                      onToggleChecklistItem={handleToggleChecklistItem}
                      onTagClick={(tag) => setSelectedTag(tag)}
                      onLongPressNote={handleStartMultiSelect}
                    />
                  </div>
                </section>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <ProfileView
                  notes={activeNotes}
                  trashedNotes={trashedNotes}
                  folders={folders}
                  currentUser={currentUser}
                  selectedMode={selectedMode}
                  onSelectMode={setSelectedMode}
                  onImportData={handleImportNotesPackage}
                  onUserLoggedOut={() => {
                    setNotes([]);
                    setFolders([]);
                    setProjects(INITIAL_PROJECTS);
                  }}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onOpenNotesFileModal={() => setIsNotesFileModalOpen(true)}
                  onOpenTrashModal={() => setIsTrashModalOpen(true)}
                  onOpenFeedbackModal={() => setIsFeedbackModalOpen(true)}
                  onOpenAdminModal={() => setIsAdminModalOpen(true)}
                  onOpenInstallModal={() => setIsInstallModalOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {/* Floating Action Button (Warm Golden-Amber MIUI/Android '+' Button) */}
        {!isMultiSelectMode && !editingNote && !isCreatingNewNote && !selectedProject && activeTab === 'home' && (
          <FloatingActionButton
            onCreateNote={(type) => {
              setNewNoteInitialType(type);
              setIsCreatingNewNote(true);
            }}
          />
        )}

        {/* Multi-Select Action Bar */}
        {isMultiSelectMode && (
          <MultiSelectActionBar
            selectedCount={selectedNoteIds.length}
            allPinned={allSelectedPinned}
            folders={folders}
            onTogglePinSelected={handleTogglePinSelected}
            onArchiveSelected={handleArchiveSelected}
            onDeleteSelected={handleDeleteSelected}
            onMoveSelectedToFolder={handleMoveSelectedToFolder}
            onCancel={handleCancelMultiSelect}
          />
        )}

        {/* Undo Snackbar */}
        {undoState && (
          <UndoSnackbar
            message={undoState.message}
            onUndo={handleUndo}
            onDismiss={() => setUndoState(null)}
          />
        )}

        {/* Bottom Navigation Bar — Fixed at bottom across all views */}
        <footer className="fixed bottom-0 left-0 right-0 z-30 w-full flex justify-center pointer-events-none">
          <div className="w-full max-w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl pointer-events-auto">
            <BottomNav
              activeTab={activeTab}
              onTabChange={(tab) => {
                setSelectedProject(null);
                setActiveTab(tab);
              }}
              notesCount={activeNotes.length}
              projectsCount={projects.length}
            />
          </div>
        </footer>
      </div>

      {/* New Project Creation Modal */}
      <CreateProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSave={handleSaveProject}
        initialMode={selectedMode === 'all' ? 'normal' : selectedMode}
      />

      {/* Note Editor Overlay */}
      {(editingNote || isCreatingNewNote) && (
        <NoteEditor
          initialNote={editingNote}
          initialType={newNoteInitialType}
          folders={folders}
          projects={projects}
          currentFolderId={selectedFolderId}
          currentProjectId={editingNote?.projectId || selectedProject?.id}
          currentMode={selectedMode === 'all' ? 'normal' : selectedMode}
          onClose={() => {
            setEditingNote(null);
            setIsCreatingNewNote(false);
          }}
          onSave={handleSaveNote}
          onDelete={handleDeleteNote}
          onCreateFolder={handleCreateFolder}
        />
      )}

      {/* Auth Modal (Account Login / Signup) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserLoggedOut={() => {
          setNotes([]);
          setProjects([]);
        }}
      />

      {/* .aknotes Offline File Management Modal */}
      <NotesFileModal
        isOpen={isNotesFileModalOpen}
        onClose={() => setIsNotesFileModalOpen(false)}
        notes={notes}
        folders={folders}
        projects={projects}
        userId={currentUser?.uid}
        onImportNotes={handleImportFileStructure}
      />

      {/* Trash & 30-Day Recycle Bin Modal */}
      <TrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        trashedNotes={trashedNotes}
        onRestoreNote={handleRestoreNote}
        onPermanentDeleteNote={handlePermanentDeleteNote}
        onEmptyTrash={handleEmptyTrash}
        folderMap={folderMap}
      />

      {/* Feedback / Bug & Idea Submission Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Admin Control Console Modal */}
      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        currentUser={currentUser}
        totalNotesCount={notes.length}
      />

      {/* Secret Passcode Prompt Triggered by 10 Clicks on Logo */}
      <SecretAdminAccessModal
        isOpen={isSecretPromptOpen}
        onClose={() => setIsSecretPromptOpen(false)}
        onSuccessUnlock={() => setIsAdminModalOpen(true)}
      />

      {/* PWA Direct Installation & Full-Screen Guide Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => {
          setIsStandalone(true);
        }}
      />

      {/* Zero Data Loss & Storage Backup/Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={async () => {
          const freshNotes = await dbService.getAllNotes();
          const freshFolders = await dbService.getAllFolders();
          const freshProjects = await dbService.getAllProjects();
          setNotes(freshNotes);
          setFolders(freshFolders);
          setProjects(freshProjects);
        }}
      />
    </div>
  );
}
