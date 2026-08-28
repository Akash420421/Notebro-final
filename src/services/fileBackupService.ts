/**
 * User-Owned Offline File Service (.aknotes format)
 * Supports File System Access API with fallback for file export/import
 */

import { NoteItem, FolderItem, ProjectItem } from '../types';

export const FILE_FORMAT_VERSION = 1;
export const APP_IDENTIFIER = 'Remix Custom Note Builder';
export const DEFAULT_FILE_NAME = 'my-notes.aknotes';

export interface AkNotesFileStructure {
  formatVersion: number;
  application: string;
  exportedAt: number;
  userId?: string;
  metadata: {
    totalNotes: number;
    totalFolders: number;
    totalProjects: number;
    appVersion: string;
  };
  notes: NoteItem[];
  folders: FolderItem[];
  projects: ProjectItem[];
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  parsedData?: AkNotesFileStructure;
}

class FileBackupService {
  private activeFileHandle: any = null;
  private isSavingToFile = false;
  private saveDebounceTimer: any = null;

  /**
   * Check if the browser supports File System Access API and is in a top-level frame
   */
  public isFileSystemAccessSupported(): boolean {
    try {
      const isTopLevel = typeof window !== 'undefined' && window.self === window.top;
      return (
        isTopLevel &&
        'showSaveFilePicker' in window &&
        'showOpenFilePicker' in window
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Generate structured .aknotes payload
   */
  public generateBackupPayload(
    notes: NoteItem[],
    folders: FolderItem[],
    projects: ProjectItem[],
    userId?: string
  ): AkNotesFileStructure {
    return {
      formatVersion: FILE_FORMAT_VERSION,
      application: APP_IDENTIFIER,
      exportedAt: Date.now(),
      userId: userId || 'anonymous',
      metadata: {
        totalNotes: notes.length,
        totalFolders: folders.length,
        totalProjects: projects.length,
        appVersion: '1.0.0',
      },
      notes,
      folders,
      projects,
    };
  }

  /**
   * Validate and parse .aknotes file content
   */
  public validateAndParse(jsonString: string): FileValidationResult {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { isValid: false, error: 'File is empty or unreadable.' };
      }

      const data = JSON.parse(jsonString);

      if (!data || typeof data !== 'object') {
        return { isValid: false, error: 'Invalid JSON format in file.' };
      }

      if (!Array.isArray(data.notes)) {
        return { isValid: false, error: 'Missing or invalid "notes" array in file.' };
      }

      // Check format version
      const formatVersion = typeof data.formatVersion === 'number' ? data.formatVersion : 1;

      const parsed: AkNotesFileStructure = {
        formatVersion,
        application: data.application || APP_IDENTIFIER,
        exportedAt: data.exportedAt || Date.now(),
        userId: data.userId,
        metadata: data.metadata || {
          totalNotes: data.notes.length,
          totalFolders: Array.isArray(data.folders) ? data.folders.length : 0,
          totalProjects: Array.isArray(data.projects) ? data.projects.length : 0,
          appVersion: '1.0.0',
        },
        notes: data.notes,
        folders: Array.isArray(data.folders) ? data.folders : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
      };

      return {
        isValid: true,
        parsedData: parsed,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `Could not parse notes file: ${err.message || 'Corrupted file'}`,
      };
    }
  }

  /**
   * Prompt user to pick/create notes file with File System Access API (or automatic download fallback)
   */
  public async chooseNotesFile(
    notes: NoteItem[],
    folders: FolderItem[],
    projects: ProjectItem[],
    userId?: string
  ): Promise<{ success: boolean; fileName?: string; isFallbackDownload?: boolean; error?: string }> {
    if (!this.isFileSystemAccessSupported()) {
      this.downloadFallbackFile(notes, folders, projects, userId);
      return { success: true, fileName: DEFAULT_FILE_NAME, isFallbackDownload: true };
    }

    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: DEFAULT_FILE_NAME,
        types: [
          {
            description: 'AKNotes File (*.aknotes)',
            accept: {
              'application/json': ['.aknotes', '.json'],
            },
          },
        ],
      });

      this.activeFileHandle = handle;
      const fileName = handle.name || DEFAULT_FILE_NAME;

      // Write initial payload to file
      const payload = this.generateBackupPayload(notes, folders, projects, userId);
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();

      return { success: true, fileName };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'File selection was cancelled.' };
      }
      // If security error (like cross origin sub frame or permission denied), fallback to download
      if (err.name === 'SecurityError' || String(err.message).includes('sub frames') || String(err.message).includes('picker')) {
        this.downloadFallbackFile(notes, folders, projects, userId);
        return { success: true, fileName: DEFAULT_FILE_NAME, isFallbackDownload: true };
      }
      return { success: false, error: err.message || 'Failed to save notes file.' };
    }
  }

  /**
   * Open and connect an existing .aknotes file using File System Access API
   */
  public async openExistingNotesFile(): Promise<{
    success: boolean;
    fileName?: string;
    parsedData?: AkNotesFileStructure;
    error?: string;
  }> {
    if (!this.isFileSystemAccessSupported()) {
      return { success: false, error: 'File System Access API is not supported in this browser.' };
    }

    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'AKNotes File (*.aknotes, *.json)',
            accept: {
              'application/json': ['.aknotes', '.json'],
            },
          },
        ],
        multiple: false,
      });

      const file = await handle.getFile();
      const text = await file.text();
      const validation = this.validateAndParse(text);

      if (!validation.isValid || !validation.parsedData) {
        return { success: false, error: validation.error || 'Invalid file format.' };
      }

      this.activeFileHandle = handle;

      return {
        success: true,
        fileName: handle.name || file.name,
        parsedData: validation.parsedData,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'File selection was cancelled.' };
      }
      return { success: false, error: err.message || 'Failed to open file.' };
    }
  }

  /**
   * Automatically write changes to active file handle if connected
   */
  public triggerAutoSaveToFile(
    notes: NoteItem[],
    folders: FolderItem[],
    projects: ProjectItem[],
    userId?: string
  ) {
    if (!this.activeFileHandle) return;

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    this.saveDebounceTimer = setTimeout(async () => {
      if (this.isSavingToFile || !this.activeFileHandle) return;
      try {
        this.isSavingToFile = true;
        const payload = this.generateBackupPayload(notes, folders, projects, userId);
        const writable = await this.activeFileHandle.createWritable();
        await writable.write(JSON.stringify(payload, null, 2));
        await writable.close();
      } catch (e) {
        console.warn('Failed to autosave to local file handle', e);
      } finally {
        this.isSavingToFile = false;
      }
    }, 1200);
  }

  /**
   * Fallback: trigger standard browser download for .aknotes file
   */
  public downloadFallbackFile(
    notes: NoteItem[],
    folders: FolderItem[],
    projects: ProjectItem[],
    userId?: string
  ) {
    const payload = this.generateBackupPayload(notes, folders, projects, userId);
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().slice(0, 10)}.aknotes`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Fallback: parse uploaded file from file input
   */
  public async readUploadedFile(file: File): Promise<FileValidationResult> {
    try {
      const text = await file.text();
      return this.validateAndParse(text);
    } catch (err: any) {
      return { isValid: false, error: err.message || 'Failed to read file.' };
    }
  }

  public getActiveFileName(): string | null {
    return this.activeFileHandle?.name || null;
  }

  public disconnectFileHandle() {
    this.activeFileHandle = null;
  }
}

export const fileBackupService = new FileBackupService();
