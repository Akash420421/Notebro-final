import React, { useState, useRef, useEffect } from 'react';
import { ProjectItem, NoteItem } from '../../types';
import {
  calculateProjectProgress,
  formatDeadlineStatus,
  formatTimeAgo,
} from '../../services/projectService';
import {
  MoreVertical,
  Pin,
  FileText,
  CheckSquare,
  Paperclip,
  Link2,
  Calendar,
  Copy,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  ExternalLink,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectItem;
  notes?: NoteItem[];
  onOpen: (project: ProjectItem) => void;
  onEdit: (project: ProjectItem) => void;
  onDuplicate: (project: ProjectItem) => void;
  onToggleArchive: (project: ProjectItem) => void;
  onTogglePin: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  notes = [],
  onOpen,
  onEdit,
  onDuplicate,
  onToggleArchive,
  onTogglePin,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Derived real counts from DB
  const projectNotes = notes.filter(
    (n) => n.projectId === project.id && !n.isDeleted && !n.isArchived
  );
  const notesCount = projectNotes.length;
  const tasks = project.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const filesCount = (project.files || []).length;
  const linksCount = (project.links || []).length;
  const progress = calculateProjectProgress(tasks);
  const deadlineInfo = formatDeadlineStatus(project.deadline);
  const title = project.name || project.title || 'Untitled Project';
  const icon = project.icon || '📁';
  const color = project.color || '#6366f1';

  return (
    <div
      id={`project-card-${project.id}`}
      onClick={() => onOpen(project)}
      className="group relative bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-[22px] border border-slate-200/90 hover:border-indigo-300/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Top Header Row */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          {/* Project Icon & Title */}
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-xs border border-slate-100/80"
              style={{ backgroundColor: `${color}15`, color: color }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                  {title}
                </h3>
                {project.isPinned && (
                  <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                )}
                {project.isArchived && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-md border border-slate-200 shrink-0">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {project.description || 'No description provided'}
              </p>
            </div>
          </div>

          {/* 3-Dot Action Menu Button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              id={`project-menu-btn-${project.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Project options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                className="absolute right-0 top-8 z-30 w-44 bg-white rounded-xl shadow-[0_10px_32px_rgba(0,0,0,0.12)] border border-slate-200 py-1.5 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpen(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Open Workspace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  Duplicate Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onTogglePin(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  <Pin className="w-3.5 h-3.5 text-slate-400" />
                  {project.isPinned ? 'Unpin from top' : 'Pin to top'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onToggleArchive(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
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
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(project);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar & Dynamic Percentage */}
        <div className="my-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
            <span>Progress</span>
            <span className="font-bold text-slate-800">
              {totalTasks > 0 ? `${progress}% (${completedTasks}/${totalTasks})` : 'No tasks'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalTasks > 0 ? progress : 0}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Meta & Real Counts */}
      <div className="pt-2 border-t border-slate-100/90 space-y-2.5">
        {/* Real Dynamic Counts Grid */}
        <div className="flex items-center flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60"
            title={`${notesCount} notes`}
          >
            <FileText className="w-3 h-3 text-slate-500" />
            {notesCount} {notesCount === 1 ? 'Note' : 'Notes'}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60"
            title={`${completedTasks} of ${totalTasks} tasks completed`}
          >
            <CheckSquare className="w-3 h-3 text-slate-500" />
            {completedTasks}/{totalTasks}
          </span>
          {filesCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60"
              title={`${filesCount} attachments`}
            >
              <Paperclip className="w-3 h-3 text-slate-500" />
              {filesCount}
            </span>
          )}
          {linksCount > 0 && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60"
              title={`${linksCount} links`}
            >
              <Link2 className="w-3 h-3 text-slate-500" />
              {linksCount}
            </span>
          )}
        </div>

        {/* Deadline & Timestamp Row */}
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          {project.deadline ? (
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                deadlineInfo.isOverdue
                  ? 'text-red-600'
                  : deadlineInfo.isDueSoon
                  ? 'text-amber-600'
                  : 'text-slate-600'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {deadlineInfo.text}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(project.updatedAt || project.createdAt)}
            </span>
          )}

          <span className="text-indigo-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Open
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
