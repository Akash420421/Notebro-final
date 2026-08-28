import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { StudentDoubtSession, StudentChatMessage } from '../types';
import {
  ArrowLeft,
  X,
  ArrowUp,
  Image as ImageIcon,
  History,
  Plus,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  Cpu,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { nvidiaService, NvidiaConnectionState, DEFAULT_NVIDIA_MODELS } from '../services/nvidiaProvider';
import { NvidiaConnectModal } from './NvidiaConnectModal';

interface StudentAIDoubtModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteContext?: {
    title: string;
    body: string;
    subject?: string;
  };
}

const STORAGE_KEY = 'student_doubt_sessions_v2';

export const StudentAIDoubtModal: React.FC<StudentAIDoubtModalProps> = ({
  isOpen,
  onClose,
  noteContext,
}) => {
  const [sessions, setSessions] = useState<StudentDoubtSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [nvidiaState, setNvidiaState] = useState<NvidiaConnectionState>(nvidiaService.getState());
  const [showNvidiaModal, setShowNvidiaModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const modelPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = nvidiaService.subscribe(setNvidiaState);
    return unsub;
  }, []);

  // Close model picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    if (showModelPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showModelPicker]);

  // Load saved doubt sessions or initialize
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StudentDoubtSession[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load saved doubt sessions', e);
    }

    const firstSession: StudentDoubtSession = {
      id: `session-${Date.now()}`,
      title: noteContext?.title ? `Discussion: ${noteContext.title}` : 'Study Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      subject: noteContext?.subject || 'All Subjects',
      messages: [
        {
          id: 'welcome-msg',
          sender: 'ai',
          text: `Hello! I am your AI academic tutor.\n\nAsk me any concept, formula derivation, problem solution, or question from your syllabus.\n\n${
            noteContext?.title
              ? `*Current note linked:* **${noteContext.title}**\nYou can ask questions directly about this note.`
              : ''
          }`,
          timestamp: Date.now(),
        },
      ],
    };

    setSessions([firstSession]);
    setActiveSessionId(firstSession.id);
  }, [noteContext?.title]);

  // Persist sessions
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn('Failed to persist doubt sessions', e);
      }
    }
  }, [sessions]);

  // Auto-scroll to bottom on new message or loading state change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isLoading]);

  // Auto-adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputMessage]);

  if (!isOpen) return null;

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Start new chat
  const handleStartNewSession = () => {
    const newSession: StudentDoubtSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ai',
          text: 'What topic or problem would you like to work on right now?',
          timestamp: Date.now(),
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setShowHistoryDrawer(false);
    setInputMessage('');
    setAttachedImage(null);
  };

  // Delete chat session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fallback: StudentDoubtSession = {
          id: `session-${Date.now()}`,
          title: 'Study Session',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [
            {
              id: 'm1',
              sender: 'ai',
              text: 'How can I assist your study session today?',
              timestamp: Date.now(),
            },
          ],
        };
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Send query to AI
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if ((!query && !attachedImage) || isLoading || !currentSession) return;

    const userMessage: StudentChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
      attachedImage: attachedImage || undefined,
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    const sessionTitle =
      currentSession.title === 'New Chat' || currentSession.title === 'Study Session'
        ? query.slice(0, 32) || 'Study Question'
        : currentSession.title;

    const updatedSession: StudentDoubtSession = {
      ...currentSession,
      title: sessionTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
    );

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    const sentImage = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const res = await nvidiaService.generateChatCompletion({
        message: query,
        history: updatedMessages.map((m) => ({
          sender: m.sender,
          text: m.text,
          attachedImage: m.attachedImage,
        })),
        noteContext: noteContext
          ? `Title: ${noteContext.title}\nSubject: ${noteContext.subject || 'General'}\nContent:\n${noteContext.body}`
          : '',
        imageBase64: sentImage || undefined,
        mode: 'student',
      });

      const aiMessage: StudentChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply || 'Here is the step-by-step explanation.',
        timestamp: Date.now(),
        model: res.model || nvidiaState.modelName,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: [...s.messages, aiMessage],
              }
            : s
        )
      );
    } catch (err) {
      console.error('Error fetching AI doubt reply:', err);
      const errorMessage: StudentChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'An error occurred while connecting. Please try again.',
        timestamp: Date.now(),
        model: nvidiaState.modelName,
      };
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, messages: [...s.messages, errorMessage] }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        setAttachedImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: 'Explain simply', query: 'Can you explain the main concept simply with an intuitive real-world example?' },
    { label: 'Important questions', query: 'What are the top 3 most important exam questions and answers from this topic?' },
    { label: 'Formulas & Definitions', query: 'Please summarize all key formulas, units, and definitions in a structured list.' },
    { label: 'Step-by-step problem', query: 'Provide a solved step-by-step example problem to test my understanding.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-full w-full overflow-hidden text-slate-900 select-none animate-in fade-in duration-150">
      
      {/* 1. TOP APP BAR (ChatGPT Style) */}
      <header className="w-full px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onClose}
            className="p-2 -ml-1 rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer shrink-0"
            title="Back to note"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate leading-tight">
              Study AI
            </h2>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              {noteContext?.title ? `Linked: ${noteContext.title}` : 'Academic Tutor'}
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleStartNewSession}
            className="p-2 rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer flex items-center gap-1.5"
            title="Start new chat"
          >
            <Plus className="w-4 h-4 stroke-[2.2]" />
            <span className="hidden sm:inline text-xs font-semibold">New chat</span>
          </button>

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`p-2 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              showHistoryDrawer ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Chat history"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">History</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 active:scale-95 transition cursor-pointer ml-1"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. CHAT HISTORY DRAWER (Sidebar overlay) */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 sm:w-80 bg-white h-full border-r border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <History className="w-4 h-4" />
                <span>Chat History</span>
              </div>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3">
              <button
                onClick={handleStartNewSession}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setShowHistoryDrawer(false);
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
                        : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-xs truncate">{sess.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(sess.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • {sess.messages.length} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex-1" onClick={() => setShowHistoryDrawer(false)} />
        </div>
      )}

      {/* 3. MAIN CONVERSATION STREAM (ChatGPT Style) */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-white select-text">
        <div className="max-w-3xl mx-auto space-y-5 pb-6">
          {currentSession?.messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group ${
                    isAI
                      ? 'bg-slate-50 border border-slate-200/80 text-slate-900 rounded-2xl rounded-tl-xs p-4 sm:p-5 max-w-[92%] sm:max-w-[85%]'
                      : 'bg-slate-900 text-white rounded-2xl rounded-tr-xs p-3.5 sm:p-4 max-w-[88%] sm:max-w-[75%]'
                  }`}
                >
                  {/* Attached images if any */}
                  {msg.attachedImage && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[240px]">
                      <img src={msg.attachedImage} alt="Attachment" className="w-full object-cover" />
                    </div>
                  )}

                  {/* Message Markdown Body */}
                  <div className={`text-xs sm:text-sm leading-relaxed ${isAI ? 'prose-sm' : ''}`}>
                    {isAI ? (
                      <div className="markdown-body space-y-2">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    )}
                  </div>

                  {/* Footer & Actions */}
                  <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500 gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {isAI && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="p-1 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition shrink-0"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-600 flex items-center gap-2 shadow-2xs">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-slate-600 font-medium">Generating answer...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>

      {/* 4. QUICK PROMPT SUGGESTIONS (Above input) */}
      <div className="w-full bg-white border-t border-slate-100 py-1.5 px-3 sm:px-6 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(p.query)}
              className="shrink-0 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. ATTACHMENT PREVIEW */}
      {attachedImage && (
        <div className="w-full bg-slate-100 border-t border-slate-200 px-3 sm:px-6 py-2 shrink-0">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="relative rounded-xl overflow-hidden border border-slate-300 w-14 h-14 bg-white shadow-2xs">
              <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5 hover:bg-black cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-slate-600 font-medium">Image attached</span>
          </div>
        </div>
      )}

      {/* 6. BOTTOM INPUT CAPSULE (Model Switcher replaces pen icon) */}
      <footer className="w-full bg-white px-3 sm:px-6 pb-3 pt-1 shrink-0 border-t border-slate-100 relative">
        <div className="max-w-3xl mx-auto relative">
          {/* Model Switcher Popover */}
          {showModelPicker && (
            <div
              ref={modelPickerRef}
              className="absolute bottom-full mb-2 left-0 sm:left-2 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  Switch AI Model
                </span>
                <span className="text-[10px] text-slate-500">Live Engine</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {DEFAULT_NVIDIA_MODELS.map((m) => {
                  const isSelected = nvidiaState.activeModel === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        nvidiaService.setActiveModel(m.id);
                        setShowModelPicker(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border border-blue-200 text-blue-900 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">{m.description}</div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModelPicker(false);
                    setShowNvidiaModal(true);
                  }}
                  className="w-full py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Configure Custom NVIDIA Key</span>
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-1.5 p-1.5 sm:p-2 bg-slate-100 rounded-3xl border border-slate-200/90 focus-within:border-slate-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-slate-900/10 transition"
          >
            {/* Attachment - Photo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 rounded-full transition cursor-pointer shrink-0"
              title="Attach image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            {/* Model Switcher Button (replaces the Pen icon circled in user screenshot) */}
            <button
              type="button"
              onClick={() => setShowModelPicker((prev) => !prev)}
              className={`p-2 rounded-full transition cursor-pointer shrink-0 flex items-center gap-1 ${
                showModelPicker
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title={`Switch Model (${nvidiaState.modelName})`}
            >
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px] font-semibold max-w-[90px] truncate">
                {nvidiaState.modelName.replace('⚡ ', '').replace('🧠 ', '').replace('✨ ', '').split(' ')[0]}
              </span>
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Message Study AI..."
              className="flex-1 bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none max-h-28 leading-relaxed font-normal"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputMessage.trim() && !attachedImage) || isLoading}
              className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-black active:scale-95 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5"
              title="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      </footer>

      {/* NVIDIA Provider Setup Modal */}
      <NvidiaConnectModal
        isOpen={showNvidiaModal}
        onClose={() => setShowNvidiaModal(false)}
      />
    </div>
  );
};
