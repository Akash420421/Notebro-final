import React from 'react';
import { ProjectItem, NoteItem, ProjectTask, ProjectLink, ProjectFile } from '../../types';
import {
  calculateProjectProgress,
  formatDeadlineStatus,
  formatTimeAgo,
  formatFileSize,
} from '../../services/projectService';
import {
  FileText,
  CheckSquare,
  Paperclip,
  Link2,
  Calendar,
  Clock,
  Pin,
  Plus,
  ArrowRight,
  Activity,
  CheckCircle2,
  Circle,
  ExternalLink,
  Tag,
  BookOpen,
  Code,
  Layers,
} from 'lucide-react';

interface ProjectOverviewTabProps {
  project: ProjectItem;
  notes: NoteItem[];
  onSwitchTab: (tab: 'overview' | 'notes' | 'tasks' | 'files' | 'links' | 'activity') => void;
  onOpenNote: (note: NoteItem) => void;
  onToggleTask: (taskId: string) => void;
  onCreateNote: () => void;
  onAddTask: () => void;
  onAddFile: () => void;
  onAddLink: () => void;
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({
  project,
  notes,
  onSwitchTab,
  onOpenNote,
  onToggleTask,
  onCreateNote,
  onAddTask,
  onAddFile,
  onAddLink,
}) => {
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed);
  const pendingTasks = tasks.filter((t) => !t.completed);
  const files = project.files || [];
  const links = project.links || [];
  const activities = project.activities || [];
  const progress = calculateProjectProgress(tasks);
  const deadlineInfo = formatDeadlineStatus(project.deadline);
  const color = project.color || '#6366f1';

  // Pinned items inside this project
  const pinnedNotes = notes.filter((n) => n.isPinned);
  const pinnedTasks = tasks.filter((t) => t.isPinned);
  const pinnedLinks = links.filter((l) => l.isPinned);
  const hasPinnedItems = pinnedNotes.length > 0 || pinnedTasks.length > 0 || pinnedLinks.length > 0;

  return (
    <div className="space-y-6">
      {/* Description & Tags Banner */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              About this Project
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {project.description || 'No detailed description added yet. Tap "Edit Project" to add goals, background, or scope.'}
            </p>

            {/* Tags list */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    <Tag className="w-2.5 h-2.5 text-slate-500" />
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mode Pill */}
          {project.mode && project.mode !== 'normal' && (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {project.mode === 'student' ? (
                <>
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Student Mode
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5 text-indigo-600" />
                  Developer Mode
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Key Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Notes Count */}
        <div
          onClick={() => onSwitchTab('notes')}
          className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-black text-slate-900">{notes.length}</div>
          <div className="text-xs font-semibold text-slate-500">Notes Documented</div>
        </div>

        {/* Tasks Progress */}
        <div
          onClick={() => onSwitchTab('tasks')}
          className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {completedTasks.length}/{tasks.length}
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {tasks.length > 0 ? `${progress}% Tasks Done` : 'No Tasks Yet'}
          </div>
        </div>

        {/* Files Attached */}
        <div
          onClick={() => onSwitchTab('files')}
          className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Paperclip className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-black text-slate-900">{files.length}</div>
          <div className="text-xs font-semibold text-slate-500">Files & Attachments</div>
        </div>

        {/* External Links */}
        <div
          onClick={() => onSwitchTab('links')}
          className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-2xl font-black text-slate-900">{links.length}</div>
          <div className="text-xs font-semibold text-slate-500">Resource Links</div>
        </div>
      </div>

      {/* Progress & Deadline Details Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Task Completion Status
            </span>
            <div className="text-lg font-black text-slate-800">
              {tasks.length > 0
                ? `${progress}% Finished (${completedTasks.length} done, ${pendingTasks.length} pending)`
                : 'No tasks configured for this project'}
            </div>
          </div>

          {/* Deadline Indicator */}
          {project.deadline ? (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div
                  className={`text-xs font-bold ${
                    deadlineInfo.isOverdue
                      ? 'text-red-600'
                      : deadlineInfo.isDueSoon
                      ? 'text-amber-600'
                      : 'text-slate-700'
                  }`}
                >
                  {deadlineInfo.text}
                </div>
                <div className="text-[11px] text-slate-500">
                  Target: {new Date(project.deadline).toLocaleDateString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              No target deadline set
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${tasks.length > 0 ? progress : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Pinned Items Section (if any exist) */}
      {hasPinnedItems && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Pinned Items in Project</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pinnedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenNote(note)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {note.title || 'Untitled note'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">Note</span>
              </div>
            ))}

            {pinnedTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={`text-xs font-bold truncate ${
                      task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">Task</span>
              </div>
            ))}

            {pinnedLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Link2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">{link.title}</span>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Section: Quick Tasks Preview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick Pending Tasks Box */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Pending Tasks</span>
              <span className="text-[11px] font-bold px-2 py-0.2 bg-emerald-50 text-emerald-700 rounded-full">
                {pendingTasks.length}
              </span>
            </h4>
            <button
              onClick={() => onSwitchTab('tasks')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
              All caught up! No pending tasks.
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className="p-2.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-slate-50/60 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Circle className="w-4 h-4 text-slate-400 shrink-0 hover:text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">{task.title}</div>
                    {task.dueDate && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {task.dueDate}
                      </div>
                    )}
                  </div>
                  {task.priority && task.priority !== 'medium' && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        task.priority === 'high'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onAddTask}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-dashed border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Task</span>
          </button>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Recent Activity</span>
            </h4>
            <button
              onClick={() => onSwitchTab('activity')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              Full Log
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {activities.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs">
              <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
              No activities recorded yet
            </div>
          ) : (
            <div className="space-y-2.5">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold truncate">{act.description}</p>
                    <span className="text-[10px] text-slate-400">
                      {formatTimeAgo(act.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
