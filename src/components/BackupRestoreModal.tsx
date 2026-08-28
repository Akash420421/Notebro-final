import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  X,
  FileJson,
  Sparkles,
  Info,
} from 'lucide-react';
import { localStore } from '../services/localStore';
import { StorageHealthInfo } from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export function BackupRestoreModal({ isOpen, onClose, onDataRestored }: BackupRestoreModalProps) {
  const [health, setHealth] = useState<StorageHealthInfo>(localStore.getStorageHealth());
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importSummary, setImportSummary] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      localStore.initStorageProtection().then(setHealth);
      setImportStatus('idle');
      setImportSummary('');
      setImportError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    await localStore.triggerFileDownloadBackup();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('importing');
    setImportError('');
    setImportSummary('');

    try {
      const text = await file.text();
      const result = await localStore.importDataFromJSON(text, 'merge');
      setImportStatus('success');
      setImportSummary(
        `Successfully restored ${result.notesImported} notes, ${result.foldersImported} folders, and ${result.projectsImported} projects.`
      );
      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err: any) {
      setImportStatus('error');
      setImportError(err?.message || 'Failed to parse and import backup file.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Zero Data Loss & Backup</h3>
              <p className="text-xs text-slate-400">Local-First Storage & Safety Net</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Storage Health Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-teal-400" />
                Browser Storage Protection:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  health.isPersisted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {health.isPersisted ? 'Persisted (Safe)' : 'Standard Storage'}
              </span>
            </div>

            {health.quotaBytes > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Usage: {Math.round(health.usedBytes / (1024 * 1024))} MB</span>
                  <span>{health.usagePercentage}% of available</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      health.isLowSpace ? 'bg-red-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, health.usagePercentage)}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Every keystroke is saved immediately to an on-device IndexedDB database. Your notes will survive browser restarts, offline edits, and network disconnects.
            </p>
          </div>

          {/* Export / Backup Section */}
          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Export / Backup My Notes</h4>
                <p className="text-xs text-slate-300">
                  Download a complete JSON snapshot of all your notes, folders, API keys, and sketches.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Download JSON Backup
              </button>
            </div>
          </div>

          {/* Import / Restore Section */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-slate-700 text-slate-300 shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-white">Restore from Backup</h4>
                <p className="text-xs text-slate-400">
                  Import a previous Note Bro JSON backup file. All notes will be safely merged.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importStatus === 'importing'}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {importStatus === 'importing' ? 'Importing...' : 'Select JSON File'}
              </button>

              {importStatus === 'success' && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSummary}</span>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Supabase + IndexedDB Sync
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
