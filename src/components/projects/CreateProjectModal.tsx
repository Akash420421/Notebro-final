import React, { useState } from 'react';
import { AppMode, ProjectItem } from '../../types';
import {
  DEFAULT_PROJECT_ICONS,
  PROJECT_COLOR_OPTIONS,
} from '../../services/projectService';
import {
  X,
  Plus,
  BookOpen,
  Code,
  FileText,
  Calendar,
  Tag,
  Sparkles,
} from 'lucide-react';
import { MODES } from '../ModeSelector';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialMode?: AppMode;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMode = 'normal',
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📁');
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLOR_OPTIONS[0]);
  const [deadline, setDeadline] = useState('');
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProject: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title: name.trim(),
      name: name.trim(),
      description: description.trim(),
      icon,
      color: selectedColor.hex,
      deadline: deadline || undefined,
      mode,
      tags,
      isPinned: false,
      isArchived: false,
      progress: 0,
      tasks: [],
      files: [],
      links: [],
      activities: [
        {
          id: `act_${Date.now()}`,
          projectId: '',
          action: 'created',
          description: `Created project "${name.trim()}"`,
          timestamp: Date.now(),
        },
      ],
    };

    onSave(newProject);
    onClose();

    // Reset Form
    setName('');
    setDescription('');
    setIcon('📁');
    setSelectedColor(PROJECT_COLOR_OPTIONS[0]);
    setDeadline('');
    setTags([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-slate-200/90 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${selectedColor.hex}15`, color: selectedColor.hex }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                Create New Project
              </h3>
              <p className="text-xs text-slate-500">
                Setup workspace container for your goals & notes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Note Bro App, Final Year Exam Prep, System Architecture"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              placeholder="What are the goals, milestones or scope of this project?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Icon & Color Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto">
                {DEFAULT_PROJECT_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                      icon === emoji
                        ? 'bg-white shadow-xs border border-indigo-300 scale-110'
                        : 'hover:bg-slate-200/60'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Accent Theme
              </label>
              <div className="flex flex-wrap gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl max-h-24 overflow-y-auto items-center">
                {PROJECT_COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      selectedColor.hex === c.hex
                        ? 'ring-2 ring-offset-2 ring-slate-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Target Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Deadline (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Workspace Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className={isSelected ? 'text-white' : 'text-neutral-600'}>{m.icon}</div>
                    <span className="text-[11px] font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Tags (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag (e.g. backend, biology, sprint1)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
