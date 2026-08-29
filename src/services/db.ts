import { NoteItem, FolderItem, ProjectItem } from '../types';
import { localStore } from './localStore';

export const DEFAULT_FOLDERS: FolderItem[] = [
  { id: 'folder-general', name: 'General', createdAt: Date.now() },
];

/**
 * dbService wrapper delegating to Dexie.js localStore with full zero-data-loss guarantees
 */
class DBServiceWrapper {
  async getAllNotes(userId?: string): Promise<NoteItem[]> {
    return await localStore.getAllNotes(userId);
  }

  async getNoteById(id: string): Promise<NoteItem | undefined> {
    return await localStore.getNoteById(id);
  }

  async saveNote(note: NoteItem): Promise<void> {
    return await localStore.saveNote(note);
  }

  async bulkSaveNotes(notes: NoteItem[], userId?: string): Promise<void> {
    return await localStore.bulkSaveNotes(notes, userId);
  }

  async deleteNote(id: string): Promise<void> {
    return await localStore.softDeleteNote(id);
  }

  async permanentDeleteNote(id: string): Promise<void> {
    return await localStore.permanentDeleteNote(id);
  }

  async restoreNote(id: string): Promise<void> {
    return await localStore.restoreNote(id);
  }

  async getAllProjects(userId?: string): Promise<ProjectItem[]> {
    return await localStore.getAllProjects(userId);
  }

  async saveProject(project: ProjectItem): Promise<void> {
    return await localStore.saveProject(project);
  }

  async deleteProject(id: string): Promise<void> {
    return await localStore.deleteProject(id);
  }

  async getAllFolders(userId?: string): Promise<FolderItem[]> {
    return await localStore.getAllFolders(userId);
  }

  async saveFolder(folder: FolderItem): Promise<void> {
    return await localStore.saveFolder(folder);
  }

  async deleteFolder(folderId: string): Promise<void> {
    return await localStore.deleteFolder(folderId);
  }

  getUserVault(userId: string) {
    return localStore.getUserVault(userId);
  }

  saveUserVault(userId: string, partial: any) {
    return localStore.saveUserVault(userId, partial);
  }

  clearSessionCaches(): void {
    localStore.clearSessionCaches();
  }

  async clearAllData(): Promise<void> {
    return await localStore.clearAllData();
  }
}

export const dbService = new DBServiceWrapper();
export { localStore };
