import React, { useState } from 'react';
import { ProjectItem, AppMode } from '../types';
import { Plus, Pin, Trash2, BookOpen, Code, Hammer, FileText, Search } from 'lucide-react';

interface ProjectsViewProps {
  projects: ProjectItem[];
  onSelectProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onOpenNewModal: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onSelectProject,
  onDeleteProject,
  onTogglePin,
  onOpenNewModal,
}) => {
  const [filterMode, setFilterMode] = useState<AppMode | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = projects.filter((p) => {
    const matchesMode = filterMode === 'all' || p.mode === filterMode;
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesMode && matchesSearch;
  });

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'student':
        return <BookOpen className="w-4 h-4 text-emerald-700" />;
      case 'developer':
        return <Code className="w-4 h-4 text-indigo-700" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-700" />;
    }
  };

  return (
    <div className="w-full space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">All Projects</h2>
          <p className="text-xs text-slate-500">Explore and manage notes by mode</p>
        </div>
        <button
          onClick={onOpenNewModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#5B86E5] hover:bg-[#4D78DE] text-white rounded-2xl text-xs font-bold shadow-[0_4px_12px_rgba(91,134,229,0.25)] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {/* Search & Filter pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#5B86E5] shadow-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold shrink-0 cursor-pointer transition ${
              filterMode === 'all'
                ? 'bg-[#5B86E5] text-white shadow-xs'
                : 'bg-white/90 text-slate-600 hover:bg-white border border-slate-200/70'
            }`}
          >
            All ({projects.length})
          </button>
          <button
            onClick={() => setFilterMode('normal')}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold shrink-0 cursor-pointer transition ${
              filterMode === 'normal'
                ? 'bg-[#5B86E5] text-white shadow-xs'
                : 'bg-white/90 text-slate-600 hover:bg-white border border-slate-200/70'
            }`}
          >
            Normal Mod
          </button>
          <button
            onClick={() => setFilterMode('student')}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold shrink-0 cursor-pointer transition ${
              filterMode === 'student'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#EAF8F0] text-emerald-800 hover:bg-[#D4F4E2] border border-[#C2ECD3]'
            }`}
          >
            Student Mod
          </button>
          <button
            onClick={() => setFilterMode('developer')}
            className={`px-3.5 py-1.5 text-xs rounded-full font-bold shrink-0 cursor-pointer transition ${
              filterMode === 'developer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[#EAF1FB] text-indigo-800 hover:bg-[#DCE9FA] border border-[#D4E4FA]'
            }`}
          >
            Developer Mod
          </button>
        </div>
      </div>

      {/* Grid of cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-[26px] border border-slate-200 shadow-xs">
          <p className="text-sm font-bold text-slate-700">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different filter or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white/95 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 rounded-[26px] p-4.5 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100/80 rounded-xl">
                      {getModeIcon(project.mode)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {project.mode === 'normal' ? 'Normal' : project.mode} mod
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => onTogglePin(project.id, e)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition cursor-pointer"
                      title={project.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${project.isPinned ? 'fill-[#5B86E5] text-[#5B86E5]' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete project "${project.title}"?`)) {
                          onDeleteProject(project.id, e);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                  {project.title}
                </h3>
                {project.subtitle && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {project.subtitle}
                  </p>
                )}
                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{project.createdAt}</span>
                {project.tags.length > 0 && (
                  <span className="font-bold text-[#3B66CC] bg-[#EAF1FB] px-2 py-0.5 rounded-full border border-[#D4E4FA]/60">
                    #{project.tags[0]}
                    {project.tags.length > 1 ? ` +${project.tags.length - 1}` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
