import React, { useState, useEffect } from 'react';
import { ShieldAlert, HardDrive, Download, Upload, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { localStore } from '../services/localStore';
import { StorageHealthInfo } from '../types';

interface StorageProtectionBannerProps {
  onOpenBackupModal?: () => void;
}

export function StorageProtectionBanner({ onOpenBackupModal }: StorageProtectionBannerProps) {
  const [health, setHealth] = useState<StorageHealthInfo>(localStore.getStorageHealth());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dismissIncognito, setDismissIncognito] = useState<boolean>(false);

  useEffect(() => {
    localStore.initStorageProtection().then(setHealth);

    const unsubError = localStore.onStorageError((err) => {
      setErrorMessage(err.message);
    });

    return () => {
      unsubError();
    };
  }, []);

  return (
    <>
      {/* 1. Critical Storage / Write Error Alert (RISK 4) */}
      {errorMessage && (
        <div
          role="alert"
          className="bg-red-900/90 border-b border-red-500 text-white px-4 py-3 text-sm flex items-center justify-between gap-3 shadow-lg z-50 animate-bounce"
        >
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
            <span>
              <strong>Storage Warning:</strong> {errorMessage}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => localStore.triggerFileDownloadBackup()}
              className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Backup Now
            </button>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-800 rounded text-red-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Incognito / Private Browsing Warning (RISK 3) */}
      {health.isIncognito && !dismissIncognito && (
        <div
          role="alert"
          className="bg-amber-950/90 border-b border-amber-500/60 text-amber-100 px-4 py-2.5 text-xs sm:text-sm flex items-center justify-between gap-3 z-40"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Private Browsing Mode detected:</strong> Notes will be lost when you close this window. Please install the app or use normal browsing to save permanently.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => localStore.triggerFileDownloadBackup()}
              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-700 rounded text-xs font-medium flex items-center gap-1 text-amber-100 transition cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Download Backup
            </button>
            <button
              onClick={() => setDismissIncognito(true)}
              className="p-1 hover:bg-amber-900 rounded text-amber-300"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Storage Low Space Warning (>90% full) */}
      {health.isLowSpace && (
        <div
          role="alert"
          className="bg-orange-950/90 border-b border-orange-500/60 text-orange-100 px-4 py-2 text-xs flex items-center justify-between gap-3 z-40"
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              Device storage is nearly full ({health.usagePercentage}% used). Export a backup file to keep your notes safe.
            </span>
          </div>
          <button
            onClick={() => localStore.triggerFileDownloadBackup()}
            className="px-2.5 py-0.5 bg-orange-800 hover:bg-orange-700 rounded text-xs font-medium text-orange-100"
          >
            Export JSON
          </button>
        </div>
      )}
    </>
  );
}
