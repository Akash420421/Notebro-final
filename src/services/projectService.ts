import { ProjectItem, ProjectTask, ProjectFile, ProjectLink, ProjectActivityItem, NoteItem } from '../types';
import { dbService } from './db';
import { localStore } from './localStore';
import { firestoreSyncService } from './firestoreSync';

export const DEFAULT_PROJECT_ICONS = [
  '📁', '🚀', '💻', '📚', '🎯', '💡', '🛒', '⚡', '🎨', '🔥', '🏆', '🧠', '⚙️', '📝', '🌟', '💼'
];

export const PROJECT_COLOR_OPTIONS = [
  { name: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Blue', hex: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Amber', hex: '#f59e0b', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Rose', hex: '#f43f5e', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Purple', hex: '#8b5cf6', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Cyan', hex: '#06b6d4', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Slate', hex: '#64748b', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
];

/**
 * Calculate dynamic task completion percentage
 */
export function calculateProjectProgress(tasks?: ProjectTask[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
}

/**
 * Calculate human-readable deadline status
 */
export function formatDeadlineStatus(deadline?: string): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  daysRemaining: number | null;
} {
  if (!deadline) {
    return {
      text: 'No deadline',
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysRemaining: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(deadline);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: `Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`,
      isOverdue: true,
      isDueSoon: false,
      isDueToday: false,
      daysRemaining: diffDays,
    };
  } else if (diffDays === 0) {
    return {
      text: 'Due today',
      isOverdue: false,
      isDueSoon: true,
      isDueToday: true,
      daysRemaining: 0,
    };
  } else if (diffDays === 1) {
    return {
      text: 'Due tomorrow',
      isOverdue: false,
      isDueSoon: true,
      isDueToday: false,
      daysRemaining: 1,
    };
  } else {
    return {
      text: `Due in ${diffDays} days`,
      isOverdue: false,
      isDueSoon: diffDays <= 3,
      isDueToday: false,
      daysRemaining: diffDays,
    };
  }
}

/**
 * Format timestamp into friendly relative string
 */
export function formatTimeAgo(timestamp: number | string): string {
  const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (!ts || isNaN(ts)) return 'Recently';

  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * Format file size in bytes to KB/MB
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

class ProjectService {
  /**
   * Helper to append an activity to a project and return the updated project
   */
  public logActivity(
    project: ProjectItem,
    action: ProjectActivityItem['action'],
    description: string,
    targetTitle?: string
  ): ProjectItem {
    const activity: ProjectActivityItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      action,
      description,
      targetTitle,
      timestamp: Date.now(),
    };

    const currentActivities = project.activities || [];
    const updatedActivities = [activity, ...currentActivities].slice(0, 50); // Keep last 50 events

    return {
      ...project,
      activities: updatedActivities,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Create a new project item with full defaults
   */
  public async createProject(
    data: {
      title: string;
      name?: string;
      description: string;
      icon?: string;
      color?: string;
      deadline?: string;
      mode?: ProjectItem['mode'];
      tags?: string[];
      userId?: string;
    },
    onSaveCallback?: (p: ProjectItem) => void
  ): Promise<ProjectItem> {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const title = data.name?.trim() || data.title?.trim() || 'New Project';

    const newProject: ProjectItem = {
      id,
      userId: data.userId,
      user_id: data.userId,
      title,
      name: title,
      description: data.description?.trim() || '',
      icon: data.icon || '📁',
      color: data.color || '#6366f1',
      status: 'active',
      progress: 0,
      deadline: data.deadline || undefined,
      mode: data.mode || 'normal',
      tags: data.tags || [],
      isPinned: false,
      isArchived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      tasks: [],
      files: [],
      links: [],
      activities: [
        {
          id: `act_${Date.now()}`,
          projectId: id,
          action: 'created',
          description: `Created project "${title}"`,
          timestamp: Date.now(),
        },
      ],
    };

    await dbService.saveProject(newProject);
    if (onSaveCallback) onSaveCallback(newProject);
    return newProject;
  }

  /**
   * Update project fields and persist
   */
  public async updateProject(
    project: ProjectItem,
    changes: Partial<ProjectItem>
  ): Promise<ProjectItem> {
    const updatedTasks = changes.tasks !== undefined ? changes.tasks : project.tasks || [];
    const calculatedProgress = calculateProjectProgress(updatedTasks);

    let updated: ProjectItem = {
      ...project,
      ...changes,
      title: changes.name || changes.title || project.title,
      name: changes.name || changes.title || project.name || project.title,
      progress: calculatedProgress,
      updatedAt: new Date().toISOString(),
    };

    // If title or description changed, log an update
    if (changes.title && changes.title !== project.title) {
      updated = this.logActivity(
        updated,
        'updated',
        `Renamed project to "${updated.title}"`
      );
    }

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Add Task to Project
   */
  public async addTask(
    project: ProjectItem,
    taskData: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high';
      dueDate?: string;
    }
  ): Promise<ProjectItem> {
    const newTask: ProjectTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      title: taskData.title.trim(),
      description: taskData.description?.trim(),
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const tasks = [...(project.tasks || []), newTask];
    let updated: ProjectItem = {
      ...project,
      tasks,
      progress: calculateProjectProgress(tasks),
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      'task_added',
      `Added task: "${newTask.title}"`,
      newTask.title
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Toggle Task Completion Status
   */
  public async toggleTask(project: ProjectItem, taskId: string): Promise<ProjectItem> {
    const currentTasks = project.tasks || [];
    const task = currentTasks.find((t) => t.id === taskId);
    if (!task) return project;

    const nextCompleted = !task.completed;
    const tasks = currentTasks.map((t) =>
      t.id === taskId
        ? { ...t, completed: nextCompleted, updatedAt: Date.now() }
        : t
    );

    let updated: ProjectItem = {
      ...project,
      tasks,
      progress: calculateProjectProgress(tasks),
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      nextCompleted ? 'task_completed' : 'task_uncompleted',
      nextCompleted ? `Completed task "${task.title}"` : `Marked "${task.title}" as pending`,
      task.title
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Delete Task from Project
   */
  public async deleteTask(project: ProjectItem, taskId: string): Promise<ProjectItem> {
    const currentTasks = project.tasks || [];
    const task = currentTasks.find((t) => t.id === taskId);
    const tasks = currentTasks.filter((t) => t.id !== taskId);

    let updated: ProjectItem = {
      ...project,
      tasks,
      progress: calculateProjectProgress(tasks),
      updatedAt: new Date().toISOString(),
    };

    if (task) {
      updated = this.logActivity(
        updated,
        'task_deleted',
        `Deleted task "${task.title}"`,
        task.title
      );
    }

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Add File/Attachment to Project
   */
  public async addFile(
    project: ProjectItem,
    fileData: {
      name: string;
      url: string;
      size?: number;
      type?: string;
    }
  ): Promise<ProjectItem> {
    const newFile: ProjectFile = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      name: fileData.name.trim(),
      url: fileData.url,
      size: fileData.size,
      type: fileData.type,
      createdAt: Date.now(),
    };

    const files = [...(project.files || []), newFile];
    let updated: ProjectItem = {
      ...project,
      files,
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      'file_added',
      `Attached file "${newFile.name}"`,
      newFile.name
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Delete File from Project
   */
  public async deleteFile(project: ProjectItem, fileId: string): Promise<ProjectItem> {
    const currentFiles = project.files || [];
    const file = currentFiles.find((f) => f.id === fileId);
    const files = currentFiles.filter((f) => f.id !== fileId);

    let updated: ProjectItem = {
      ...project,
      files,
      updatedAt: new Date().toISOString(),
    };

    if (file) {
      updated = this.logActivity(
        updated,
        'file_deleted',
        `Removed file "${file.name}"`,
        file.name
      );
    }

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Add Link to Project
   */
  public async addLink(
    project: ProjectItem,
    linkData: {
      title: string;
      url: string;
      description?: string;
    }
  ): Promise<ProjectItem> {
    let cleanUrl = linkData.url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const newLink: ProjectLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: project.id,
      title: linkData.title.trim() || cleanUrl,
      url: cleanUrl,
      description: linkData.description?.trim(),
      createdAt: Date.now(),
    };

    const links = [...(project.links || []), newLink];
    let updated: ProjectItem = {
      ...project,
      links,
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      'link_added',
      `Added link "${newLink.title}"`,
      newLink.title
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Delete Link from Project
   */
  public async deleteLink(project: ProjectItem, linkId: string): Promise<ProjectItem> {
    const currentLinks = project.links || [];
    const link = currentLinks.find((l) => l.id === linkId);
    const links = currentLinks.filter((l) => l.id !== linkId);

    let updated: ProjectItem = {
      ...project,
      links,
      updatedAt: new Date().toISOString(),
    };

    if (link) {
      updated = this.logActivity(
        updated,
        'link_deleted',
        `Removed link "${link.title}"`,
        link.title
      );
    }

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Toggle Pin/Unpin on Project
   */
  public async togglePinProject(project: ProjectItem): Promise<ProjectItem> {
    const isPinned = !project.isPinned;
    let updated: ProjectItem = {
      ...project,
      isPinned,
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      isPinned ? 'pinned' : 'unpinned',
      isPinned ? `Pinned project to top` : `Unpinned project`
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Toggle Archive/Restore Project
   */
  public async toggleArchiveProject(project: ProjectItem): Promise<ProjectItem> {
    const isArchived = !project.isArchived;
    let updated: ProjectItem = {
      ...project,
      isArchived,
      status: isArchived ? 'archived' : 'active',
      updatedAt: new Date().toISOString(),
    };

    updated = this.logActivity(
      updated,
      isArchived ? 'archived' : 'restored',
      isArchived ? `Archived project` : `Restored project from archive`
    );

    await dbService.saveProject(updated);
    return updated;
  }

  /**
   * Duplicate a Project and clone child tasks/files/links
   */
  public async duplicateProject(project: ProjectItem): Promise<ProjectItem> {
    const newId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const newTitle = `${project.title || project.name} (Copy)`;

    const duplicatedTasks: ProjectTask[] = (project.tasks || []).map((t) => ({
      ...t,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: newId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const duplicatedFiles: ProjectFile[] = (project.files || []).map((f) => ({
      ...f,
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: newId,
      createdAt: Date.now(),
    }));

    const duplicatedLinks: ProjectLink[] = (project.links || []).map((l) => ({
      ...l,
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      projectId: newId,
      createdAt: Date.now(),
    }));

    const duplicated: ProjectItem = {
      ...project,
      id: newId,
      title: newTitle,
      name: newTitle,
      createdAt: nowIso,
      updatedAt: nowIso,
      tasks: duplicatedTasks,
      files: duplicatedFiles,
      links: duplicatedLinks,
      progress: calculateProjectProgress(duplicatedTasks),
      isPinned: false,
      isArchived: false,
      activities: [
        {
          id: `act_${Date.now()}`,
          projectId: newId,
          action: 'created',
          description: `Duplicated from "${project.title || project.name}"`,
          timestamp: Date.now(),
        },
      ],
    };

    await dbService.saveProject(duplicated);
    return duplicated;
  }

  /**
   * Delete Project with option to keep or delete associated notes
   */
  public async deleteProject(
    projectId: string,
    options?: { deleteAssociatedNotes?: boolean }
  ): Promise<void> {
    // 1. Delete project from DB
    await dbService.deleteProject(projectId);

    // 2. Handle child notes
    const allNotes = await dbService.getAllNotes();
    const projectNotes = allNotes.filter((n) => n.projectId === projectId);

    if (options?.deleteAssociatedNotes) {
      for (const n of projectNotes) {
        await dbService.deleteNote(n.id);
      }
    } else {
      // Unlink notes so they remain independent
      for (const n of projectNotes) {
        await dbService.saveNote({ ...n, projectId: undefined });
      }
    }
  }

  /**
   * Fetch all notes belonging to a project
   */
  public async getNotesForProject(projectId: string): Promise<NoteItem[]> {
    const allNotes = await dbService.getAllNotes();
    return allNotes.filter((n) => n.projectId === projectId && !n.isDeleted && !n.isArchived);
  }
}

export const projectService = new ProjectService();
