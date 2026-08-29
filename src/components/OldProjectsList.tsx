import React, { useState } from 'react';
import { ProjectItem, NoteItem } from '../types';
import { calculateProjectProgress, formatDeadlineStatus } from '../services/projectService';
import {
  Pin,
  Trash2,
  BookOpen,
  Code,
  FileText,
  ChevronRight,
  Layers,
  AlertCircle,
  X,
  CheckSquare,
  Paperclip,
  Link2,
  Calendar,
} from 'lucide-react';

interface OldProjectsListProps {
  projects: ProjectItem[];
  notes?: NoteItem[];
  onSelectProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string, e?: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
}

export const OldProjectsList: React.FC<OldProjectsListProps> = ({
  projects,
  notes = [],
  onSelectProject,
  onDeleteProject,
  onTogglePin,
}) => {
  const [projectToDelete, setProjectToDelete] = useState<ProjectItem | null>(null);

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case 'student':
        return {
          label: 'Student',
          icon: <BookOpen className="w-3 h-3 text-emerald-700" />,
          badgeBg: 'bg-[#EAF8F0] text-emerald-800 border-[#C2ECD3]',
        };
      case 'developer':
        return {
          label: 'Developer',
          icon: <Code className="w-3 h-3 text-indigo-700" />,
          badgeBg: 'bg-[#EAF1FB] text-indigo-800 border-[#D4E4FA]',
        };
      default:
        return {
          label: 'Normal',
          icon: <FileText className="w-3 h-3 text-slate-700" />,
          badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
        };
    }
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectToDelete) {
      onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="w-full">
      {/* Title & Count */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
            Old projects
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-[#EAF1FB] text-[#3B66CC] border border-[#D4E4FA]/60 rounded-full">
            {projects.length}
          </span>
        </div>

        {projects.length > 2 && (
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5">
            Scroll
            <ChevronRight className="w-3 h-3" />
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 px-4 bg-white/80 rounded-[26px] border border-slate-200 shadow-xs">
          <Layers className="w-6 h-6 mx-auto mb-1.5 text-slate-400" />
          <p className="text-slate-700 text-xs font-bold">
            No projects in this category
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Tap "+ New project" below to create one.
          </p>
        </div>
      ) : (
        /* Horizontal Scrollable Row */
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-1 px-1">
          {projects.map((project) => {
            const badge = getModeBadge(project.mode);
            const projectNotesCount = notes.filter((n) => n.projectId === project.id).length;
            const tasks = project.tasks || [];
            const completedCount = tasks.filter((t) => t.completed).length;
            const progress = calculateProjectProgress(tasks);
            const deadline = project.deadline ? formatDeadlineStatus(project.deadline) : null;

            return (
              <div
                key={project.id}
                id={`project-card-${project.id}`}
                onClick={() => onSelectProject(project)}
                className="snap-start shrink-0 w-64 sm:w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 hover:border-indigo-300 rounded-[26px] p-4.5 flex flex-col justify-between cursor-pointer transition-all duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] group relative"
              >
                <div>
                  {/* Top Bar: Mode tag & pin & delete */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.badgeBg}`}
                    >
                      {project.icon ? <span className="text-xs">{project.icon}</span> : badge.icon}
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1 relative z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onTogglePin(project.id, e);
                        }}
                        className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                          project.isPinned
                            ? 'text-[#5B86E5] bg-[#EAF1FB]'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={project.isPinned ? 'Unpin project' : 'Pin to top'}
                      >
                        <Pin
                          className={`w-3.5 h-3.5 ${
                            project.isPinned ? 'fill-[#5B86E5]' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        id={`delete-project-${project.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setProjectToDelete(project);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1 mb-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">
                    {project.name || project.title}
                  </h4>
                  {project.subtitle && (
                    <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mb-1.5">
                      {project.subtitle}
                    </p>
                  )}

                  {/* Description preview */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
                    {project.description || 'No description added.'}
                  </p>

                  {/* Progress bar */}
                  {tasks.length > 0 && (
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                        <span>{completedCount}/{tasks.length} Tasks</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Tags, notes count and timestamp */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {projectNotesCount}
                    </span>
                    {project.tags && project.tags.length > 0 && (
                      <span className="bg-[#EAF1FB] text-[#3B66CC] font-bold px-2 py-0.5 rounded-full text-[10px] truncate max-w-[80px] border border-[#D4E4FA]/60">
                        #{project.tags[0]}
                      </span>
                    )}
                  </div>

                  <span className="shrink-0 text-[10px] font-medium text-slate-400">
                    {deadline ? deadline.text : (project.updatedAt || project.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal for Old Projects */}
      {projectToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setProjectToDelete(null);
          }}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <button
                onClick={() => setProjectToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Delete Project?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{projectToDelete.name || projectToDelete.title}"</strong>? This will remove the project card from workspace.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
