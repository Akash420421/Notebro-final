import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  Bot,
  User,
  History,
  Image as ImageIcon,
  Sparkles,
  Terminal,
  Code2,
  Layers,
  Database,
  FileText,
  FileCode,
  CheckCircle2,
  X,
  Share2,
  Cpu,
} from 'lucide-react';
import { nvidiaService, NvidiaConnectionState } from '../services/nvidiaProvider';
import { NvidiaConnectModal } from './NvidiaConnectModal';

export interface DevChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  attachedImage?: string;
}

export interface DevChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DevChatMessage[];
}

interface DeveloperAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle?: string;
  noteContext?: string;
  onInsertToNote?: (content: string, type?: 'spec' | 'prompt' | 'text') => void;
}

export const DeveloperAIChatModal: React.FC<DeveloperAIChatModalProps> = ({
  isOpen,
  onClose,
  noteTitle = '',
  noteContext = '',
  onInsertToNote,
}) => {
  const [sessions, setSessions] = useState<DevChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('developer_ai_sessions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return `session-${Date.now()}`;
  });

  const [messages, setMessages] = useState<DevChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [insertSuccessId, setInsertSuccessId] = useState<string | null>(null);
  const [nvidiaState, setNvidiaState] = useState<NvidiaConnectionState>(nvidiaService.getState());
  const [showNvidiaModal, setShowNvidiaModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = nvidiaService.subscribe(setNvidiaState);
    return unsub;
  }, []);

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load session or initialize with welcome message
  useEffect(() => {
    if (!isOpen) return;

    const existingSession = sessions.find((s) => s.id === currentSessionId);
    if (existingSession && existingSession.messages.length > 0) {
      setMessages(existingSession.messages);
    } else {
      const welcomeMessage: DevChatMessage = {
        id: 'welcome-dev',
        sender: 'ai',
        text: `### 🚀 Developer AI Architect & PRD Assistant
I am your System Architect and Engineering Planner. I can help you design and build software projects:

* **Product Requirements (PRD):** Generate complete \`PRD.md\` with user stories & non-functional requirements.
* **Database & Schemas:** Formulate PostgreSQL, Prisma, SQL, and NoSQL models.
* **API Specifications:** Design clean REST, GraphQL, or tRPC endpoints with validation.
* **System Architecture:** Plan data flow, caching, background workers, and tech stacks.
* **Prompt Engineering:** Write production-ready LLM system prompts.

${noteTitle ? `*Currently working on:* **${noteTitle}**\n\n` : ''}What project or feature would you like to plan today?`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, currentSessionId]);

  // Save sessions to localStorage
  const saveSessions = (updatedSessions: DevChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem('developer_ai_sessions_v1', JSON.stringify(updatedSessions));
    } catch (e) {}
  };

  // Start new chat session
  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setCurrentSessionId(newId);
    setShowHistoryDrawer(false);
    setAttachedImage(null);
  };

  // Delete session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessions(updated);
    if (sessionId === currentSessionId) {
      handleNewChat();
    }
  };

  // Send message to AI endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputValue).trim();
    if ((!messageText && !attachedImage) || isLoading) return;

    const userMessage: DevChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: messageText,
      attachedImage: attachedImage || undefined,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    const currentImg = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      let aiReplyText = '';

      const res = await nvidiaService.generateChatCompletion({
        message: messageText,
        history: updatedMessages.map((m) => ({
          sender: m.sender,
          text: m.text,
          attachedImage: m.attachedImage,
        })),
        noteContext: noteContext || noteTitle,
        imageBase64: currentImg || undefined,
        mode: 'developer',
      });
      aiReplyText = res.reply || 'Here is the technical solution blueprint.';

      const aiMessage: DevChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: Date.now(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Derive title for session
      const sessionTitle =
        messageText.slice(0, 32) + (messageText.length > 32 ? '...' : '') ||
        (noteTitle ? `${noteTitle} Plan` : 'Dev Architecture Plan');

      const existingIndex = sessions.findIndex((s) => s.id === currentSessionId);
      let updatedSessions: DevChatSession[];

      if (existingIndex >= 0) {
        updatedSessions = [...sessions];
        updatedSessions[existingIndex] = {
          ...updatedSessions[existingIndex],
          title: sessionTitle,
          updatedAt: Date.now(),
          messages: finalMessages,
        };
      } else {
        const newSessionObj: DevChatSession = {
          id: currentSessionId,
          title: sessionTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: finalMessages,
        };
        updatedSessions = [newSessionObj, ...sessions];
      }
      saveSessions(updatedSessions);
    } catch (err: any) {
      console.error('Failed to get AI response:', err);
      const errorMessage: DevChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `### ⚠️ Connection Issue\n${err?.message || 'Unable to reach the AI service right now. Please check your connection or key.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          setAttachedImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  // Quick dev prompt suggestions
  const devPromptSuggestions = [
    {
      label: '📄 Draft Full PRD.md',
      prompt: `Create a comprehensive, production-ready Product Requirements Document (PRD.md) for this project with Overview, Target Users, Functional Specs, Non-Functional Requirements, and Milestone Roadmap.`,
    },
    {
      label: '🗄️ PostgreSQL & Prisma Schema',
      prompt: `Design a normalized relational database schema with PostgreSQL tables, foreign key constraints, indexes, and Prisma schema syntax for this application.`,
    },
    {
      label: '⚡ REST API Specifications',
      prompt: `Design clean REST API endpoints for this application with route definitions (Method, Path, Query/Body Params), Zod validation schemas, and sample JSON responses.`,
    },
    {
      label: '💬 LLM System Prompt',
      prompt: `Formulate an optimized, robust System Prompt and prompt template for an LLM agent powering this feature.`,
    },
    {
      label: '📋 Sprint Task Breakdown',
      prompt: `Break down the entire development lifecycle of this project into actionable sprint tasks and phases from database setup to deployment.`,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP APP BAR */}
      <header className="w-full px-3 sm:px-5 py-2.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 shrink-0 shadow-md gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1 rounded-full text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0"
            title="Back to Note"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 truncate">
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                  Developer AI Architect
                </h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap shrink-0 hidden sm:inline-block">
                  PRD & Planning
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {noteTitle ? `Context: ${noteTitle}` : 'Software architecture & specs'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={handleNewChat}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer border border-slate-700 shrink-0 whitespace-nowrap"
            title="Start new planning session"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">New Chat</span>
          </button>

          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700 relative shrink-0"
            title="View Chat History"
          >
            <History className="w-4 h-4" />
            {sessions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTAINER & DRAWER */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-900">
        {/* Chat History Sidebar / Drawer */}
        {showHistoryDrawer && (
          <aside className="absolute sm:relative inset-y-0 left-0 z-30 w-72 sm:w-64 bg-slate-950 border-r border-slate-800 flex flex-col p-3 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Planning Sessions
              </span>
              <button
                onClick={() => setShowHistoryDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 no-scrollbar">
              {sessions.length > 0 ? (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setCurrentSessionId(s.id);
                      setMessages(s.messages);
                      setShowHistoryDrawer(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-medium cursor-pointer transition flex items-center justify-between group ${
                      s.id === currentSessionId
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="truncate flex-1 pr-1">{s.title || 'Untitled Session'}</span>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No previous sessions saved
                </div>
              )}
            </div>
          </aside>
        )}

        {/* 3. MESSAGES STREAM */}
        <main className="flex-1 flex flex-col overflow-y-auto px-3 sm:px-6 py-4 space-y-4 no-scrollbar bg-slate-900">
          {/* Quick Prompt Suggestion Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Quick Plan:</span>
            {devPromptSuggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-indigo-900/60 hover:border-indigo-500/60 border border-slate-700 text-slate-200 text-xs font-medium shrink-0 cursor-pointer transition active:scale-95 shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages List */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isCopied = copiedMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-2xl rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed relative shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-xs'
                  }`}
                >
                  {/* Attached Image if any */}
                  {msg.attachedImage && (
                    <div className="mb-2.5 rounded-lg overflow-hidden border border-white/20 max-w-xs">
                      <img
                        src={msg.attachedImage}
                        alt="Attached Diagram"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  {/* Message Markdown Body */}
                  <div className="markdown-body select-text text-slate-100">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>

                  {/* Message Action Footer */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="font-mono text-slate-400 text-[10px] uppercase tracking-wider">
                        AI Output
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1-Click Copy Whole Response */}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                            isCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                          title="Copy text to clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="whitespace-nowrap">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 shrink-0" />
                              <span className="whitespace-nowrap">Copy</span>
                            </>
                          )}
                        </button>

                        {/* Add as Spec / PRD File block into note */}
                        {onInsertToNote && (
                          <button
                            onClick={() => {
                              onInsertToNote(msg.text, 'spec');
                              setInsertSuccessId(`${msg.id}-spec`);
                              setTimeout(() => setInsertSuccessId(null), 2500);
                            }}
                            className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                              insertSuccessId === `${msg.id}-spec`
                                ? 'bg-emerald-600 text-white'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            }`}
                            title="Save as a new Spec / PRD File block in your note"
                          >
                            {insertSuccessId === `${msg.id}-spec` ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">Saved to Spec</span>
                              </>
                            ) : (
                              <>
                                <FileCode className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">+ Spec File</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Add as Prompt Box into note */}
                        {onInsertToNote && (
                          <button
                            onClick={() => {
                              onInsertToNote(msg.text, 'prompt');
                              setInsertSuccessId(`${msg.id}-prompt`);
                              setTimeout(() => setInsertSuccessId(null), 2500);
                            }}
                            className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                              insertSuccessId === `${msg.id}-prompt`
                                ? 'bg-indigo-600 text-white'
                                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                            }`}
                            title="Save as a Prompt Box block in your note"
                          >
                            {insertSuccessId === `${msg.id}-prompt` ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">Saved to Prompt</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">+ Prompt Box</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Append to Note Body */}
                        {onInsertToNote && (
                          <button
                            onClick={() => {
                              onInsertToNote(msg.text, 'text');
                              setInsertSuccessId(`${msg.id}-text`);
                              setTimeout(() => setInsertSuccessId(null), 2500);
                            }}
                            className={`px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0 ${
                              insertSuccessId === `${msg.id}-text`
                                ? 'bg-sky-600 text-white'
                                : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30'
                            }`}
                            title="Append into your active note body"
                          >
                            {insertSuccessId === `${msg.id}-text` ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">Appended</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="whitespace-nowrap">+ Note Body</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-700 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3.5 items-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="font-mono text-slate-400">Architecting technical blueprint...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>
      </div>

      {/* 4. ATTACHMENT PREVIEW */}
      {attachedImage && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={attachedImage}
              alt="Preview"
              className="w-10 h-10 object-cover rounded-lg border border-slate-700"
            />
            <span className="text-xs text-slate-300 font-medium">Architecture Diagram attached</span>
          </div>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. BOTTOM INPUT CAPSULE */}
      <footer className="w-full p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        <div className="max-w-3xl mx-auto flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition shadow-lg">
          {/* Attach Diagram Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0 mb-0.5"
            title="Attach UI wireframe or architecture diagram"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Prompt Text Input */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Discuss project requirements, PRD specs, schemas, or tech stack..."
            className="flex-1 min-h-[38px] max-h-32 bg-transparent text-slate-100 placeholder-slate-500 text-xs sm:text-sm outline-none resize-none px-2 py-2 leading-normal font-normal"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={(!inputValue.trim() && !attachedImage) || isLoading}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 mb-0.5 ${
              (inputValue.trim() || attachedImage) && !isLoading
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs active:scale-95'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
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
