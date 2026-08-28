import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SpecFileItem } from '../types';
import {
  FileCode,
  Plus,
  Copy,
  Check,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Code,
  Sparkles,
} from 'lucide-react';

interface DevSpecFilesSectionProps {
  specFiles: SpecFileItem[];
  onChange: (files: SpecFileItem[]) => void;
  isOpenDefault?: boolean;
  isAddingExternal?: boolean;
  onCloseAddingExternal?: () => void;
}

export const DevSpecFilesSection: React.FC<DevSpecFilesSectionProps> = ({
  specFiles,
  onChange,
  isOpenDefault = true,
  isAddingExternal = false,
  onCloseAddingExternal,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isOpenDefault);
  const [internalAddingFile, setInternalAddingFile] = useState(false);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);

  const isAddingFile = isAddingExternal || internalAddingFile;

  // Form State
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'markdown' | 'json' | 'sql' | 'typescript' | 'yaml' | 'env' | 'other'>('markdown');
  const [fileContent, setFileContent] = useState('');
  const [description, setDescription] = useState('');

  // View mode toggles per file (preview rendered markdown vs raw code)
  const [previewFileIds, setPreviewFileIds] = useState<Record<string, boolean>>({});
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null);

  const closeFileForm = () => {
    setInternalAddingFile(false);
    setEditingFileId(null);
    setFileName('');
    setFileContent('');
    setDescription('');
    if (onCloseAddingExternal) onCloseAddingExternal();
  };

  const togglePreview = (id: string) => {
    setPreviewFileIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFileId(id);
    setTimeout(() => setCopiedFileId(null), 2000);
  };

  const handleStartAdd = () => {
    setEditingFileId(null);
    setFileName('PRD.md');
    setFileType('markdown');
    setFileContent('');
    setDescription('Product Requirements Document');
    setInternalAddingFile(true);
    setIsSectionOpen(true);
  };

  const handleStartEdit = (item: SpecFileItem) => {
    setEditingFileId(item.id);
    setFileName(item.fileName);
    setFileType(item.fileType || 'markdown');
    setFileContent(item.content);
    setDescription(item.description || '');
    setInternalAddingFile(true);
    setIsSectionOpen(true);
  };

  const handleSaveFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContent.trim()) return;

    if (editingFileId) {
      onChange(
        specFiles.map((f) =>
          f.id === editingFileId
            ? {
                ...f,
                fileName: fileName.trim(),
                fileType,
                content: fileContent.trim(),
                description: description.trim() || undefined,
              }
            : f
        )
      );
    } else {
      const newItem: SpecFileItem = {
        id: `spec-${Date.now()}`,
        fileName: fileName.trim(),
        fileType,
        content: fileContent.trim(),
        description: description.trim() || undefined,
      };
      onChange([...specFiles, newItem]);
    }

    closeFileForm();
  };

  const handleDeleteFile = (id: string) => {
    onChange(specFiles.filter((f) => f.id !== id));
  };

  const fileTemplates = [
    {
      name: 'PRD.md',
      type: 'markdown' as const,
      desc: 'Product Requirements Document',
      content: `# Product Requirements Document (PRD)

## 1. Overview & Objective
Briefly describe the vision, problem statement, and primary goal of this application.

## 2. Target Users & Personas
- **Primary Persona:** Needs quick execution, modern clean UI.
- **Pain Points:** Scattered tools, lack of centralized specs.

## 3. Core Features & Specifications
1. **Module A:** Detailed requirement, inputs, outputs.
2. **Module B:** Data flow and interaction states.
3. **Module C:** Real-time updates and persistence.

## 4. Non-Functional Requirements
- **Performance:** Sub-100ms response time.
- **Security:** Strict API key hashing and validation.
- **Responsiveness:** Flawless mobile & desktop support.

## 5. Implementation Roadmap
- [ ] Phase 1: Database & API Setup
- [ ] Phase 2: Core UI Components
- [ ] Phase 3: Testing & Deployment`,
    },
    {
      name: 'SCHEMA.sql',
      type: 'sql' as const,
      desc: 'Database Schema & Tables',
      content: `-- Database Schema Definition (PostgreSQL / SQLite)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_user_id ON projects(user_id);`,
    },
    {
      name: 'API_SPEC.json',
      type: 'json' as const,
      desc: 'REST Endpoints & Contract',
      content: `{
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/v1/projects",
      "description": "Fetch all user projects",
      "auth": "Bearer token",
      "response": { "status": 200, "data": [] }
    },
    {
      "method": "POST",
      "path": "/api/v1/projects",
      "description": "Create a new project",
      "body": { "title": "string", "mode": "string" }
    }
  ]
}`,
    },
    {
      name: 'README.md',
      type: 'markdown' as const,
      desc: 'Repository Readme & Setup',
      content: `# Project Name

An overview of what this application does and how to get started.

## Tech Stack
- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Express / Node.js
- Database: PostgreSQL / IndexedDB

## Local Development
\`\`\`bash
npm install
npm run dev
\`\`\`

## Environment Variables
Copy \`.env.example\` to \`.env\` and provide required keys.`,
    },
  ];

  const handleApplyTemplate = (tmpl: typeof fileTemplates[0]) => {
    setFileName(tmpl.name);
    setFileType(tmpl.type);
    setDescription(tmpl.desc);
    setFileContent(tmpl.content);
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
      {/* Header */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full px-3 sm:px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>Spec & Documentation</span>
              {specFiles.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                  {specFiles.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden xs:block">
              PRD.md, Architecture, DB Schemas, and pre-dev files
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
            <span className="whitespace-nowrap">Add File</span>
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
          {isAddingFile && (
            <form
              onSubmit={handleSaveFile}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  {editingFileId ? 'Edit File Block' : 'New Spec / Doc File'}
                </span>
                <button
                  type="button"
                  onClick={closeFileForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Template Selector */}
              {!editingFileId && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">Templates:</span>
                  {fileTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium shrink-0 cursor-pointer transition border border-emerald-200/60"
                    >
                      {tmpl.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    FILE NAME (WITH EXTENSION)
                  </label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. PRD.md, SCHEMA.sql, README.md"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    SYNTAX FORMAT
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="sql">SQL (.sql)</option>
                    <option value="json">JSON (.json)</option>
                    <option value="typescript">TypeScript (.ts)</option>
                    <option value="yaml">YAML (.yaml)</option>
                    <option value="env">Environment (.env)</option>
                    <option value="other">Plain Text</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  DESCRIPTION / PURPOSE
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Core System Requirements, Initial Database Schema..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  FILE CONTENT
                </label>
                <textarea
                  required
                  rows={8}
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  placeholder="Write or paste your specification, markdown, or code here..."
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 leading-relaxed resize-y"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeFileForm}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
                >
                  {editingFileId ? 'Save Changes' : 'Save File Block'}
                </button>
              </div>
            </form>
          )}

          {/* List of Saved Spec Files */}
          {specFiles.length > 0 ? (
            <div className="space-y-3">
              {specFiles.map((file) => {
                const isPreview = previewFileIds[file.id] ?? (file.fileType === 'markdown');
                const isCopied = copiedFileId === file.id;
                const lines = file.content.split('\n').length;

                return (
                  <div
                    key={file.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                  >
                    {/* Header Bar */}
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCode className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 truncate">
                          {file.fileName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono uppercase">
                          {file.fileType || 'md'}
                        </span>
                        {file.description && (
                          <span className="text-xs text-slate-500 truncate hidden sm:inline">
                            • {file.description}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Toggle View (Rendered Markdown vs Raw Code) */}
                        {file.fileType === 'markdown' && (
                          <button
                            type="button"
                            onClick={() => togglePreview(file.id)}
                            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                            title={isPreview ? 'View Raw Code' : 'View Formatted Preview'}
                          >
                            {isPreview ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isPreview ? 'Raw' : 'Preview'}</span>
                          </button>
                        )}

                        {/* Copy Entire File Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(file.id, file.content)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-800 shadow-2xs'
                              : 'bg-slate-900 hover:bg-black text-white shadow-2xs'
                          }`}
                          title="Copy entire file content"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy File</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(file)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* File Content Area */}
                    <div className="rounded-lg border border-slate-200/90 overflow-hidden bg-slate-50">
                      {isPreview && file.fileType === 'markdown' ? (
                        <div className="p-3.5 markdown-body bg-white text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto select-text">
                          <ReactMarkdown>{file.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <pre className="p-3 font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre leading-relaxed max-h-72 select-all bg-slate-900 text-slate-100 rounded-lg">
                          <code>{file.content}</code>
                        </pre>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-0.5">
                      <span>{lines} lines • {file.content.length} characters</span>
                      <span className="font-mono">Ready for repo / Cursor</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingFile && (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No spec or PRD files created yet.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="mt-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create PRD.md / Spec Block</span>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
