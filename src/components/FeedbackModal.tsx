import React, { useState, useRef } from 'react';
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  MessageCircle,
  X,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AuthUser } from '../types';
import { adminService } from '../services/adminService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  onSuccessToast?: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessToast,
}) => {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'idea' | 'feedback'>('idea');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userName, setUserName] = useState(currentUser?.displayName || '');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Image exceeds 3MB limit. Please upload a smaller screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAttachment(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Please provide both a title and description.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await adminService.submitFeedback({
        userId: currentUser?.uid || 'anonymous',
        userEmail: userEmail.trim() || currentUser?.email || 'Not provided',
        userName: userName.trim() || currentUser?.displayName || 'Anonymous User',
        type: feedbackType,
        title: title.trim(),
        description: description.trim(),
        attachment: attachment || undefined,
      });

      setIsSubmitted(true);
      if (onSuccessToast) {
        onSuccessToast('Thank you! Your feedback has been sent to the Admin.');
      }
      setTimeout(() => {
        setIsSubmitted(false);
        setTitle('');
        setDescription('');
        setAttachment(null);
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] text-slate-900 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Share Idea or Report Issue
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sent directly to the workspace development team.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Feedback Submitted!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Thank you! Your feedback has been securely submitted and logged.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Feedback Category Tabs */}
            <div>
              <label className="text-[12px] font-bold text-slate-700 block mb-1.5">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType('idea')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    feedbackType === 'idea'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                  }`}
                >
                  <Lightbulb className={`w-4 h-4 ${feedbackType === 'idea' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>Feature Idea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('bug')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    feedbackType === 'bug'
                      ? 'border-rose-600 bg-rose-50/70 text-rose-900 ring-1 ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                  }`}
                >
                  <Bug className={`w-4 h-4 ${feedbackType === 'bug' ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>Bug / Error</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackType('feedback')}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                    feedbackType === 'feedback'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-600'
                  }`}
                >
                  <MessageCircle className={`w-4 h-4 ${feedbackType === 'feedback' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>Suggestion</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-[12px] font-bold text-slate-700 block mb-1">
                Summary / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  feedbackType === 'bug'
                    ? 'e.g., Note editor freeze on pasting large table'
                    : feedbackType === 'idea'
                    ? 'e.g., Add Notion-style toggle list'
                    : 'e.g., Overall speed and font rendering feedback'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[12px] font-bold text-slate-700 block mb-1">
                Detailed Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the suggestion, steps to reproduce the error, or details of your idea..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition resize-none"
              />
            </div>

            {/* Optional screenshot attachment */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-bold text-slate-700">
                  Attach Screenshot (Optional)
                </label>
                {attachment && (
                  <button
                    type="button"
                    onClick={() => setAttachment(null)}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove attachment
                  </button>
                )}
              </div>

              {attachment ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex items-center gap-3">
                  <img
                    src={attachment}
                    alt="Screenshot attachment"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="text-xs text-slate-600 truncate flex-1 font-medium">
                    Screenshot attached successfully
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>Click to attach image or screenshot</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />
            </div>

            {/* User contact fields (if guest) */}
            {!currentUser && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Your Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
