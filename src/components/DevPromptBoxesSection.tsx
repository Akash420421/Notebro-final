import React, { useState } from 'react';
import { PromptBoxItem } from '../types';
import {
  MessageSquareCode,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface DevPromptBoxesSectionProps {
  promptBoxes: PromptBoxItem[];
  onChange: (prompts: PromptBoxItem[]) => void;
  isOpenDefault?: boolean;
  isAddingExternal?: boolean;
  onCloseAddingExternal?: () => void;
}

export const DevPromptBoxesSection: React.FC<DevPromptBoxesSectionProps> = ({
  promptBoxes,
  onChange,
  isOpenDefault = true,
  isAddingExternal = false,
  onCloseAddingExternal,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isOpenDefault);
  const [internalAddingPrompt, setInternalAddingPrompt] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

  const isAddingPrompt = isAddingExternal || internalAddingPrompt;

  // Form State
  const [promptTitle, setPromptTitle] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [category, setCategory] = useState('');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const closePromptForm = () => {
    setInternalAddingPrompt(false);
    setEditingPromptId(null);
    setPromptTitle('');
    setPromptContent('');
    setCategory('');
    if (onCloseAddingExternal) onCloseAddingExternal();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleStartAdd = () => {
    setEditingPromptId(null);
    setPromptTitle('');
    setPromptContent('');
    setCategory('System Prompt');
    setInternalAddingPrompt(true);
    setIsSectionOpen(true);
  };

  const handleStartEdit = (item: PromptBoxItem) => {
    setEditingPromptId(item.id);
    setPromptTitle(item.title);
    setPromptContent(item.prompt);
    setCategory(item.category || 'General');
    setInternalAddingPrompt(true);
    setIsSectionOpen(true);
  };

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTitle.trim() || !promptContent.trim()) return;

    if (editingPromptId) {
      onChange(
        promptBoxes.map((p) =>
          p.id === editingPromptId
            ? {
                ...p,
                title: promptTitle.trim(),
                prompt: promptContent.trim(),
                category: category.trim() || undefined,
              }
            : p
        )
      );
    } else {
      const newItem: PromptBoxItem = {
        id: `prompt-${Date.now()}`,
        title: promptTitle.trim(),
        prompt: promptContent.trim(),
        category: category.trim() || undefined,
      };
      onChange([...promptBoxes, newItem]);
    }

    closePromptForm();
  };

  const handleDeletePrompt = (id: string) => {
    onChange(promptBoxes.filter((p) => p.id !== id));
  };

  const promptPresets = [
    {
      title: 'PRD Architect System Prompt',
      category: 'PRD',
      prompt:
        'You are a Lead Product Architect. Create a complete, production-ready Product Requirements Document (PRD) with Executive Summary, Target Users, Feature Specifications, Non-Functional Requirements, and Milestone Roadmap.',
    },
    {
      title: 'Database Schema & Migration Prompt',
      category: 'Database',
      prompt:
        'Design a normalized relational database schema for PostgreSQL / Prisma with tables, foreign key constraints, indexes, and sample seed data.',
    },
    {
      title: 'REST API & Zod Validator Prompt',
      category: 'Backend',
      prompt:
        'Design clean REST API endpoints for this module with Express / Next.js route handlers, error handling, and Zod input validation schemas.',
    },
  ];

  const handleApplyPreset = (preset: typeof promptPresets[0]) => {
    setPromptTitle(preset.title);
    setCategory(preset.category);
    setPromptContent(preset.prompt);
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
      {/* Header */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full px-3 sm:px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
            <MessageSquareCode className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>Prompt Boxes</span>
              {promptBoxes.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                  {promptBoxes.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden xs:block">
              Save AI system prompts, test cases, and LLM templates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Add Prompt</span>
          </button>
          <button
            type="button"
            onClick={() => setIsSectionOpen(!isSectionOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer shrink-0"
          >
            {isSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isSectionOpen && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Add / Edit Form */}
          {isAddingPrompt && (
            <form
              onSubmit={handleSavePrompt}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  {editingPromptId ? 'Edit Prompt Box' : 'New Prompt Box'}
                </span>
                <button
                  type="button"
                  onClick={closePromptForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Presets */}
              {!editingPromptId && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">Presets:</span>
                  {promptPresets.map((pr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(pr)}
                      className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium shrink-0 cursor-pointer transition border border-indigo-200/60"
                    >
                      {pr.title}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    PROMPT TITLE / PURPOSE
                  </label>
                  <input
                    type="text"
                    required
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    placeholder="e.g. System Architect Prompt, Copywriter..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    CATEGORY / TAG
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Architecture, LLM"
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold text-slate-600">
                    PROMPT CONTENT
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {promptContent.length} chars • {promptContent.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={promptContent}
                  onChange={(e) => setPromptContent(e.target.value)}
                  placeholder="Type or paste the complete prompt text here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 leading-relaxed resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closePromptForm}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
                >
                  {editingPromptId ? 'Save Changes' : 'Save Prompt Box'}
                </button>
              </div>
            </form>
          )}

          {/* List of Prompt Boxes */}
          {promptBoxes.length > 0 ? (
            <div className="space-y-2.5">
              {promptBoxes.map((item) => {
                const isCopied = copiedPromptId === item.id;
                const charCount = item.prompt.length;
                const wordCount = item.prompt.split(/\s+/).filter(Boolean).length;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <MessageSquareCode className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                        {item.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/60">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.prompt)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                          }`}
                          title="Copy Prompt"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeletePrompt(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Prompt Text Box */}
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto select-all">
                      {item.prompt}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                      <span>{wordCount} words • {charCount} characters</span>
                      <span className="font-mono text-slate-400">1-click ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingPrompt && (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No prompt boxes added yet.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="mt-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Prompt Box</span>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
