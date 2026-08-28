import React, { useState } from 'react';
import { ImportantQuestion } from '../types';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface StudentImportantQuestionsSectionProps {
  questions: ImportantQuestion[];
  onChange: (questions: ImportantQuestion[]) => void;
  isAddingNewExternal?: boolean;
  onCloseAddingNewExternal?: () => void;
}

export const StudentImportantQuestionsSection: React.FC<StudentImportantQuestionsSectionProps> = ({
  questions,
  onChange,
  isAddingNewExternal = false,
  onCloseAddingNewExternal,
}) => {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [internalAddingNew, setInternalAddingNew] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'normal'>('high');

  const isAddingNew = isAddingNewExternal || internalAddingNew;

  const closeAdding = () => {
    setInternalAddingNew(false);
    if (onCloseAddingNewExternal) onCloseAddingNewExternal();
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const item: ImportantQuestion = {
      id: `q-${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      priority: newPriority,
      isImportant: true,
    };

    onChange([...questions, item]);
    setNewQuestion('');
    setNewAnswer('');
    closeAdding();
    // Auto-reveal for the creator initially
    setRevealedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleDelete = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  // If there are no questions and user is not adding a new one, don't show a giant empty card
  if (questions.length === 0 && !isAddingNew) {
    return null;
  }

  return (
    <div className="my-3 rounded-2xl bg-amber-50/50 border border-amber-200/70 p-3 sm:p-4 shadow-2xs space-y-3 animate-in fade-in duration-150">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Star className="w-3.5 h-3.5 fill-white" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
              Important Exam Questions
            </h4>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded-full border border-amber-300">
              {questions.length} Q&A
            </span>
          </div>
        </div>

        {!isAddingNew && (
          <button
            type="button"
            onClick={() => setInternalAddingNew(true)}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Add Q&A</span>
          </button>
        )}
      </div>

      {/* Inline Form to add a new question */}
      {isAddingNew && (
        <form
          onSubmit={handleAddQuestion}
          className="p-3.5 rounded-xl bg-white border border-amber-300 shadow-sm space-y-2.5 animate-in fade-in zoom-in-98 duration-150"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              New Important Question
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">Priority:</span>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 rounded-md px-1.5 py-0.5 outline-none cursor-pointer"
              >
                <option value="high">⭐ High (Must Know)</option>
                <option value="medium">⚡ Medium</option>
                <option value="normal">📌 Normal</option>
              </select>
            </div>
          </div>

          <div>
            <input
              type="text"
              required
              autoFocus
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="e.g. State Newton's Second Law & derive F = ma"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <textarea
              rows={2}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Model Answer / Key formulas / points (optional)..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onClick={closeAdding}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
            >
              Save Question
            </button>
          </div>
        </form>
      )}

      {/* Dynamic List of Questions */}
      {questions.length > 0 && (
        <div className="space-y-2">
          {questions.map((q, idx) => {
            const isRevealed = revealedIds[q.id] ?? false;

            return (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-white border border-amber-200/70 hover:border-amber-300 transition shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <span className="shrink-0 w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[11px] flex items-center justify-center mt-0.5">
                      Q{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                            q.priority === 'high'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : q.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {q.priority === 'high' ? '⭐ High Yield' : q.priority === 'medium' ? '⚡ Medium' : '📌 Normal'}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h5>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Toggle Answer Reveal */}
                    {q.answer && (
                      <button
                        type="button"
                        onClick={() => toggleReveal(q.id)}
                        className={`p-1 rounded-md text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          isRevealed
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                        }`}
                        title={isRevealed ? 'Hide Answer' : 'Reveal Answer'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px] hidden sm:inline">
                          {isRevealed ? 'Hide' : 'Answer'}
                        </span>
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Answer Section with Active Recall Toggle */}
                {q.answer && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    {isRevealed ? (
                      <div className="p-2.5 rounded-lg bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-100 font-normal">
                        <span className="font-bold block mb-0.5 text-[10px] uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Answer / Key Points:
                        </span>
                        {q.answer}
                      </div>
                    ) : (
                      <div
                        onClick={() => toggleReveal(q.id)}
                        className="py-1.5 px-2 rounded-lg bg-amber-50/70 border border-dashed border-amber-200 text-center text-[11px] font-bold text-amber-900 cursor-pointer hover:bg-amber-100/70 transition flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-amber-700" />
                        <span>Tap to Reveal Answer (Flashcard Practice)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
