import React from 'react';
import { ProjectItem, ProjectActivityItem } from '../../types';
import { formatTimeAgo } from '../../services/projectService';
import {
  Activity,
  CheckCircle2,
  FileText,
  Paperclip,
  Link2,
  Edit2,
  Pin,
  Archive,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ProjectActivityTabProps {
  project: ProjectItem;
}

export const ProjectActivityTab: React.FC<ProjectActivityTabProps> = ({ project }) => {
  const activities = project.activities || [];

  const getActivityIcon = (action: ProjectActivityItem['action']) => {
    switch (action) {
      case 'created':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'note_added':
      case 'note_removed':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'task_added':
      case 'task_uncompleted':
      case 'task_deleted':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'file_added':
      case 'file_deleted':
        return <Paperclip className="w-4 h-4 text-purple-600" />;
      case 'link_added':
      case 'link_deleted':
        return <Link2 className="w-4 h-4 text-amber-600" />;
      case 'pinned':
      case 'unpinned':
        return <Pin className="w-4 h-4 text-amber-500" />;
      case 'archived':
      case 'restored':
        return <Archive className="w-4 h-4 text-slate-600" />;
      default:
        return <Edit2 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Activity & Audit Log
        </h4>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time event history for {project.name || project.title}
        </p>
      </div>

      {/* Activities Timeline */}
      {activities.length === 0 ? (
        <div className="py-12 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No activity recorded yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Events such as adding notes, completing tasks, and uploading files will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3 text-xs">
                {/* Circle Icon Badge */}
                <div className="absolute -left-6 w-5 h-5 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center -translate-x-1/2">
                  {getActivityIcon(act.action)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-800 font-bold text-xs leading-relaxed">
                    {act.description}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {formatTimeAgo(act.timestamp)} •{' '}
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
