import { syncManager } from './syncManager';
import { NoteItem, FolderItem, ProjectItem, AuthUser } from '../types';

class FirestoreSyncWrapper {
  public attachUser(
    user: AuthUser | null,
    onRemoteNotesUpdate?: (notes: NoteItem[]) => void,
    onRemoteFoldersUpdate?: (folders: FolderItem[]) => void,
    onRemoteProjectsUpdate?: (projects: ProjectItem[]) => void
  ) {
    syncManager.attachUser(user, onRemoteNotesUpdate, onRemoteFoldersUpdate, onRemoteProjectsUpdate);
  }

  public async syncNote(note: NoteItem): Promise<void> {
    await syncManager.syncNote(note);
  }

  public async syncDeleteNote(noteId: string): Promise<void> {
    await syncManager.syncDeleteNote(noteId);
  }

  public async syncProject(project: ProjectItem): Promise<void> {
    await syncManager.syncProject(project);
  }

  public async syncDeleteProject(projectId: string): Promise<void> {
    await syncManager.syncDeleteProject(projectId);
  }

  public async syncFolder(folder: FolderItem): Promise<void> {
    await syncManager.syncFolder(folder);
  }

  public async syncDeleteFolder(folderId: string): Promise<void> {
    await syncManager.syncDeleteFolder(folderId);
  }
}

export const firestoreSyncService = new FirestoreSyncWrapper();
