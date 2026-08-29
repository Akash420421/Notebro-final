import React, { useState } from 'react';
import { AppMode, ProjectItem } from '../types';
import { X, Plus, BookOpen, Code, Hammer, FileText, Check, Tag } from 'lucide-react';
import { MODES } from './ModeSelector';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialMode?: AppMode;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMode = 'normal',
}) => {
  const [mode, setMode] = useState<AppMode>(initialMode);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Student mode fields
  const [subject, setSubject] = useState('');
  const [keyPointInput, setKeyPointInput] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);

  // Developer mode fields
  const [language, setLanguage] = useState('typescript');
  const [codeSnippet, setCodeSnippet] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const clean = tagInput.trim().replace(/^#/, '');
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddKeyPoint = () => {
    if (!keyPointInput.trim()) return;
    setKeyPoints([...keyPoints, keyPointInput.trim()]);
    setKeyPointInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProject: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      mode,
      tags,
      isPinned: false,
    };

    if (mode === 'student') {
      newProject.studentData = {
        subject: subject.trim() || 'General Study',
        keyPoints,
      };
    } else if (mode === 'developer') {
      newProject.developerData = {
        language,
        codeSnippet,
      };
    }

    onSave(newProject);
    onClose();
    // Reset form
    setTitle('');
    setSubtitle('');
    setDescription('');
    setTags([]);
    setKeyPoints([]);
    setCodeSnippet('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-slate-200/90 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Create New Project
            </h3>
            <p className="text-xs text-slate-500">
              Select mode & customize your notes template
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Mode Selector Row */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Mode
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {MODES.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                        : 'border-slate-200 bg-slate-100/90 hover:bg-slate-200/80 text-slate-800'
                    }`}
                  >
                    <div className={isSelected ? 'text-white' : 'text-neutral-600'}>
                      {m.icon}
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Thermodynamics Chapter 4 / React Dashboard API"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#5B86E5] focus:bg-white outline-none"
            />
          </div>

          {/* Subtitle input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subtitle or Topic
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Physics lecture 12 / Authentication endpoints"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#5B86E5] focus:bg-white outline-none"
            />
          </div>

          {/* Description / Content input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your notes, objectives, or summary here..."
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#5B86E5] focus:bg-white outline-none resize-none"
            />
          </div>

          {/* Mode-Specific Fields */}
          {mode === 'student' && (
            <div className="p-3.5 bg-[#EAF8F0] border border-[#C2ECD3] rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <BookOpen className="w-4 h-4" />
                Student Mod Details
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  Subject / Course
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Chemistry, Computer Science"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  Key Formulas / Takeaways
                </label>
                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    value={keyPointInput}
                    onChange={(e) => setKeyPointInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyPoint())}
                    placeholder="Add a formula or key point..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-xl outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyPoint}
                    className="px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-medium"
                  >
                    Add
                  </button>
                </div>
                {keyPoints.length > 0 && (
                  <ul className="space-y-1">
                    {keyPoints.map((kp, idx) => (
                      <li key={idx} className="text-xs text-emerald-900 flex items-center justify-between bg-white px-2.5 py-1 rounded-xl border border-emerald-200">
                        <span>• {kp}</span>
                        <button
                          type="button"
                          onClick={() => setKeyPoints(keyPoints.filter((_, i) => i !== idx))}
                          className="text-emerald-500 hover:text-red-500 ml-2"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {mode === 'developer' && (
            <div className="p-3.5 bg-[#EAF1FB] border border-[#D4E4FA] rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                <Code className="w-4 h-4" />
                Developer Mod Snippet
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-indigo-900">
                  Programming Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 py-1 text-xs bg-white border border-indigo-300 rounded-xl outline-none"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="html">HTML/CSS</option>
                  <option value="sql">SQL</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <textarea
                  rows={4}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="// Paste your code snippet, function, or API schema here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-900 text-neutral-100 rounded-xl outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tags & Labels
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="e.g. Physics, Sprint12, Ideas"
                className="flex-1 px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#5B86E5]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 bg-[#EAF1FB] text-[#3B66CC] hover:bg-[#DCE9FA] rounded-2xl text-xs font-bold border border-[#D4E4FA]/60"
              >
                Add Tag
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF1FB] text-[#3B66CC] border border-[#D4E4FA]/60"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-slate-700 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-2xl"
            >
              Cancel
            </button>
            <button
              id="save-new-project-btn"
              type="submit"
              className="px-6 py-2.5 bg-[#5B86E5] hover:bg-[#4D78DE] text-white text-sm font-bold rounded-2xl shadow-[0_4px_16px_rgba(91,134,229,0.3)] cursor-pointer active:scale-95 transition"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
