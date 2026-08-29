import React, { useState, useEffect } from 'react';
import { ProjectItem, NoteItem, FolderItem } from '../../types';
import {
  projectService,
  calculateProjectProgress,
  formatDeadlineStatus,
} from '../../services/projectService';
import { ProjectOverviewTab } from './ProjectOverviewTab';
import { ProjectNotesTab } from './ProjectNotesTab';
import { ProjectTasksTab } from './ProjectTasksTab';
import { ProjectFilesTab } from './ProjectFilesTab';
import { ProjectLinksTab } from './ProjectLinksTab';
import { ProjectActivityTab } from './ProjectActivityTab';
import { EditProjectModal } from './EditProjectModal';
import { DeleteProjectModal } from './DeleteProjectModal';
import {
  ArrowLeft,
  MoreVertical,
  Pin,
  FileText,
  CheckSquare,
  Paperclip,
  Link2,
  Activity,
  Plus,
  Edit2,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProjectDetailViewProps {
  project: ProjectItem;
  notes: NoteItem[];
  folders?: FolderItem[];
  onBack: () => void;
  onUpdateProject: (updatedProject: ProjectItem) => void;
  onDeleteProject: (projectId: string, deleteAssociatedNotes?: boolean) => void;
  onOpenNote: (note: NoteItem) => void;
  onCreateNote: (projectId: string) => void;
  onSaveNote: (note: NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
  onDuplicateProject: (project: ProjectItem) => void;
}

export type ProjectTabKey = 'overview' | 'notes' | 'tasks' | 'files' | 'links' | 'activity';

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project: initialProject,
  notes,
  folders = [],
  onBack,
  onUpdateProject,
  onDeleteProject,
  onOpenNote,
  onCreateNote,
  onSaveNote,
  onDeleteNote,
  onDuplicateProject,
}) => {
  const [project, setProject] = useState<ProjectItem>(initialProject);
  const [activeTab, setActiveTab] = useState<ProjectTabKey>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Sync state if initialProject prop updates
  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const projectNotes = notes.filter(
    (n) => n.projectId === project.id && !n.isDeleted && !n.isArchived
  );
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progress = calculateProjectProgress(tasks);
  const deadlineInfo = formatDeadlineStatus(project.deadline);
  const color = project.color || '#6366f1';

  // --- Handlers for Child Entities ---
  const handleUpdate = async (updated: ProjectItem) => {
    setProject(updated);
    onUpdateProject(updated);
  };

  const handleAddTask = async (taskData: {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
  }) => {
    const updated = await projectService.addTask(project, taskData);
    handleUpdate(updated);
  };

  const handleToggleTask = async (taskId: string) => {
    const updated = await projectService.toggleTask(project, taskId);
    handleUpdate(updated);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = await projectService.deleteTask(project, taskId);
    handleUpdate(updated);
  };

  const handleAddFile = async (fileData: {
    name: string;
    url: string;
    size?: number;
    type?: string;
  }) => {
    const updated = await projectService.addFile(project, fileData);
    handleUpdate(updated);
  };

  const handleDeleteFile = async (fileId: string) => {
    const updated = await projectService.deleteFile(project, fileId);
    handleUpdate(updated);
  };

  const handleAddLink = async (linkData: {
    title: string;
    url: string;
    description?: string;
  }) => {
    const updated = await projectService.addLink(project, linkData);
    handleUpdate(updated);
  };

  const handleDeleteLink = async (linkId: string) => {
    const updated = await projectService.deleteLink(project, linkId);
    handleUpdate(updated);
  };

  const handleTogglePin = async () => {
    const updated = await projectService.togglePinProject(project);
    handleUpdate(updated);
  };

  const handleToggleArchive = async () => {
    const updated = await projectService.toggleArchiveProject(project);
    handleUpdate(updated);
  };

  const handleRemoveNoteFromProject = async (note: NoteItem) => {
    const updatedNote = { ...note, projectId: undefined };
    onSaveNote(updatedNote);
    const updated = projectService.logActivity(
      project,
      'note_removed',
      `Unlinked note "${note.title || 'Untitled'}" from project`
    );
    handleUpdate(updated);
  };

  const handleTogglePinNote = async (noteId: string) => {
    const targetNote = notes.find((n) => n.id === noteId);
    if (targetNote) {
      onSaveNote({ ...targetNote, isPinned: !targetNote.isPinned });
    }
  };

  return (
    <div className="w-full pb-20 animate-in fade-in duration-200">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </button>

          {/* Center Project Title & Icon preview */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{project.icon || '📁'}</span>
            <h1 className="text-sm sm:text-base font-black text-slate-900 truncate">
              {project.name || project.title}
            </h1>
            {project.isPinned && (
              <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onCreateNote(project.id)}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>

            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                project.isPinned
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
              title={project.isPinned ? 'Unpin project' : 'Pin project'}
            >
              <Pin className="w-4 h-4" />
            </button>

            {/* 3-Dot Options Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 top-10 z-40 w-48 bg-white rounded-2xl shadow-[0_10px_32px_rgba(0,0,0,0.12)] border border-slate-200 py-1.5 animate-in fade-in zoom-in-95"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    Edit Project
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onDuplicateProject(project);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Duplicate Project
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleToggleArchive();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    {project.isArchived ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                        Restore Project
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        Archive Project
                      </>
                    )}
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Project Workspace Header Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[26px] border border-slate-200/90 p-5 sm:p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-xs border border-slate-100"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {project.icon || '📁'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                  {project.name || project.title}
                </h2>
                {project.status === 'archived' && (
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">
                {project.description || 'Workspace mini-container for notes, tasks, files & links'}
              </p>
            </div>
          </div>

          {/* Quick Context Action Bar */}
          <div className="flex items-center flex-wrap gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <button
              onClick={() => onCreateNote(project.id)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200/60 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Note</span>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200/60 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>+ Task</span>
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-200/60 transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>+ File</span>
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-amber-200/60 transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>+ Link</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-6 border-b border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {projectNotes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'tasks' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {completedTasks}/{tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Files</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'files' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {(project.files || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Links</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'links' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {(project.links || []).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content View */}
      <div>
        {activeTab === 'overview' && (
          <ProjectOverviewTab
            project={project}
            notes={projectNotes}
            onSwitchTab={(t) => setActiveTab(t)}
            onOpenNote={onOpenNote}
            onToggleTask={handleToggleTask}
            onCreateNote={() => onCreateNote(project.id)}
            onAddTask={() => setActiveTab('tasks')}
            onAddFile={() => setActiveTab('files')}
            onAddLink={() => setActiveTab('links')}
          />
        )}

        {activeTab === 'notes' && (
          <ProjectNotesTab
            project={project}
            notes={projectNotes}
            folders={folders}
            onOpenNote={onOpenNote}
            onCreateNote={() => onCreateNote(project.id)}
            onTogglePinNote={handleTogglePinNote}
            onRemoveFromProject={handleRemoveNoteFromProject}
            onDeleteNote={onDeleteNote}
          />
        )}

        {activeTab === 'tasks' && (
          <ProjectTasksTab
            project={project}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'files' && (
          <ProjectFilesTab
            project={project}
            onAddFile={handleAddFile}
            onDeleteFile={handleDeleteFile}
          />
        )}

        {activeTab === 'links' && (
          <ProjectLinksTab
            project={project}
            onAddLink={handleAddLink}
            onDeleteLink={handleDeleteLink}
          />
        )}

        {activeTab === 'activity' && <ProjectActivityTab project={project} />}
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        project={project}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdate}
      />

      {/* Delete Project Confirmation Modal */}
      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        project={project}
        notes={notes}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={(id, deleteNotes) => {
          onDeleteProject(id, deleteNotes);
          onBack();
        }}
      />
    </div>
  );
};
