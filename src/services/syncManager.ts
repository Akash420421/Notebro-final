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
   * Pull latest changes from Supabase and Server API, and merge with Local-First guarantees
   */
  public async reconcileWithRemote(
    onRemoteNotesUpdate?: (notes: NoteItem[]) => void,
    onRemoteFoldersUpdate?: (folders: FolderItem[]) => void,
    onRemoteProjectsUpdate?: (projects: ProjectItem[]) => void
  ) {
    if (!this.activeUser) return;

    try {
      this.updateStatus('saving');
      const userId = this.activeUser.uid;

      // 0. Load existing user notes from local store (vault + dexie)
      const initialUserNotes = await localStore.getAllNotes(userId);
      const localMap = new Map<string, NoteItem>();
      initialUserNotes.forEach((n) => localMap.set(n.id, n));

      // 1. Fetch Remote Notes from Supabase for user
      try {
        const { data: remoteData, error } = await supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId);

        if (!error && Array.isArray(remoteData) && remoteData.length > 0) {
          for (const item of remoteData) {
            const rawNote = item.note_data ? item.note_data : item;
            const remoteNote: NoteItem = {
              id: item.id || rawNote.id,
              userId: userId,
              user_id: userId,
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
            if (!local || (remoteNote.updatedAt || 0) >= (local.updatedAt || 0)) {
              localMap.set(remoteNote.id, remoteNote);
              await localStore.saveNote(remoteNote);
            }
          }
        }
      } catch (sbErr) {
        console.warn('Supabase notes reconcile check:', sbErr);
      }

      // 2. Fallback / Augment with Server-Side User Account Data Backup
      try {
        const serverRes = await fetch(`/api/users/${encodeURIComponent(userId)}/data`);
        if (serverRes.ok) {
          const srvData = await serverRes.json();
          if (srvData?.bundle) {
            const { notes: sNotes, folders: sFolders, projects: sProjects, studentDoubtSessions, developerSessions } = srvData.bundle;
            
            if (Array.isArray(sNotes) && sNotes.length > 0) {
              for (const n of sNotes) {
                const existing = localMap.get(n.id);
                if (!existing || ((n.updatedAt || 0) >= (existing.updatedAt || 0))) {
                  const mergedN: NoteItem = { ...n, userId, user_id: userId, syncStatus: 'synced' };
                  localMap.set(n.id, mergedN);
                  await localStore.saveNote(mergedN);
                }
              }
            }

            if (Array.isArray(sFolders) && sFolders.length > 0) {
              for (const f of sFolders) {
                await localStore.saveFolder({ ...f, userId, user_id: userId });
              }
            }

            if (Array.isArray(sProjects) && sProjects.length > 0) {
              for (const p of sProjects) {
                await localStore.saveProject({ ...p, userId, user_id: userId });
              }
            }

            // Restore doubt & dev sessions to user localStorage
            if (Array.isArray(studentDoubtSessions) && studentDoubtSessions.length > 0) {
              try {
                localStorage.setItem(`student_doubt_sessions_${userId}`, JSON.stringify(studentDoubtSessions));
                localStorage.setItem('student_doubt_sessions_v2', JSON.stringify(studentDoubtSessions));
              } catch (e) {}
            }

            if (Array.isArray(developerSessions) && developerSessions.length > 0) {
              try {
                localStorage.setItem(`developer_ai_sessions_${userId}`, JSON.stringify(developerSessions));
                localStorage.setItem('developer_ai_sessions_v1', JSON.stringify(developerSessions));
              } catch (e) {}
            }
          }
        }
      } catch (srvErr) {
        console.warn('Server user-data reconcile check:', srvErr);
      }

      // 3. Fetch Folders from Supabase
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
              userId: userId,
              user_id: userId,
              name: rawFolder.name || 'Folder',
              createdAt: rawFolder.createdAt || Date.now(),
              color: rawFolder.color,
            });
          }
        }
      } catch (e) {}

      // 4. Fetch Projects from Supabase
      try {
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId);

        if (Array.isArray(projectData)) {
          for (const p of projectData) {
            const rawProj = p.project_data || p;
            await localStore.saveProject({ ...rawProj, userId, user_id: userId });
          }
        }
      } catch (e) {}

      // Check if user is still active before applying state
      if (this.activeUser?.uid !== userId) return;

      // Notify UI with fully reconciled data for this user
      const allFinalNotes = await localStore.getAllNotes(userId);
      const allFinalFolders = await localStore.getAllFolders(userId);
      const allFinalProjects = await localStore.getAllProjects(userId);

      if (this.activeUser?.uid !== userId) return;

      if (onRemoteNotesUpdate) onRemoteNotesUpdate(allFinalNotes);
      if (onRemoteFoldersUpdate) onRemoteFoldersUpdate(allFinalFolders);
      if (onRemoteProjectsUpdate) onRemoteProjectsUpdate(allFinalProjects);

      // 5. Push any pending local items and backup user state to server
      await this.flushPendingSync();
    } catch (err) {
      console.warn('Reconciliation warning (local store is 100% safe):', err);
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
      const allNotes = await localStore.getAllNotes(userId);
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
      const allFolders = await localStore.getAllFolders(userId);
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
      const allProjects = await localStore.getAllProjects(userId);
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

      // 4. Server-Side User Account Snapshot Backup (Guarantees persistence across logout/re-login)
      try {
        const studentDoubtSessions = (() => {
          try {
            const raw = localStorage.getItem(`student_doubt_sessions_${userId}`) || localStorage.getItem('student_doubt_sessions_v2');
            return raw ? JSON.parse(raw) : [];
          } catch { return []; }
        })();
        const developerSessions = (() => {
          try {
            const raw = localStorage.getItem(`developer_ai_sessions_${userId}`) || localStorage.getItem('developer_ai_sessions_v1');
            return raw ? JSON.parse(raw) : [];
          } catch { return []; }
        })();

        await fetch(`/api/users/${encodeURIComponent(userId)}/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: allNotes,
            folders: allFolders,
            projects: allProjects,
            studentDoubtSessions,
            developerSessions,
          }),
        });

        // Also update local cache for this user
        localStorage.setItem(`user_notes_cache_${userId}`, JSON.stringify(allNotes));
      } catch (srvErr) {
        console.warn('Server user backup sync skipped:', srvErr);
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
