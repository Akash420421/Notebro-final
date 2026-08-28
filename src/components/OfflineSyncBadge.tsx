import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AuthUser } from '../types';
import { syncManager, SyncManagerStatus } from '../services/syncManager';
import { nvidiaService, NvidiaConnectionState } from '../services/nvidiaProvider';
import { fileBackupService } from '../services/fileBackupService';

interface OfflineSyncBadgeProps {
  currentUser: AuthUser | null;
  onOpenAuthModal: () => void;
  onOpenNotesFileModal: () => void;
  onOpenNvidiaModal: () => void;
}

export function OfflineSyncBadge({
  currentUser,
  onOpenAuthModal,
  onOpenNotesFileModal,
  onOpenNvidiaModal,
}: OfflineSyncBadgeProps) {
  const [syncStatus, setSyncStatus] = useState<SyncManagerStatus>(syncManager.getStatus());
  const [pendingCount, setPendingCount] = useState<number>(syncManager.getPendingNotesCount());
  const [nvidiaState, setNvidiaState] = useState<NvidiaConnectionState>(nvidiaService.getState());
  const [activeFileName, setActiveFileName] = useState<string | null>(fileBackupService.getActiveFileName());
  const [stalePendingInfo, setStalePendingInfo] = useState<{ hasStale: boolean; oldestHours: number }>({
    hasStale: false,
    oldestHours: 0,
  });

  useEffect(() => {
    const unsubSync = syncManager.subscribeStatus((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });
    const unsubNvidia = nvidiaService.subscribe(setNvidiaState);

    const checkStale = async () => {
      const info = await syncManager.getStalePendingNoteIds(24);
      setStalePendingInfo({
        hasStale: info.staleIds.length > 0 && navigator.onLine,
        oldestHours: info.oldestPendingAgeHours,
      });
    };

    const storageRefresh = async () => {
      await syncManager.refreshStorageHealth();
    };

    checkStale();
    storageRefresh();

    const interval = setInterval(() => {
      setActiveFileName(fileBackupService.getActiveFileName());
      checkStale();
      storageRefresh();
    }, 60000);

    return () => {
      unsubSync();
      unsubNvidia();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* 1. NVIDIA / AI Chip Pill */}
      <button
        id="nvidia-ai-chip-pill"
        type="button"
        onClick={onOpenNvidiaModal}
        title={nvidiaState.isConnected ? `NVIDIA AI Active (${nvidiaState.modelName})` : 'Connect NVIDIA AI / Model Provider'}
        className="px-2.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border shadow-2xs whitespace-nowrap active:scale-95 bg-[#284B3E] hover:bg-[#1E3B30] border-[#34D399]/40 text-[#34D399]"
      >
        <Cpu className="w-4 h-4 text-[#34D399]" />
        <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
      </button>

      {/* File Backup Pill (if active on desktop) */}
      {activeFileName && (
        <button
          type="button"
          onClick={onOpenNotesFileModal}
          title={`Mirroring to local file: ${activeFileName}`}
          className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-950/70 border border-amber-500/50 text-amber-300 hover:bg-amber-900/80 transition cursor-pointer hidden lg:inline-flex items-center gap-1 shadow-2xs whitespace-nowrap"
        >
          <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          <span className="max-w-[75px] truncate">{activeFileName}</span>
        </button>
      )}

      {/* 2. Supabase & Local-First Cloud Sync Pill */}
      <button
        id="cloud-sync-status-pill"
        type="button"
        onClick={onOpenAuthModal}
        title={
          syncStatus === 'saving'
            ? 'Syncing with Supabase...'
            : syncStatus === 'offline'
            ? 'Offline Mode - All notes safely saved in Local IndexedDB'
            : syncStatus === 'pending_local'
            ? `${pendingCount} note(s) saved locally, pending Supabase background sync`
            : currentUser
            ? `Supabase Connected: ${currentUser.email || 'User'}`
            : 'Local-First Storage Active • Tap for Supabase Account Sync'
        }
        className="px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer border shadow-2xs active:scale-95 bg-[#1E293B] hover:bg-slate-800 border-slate-700 text-[#2DD4BF]"
      >
        {syncStatus === 'saving' ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#2DD4BF]" />
            <span className="text-xs font-medium text-[#2DD4BF] hidden sm:inline">Syncing</span>
          </>
        ) : syncStatus === 'offline' ? (
          <>
            <CloudOff className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400 hidden sm:inline">Local Safe</span>
          </>
        ) : syncStatus === 'pending_local' ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400 hidden sm:inline">Saved Local ({pendingCount})</span>
          </>
        ) : (
          <>
            <Cloud className="w-4 h-4 text-[#2DD4BF]" />
            <span className="text-xs font-medium text-teal-300 hidden sm:inline">Supabase</span>
          </>
        )}
      </button>

      {/* RISK 9: Stale pending sync warning (> 24h stuck while online) */}
      {stalePendingInfo.hasStale && (
        <button
          type="button"
          onClick={() => onOpenNotesFileModal()}
          title={`${stalePendingInfo.oldestHours}h since last successful sync. Export a safety backup or check your connection.`}
          className="px-2.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer border shadow-2xs active:scale-95 bg-amber-50 hover:bg-amber-100 border-amber-400/70 text-amber-800 animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold hidden xs:inline">
            {stalePendingInfo.oldestHours}h Stale
          </span>
        </button>
      )}
    </div>
  );
}
