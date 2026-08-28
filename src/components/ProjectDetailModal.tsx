import React, { useState } from 'react';
import { ProjectItem } from '../types';
import {
  X,
  Pin,
  Trash2,
  BookOpen,
  Code,
  FileText,
  Calendar,
  Tag,
  Save,
  Copy,
  Check,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onUpdate: (updatedProject: ProjectItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onUpdate,
  onDelete,
  onTogglePin,
}) => {
  if (!project) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [subtitle, setSubtitle] = useState(project.subtitle || '');
  const [description, setDescription] = useState(project.description);
  const [copiedCode, setCopiedCode] = useState(false);

  // Student flashcards flip state
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const handleSaveEdit = () => {
    const updated: ProjectItem = {
      ...project,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      updatedAt: 'Just now',
    };
    onUpdate(updated);
    setIsEditing(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getModeBadge = () => {
    switch (project.mode) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF8F0] text-emerald-800 border border-[#C2ECD3]">
            <BookOpen className="w-3.5 h-3.5" />
            Student Mod
          </span>
        );
      case 'developer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EAF1FB] text-indigo-800 border border-[#D4E4FA]">
            <Code className="w-3.5 h-3.5" />
            Developer Mod
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <FileText className="w-3.5 h-3.5" />
            Normal Mod
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-md rounded-[28px] shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-slate-200/90 overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {getModeBadge()}
            <button
              onClick={() => onTogglePin(project.id)}
              className={`p-1.5 rounded-xl border transition ${
                project.isPinned
                  ? 'bg-[#5B86E5] text-white border-[#5B86E5]'
                  : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
              }`}
              title={project.isPinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Delete this project?')) {
                  onDelete(project.id);
                  onClose();
                }
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-sm outline-none font-bold focus:ring-2 focus:ring-[#5B86E5]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#5B86E5]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Notes / Content
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs outline-none resize-none font-normal focus:ring-2 focus:ring-[#5B86E5]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-2xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-4.5 py-2 text-xs font-bold bg-[#5B86E5] hover:bg-[#4D78DE] text-white rounded-2xl shadow-[0_4px_12px_rgba(91,134,229,0.25)] flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
                    {project.title}
                  </h2>
                  {project.subtitle && (
                    <p className="text-sm font-medium text-slate-500 mt-0.5">
                      {project.subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 text-xs font-bold bg-[#EAF1FB] text-[#3B66CC] hover:bg-[#DCE9FA] border border-[#D4E4FA]/60 rounded-2xl shrink-0"
                >
                  Edit Note
                </button>
              </div>

              {/* Timestamp info */}
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Created {project.createdAt}
                </span>
                <span>•</span>
                <span>Updated {project.updatedAt}</span>
              </div>

              {/* Note body */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-[22px] p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {project.description || 'No description provided.'}
              </div>
            </div>
          )}

          {/* Mode specifics (Student Flashcards / Formulas) */}
          {project.mode === 'student' && project.studentData && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Course: {project.studentData.subject}
              </h4>

              {project.studentData.keyPoints && project.studentData.keyPoints.length > 0 && (
                <div className="p-3 bg-[#EAF8F0] rounded-2xl border border-[#C2ECD3]">
                  <span className="text-xs font-bold text-emerald-900 block mb-1">
                    Key Formulas / Concepts:
                  </span>
                  <ul className="space-y-1">
                    {project.studentData.keyPoints.map((kp, i) => (
                      <li key={i} className="text-xs text-emerald-800 font-medium">
                        • {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {project.studentData.flashcards && project.studentData.flashcards.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1.5">
                    Interactive Flashcards (Tap to flip):
                  </span>
                  <div className="space-y-2">
                    {project.studentData.flashcards.map((fc, i) => {
                      const isFlipped = !!flippedCards[i];
                      return (
                        <div
                          key={i}
                          onClick={() =>
                            setFlippedCards({
                              ...flippedCards,
                              [i]: !isFlipped,
                            })
                          }
                          className="p-3 rounded-2xl border border-[#C2ECD3] bg-white hover:bg-emerald-50/50 cursor-pointer transition text-xs select-none shadow-xs"
                        >
                          <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                            {isFlipped ? 'Answer' : 'Question (Click to reveal)'}
                          </div>
                          <p className="font-semibold text-slate-800">
                            {isFlipped ? fc.answer : fc.question}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Developer Code Snippet */}
          {project.mode === 'developer' && project.developerData && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <Code className="w-4 h-4" />
                  Snippet ({project.developerData.language})
                </span>
                <button
                  onClick={() => handleCopyCode(project.developerData?.codeSnippet || '')}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#3B66CC] bg-[#EAF1FB] hover:bg-[#DCE9FA] border border-[#D4E4FA]/60 px-3 py-1 rounded-2xl transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                <code>{project.developerData.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1.5 items-center">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {project.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 bg-[#EAF1FB] text-[#3B66CC] text-xs font-bold rounded-full border border-[#D4E4FA]/60"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
