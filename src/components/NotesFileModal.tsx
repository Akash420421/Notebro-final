import React, { useState, useRef } from 'react';
import {
  X,
  FileCode,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  FileCheck,
  Loader2,
  ArrowRight,
  Shield,
  Copy,
  Check,
  Layers,
  FolderOpen,
} from 'lucide-react';
import {
  fileBackupService,
  AkNotesFileStructure,
  FILE_FORMAT_VERSION,
  DEFAULT_FILE_NAME,
} from '../services/fileBackupService';
import { NoteItem, FolderItem, ProjectItem } from '../types';

interface NotesFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  folders: FolderItem[];
  projects: ProjectItem[];
  userId?: string;
  onImportNotes: (data: AkNotesFileStructure) => void;
}

export function NotesFileModal({
  isOpen,
  onClose,
  notes,
  folders,
  projects,
  userId,
  onImportNotes,
}: NotesFileModalProps) {
  const [activeFileName, setActiveFileName] = useState<string | null>(
    fileBackupService.getActiveFileName()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [pendingPreviewData, setPendingPreviewData] = useState<AkNotesFileStructure | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isNativeSupported = fileBackupService.isFileSystemAccessSupported();

  // Handler: Direct One-Click Download of .aknotes file
  const handleDownloadExport = () => {
    setIsLoading(true);
    try {
      fileBackupService.downloadFallbackFile(notes, folders, projects, userId);
      setStatusMessage({
        type: 'success',
        text: `✓ Successfully exported ${notes.length} notes & workspace data to "${DEFAULT_FILE_NAME}". Check your downloads!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Failed to download export file: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Choose / Connect Live Mirroring (when supported) or trigger Download
  const handleChooseFile = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const res = await fileBackupService.chooseNotesFile(notes, folders, projects, userId);
    setIsLoading(false);

    if (res.success) {
      if (res.isFallbackDownload) {
        setStatusMessage({
          type: 'success',
          text: `✓ Generated and downloaded "${DEFAULT_FILE_NAME}" with all your notes and folder structures.`,
        });
      } else if (res.fileName) {
        setActiveFileName(res.fileName);
        setStatusMessage({
          type: 'success',
          text: `✓ Connected to "${res.fileName}". Live workspace mirroring active!`,
        });
      }
    } else if (res.error && res.error !== 'File selection was cancelled.') {
      setStatusMessage({ type: 'error', text: res.error });
    }
  };

  // Handler: Upload / Pick Existing File (Robust HTML5 File Input)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    const res = await fileBackupService.readUploadedFile(file);
    setIsLoading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (res.isValid && res.parsedData) {
      setPendingPreviewData(res.parsedData);
      setActiveFileName(file.name);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to read notes file.' });
    }
  };

  // Handler: Drag and drop file support
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStatusMessage(null);

    const res = await fileBackupService.readUploadedFile(file);
    setIsLoading(false);

    if (res.isValid && res.parsedData) {
      setPendingPreviewData(res.parsedData);
      setActiveFileName(file.name);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to read dropped file.' });
    }
  };

  // Copy raw JSON bundle to clipboard
  const handleCopyJson = () => {
    const payload = fileBackupService.generateBackupPayload(notes, folders, projects, userId);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setStatusMessage({
      type: 'success',
      text: '✓ Workspace data JSON copied to clipboard!',
    });
  };

  // Confirm and Apply Import
  const handleConfirmImport = () => {
    if (!pendingPreviewData) return;
    onImportNotes(pendingPreviewData);
    setStatusMessage({
      type: 'success',
      text: `✓ Successfully restored ${pendingPreviewData.notes.length} notes, ${pendingPreviewData.folders?.length || 0} folders, and ${pendingPreviewData.projects?.length || 0} projects!`,
    });
    setPendingPreviewData(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".aknotes,.json,application/json,text/plain"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.12)] text-slate-900 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  User-Owned Offline File
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  .aknotes
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Direct offline backup & portable recovery</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Permission / Sovereignty Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Full Data Sovereignty & Portability</span>
            </div>
            <p className="leading-relaxed text-slate-600 text-xs">
              Save your workspace (notes, sketches, checklists, tags, folders, and projects) to a single portable <strong className="text-amber-800 font-mono">.aknotes</strong> file on your device.
            </p>
          </div>

          {/* Active File / Status Banner */}
          {activeFileName && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-amber-950 font-mono truncate max-w-[220px] sm:max-w-[280px]">
                    {activeFileName}
                  </div>
                  <div className="text-[11px] text-amber-700">Offline backup loaded</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  fileBackupService.disconnectFileHandle();
                  setActiveFileName(null);
                  setStatusMessage({ type: 'success', text: 'Disconnected local file.' });
                }}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-start gap-2 animate-in fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Drag & Drop Feedback Area */}
          {isDragging && (
            <div className="p-6 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 text-center text-amber-900 text-xs font-bold animate-pulse">
              Drop .aknotes or .json backup file here to import
            </div>
          )}

          {/* Pending Import Preview Confirmation */}
          {pendingPreviewData && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-200 space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold uppercase tracking-wider">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>Validated .aknotes File Ready to Restore</span>
              </div>

              <div className="text-xs space-y-1 font-mono text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Notes:</span>
                  <span className="font-bold text-slate-900">{pendingPreviewData.notes.length}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Folders:</span>
                  <span className="font-bold text-slate-900">{pendingPreviewData.folders?.length || 0}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="text-slate-500">Projects:</span>
                  <span className="font-bold text-slate-900">{pendingPreviewData.projects?.length || 0}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-500">Exported:</span>
                  <span className="text-slate-700 text-[11px]">
                    {new Date(pendingPreviewData.exportedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingPreviewData(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm inline-flex items-center gap-1.5"
                >
                  <span>Restore to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Export / Download Backup File */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Export .aknotes File</span>
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Download a complete standalone backup bundle of all {notes.length} notes and folders.
                </p>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleDownloadExport}
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download Backup</span>
              </button>
            </div>

            {/* 2. Connect / Import Existing File */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>Import & Restore</span>
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                  Restore notes from an existing <span className="font-mono text-slate-700">.aknotes</span> or JSON backup file.
                </p>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>Select & Restore File</span>
              </button>
            </div>
          </div>

          {/* Additional Utilities (Copy JSON / Disk Sync Info) */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 text-[11px] text-slate-700 hover:text-slate-900 transition cursor-pointer bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Raw JSON</span>
                </>
              )}
            </button>

            {isNativeSupported && (
              <button
                type="button"
                onClick={handleChooseFile}
                className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 underline cursor-pointer font-medium"
              >
                <FolderOpen className="w-3 h-3" />
                <span>Live Disk Mirror</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Format v{FILE_FORMAT_VERSION} • {notes.length} Notes</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
