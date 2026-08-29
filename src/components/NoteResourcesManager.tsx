import React, { useState } from 'react';
import {
  ApiKeyItem,
  PromptBoxItem,
  SpecFileItem,
  DevWebsiteCredentialItem,
  DevVideoResourceItem,
  YoutubeLink,
  WebResourceLink,
  ImportantQuestion,
} from '../types';
import {
  Key,
  MessageSquareCode,
  FileCode,
  Globe,
  Video,
  HelpCircle,
  Link2,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  BookOpen,
  Calculator,
} from 'lucide-react';

interface NoteResourcesManagerProps {
  apiKeys: ApiKeyItem[];
  promptBoxes: PromptBoxItem[];
  specFiles: SpecFileItem[];
  devWebsites: DevWebsiteCredentialItem[];
  devVideos: DevVideoResourceItem[];
  youtubeLinks: YoutubeLink[];
  webLinks: WebResourceLink[];
  importantQuestions: ImportantQuestion[];
  quickFormulas?: string[];

  onUpdateApiKeys: (keys: ApiKeyItem[]) => void;
  onUpdatePromptBoxes: (prompts: PromptBoxItem[]) => void;
  onUpdateSpecFiles: (files: SpecFileItem[]) => void;
  onUpdateDevWebsites: (sites: DevWebsiteCredentialItem[]) => void;
  onUpdateDevVideos: (videos: DevVideoResourceItem[]) => void;
  onUpdateYoutubeLinks: (links: YoutubeLink[]) => void;
  onUpdateWebLinks: (links: WebResourceLink[]) => void;
  onUpdateImportantQuestions: (questions: ImportantQuestion[]) => void;
  onUpdateQuickFormulas?: (formulas: string[]) => void;

  // External trigger to open a specific add dialog
  activeAddType: string | null;
  onCloseAddType: () => void;
}

type ResourceCategoryKey =
  | 'apiKeys'
  | 'prompts'
  | 'specs'
  | 'websites'
  | 'videos'
  | 'questions'
  | 'webLinks'
  | 'formulas';

export const NoteResourcesManager: React.FC<NoteResourcesManagerProps> = ({
  apiKeys,
  promptBoxes,
  specFiles,
  devWebsites,
  devVideos,
  youtubeLinks,
  webLinks,
  importantQuestions,
  quickFormulas = [],

  onUpdateApiKeys,
  onUpdatePromptBoxes,
  onUpdateSpecFiles,
  onUpdateDevWebsites,
  onUpdateDevVideos,
  onUpdateYoutubeLinks,
  onUpdateWebLinks,
  onUpdateImportantQuestions,
  onUpdateQuickFormulas,

  activeAddType,
  onCloseAddType,
}) => {
  // Accordion open states
  const [expandedCategories, setExpandedCategories] = useState<Record<ResourceCategoryKey, boolean>>({
    apiKeys: apiKeys.length > 0,
    prompts: promptBoxes.length > 0,
    specs: specFiles.length > 0,
    websites: devWebsites.length > 0,
    videos: devVideos.length > 0 || youtubeLinks.length > 0,
    questions: importantQuestions.length > 0,
    webLinks: webLinks.length > 0,
    formulas: quickFormulas.length > 0,
  });

  const toggleCategory = (cat: ResourceCategoryKey) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Active form modal for Add/Edit
  const [activeFormType, setActiveFormType] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Synchronize external add triggers
  React.useEffect(() => {
    if (activeAddType) {
      setActiveFormType(activeAddType);
      setEditingItemId(null);
    }
  }, [activeAddType]);

  const closeForm = () => {
    setActiveFormType(null);
    setEditingItemId(null);
    onCloseAddType();
  };

  // State for items
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Total Resources Count ---
  const totalResources =
    apiKeys.length +
    promptBoxes.length +
    specFiles.length +
    devWebsites.length +
    devVideos.length +
    youtubeLinks.length +
    webLinks.length +
    importantQuestions.length +
    quickFormulas.length;

  // If there are no resources present and no active add dialog, do NOT render the section at all!
  if (totalResources === 0 && !activeFormType) {
    return null;
  }

  // Render Category Rows (only categories with count > 0)
  return (
    <>
      {totalResources > 0 && (
        <div className="w-full my-5 pt-4 border-t border-neutral-200/80">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                Attached Resources
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                {totalResources}
              </span>
            </div>
          </div>

          {/* Resource Category Accordion Table */}
          <div className="divide-y divide-neutral-200/70 rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
            {/* 1. API Keys Row */}
            {apiKeys.length > 0 && (
              <ResourceCategoryRow
                icon={<Key className="w-4 h-4 text-neutral-600" />}
                title="API Keys & Secrets"
                count={apiKeys.length}
                isExpanded={expandedCategories.apiKeys}
                onToggle={() => toggleCategory('apiKeys')}
                onAdd={() => {
                  setActiveFormType('apikey');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {apiKeys.map((item) => {
                    const isRevealed = !!revealedIds[item.id];
                    return (
                      <div
                        key={item.id}
                        className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-neutral-900 truncate">
                              {item.name}
                            </span>
                            {item.environment && (
                              <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                                {item.environment}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs text-neutral-500 truncate max-w-xs sm:max-w-md">
                              {isRevealed ? item.value : '••••••••••••••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleReveal(item.id)}
                              className="text-neutral-400 hover:text-neutral-700 p-0.5"
                              title={isRevealed ? 'Hide' : 'Reveal'}
                            >
                              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-neutral-500 mt-0.5">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.value)}
                            className="px-2 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-neutral-500" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setActiveFormType('apikey');
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete API key "${item.name}"?`)) {
                                onUpdateApiKeys(apiKeys.filter((k) => k.id !== item.id));
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 2. Prompts Row */}
            {promptBoxes.length > 0 && (
              <ResourceCategoryRow
                icon={<MessageSquareCode className="w-4 h-4 text-neutral-600" />}
                title="Prompts & AI Templates"
                count={promptBoxes.length}
                isExpanded={expandedCategories.prompts}
                onToggle={() => toggleCategory('prompts')}
                onAdd={() => {
                  setActiveFormType('prompt');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {promptBoxes.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900 truncate">
                            {item.title}
                          </span>
                          {item.category && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-neutral-600 mt-1 line-clamp-2 bg-white/80 p-2 rounded border border-neutral-100 whitespace-pre-wrap">
                          {item.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-start shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.prompt)}
                          className="px-2 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setActiveFormType('prompt');
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete prompt "${item.title}"?`)) {
                              onUpdatePromptBoxes(promptBoxes.filter((p) => p.id !== item.id));
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 3. Specs & Markdown Documents */}
            {specFiles.length > 0 && (
              <ResourceCategoryRow
                icon={<FileCode className="w-4 h-4 text-neutral-600" />}
                title="PRD & Architecture Specs"
                count={specFiles.length}
                isExpanded={expandedCategories.specs}
                onToggle={() => toggleCategory('specs')}
                onAdd={() => {
                  setActiveFormType('spec');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {specFiles.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-neutral-900 truncate">
                            {item.fileName}
                          </span>
                          {item.fileType && (
                            <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                              {item.fileType}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{item.description}</p>
                        )}
                        <p className="font-mono text-xs text-neutral-600 mt-1 line-clamp-2 bg-white/80 p-2 rounded border border-neutral-100 whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-start shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.content)}
                          className="px-2 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id);
                            setActiveFormType('spec');
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete document "${item.fileName}"?`)) {
                              onUpdateSpecFiles(specFiles.filter((s) => s.id !== item.id));
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 4. Websites & Dev Logins */}
            {devWebsites.length > 0 && (
              <ResourceCategoryRow
                icon={<Globe className="w-4 h-4 text-neutral-600" />}
                title="Websites & Logins"
                count={devWebsites.length}
                isExpanded={expandedCategories.websites}
                onToggle={() => toggleCategory('websites')}
                onAdd={() => {
                  setActiveFormType('website');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {devWebsites.map((item) => {
                    const isRevealed = !!revealedIds[item.id];
                    return (
                      <div
                        key={item.id}
                        className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-900 truncate">
                              {item.serviceName}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-neutral-500 hover:underline truncate"
                            >
                              {item.url}
                            </a>
                          </div>
                          {(item.emailOrUsername || item.passwordOrToken) && (
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-600 font-mono">
                              {item.emailOrUsername && (
                                <span>User: {item.emailOrUsername}</span>
                              )}
                              {item.passwordOrToken && (
                                <div className="flex items-center gap-1">
                                  <span>Pass: {isRevealed ? item.passwordOrToken : '••••••••'}</span>
                                  <button
                                    type="button"
                                    onClick={() => toggleReveal(item.id)}
                                    className="text-neutral-400 hover:text-neutral-700 p-0.5"
                                  >
                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                            <span>Visit</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(item.id);
                              setActiveFormType('website');
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete website "${item.serviceName}"?`)) {
                                onUpdateDevWebsites(devWebsites.filter((w) => w.id !== item.id));
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 5. Videos & YouTube Lectures */}
            {(devVideos.length > 0 || youtubeLinks.length > 0) && (
              <ResourceCategoryRow
                icon={<Video className="w-4 h-4 text-neutral-600" />}
                title="Videos & Lectures"
                count={devVideos.length + youtubeLinks.length}
                isExpanded={expandedCategories.videos}
                onToggle={() => toggleCategory('videos')}
                onAdd={() => {
                  setActiveFormType('video');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {/* YouTube Links */}
                  {youtubeLinks.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {item.title}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500 hover:underline truncate block mt-0.5"
                        >
                          {item.url}
                        </a>
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Watch</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove video "${item.title}"?`)) {
                              onUpdateYoutubeLinks(youtubeLinks.filter((y) => y.id !== item.id));
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Dev Videos */}
                  {devVideos.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {item.title}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500 hover:underline truncate block mt-0.5"
                        >
                          {item.url}
                        </a>
                        {item.notes && <p className="text-[11px] text-neutral-500 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Watch</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove video "${item.title}"?`)) {
                              onUpdateDevVideos(devVideos.filter((v) => v.id !== item.id));
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 6. Questions & Answers (Exam / Study Q&A) */}
            {importantQuestions.length > 0 && (
              <ResourceCategoryRow
                icon={<HelpCircle className="w-4 h-4 text-neutral-600" />}
                title="Important Q&A"
                count={importantQuestions.length}
                isExpanded={expandedCategories.questions}
                onToggle={() => toggleCategory('questions')}
                onAdd={() => {
                  setActiveFormType('question');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {importantQuestions.map((item, idx) => (
                    <div
                      key={item.id || `q-${idx}`}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-neutral-900">
                            Q: {item.question}
                          </span>
                          {item.priority && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize">
                              {item.priority}
                            </span>
                          )}
                        </div>
                        {item.answer && (
                          <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{item.answer}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 self-end sm:self-start shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(item.id || `q-${idx}`);
                            setActiveFormType('question');
                          }}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 rounded-md"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove question "${item.question}"?`)) {
                              onUpdateImportantQuestions(
                                importantQuestions.filter((q, i) => (q.id ? q.id !== item.id : i !== idx))
                              );
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 7. Quick Formulas / Cheat Sheet */}
            {quickFormulas.length > 0 && (
              <ResourceCategoryRow
                icon={<Calculator className="w-4 h-4 text-neutral-600" />}
                title="Formulas & Equations"
                count={quickFormulas.length}
                isExpanded={expandedCategories.formulas}
                onToggle={() => toggleCategory('formulas')}
                onAdd={() => {
                  setActiveFormType('formula');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {quickFormulas.map((formula, idx) => (
                    <div
                      key={`f-${idx}`}
                      className="p-3 sm:px-4 flex items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-semibold text-neutral-900 bg-white px-2 py-1 rounded border border-neutral-200 inline-block">
                          {formula}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(`formula-${idx}`, formula)}
                          className="px-2 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          {copiedId === `formula-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-500" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        {onUpdateQuickFormulas && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete formula "${formula}"?`)) {
                                onUpdateQuickFormulas(quickFormulas.filter((_, i) => i !== idx));
                              }
                            }}
                            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}

            {/* 8. Reference Links */}
            {webLinks.length > 0 && (
              <ResourceCategoryRow
                icon={<Link2 className="w-4 h-4 text-neutral-600" />}
                title="Reference Links"
                count={webLinks.length}
                isExpanded={expandedCategories.webLinks}
                onToggle={() => toggleCategory('webLinks')}
                onAdd={() => {
                  setActiveFormType('weblink');
                  setEditingItemId(null);
                }}
              >
                <div className="divide-y divide-neutral-100 bg-neutral-50/50">
                  {webLinks.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-neutral-900 truncate block">
                          {item.title}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-neutral-500 hover:underline truncate block mt-0.5"
                        >
                          {item.url}
                        </a>
                        {item.description && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-neutral-700 hover:bg-neutral-200/70 border border-neutral-200 transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Visit</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Remove link "${item.title}"?`)) {
                              onUpdateWebLinks(webLinks.filter((w) => w.id !== item.id));
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ResourceCategoryRow>
            )}
          </div>
        </div>
      )}

      {/* MODAL DIALOG FOR ADDING/EDITING ANY RESOURCE */}
      {activeFormType && (
        <ResourceFormModal
          type={activeFormType}
          editingId={editingItemId}
          apiKeys={apiKeys}
          promptBoxes={promptBoxes}
          specFiles={specFiles}
          devWebsites={devWebsites}
          devVideos={devVideos}
          youtubeLinks={youtubeLinks}
          webLinks={webLinks}
          importantQuestions={importantQuestions}
          quickFormulas={quickFormulas}
          onSaveApiKey={(key) => {
            if (editingItemId) {
              onUpdateApiKeys(apiKeys.map((k) => (k.id === editingItemId ? key : k)));
            } else {
              onUpdateApiKeys([...apiKeys, key]);
            }
            setExpandedCategories((p) => ({ ...p, apiKeys: true }));
            closeForm();
          }}
          onSavePrompt={(prompt) => {
            if (editingItemId) {
              onUpdatePromptBoxes(promptBoxes.map((p) => (p.id === editingItemId ? prompt : p)));
            } else {
              onUpdatePromptBoxes([...promptBoxes, prompt]);
            }
            setExpandedCategories((p) => ({ ...p, prompts: true }));
            closeForm();
          }}
          onSaveSpec={(spec) => {
            if (editingItemId) {
              onUpdateSpecFiles(specFiles.map((s) => (s.id === editingItemId ? spec : s)));
            } else {
              onUpdateSpecFiles([...specFiles, spec]);
            }
            setExpandedCategories((p) => ({ ...p, specs: true }));
            closeForm();
          }}
          onSaveWebsite={(site) => {
            if (editingItemId) {
              onUpdateDevWebsites(devWebsites.map((w) => (w.id === editingItemId ? site : w)));
            } else {
              onUpdateDevWebsites([...devWebsites, site]);
            }
            setExpandedCategories((p) => ({ ...p, websites: true }));
            closeForm();
          }}
          onSaveVideo={(vid) => {
            if (editingItemId) {
              onUpdateDevVideos(devVideos.map((v) => (v.id === editingItemId ? vid : v)));
            } else {
              onUpdateDevVideos([...devVideos, vid]);
            }
            setExpandedCategories((p) => ({ ...p, videos: true }));
            closeForm();
          }}
          onSaveQuestion={(q) => {
            if (editingItemId) {
              onUpdateImportantQuestions(
                importantQuestions.map((item) => (item.id === editingItemId ? q : item))
              );
            } else {
              onUpdateImportantQuestions([...importantQuestions, q]);
            }
            setExpandedCategories((p) => ({ ...p, questions: true }));
            closeForm();
          }}
          onSaveWebLink={(link) => {
            if (editingItemId) {
              onUpdateWebLinks(webLinks.map((w) => (w.id === editingItemId ? link : w)));
            } else {
              onUpdateWebLinks([...webLinks, link]);
            }
            setExpandedCategories((p) => ({ ...p, webLinks: true }));
            closeForm();
          }}
          onSaveFormula={(formula) => {
            if (onUpdateQuickFormulas) {
              onUpdateQuickFormulas([...quickFormulas, formula]);
            }
            setExpandedCategories((p) => ({ ...p, formulas: true }));
            closeForm();
          }}
          onClose={closeForm}
        />
      )}
    </>
  );
};

// --- SUB-COMPONENTS ---

interface ResourceCategoryRowProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}

const ResourceCategoryRow: React.FC<ResourceCategoryRowProps> = ({
  icon,
  title,
  count,
  isExpanded,
  onToggle,
  onAdd,
  children,
}) => {
  return (
    <div>
      <div
        onClick={onToggle}
        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-neutral-50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="text-neutral-500 shrink-0">{icon}</div>
          <span className="text-xs font-semibold text-neutral-800 truncate">{title}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
            {count}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onAdd}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Add item"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && children}
    </div>
  );
};

// --- MODAL FORM ---

interface ResourceFormModalProps {
  type: string;
  editingId: string | null;
  apiKeys: ApiKeyItem[];
  promptBoxes: PromptBoxItem[];
  specFiles: SpecFileItem[];
  devWebsites: DevWebsiteCredentialItem[];
  devVideos: DevVideoResourceItem[];
  youtubeLinks: YoutubeLink[];
  webLinks: WebResourceLink[];
  importantQuestions: ImportantQuestion[];
  quickFormulas?: string[];

  onSaveApiKey: (item: ApiKeyItem) => void;
  onSavePrompt: (item: PromptBoxItem) => void;
  onSaveSpec: (item: SpecFileItem) => void;
  onSaveWebsite: (item: DevWebsiteCredentialItem) => void;
  onSaveVideo: (item: DevVideoResourceItem) => void;
  onSaveQuestion: (item: ImportantQuestion) => void;
  onSaveWebLink: (item: WebResourceLink) => void;
  onSaveFormula?: (formula: string) => void;
  onClose: () => void;
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  type,
  editingId,
  apiKeys,
  promptBoxes,
  specFiles,
  devWebsites,
  devVideos,
  webLinks,
  importantQuestions,
  onSaveApiKey,
  onSavePrompt,
  onSaveSpec,
  onSaveWebsite,
  onSaveVideo,
  onSaveQuestion,
  onSaveWebLink,
  onSaveFormula,
  onClose,
}) => {
  // Existing data if editing
  const existingApiKey = editingId ? apiKeys.find((k) => k.id === editingId) : null;
  const existingPrompt = editingId ? promptBoxes.find((p) => p.id === editingId) : null;
  const existingSpec = editingId ? specFiles.find((s) => s.id === editingId) : null;
  const existingWebsite = editingId ? devWebsites.find((w) => w.id === editingId) : null;
  const existingVideo = editingId ? devVideos.find((v) => v.id === editingId) : null;
  const existingQuestion = editingId ? importantQuestions.find((q) => q.id === editingId) : null;
  const existingWebLink = editingId ? webLinks.find((w) => w.id === editingId) : null;

  // Form states
  const [f1, setF1] = useState(
    existingApiKey?.name ||
      existingPrompt?.title ||
      existingSpec?.fileName ||
      existingWebsite?.serviceName ||
      existingVideo?.title ||
      existingQuestion?.question ||
      existingWebLink?.title ||
      ''
  );

  const [f2, setF2] = useState(
    existingApiKey?.value ||
      existingPrompt?.prompt ||
      existingSpec?.content ||
      existingWebsite?.url ||
      existingVideo?.url ||
      existingQuestion?.answer ||
      existingWebLink?.url ||
      ''
  );

  const [f3, setF3] = useState(
    existingApiKey?.environment ||
      existingPrompt?.category ||
      existingSpec?.description ||
      existingWebsite?.emailOrUsername ||
      existingVideo?.notes ||
      existingQuestion?.priority ||
      existingWebLink?.description ||
      ''
  );

  const [f4, setF4] = useState(
    existingApiKey?.notes ||
      existingWebsite?.passwordOrToken ||
      ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f1.trim()) return;

    if (type === 'apikey') {
      onSaveApiKey({
        id: editingId || `key-${Date.now()}`,
        name: f1.trim().toUpperCase().replace(/\s+/g, '_'),
        value: f2.trim(),
        environment: (f3 as any) || 'development',
        notes: f4.trim() || undefined,
      });
    } else if (type === 'prompt') {
      onSavePrompt({
        id: editingId || `prompt-${Date.now()}`,
        title: f1.trim(),
        prompt: f2.trim(),
        category: f3.trim() || undefined,
      });
    } else if (type === 'spec') {
      onSaveSpec({
        id: editingId || `spec-${Date.now()}`,
        fileName: f1.trim(),
        content: f2.trim(),
        description: f3.trim() || undefined,
        fileType: 'markdown',
      });
    } else if (type === 'website') {
      onSaveWebsite({
        id: editingId || `site-${Date.now()}`,
        serviceName: f1.trim(),
        url: f2.trim().startsWith('http') ? f2.trim() : `https://${f2.trim()}`,
        emailOrUsername: f3.trim() || undefined,
        passwordOrToken: f4.trim() || undefined,
      });
    } else if (type === 'video') {
      onSaveVideo({
        id: editingId || `vid-${Date.now()}`,
        title: f1.trim(),
        url: f2.trim(),
        notes: f3.trim() || undefined,
      });
    } else if (type === 'question') {
      onSaveQuestion({
        id: editingId || `q-${Date.now()}`,
        question: f1.trim(),
        answer: f2.trim(),
        priority: (f3 as any) || 'normal',
      });
    } else if (type === 'weblink') {
      onSaveWebLink({
        id: editingId || `link-${Date.now()}`,
        title: f1.trim(),
        url: f2.trim().startsWith('http') ? f2.trim() : `https://${f2.trim()}`,
        description: f3.trim() || undefined,
      });
    } else if (type === 'formula') {
      if (onSaveFormula) {
        onSaveFormula(f1.trim());
      }
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'apikey':
        return editingId ? 'Edit API Key' : 'Add API Key';
      case 'prompt':
        return editingId ? 'Edit Prompt' : 'Add Prompt';
      case 'spec':
        return editingId ? 'Edit Document / PRD' : 'Add Document / PRD';
      case 'website':
        return editingId ? 'Edit Website & Login' : 'Add Website & Login';
      case 'video':
        return editingId ? 'Edit Video Link' : 'Add Video / Lecture Link';
      case 'question':
        return editingId ? 'Edit Question & Answer' : 'Add Revision Q&A';
      case 'weblink':
        return editingId ? 'Edit Reference Link' : 'Add Reference Link';
      case 'formula':
        return 'Add Key Formula';
      default:
        return 'Add Resource';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-3.5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h3 className="text-sm font-bold text-neutral-900">{getTitle()}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {/* Field 1 */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              {type === 'apikey'
                ? 'Key Name'
                : type === 'prompt'
                ? 'Prompt Title'
                : type === 'spec'
                ? 'File Name (e.g. PRD.md)'
                : type === 'website'
                ? 'Service / Site Name'
                : type === 'video' || type === 'weblink'
                ? 'Title'
                : type === 'formula'
                ? 'Formula / Equation'
                : 'Question'}
            </label>
            <input
              type="text"
              required
              value={f1}
              onChange={(e) => setF1(e.target.value)}
              placeholder={
                type === 'apikey'
                  ? 'e.g. OPENAI_API_KEY'
                  : type === 'spec'
                  ? 'e.g. PRD.md'
                  : type === 'formula'
                  ? 'e.g. F = m * a or x = (-b ± √(b²-4ac))/2a'
                  : type === 'question'
                  ? 'e.g. What is the difference between TCP and UDP?'
                  : 'Enter title...'
              }
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
            />
          </div>

          {/* Field 2 (Only if not formula) */}
          {type !== 'formula' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {type === 'apikey'
                  ? 'Secret Value / Key'
                  : type === 'prompt'
                  ? 'Prompt Content'
                  : type === 'spec'
                  ? 'File Content'
                  : type === 'website' || type === 'video' || type === 'weblink'
                  ? 'URL Address'
                  : 'Answer / Solution'}
              </label>
              {type === 'prompt' || type === 'spec' || type === 'question' ? (
                <textarea
                  required
                  rows={4}
                  value={f2}
                  onChange={(e) => setF2(e.target.value)}
                  placeholder="Enter detailed content..."
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
                />
              ) : (
                <input
                  type={type === 'apikey' ? 'password' : 'text'}
                  required
                  value={f2}
                  onChange={(e) => setF2(e.target.value)}
                  placeholder={
                    type === 'apikey'
                      ? 'sk-...'
                      : type === 'website' || type === 'video' || type === 'weblink'
                      ? 'https://...'
                      : ''
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
                />
              )}
            </div>
          )}

          {/* Optional Meta fields */}
          {type === 'apikey' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Environment</label>
                <select
                  value={f3}
                  onChange={(e) => setF3(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                  <option value="test">Test</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={f4}
                  onChange={(e) => setF4(e.target.value)}
                  placeholder="Optional notes"
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
                />
              </div>
            </div>
          )}

          {type === 'website' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={f3}
                  onChange={(e) => setF3(e.target.value)}
                  placeholder="Optional login"
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Password / PIN</label>
                <input
                  type="password"
                  value={f4}
                  onChange={(e) => setF4(e.target.value)}
                  placeholder="Optional password"
                  className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
                />
              </div>
            </div>
          )}

          {type === 'question' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">Importance / Priority</label>
              <select
                value={f3}
                onChange={(e) => setF3(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
              >
                <option value="high">High (Frequent Exam Question)</option>
                <option value="medium">Medium</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          )}

          {(type === 'prompt' || type === 'spec' || type === 'video' || type === 'weblink') && (
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                {type === 'prompt' ? 'Category / Tag' : 'Description / Topic'}
              </label>
              <input
                type="text"
                value={f3}
                onChange={(e) => setF3(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none"
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition cursor-pointer"
            >
              {editingId ? 'Save Changes' : 'Add to Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
