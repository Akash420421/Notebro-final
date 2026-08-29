import React, { useState } from 'react';
import { ProjectItem, ProjectLink } from '../../types';
import { formatTimeAgo } from '../../services/projectService';
import {
  Link2,
  Plus,
  ExternalLink,
  Trash2,
  Globe,
  Clock,
  X,
} from 'lucide-react';

interface ProjectLinksTabProps {
  project: ProjectItem;
  onAddLink: (linkData: {
    title: string;
    url: string;
    description?: string;
  }) => void;
  onDeleteLink: (linkId: string) => void;
}

export const ProjectLinksTab: React.FC<ProjectLinksTabProps> = ({
  project,
  onAddLink,
  onDeleteLink,
}) => {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  const links = project.links || [];

  const handleCreateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onAddLink({
      title: title.trim() || url.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
    });

    setTitle('');
    setUrl('');
    setDescription('');
    setIsAddingLink(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Project Resource Links
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {links.length} external {links.length === 1 ? 'bookmark' : 'bookmarks'} saved
          </p>
        </div>

        <button
          onClick={() => setIsAddingLink(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Link</span>
        </button>
      </div>

      {/* Add Link Form */}
      {isAddingLink && (
        <form
          onSubmit={handleCreateLink}
          className="bg-white rounded-2xl border border-indigo-200/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(99,102,241,0.08)] space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-indigo-600" />
              <span>Add Resource Link</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingLink(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://github.com/..., https://figma.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. GitHub Repository, Figma Design System, API Documentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief description about this link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingLink(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      {/* Links List */}
      {links.length === 0 ? (
        <div className="py-8 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <Globe className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No links added yet</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Bookmark relevant external resources, GitHub repos, Google Docs, Figma files, or research links.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((link) => (
            <div
              key={link.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 flex flex-col justify-between shadow-xs transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={link.title}>
                      {link.title}
                    </h5>
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-500 hover:underline truncate block mb-2"
                >
                  {link.url}
                </a>

                {link.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {link.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(link.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove link "${link.title}"?`)) {
                      onDeleteLink(link.id);
                    }
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Delete link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
