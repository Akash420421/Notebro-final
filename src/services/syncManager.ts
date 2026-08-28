import { supabase } from './supabase';
import { localStore } from './localStore';
import { NoteItem, FolderItem, ProjectItem, AuthUser } from '../types';

export type SyncManagerStatus = 'synced' | 'saving' | 'offline' | 'pending_local' | 'error';

export type SyncStatusListener = (status: SyncManagerStatus, pendingCount: number) => void;

function cleanPayload(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

class SyncManagerService {
  private activeUser: AuthUser | null = null;
  private currentStatus: SyncManagerStatus = 'synced';
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<SyncStatusListener> = new Set();
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.updateStatus('saving');
        this.flushPendingSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.updateStatus('offline');
      });

      // Background periodic sync every 30 seconds
      this.syncTimer = setInterval(() => {
        if (this.isOnline && this.activeUser) {
          this.flushPendingSync();
        }
      }, 30000);
    }
  }

  public subscribeStatus(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus(), this.getPendingNotesCount());
    return () => this.listeners.delete(listener);
  }

  private pendingCountCache: number = 0;

  private async updatePendingCount() {
    try {
      const allNotes = await localStore.getAllNotes();
      const pending = allNotes.filter((n) => n.syncStatus === 'pending');
      this.pendingCountCache = pending.length;
    } catch {
      this.pendingCountCache = 0;
    }
  }

  private updateStatus(status: SyncManagerStatus) {
    this.currentStatus = status;
    this.notify();
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((fn) => {
      try {
        fn(status, this.pendingCountCache);
      } catch (e) {}
    });
  }

  public getStatus(): SyncManagerStatus {
    if (!this.isOnline) return 'offline';
    if (this.pendingCountCache > 0 && this.currentStatus !== 'saving') return 'pending_local';
    return this.currentStatus;
  }

  public getPendingNotesCount(): number {
    return this.pendingCountCache;
  }

  public getActiveUser(): AuthUser | null {
    return this.activeUser;
  }

  /**
   * Attach authenticated user and run initial reconcile
   */
  public attachUser(
    user: AuthUser | null,
    onRemoteNotesUpdate?: (notes: NoteItem[]) => void,
    onRemoteFoldersUpdate?: (folders: FolderItem[]) => void,
    onRemoteProjectsUpdate?: (projects: ProjectItem[]) => void
  ) {
    this.activeUser = user;

    if (!user) {
      this.updateStatus('synced');
      return;
    }

    // Pull from Supabase in background without blocking UI
    this.reconcileWithRemote(onRemoteNotesUpdate, onRemoteFoldersUpdate, onRemoteProjectsUpdate);
  }

  /**
   * Pull latest changes from Supabase and merge with Local-First guarantees
   */
  public async reconcileWithRemote(
    onRemoteNotesUpdate?: (notes: NoteItem[]) => void,
    onRemoteFoldersUpdate?: (folders: FolderItem[]) => void,
    onRemoteProjectsUpdate?: (projects: ProjectItem[]) => void
  ) {
    if (!this.activeUser || !this.isOnline) return;

    try {
      this.updateStatus('saving');
      const userId = this.activeUser.uid;

      // 1. Fetch Remote Notes for user
      const { data: remoteData, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId);

      if (!error && Array.isArray(remoteData)) {
        const localNotes = await localStore.getAllNotes();
        const localMap = new Map<string, NoteItem>();
        localNotes.forEach((n) => localMap.set(n.id, n));

        const updatedNotesList: NoteItem[] = [];

        for (const item of remoteData) {
          const rawNote = item.note_data ? item.note_data : item;
          const remoteNote: NoteItem = {
            id: item.id || rawNote.id,
            type: rawNote.type || 'text',
            title: rawNote.title || 'Untitled',
            body: rawNote.body || '',
            checklistItems: rawNote.checklistItems || [],
            images: rawNote.images || [],
            sketches: rawNote.sketches || [],
            youtubeLinks: rawNote.youtubeLinks || [],
            webLinks: rawNote.webLinks || [],
            importantQuestions: rawNote.importantQuestions || [],
            studentSubject: rawNote.studentSubject,
            quickFormulas: rawNote.quickFormulas,
            apiKeys: rawNote.apiKeys,
            promptBoxes: rawNote.promptBoxes,
            specFiles: rawNote.specFiles,
            devWebsites: rawNote.devWebsites,
            devVideos: rawNote.devVideos,
            folderId: rawNote.folderId,
            tags: rawNote.tags || [],
            isPinned: !!rawNote.isPinned,
            isArchived: !!rawNote.isArchived,
            isDeleted: !!rawNote.isDeleted,
            deletedAt: rawNote.deletedAt,
            color: rawNote.color,
            mode: rawNote.mode || 'normal',
            createdAt: rawNote.createdAt || Date.now(),
            updatedAt: rawNote.updatedAt || Date.now(),
            syncStatus: 'synced',
          };

          const local = localMap.get(remoteNote.id);

          if (!local) {
            // New remote note: save to local store
            await localStore.saveNote(remoteNote);
            updatedNotesList.push(remoteNote);
          } else {
            // RISK 6: Local Unsynced Changes NEVER Overwritten
            if (local.syncStatus === 'pending') {
              // Local has unsynced changes. Local wins.
              // If remote was also updated newer than local baseline, archive conflict
              if (remoteNote.updatedAt > local.updatedAt) {
                await localStore.saveConflictCopy({
                  id: `conflict_${remoteNote.id}_${Date.now()}`,
                  originalNoteId: remoteNote.id,
                  title: remoteNote.title,
                  body: remoteNote.body,
                  remoteUpdatedAt: remoteNote.updatedAt,
                  savedAt: Date.now(),
                  reason: 'Simultaneous offline edit detected on another device',
                });
              }
            } else if (remoteNote.updatedAt > (local.updatedAt || 0)) {
              // Remote is newer and local is already synced: safe update
              await localStore.saveNote(remoteNote);
              updatedNotesList.push(remoteNote);
            }
          }
        }

        if (updatedNotesList.length > 0 && onRemoteNotesUpdate) {
          const allFreshNotes = await localStore.getAllNotes();
          onRemoteNotesUpdate(allFreshNotes);
        }
      }

      // 2. Fetch Folders
      try {
        const { data: folderData } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', userId);

        if (Array.isArray(folderData)) {
          for (const f of folderData) {
            const rawFolder = f.folder_data || f;
            await localStore.saveFolder({
              id: f.id || rawFolder.id,
              name: rawFolder.name || 'Folder',
              createdAt: rawFolder.createdAt || Date.now(),
              color: rawFolder.color,
            });
          }
          if (onRemoteFoldersUpdate) {
            const folders = await localStore.getAllFolders();
            onRemoteFoldersUpdate(folders);
          }
        }
      } catch (e) {}

      // 3. Fetch Projects
      try {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId);

        if (Array.isArray(projectData)) {
          for (const p of projectData) {
            const rawProj = p.project_data || p;
            await localStore.saveProject(rawProj);
          }
          if (onRemoteProjectsUpdate) {
            const projects = await localStore.getAllProjects();
            onRemoteProjectsUpdate(projects);
          }
        }
      } catch (e) {}

      // 4. Push any pending local notes
      await this.flushPendingSync();
    } catch (err) {
      console.warn('Supabase reconcile warning (local remains 100% intact):', err);
      this.updateStatus(this.isOnline ? 'error' : 'offline');
    }
  }

  /**
   * Sync a single note to Supabase in the background
   */
  public async syncNote(note: NoteItem): Promise<void> {
    if (!this.activeUser || !this.isOnline) {
      await this.updatePendingCount();
      this.updateStatus(!this.isOnline ? 'offline' : 'pending_local');
      return;
    }

    const userId = this.activeUser.uid;
    const cleanNote = cleanPayload(note);

    try {
      this.updateStatus('saving');
      const { error } = await supabase.from('notes').upsert({
        id: note.id,
        user_id: userId,
        title: note.title || 'Untitled',
        body: note.body || '',
        mode: note.mode || 'normal',
        is_deleted: !!note.isDeleted,
        updated_at: new Date(note.updatedAt || Date.now()).toISOString(),
        note_data: cleanNote,
      });

      if (!error) {
        // Mark note as synced in localStore
        await localStore.saveNote({ ...note, syncStatus: 'synced' });
      } else {
        console.warn('Supabase note upsert error (saved locally):', error.message);
      }
    } catch (e) {
      console.warn('Supabase sync note fallback:', e);
    } finally {
      await this.updatePendingCount();
      this.updateStatus(this.pendingCountCache > 0 ? 'pending_local' : 'synced');
    }
  }

  /**
   * Sync single note deletion
   */
  public async syncDeleteNote(noteId: string): Promise<void> {
    if (!this.activeUser || !this.isOnline) return;
    try {
      await supabase.from('notes').delete().eq('id', noteId).eq('user_id', this.activeUser.uid);
    } catch (e) {
      console.warn('Supabase deleteNote error:', e);
    }
  }

  /**
   * Push all pending notes, folders, and projects to Supabase
   */
  public async flushPendingSync(): Promise<void> {
    if (this.isSyncing || !this.activeUser || !this.isOnline) {
      await this.updatePendingCount();
      this.updateStatus(!this.isOnline ? 'offline' : this.pendingCountCache > 0 ? 'pending_local' : 'synced');
      return;
    }

    this.isSyncing = true;
    this.updateStatus('saving');

    try {
      const userId = this.activeUser.uid;
      const allNotes = await localStore.getAllNotes();
      const pendingNotes = allNotes.filter((n) => n.syncStatus === 'pending');

      // 1. Sync pending notes
      for (const note of pendingNotes) {
        const cleanNote = cleanPayload(note);
        const { error } = await supabase.from('notes').upsert({
          id: note.id,
          user_id: userId,
          title: note.title || 'Untitled',
          body: note.body || '',
          mode: note.mode || 'normal',
          is_deleted: !!note.isDeleted,
          updated_at: new Date(note.updatedAt || Date.now()).toISOString(),
          note_data: cleanNote,
        });

        if (!error) {
          await localStore.saveNote({ ...note, syncStatus: 'synced' });
        }
      }

      // 2. Sync folders
      const allFolders = await localStore.getAllFolders();
      for (const folder of allFolders) {
        try {
          await supabase.from('folders').upsert({
            id: folder.id,
            user_id: userId,
            name: folder.name,
            folder_data: cleanPayload(folder),
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}
      }

      // 3. Sync projects
      const allProjects = await localStore.getAllProjects();
      for (const proj of allProjects) {
        try {
          await supabase.from('projects').upsert({
            id: proj.id,
            user_id: userId,
            title: proj.title,
            project_data: cleanPayload(proj),
            updated_at: new Date().toISOString(),
          });
        } catch (e) {}
      }

      this.lastSyncTime = Date.now();
    } catch (err) {
      console.warn('Sync flush error (all local data safe):', err);
    } finally {
      this.isSyncing = false;
      await this.updatePendingCount();
      this.updateStatus(this.pendingCountCache > 0 ? 'pending_local' : 'synced');
    }
  }

  public async pushAllToCloud(notes: NoteItem[], folders: FolderItem[], projects: ProjectItem[]): Promise<void> {
    if (!this.activeUser || !this.isOnline) return;
    this.updateStatus('saving');

    const userId = this.activeUser.uid;
    try {
      for (const n of notes) {
        await supabase.from('notes').upsert({
          id: n.id,
          user_id: userId,
          title: n.title || 'Untitled',
          body: n.body || '',
          mode: n.mode || 'normal',
          is_deleted: !!n.isDeleted,
          updated_at: new Date(n.updatedAt || Date.now()).toISOString(),
          note_data: cleanPayload(n),
        });
      }
      this.updateStatus('synced');
    } catch (e) {
      this.updateStatus('error');
    }
  }

  /**
   * Sync single project to Supabase
   */
  public async syncProject(project: ProjectItem): Promise<void> {
    if (!this.activeUser || !this.isOnline) {
      await this.updatePendingCount();
      return;
    }
    const userId = this.activeUser.uid;
    try {
      this.updateStatus('saving');
      const { error } = await supabase.from('projects').upsert({
        id: project.id,
        user_id: userId,
        title: project.title,
        project_data: cleanPayload(project),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncProject error (safe locally):', error.message);
      }
    } catch (e) {
      console.warn('syncProject fallback:', e);
    } finally {
      await this.updatePendingCount();
      this.updateStatus(this.pendingCountCache > 0 ? 'pending_local' : 'synced');
    }
  }

  /**
   * Sync single project deletion
   */
  public async syncDeleteProject(projectId: string): Promise<void> {
    if (!this.activeUser || !this.isOnline) return;
    try {
      await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', this.activeUser.uid);
    } catch (e) {
      console.warn('syncDeleteProject error:', e);
    }
  }

  /**
   * Sync single folder to Supabase
   */
  public async syncFolder(folder: FolderItem): Promise<void> {
    if (!this.activeUser || !this.isOnline) {
      await this.updatePendingCount();
      return;
    }
    const userId = this.activeUser.uid;
    try {
      this.updateStatus('saving');
      const { error } = await supabase.from('folders').upsert({
        id: folder.id,
        user_id: userId,
        name: folder.name,
        folder_data: cleanPayload(folder),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase syncFolder error (safe locally):', error.message);
      }
    } catch (e) {
      console.warn('syncFolder fallback:', e);
    } finally {
      await this.updatePendingCount();
      this.updateStatus(this.pendingCountCache > 0 ? 'pending_local' : 'synced');
    }
  }

  /**
   * Sync single folder deletion
   */
  public async syncDeleteFolder(folderId: string): Promise<void> {
    if (!this.activeUser || !this.isOnline) return;
    try {
      await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)
        .eq('user_id', this.activeUser.uid);
    } catch (e) {
      console.warn('syncDeleteFolder error:', e);
    }
  }

  /**
   * RISK 9: Detect notes stuck in "pending" sync for > 24 hours while online
   * Returns list of note IDs that are stuck (empty list = all good)
   */
  public async getStalePendingNoteIds(maxAgeHours: number = 24): Promise<{ staleIds: string[]; oldestPendingAgeHours: number }> {
    try {
      const allNotes = await localStore.getAllNotes();
      const pendingNotes = allNotes.filter((n) => n.syncStatus === 'pending');
      const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
      const staleIds: string[] = [];
      let oldestAge = 0;
      for (const n of pendingNotes) {
        const ageMs = Date.now() - (n.updatedAt || 0);
        const ageHours = ageMs / (60 * 60 * 1000);
        if (ageHours > oldestAge) oldestAge = ageHours;
        if ((n.updatedAt || 0) < cutoff) {
          staleIds.push(n.id);
        }
      }
      return { staleIds, oldestPendingAgeHours: Math.round(oldestAge * 10) / 10 };
    } catch {
      return { staleIds: [], oldestPendingAgeHours: 0 };
    }
  }

  /**
   * Periodically refresh storage health estimate and check for stale pending
   */
  public async refreshStorageHealth(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        await localStore.initStorageProtection();
      }
    } catch {}
  }
}

export const syncManager = new SyncManagerService();
