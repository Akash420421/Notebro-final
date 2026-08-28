import Dexie, { type Table } from 'dexie';
import { NoteItem, FolderItem, ProjectItem, ConflictCopy, StorageHealthInfo } from '../types';

export const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'folder-general', name: 'General', createdAt: Date.now() },
];

export type StorageErrorListener = (err: { message: string; details?: unknown }) => void;

class NoteBroDexieDB extends Dexie {
  notes!: Table<NoteItem, string>;
  folders!: Table<FolderItem, string>;
  projects!: Table<ProjectItem, string>;
  conflictCopies!: Table<ConflictCopy, string>;
  appSettings!: Table<{ key: string; value: any; updatedAt: number }, string>;

  constructor() {
    super('NoteBroLocalFirstDB');
    
    // Schema definition with versioning
    this.version(1).stores({
      notes: 'id, updatedAt, isDeleted, folderId, syncStatus, mode, createdAt',
      folders: 'id, createdAt, name',
      projects: 'id, updatedAt, mode',
      conflictCopies: 'id, originalNoteId, savedAt',
      appSettings: 'key, updatedAt',
    });
  }
}

class LocalStoreService {
  private db: NoteBroDexieDB;
  private errorListeners: Set<StorageErrorListener> = new Set();
  private storageHealth: StorageHealthInfo = {
    isPersisted: false,
    isIncognito: false,
    usedBytes: 0,
    quotaBytes: 0,
    usagePercentage: 0,
    isLowSpace: false,
  };

  constructor() {
    this.db = new NoteBroDexieDB();
    if (typeof window !== 'undefined') {
      this.initStorageProtection();
      this.verifyDatabaseIntegrity();
    }
  }

  /**
   * Subscribe to critical storage errors (e.g. disk full, quota exceeded)
   */
  public onStorageError(listener: StorageErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  private notifyError(message: string, details?: unknown) {
    console.error('[LocalStore Error]', message, details);
    this.errorListeners.forEach((fn) => {
      try {
        fn({ message, details });
      } catch (e) {}
    });
  }

  /**
   * RISK 2 & RISK 3: Request persistent storage & detect incognito mode
   */
  public async initStorageProtection(): Promise<StorageHealthInfo> {
    try {
      // 1. Request persistent storage from browser
      if (typeof navigator !== 'undefined' && navigator.storage) {
        if (navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          this.storageHealth.isPersisted = isPersisted;
        } else if (navigator.storage.persisted) {
          this.storageHealth.isPersisted = await navigator.storage.persisted();
        }

        // 2. Check storage quota usage
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const pct = quota > 0 ? (used / quota) * 100 : 0;
          
          this.storageHealth.usedBytes = used;
          this.storageHealth.quotaBytes = quota;
          this.storageHealth.usagePercentage = Math.round(pct * 10) / 10;
          this.storageHealth.isLowSpace = pct > 90;

          // 3. Incognito detection heuristic (quota < 120MB in private mode on most browsers)
          if (quota > 0 && quota < 130 * 1024 * 1024) {
            this.storageHealth.isIncognito = true;
          }
        }
      }
    } catch (e) {
      console.warn('Storage persistence check warning:', e);
    }

    return this.storageHealth;
  }

  public getStorageHealth(): StorageHealthInfo {
    return { ...this.storageHealth };
  }

  /**
   * RISK 5: Startup database integrity verification
   */
  public async verifyDatabaseIntegrity(): Promise<boolean> {
    try {
      await this.db.open();
      const testCount = await this.db.notes.count();
      // Ensure default folders exist if empty
      const folderCount = await this.db.folders.count();
      if (folderCount === 0) {
        await this.db.folders.bulkPut(DEFAULT_FOLDERS);
      }
      return true;
    } catch (err) {
      this.notifyError('Local Database could not be initialized or is corrupted.', err);
      return false;
    }
  }

  // ==========================================
  // NOTES OPERATIONS (Atomic ReadWrite Dexie)
  // ==========================================

  public async getAllNotes(): Promise<NoteItem[]> {
    try {
      const notes = await this.db.notes.toArray();
      // Fallback cache mirror in localStorage as second redundancy layer
      try {
        localStorage.setItem('project_notes_cache', JSON.stringify(notes));
      } catch (e) {}
      return notes.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (e) {
      this.notifyError('Failed to read notes from local database. Loading from backup cache.', e);
      try {
        const local = localStorage.getItem('project_notes_cache');
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
  }

  public async getNoteById(id: string): Promise<NoteItem | undefined> {
    try {
      return await this.db.notes.get(id);
    } catch (e) {
      this.notifyError(`Failed to fetch note ${id}`, e);
      return undefined;
    }
  }

  /**
   * RISK 1 & RISK 4: Atomic readwrite transaction.
   * Promise resolves ONLY after Dexie completes the write to disk.
   */
  public async saveNote(note: NoteItem): Promise<void> {
    try {
      const cleanNote: NoteItem = {
        ...note,
        updatedAt: note.updatedAt || Date.now(),
        syncStatus: note.syncStatus || 'pending',
      };

      await this.db.transaction('rw', this.db.notes, async () => {
        await this.db.notes.put(cleanNote);
      });

      // Update backup mirror
      try {
        const cached = localStorage.getItem('project_notes_cache');
        if (cached) {
          const arr: NoteItem[] = JSON.parse(cached);
          const idx = arr.findIndex((n) => n.id === cleanNote.id);
          if (idx >= 0) arr[idx] = cleanNote;
          else arr.unshift(cleanNote);
          localStorage.setItem('project_notes_cache', JSON.stringify(arr));
        }
      } catch (e) {}
    } catch (err: any) {
      const reason = err?.message || 'Storage Quota Exceeded or IndexedDB Error';
      this.notifyError(`Note "${note.title || 'Untitled'}" could not be saved locally: ${reason}`, err);
      throw err;
    }
  }

  public async bulkSaveNotes(notesList: NoteItem[]): Promise<void> {
    if (!notesList || notesList.length === 0) return;
    try {
      await this.db.transaction('rw', this.db.notes, async () => {
        await this.db.notes.bulkPut(notesList);
      });
    } catch (e) {
      this.notifyError('Bulk save notes failed', e);
      throw e;
    }
  }

  /**
   * RISK 7: Soft-delete note (moves to Trash for 30 days)
   */
  public async softDeleteNote(id: string): Promise<void> {
    try {
      const existing = await this.db.notes.get(id);
      if (!existing) return;

      const trashed: NoteItem = {
        ...existing,
        isDeleted: true,
        deletedAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending',
      };

      await this.db.transaction('rw', this.db.notes, async () => {
        await this.db.notes.put(trashed);
      });
    } catch (e) {
      this.notifyError('Failed to move note to trash', e);
    }
  }

  public async restoreNote(id: string): Promise<void> {
    try {
      const existing = await this.db.notes.get(id);
      if (!existing) return;

      const restored: NoteItem = {
        ...existing,
        isDeleted: false,
        deletedAt: undefined,
        updatedAt: Date.now(),
        syncStatus: 'pending',
      };

      await this.db.transaction('rw', this.db.notes, async () => {
        await this.db.notes.put(restored);
      });
    } catch (e) {
      this.notifyError('Failed to restore note', e);
    }
  }

  public async permanentDeleteNote(id: string): Promise<void> {
    try {
      await this.db.transaction('rw', this.db.notes, async () => {
        await this.db.notes.delete(id);
      });
    } catch (e) {
      this.notifyError('Failed to permanently delete note', e);
    }
  }

  public async purgeOldTrash(maxAgeDays: number = 30): Promise<number> {
    try {
      const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
      let count = 0;
      await this.db.transaction('rw', this.db.notes, async () => {
        const trashed = await this.db.notes.filter((n) => !!n.isDeleted && (n.deletedAt || 0) < cutoff).toArray();
        for (const n of trashed) {
          await this.db.notes.delete(n.id);
          count++;
        }
      });
      return count;
    } catch (e) {
      return 0;
    }
  }

  // ==========================================
  // FOLDERS & PROJECTS OPERATIONS
  // ==========================================

  public async getAllFolders(): Promise<FolderItem[]> {
    try {
      const folders = await this.db.folders.toArray();
      if (folders.length === 0) {
        await this.db.folders.bulkPut(DEFAULT_FOLDERS);
        return DEFAULT_FOLDERS;
      }
      return folders;
    } catch (e) {
      return DEFAULT_FOLDERS;
    }
  }

  public async saveFolder(folder: FolderItem): Promise<void> {
    try {
      await this.db.folders.put(folder);
    } catch (e) {
      this.notifyError('Failed to save folder', e);
    }
  }

  public async deleteFolder(folderId: string): Promise<void> {
    try {
      await this.db.transaction('rw', [this.db.folders, this.db.notes], async () => {
        await this.db.folders.delete(folderId);
        // Move notes inside to uncategorized
        const notesInFolder = await this.db.notes.where('folderId').equals(folderId).toArray();
        for (const note of notesInFolder) {
          await this.db.notes.put({ ...note, folderId: undefined, updatedAt: Date.now(), syncStatus: 'pending' });
        }
      });
    } catch (e) {
      this.notifyError('Failed to delete folder', e);
    }
  }

  public async getAllProjects(): Promise<ProjectItem[]> {
    try {
      const projects = await this.db.projects.toArray();
      try {
        localStorage.setItem('projects_cache', JSON.stringify(projects));
      } catch (e) {}
      return projects;
    } catch (e) {
      try {
        const local = localStorage.getItem('projects_cache');
        return local ? JSON.parse(local) : [];
      } catch {
        return [];
      }
    }
  }

  public async saveProject(project: ProjectItem): Promise<void> {
    try {
      await this.db.projects.put(project);
    } catch (e) {
      this.notifyError('Failed to save project', e);
    }
  }

  public async deleteProject(projectId: string): Promise<void> {
    try {
      await this.db.projects.delete(projectId);
    } catch (e) {
      this.notifyError('Failed to delete project', e);
    }
  }

  // ==========================================
  // CONFLICT COPIES (Risk 6 Safe Archiving)
  // ==========================================

  public async saveConflictCopy(conflict: ConflictCopy): Promise<void> {
    try {
      await this.db.conflictCopies.put(conflict);
    } catch (e) {
      console.warn('Could not save conflict copy', e);
    }
  }

  public async getConflictCopies(): Promise<ConflictCopy[]> {
    try {
      return await this.db.conflictCopies.toArray();
    } catch (e) {
      return [];
    }
  }

  // ==========================================
  // RISK 2: EXPORT & IMPORT ZERO-DATA-LOSS BACKUP
  // ==========================================

  public async exportAllDataAsJSON(): Promise<string> {
    const allNotes = await this.getAllNotes();
    const allFolders = await this.getAllFolders();
    const allProjects = await this.getAllProjects();

    const backupPayload = {
      app: 'Note Bro',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      notesCount: allNotes.length,
      foldersCount: allFolders.length,
      projectsCount: allProjects.length,
      data: {
        notes: allNotes,
        folders: allFolders,
        projects: allProjects,
      },
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  public async triggerFileDownloadBackup(): Promise<void> {
    const jsonStr = await this.exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NoteBro-SafetyBackup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public async importDataFromJSON(
    jsonString: string,
    strategy: 'merge' | 'replace' = 'merge'
  ): Promise<{ notesImported: number; foldersImported: number; projectsImported: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      const incomingNotes: NoteItem[] = parsed?.data?.notes || (Array.isArray(parsed) ? parsed : []);
      const incomingFolders: FolderItem[] = parsed?.data?.folders || [];
      const incomingProjects: ProjectItem[] = parsed?.data?.projects || [];

      if (!Array.isArray(incomingNotes)) {
        throw new Error('Invalid backup file format: Notes collection missing');
      }

      await this.db.transaction('rw', [this.db.notes, this.db.folders, this.db.projects], async () => {
        if (strategy === 'replace') {
          await this.db.notes.clear();
          await this.db.folders.clear();
          await this.db.projects.clear();
        }

        for (const n of incomingNotes) {
          await this.db.notes.put({
            ...n,
            syncStatus: 'pending', // Mark pending so it uploads to Supabase
            updatedAt: n.updatedAt || Date.now(),
          });
        }

        for (const f of incomingFolders) {
          await this.db.folders.put(f);
        }

        for (const p of incomingProjects) {
          await this.db.projects.put(p);
        }
      });

      return {
        notesImported: incomingNotes.length,
        foldersImported: incomingFolders.length,
        projectsImported: incomingProjects.length,
      };
    } catch (e: any) {
      this.notifyError(`Failed to import backup file: ${e.message}`, e);
      throw e;
    }
  }

  public async clearAllData(): Promise<void> {
    try {
      await this.db.transaction('rw', [this.db.notes, this.db.folders, this.db.projects, this.db.conflictCopies], async () => {
        await this.db.notes.clear();
        await this.db.folders.clear();
        await this.db.projects.clear();
        await this.db.conflictCopies.clear();
      });
      localStorage.removeItem('project_notes_cache');
      localStorage.removeItem('projects_cache');
    } catch (e) {
      this.notifyError('Clear all data failed', e);
    }
  }
}

export const localStore = new LocalStoreService();
