import React, { useState, useEffect, useRef } from 'react';
import { NoteItem, FolderItem, AppMode } from '../types';
import {
  ChevronRight,
  Check,
  Download,
  Upload,
  Cloud,
  HardDrive,
  LogOut,
  LogIn,
  X,
  Edit2,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Camera,
  Image as ImageIcon,
  Database,
  Info,
  Shield,
  MessageSquarePlus,
  Lightbulb,
  User as UserIcon,
} from 'lucide-react';
import { AuthUser } from '../types';
import { supabase, signOutUser } from '../services/supabase';
import { syncManager, SyncManagerStatus } from '../services/syncManager';
import { fileBackupService } from '../services/fileBackupService';
import { adminService } from '../services/adminService';

interface ProfileViewProps {
  notes?: NoteItem[];
  folders?: FolderItem[];
  trashedNotes?: NoteItem[];
  currentUser?: AuthUser | null;
  selectedMode?: AppMode | 'all';
  onSelectMode?: (mode: AppMode | 'all') => void;
  onImportData?: (notes: NoteItem[]) => void;
  onOpenAuthModal?: () => void;
  onOpenNotesFileModal?: () => void;
  onOpenTrashModal?: () => void;
  onOpenFeedbackModal?: () => void;
  onOpenAdminModal?: () => void;
  onOpenInstallModal?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  notes = [],
  folders = [],
  trashedNotes = [],
  currentUser = null,
  selectedMode = 'normal',
  onSelectMode,
  onImportData,
  onOpenAuthModal,
  onOpenNotesFileModal,
  onOpenTrashModal,
  onOpenFeedbackModal,
  onOpenAdminModal,
  onOpenInstallModal,
}) => {
  // Sync status
  const [syncStatus, setSyncStatus] = useState<SyncManagerStatus>(syncManager.getStatus());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Custom Local Profile State (for offline/custom display)
  const [customName, setCustomName] = useState<string>(() => {
    return currentUser ? (localStorage.getItem('projectnotes_custom_display_name') || '') : '';
  });
  const [customPhotoURL, setCustomPhotoURL] = useState<string>(() => {
    return currentUser ? (localStorage.getItem('projectnotes_custom_photo_url') || '') : '';
  });
  const [customBio, setCustomBio] = useState<string>(() => {
    return currentUser ? (localStorage.getItem('projectnotes_custom_bio') || '') : '';
  });

  // Remote profile hydration on login / cleanup on logout
  useEffect(() => {
    if (!currentUser) {
      setCustomName('');
      setCustomPhotoURL('');
      setCustomBio('');
      return;
    }

    if (currentUser.id) {
      if (currentUser.displayName) setCustomName(currentUser.displayName);
      if (currentUser.photoURL) setCustomPhotoURL(currentUser.photoURL);

      // Hydrate from Supabase user_profiles if present
      if (supabase) {
        Promise.resolve(
          supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle()
        )
          .then(({ data, error }) => {
            if (data && !error) {
              if (data.display_name) {
                setCustomName(data.display_name);
                localStorage.setItem('projectnotes_custom_display_name', data.display_name);
              }
              if (data.photo_url) {
                setCustomPhotoURL(data.photo_url);
                localStorage.setItem('projectnotes_custom_photo_url', data.photo_url);
              }
              if (data.bio) {
                setCustomBio(data.bio);
                localStorage.setItem('projectnotes_custom_bio', data.bio);
              }
            }
          })
          .catch(() => {});
      }

      adminService.syncUserActivity({
        id: currentUser.id,
        email: currentUser.email || 'user@projectnotes.app',
        displayName: customName || currentUser.displayName || undefined,
        photoURL: customPhotoURL || currentUser.photoURL || undefined,
        bio: customBio || undefined,
        notesCount: notes.length,
        provider: currentUser.provider || 'email',
      });
    }
  }, [currentUser, notes.length]);

  // Modals / Sheets
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'appearance' | 'notifications' | 'storage' | 'sync' | null>(null);

  // Edit Profile Form State
  const [editNameInput, setEditNameInput] = useState('');
  const [editPhotoInput, setEditPhotoInput] = useState('');
  const [editBioInput, setEditBioInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);

  // Appearance Theme State
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('projectnotes_theme_mode') as 'light' | 'dark' | 'system') || 'light';
  });

  // Notification Preferences State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof Notification !== 'undefined' ? Notification.permission : 'default';
  });
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(() => {
    return localStorage.getItem('projectnotes_reminders_enabled') !== 'false';
  });
  const [syncAlertsEnabled, setSyncAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('projectnotes_sync_alerts_enabled') === 'true';
  });

  // Storage Stats State
  const [storageEstimate, setStorageEstimate] = useState<{ usedMB: string; quotaMB: string } | null>(null);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Listen to Firestore Sync Status & Online State
  useEffect(() => {
    const unsubSync = syncManager.subscribeStatus((status) => {
      setSyncStatus(status);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update storage calculation when storage sheet is opened
  useEffect(() => {
    if (activeSheet === 'storage' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        const used = estimate.usage ? (estimate.usage / (1024 * 1024)).toFixed(2) : '0.45';
        const quota = estimate.quota ? (estimate.quota / (1024 * 1024)).toFixed(0) : '2048';
        setStorageEstimate({ usedMB: used, quotaMB: quota });
      }).catch(() => {
        setStorageEstimate({ usedMB: '0.50', quotaMB: '2048' });
      });
    }
  }, [activeSheet, notes.length, folders.length]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Dynamic statistics
  const textNotesCount = notes.filter((n) => n.type === 'text').length;
  const checklistCount = notes.filter((n) => n.type === 'checklist').length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;

  // Resolved identity data
  const displayName = currentUser
    ? (customName || currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Workspace Member'))
    : 'Local Workspace';

  const displayEmail = currentUser
    ? (currentUser.email || 'User')
    : 'Sign in to sync your notes';
  const displayPhoto = currentUser ? (customPhotoURL || currentUser.photoURL || '') : '';
  const initial = currentUser ? ((displayName.charAt(0) || 'U').toUpperCase()) : '';

  // 1. Handle Profile Editing
  const handleOpenEditProfile = () => {
    setEditNameInput(displayName);
    setEditPhotoInput(displayPhoto);
    setEditBioInput(customBio);
    setEditProfileError(null);
    setIsEditProfileOpen(true);
  };

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setEditProfileError('Image size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditPhotoInput(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = editNameInput.trim();
    if (!cleanName) {
      setEditProfileError('Display name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setEditProfileError(null);

    try {
      // 1. Save to LocalStorage
      setCustomName(cleanName);
      setCustomPhotoURL(editPhotoInput);
      setCustomBio(editBioInput.trim());

      localStorage.setItem('projectnotes_custom_display_name', cleanName);
      localStorage.setItem('projectnotes_custom_photo_url', editPhotoInput);
      localStorage.setItem('projectnotes_custom_bio', editBioInput.trim());

      // 2. If logged in, update Supabase user profile
      if (currentUser && supabase) {
        try {
          await supabase.from('user_profiles').upsert({
            id: currentUser.id,
            display_name: cleanName,
            photo_url: editPhotoInput || null,
            bio: editBioInput.trim() || null,
            updated_at: new Date().toISOString(),
          });
        } catch (sbErr: any) {
          console.warn('Supabase profile update notice:', sbErr.message);
        }
      }

      setIsEditProfileOpen(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      setEditProfileError(err.message || 'Failed to save profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Data Management (Export / Import JSON)
  const handleExportJson = () => {
    try {
      const backupPayload = {
        application: 'ProjectNotes',
        formatVersion: 1,
        exportedAt: new Date().toISOString(),
        user: {
          displayName,
          email: displayEmail,
        },
        metadata: {
          totalNotes: notes.length,
          totalFolders: folders.length,
          textNotes: textNotesCount,
          checklists: checklistCount,
          pinnedNotes: pinnedCount,
        },
        folders,
        notes,
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `projectnotes-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${notes.length} notes to JSON file!`, 'success');
    } catch (e: any) {
      showToast(`Export failed: ${e.message}`, 'error');
    }
  };

  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const validation = fileBackupService.validateAndParse(text);

      if (validation.isValid && validation.parsedData) {
        if (onImportData) {
          onImportData(validation.parsedData.notes);
        }
        showToast(`Imported ${validation.parsedData.notes.length} notes successfully!`, 'success');
      } else {
        // Try fallback raw JSON notes array
        try {
          const raw = JSON.parse(text);
          const rawNotes: NoteItem[] = Array.isArray(raw) ? raw : Array.isArray(raw.notes) ? raw.notes : [];
          if (rawNotes.length > 0) {
            if (onImportData) {
              onImportData(rawNotes);
            }
            showToast(`Imported ${rawNotes.length} notes successfully!`, 'success');
          } else {
            showToast('No valid notes found in file.', 'error');
          }
        } catch {
          showToast('Invalid JSON file format.', 'error');
        }
      }
    } catch (err: any) {
      showToast(`Failed to read file: ${err.message}`, 'error');
    }
  };

  // 3. Cloud Sync Toggle Handler
  const handleToggleCloudSync = () => {
    if (!currentUser) {
      if (onOpenAuthModal) onOpenAuthModal();
    } else {
      setActiveSheet('sync');
    }
  };

  // 4. Appearance Mode Selection
  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    localStorage.setItem('projectnotes_theme_mode', mode);

    const applyDark = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    if (mode === 'dark') {
      applyDark(true);
    } else if (mode === 'light') {
      applyDark(false);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyDark(prefersDark);
    }
    showToast(`Theme set to ${mode.charAt(0).toUpperCase() + mode.slice(1)}`, 'info');
  };

  // 5. Notifications Permission Request & Test
  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Notifications are not supported in this browser.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        try {
          new Notification('Study & ProjectNotes Alerts', {
            body: 'Notifications are active! You will receive reminder and sync alerts.',
          });
        } catch (e) {}
        showToast('Notifications enabled successfully!', 'success');
      } else {
        showToast('Notification permission was not granted by the browser.', 'info');
      }
    } catch (e: any) {
      showToast(`Permission error: ${e.message}`, 'error');
    }
  };

  const handleSendTestNotification = () => {
    if (typeof Notification === 'undefined') {
      showToast('Notifications are not supported in this browser.', 'error');
      return;
    }
    if (Notification.permission === 'granted') {
      try {
        new Notification('🔔 Note Reminder Alert', {
          body: 'This is a test notification from your workspace notes!',
        });
        showToast('Test notification sent!', 'success');
      } catch (e: any) {
        showToast(`Could not display notification: ${e.message}`, 'error');
      }
    } else {
      handleRequestNotifications();
    }
  };

  // 6. Sign Out / Sign In
  const handleSignOut = async () => {
    if (currentUser) {
      try {
        try {
          await syncManager.flushPendingSync();
        } catch (e) {}
        await signOutUser();
        setCustomName('');
        setCustomPhotoURL('');
        setCustomBio('');
        try {
          localStorage.removeItem('projectnotes_custom_display_name');
          localStorage.removeItem('projectnotes_custom_photo_url');
          localStorage.removeItem('projectnotes_custom_bio');
        } catch (e) {}
        showToast('Signed out successfully.', 'info');
      } catch (e: any) {
        showToast(`Error signing out: ${e.message}`, 'error');
      }
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  // 7. Clear Temporary Cache
  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem('projectnotes_search_history');
      showToast('Temporary cache cleared.', 'success');
    } catch (e: any) {
      showToast(`Failed: ${e.message}`, 'error');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 pb-32 sm:pb-36 text-[#111827]">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        id="profile-json-file-input"
        accept=".json,.aknotes,application/json,text/plain"
        onChange={handleFileImport}
        className="hidden"
      />
      <input
        ref={avatarFileInputRef}
        type="file"
        id="profile-avatar-file-input"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleAvatarFileSelected}
        className="hidden"
      />

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div
          id="profile-toast-banner"
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-900'
              : toastMessage.type === 'error'
              ? 'bg-white border-rose-200 text-rose-900'
              : 'bg-white border-blue-200 text-blue-900'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. IDENTITY CARD (ONE White Card, Inset & Quiet) */}
      {/* ========================================================================= */}
      <div id="profile-identity-card" className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-none space-y-4">
        {/* Top: Avatar, Name, Email, Status Pills, Edit button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* 56px circular avatar with click to edit */}
            <button
              type="button"
              onClick={currentUser ? handleOpenEditProfile : onOpenAuthModal}
              title={currentUser ? "Click to edit profile & avatar" : "Click to Sign In"}
              className={`relative w-14 h-14 rounded-full ${currentUser ? 'bg-[#111827] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'} flex items-center justify-center text-xl font-semibold shrink-0 select-none overflow-hidden group cursor-pointer border border-[#E5E7EB]`}
            >
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={displayName}
                  className="w-14 h-14 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : initial ? (
                <span>{initial}</span>
              ) : (
                <UserIcon className="w-6 h-6 text-[#6B7280]" />
              )}
              {currentUser && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Camera className="w-4 h-4" />
                </div>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-[17px] font-semibold text-[#111827] dark:text-white leading-tight truncate">
                  {displayName}
                </h2>
              </div>
              <p className="text-[13px] text-[#6B7280] dark:text-slate-400 leading-tight truncate mt-0.5 font-mono">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Small outline button top-right */}
          {currentUser ? (
            <button
              type="button"
              id="profile-edit-name-btn"
              onClick={handleOpenEditProfile}
              className="px-3 py-1 text-xs font-medium text-[#111827] border border-[#E5E7EB] rounded-lg hover:bg-[#F5F5F7] transition cursor-pointer shrink-0 inline-flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3 text-[#6B7280]" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              type="button"
              id="profile-sign-in-top-btn"
              onClick={onOpenAuthModal}
              className="px-3 py-1 text-xs font-medium text-white bg-[#111827] rounded-lg hover:bg-black transition cursor-pointer shrink-0 inline-flex items-center gap-1"
            >
              <LogIn className="w-3 h-3 text-white" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {customBio && (
          <p className="text-[12px] text-[#6B7280] italic px-1 leading-relaxed border-l-2 border-[#E5E7EB] pl-2">
            "{customBio}"
          </p>
        )}

        {/* Hairline divider */}
        <div className="border-t border-[#E5E7EB]" />

        {/* Stats as a quiet 4-column ROW inside the same card */}
        <div id="profile-stats-row" className="grid grid-cols-4 divide-x divide-[#F3F4F6] text-center pt-0.5">
          <div className="px-1">
            <div className="text-[18px] font-semibold text-[#111827] leading-none">
              {notes.length}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mt-1.5">
              TOTAL
            </div>
          </div>

          <div className="px-1">
            <div className="text-[18px] font-semibold text-[#111827] leading-none">
              {textNotesCount}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mt-1.5">
              TEXT
            </div>
          </div>

          <div className="px-1">
            <div className="text-[18px] font-semibold text-[#111827] leading-none">
              {checklistCount}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mt-1.5">
              LISTS
            </div>
          </div>

          <div className="px-1">
            <div className="text-[18px] font-semibold text-[#111827] leading-none">
              {pinnedCount}
            </div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-[#9CA3AF] mt-1.5">
              PINNED
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GROUP: DATA MANAGEMENT & BACKUPS */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1">
          DATA MANAGEMENT &amp; RECYCLE BIN
        </h3>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] overflow-hidden shadow-none">
          {/* Trash & 30-Day Backup */}
          <button
            type="button"
            id="profile-trash-backup-btn"
            onClick={onOpenTrashModal}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div>
              <div className="text-[14px] font-medium text-[#111827] flex items-center gap-1.5">
                <span className="text-rose-600">Trash &amp; 30-Day Backup</span>
                {trashedNotes.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    {trashedNotes.length} notes
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Restore deleted notes or purge permanently
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-rose-500">
              <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition shrink-0" />
            </div>
          </button>

          {/* .aknotes archive / Universal offline file */}
          <button
            type="button"
            id="profile-open-aknotes-btn"
            onClick={onOpenNotesFileModal}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div>
              <div className="text-[14px] font-medium text-[#111827] flex items-center gap-1.5">
                <span>.aknotes Portable Archive</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  Offline File
                </span>
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Direct disk mirroring &amp; portable backups
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition shrink-0 ml-3" />
          </button>

          {/* Export JSON backup */}
          <button
            type="button"
            id="profile-export-json-btn"
            onClick={handleExportJson}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div>
              <div className="text-[14px] font-medium text-[#111827]">
                Export JSON Backup
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Download all {notes.length} notes &amp; folders
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-[#6B7280]">
              <Download className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition shrink-0" />
            </div>
          </button>

          {/* Import JSON / .aknotes */}
          <button
            type="button"
            id="profile-import-json-btn"
            onClick={handleTriggerImport}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div>
              <div className="text-[14px] font-medium text-[#111827]">
                Import JSON / .aknotes File
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Restore notes from file into workspace
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-[#6B7280]">
              <Upload className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition shrink-0" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. GROUP: CLOUD SYNC & BACKUP */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1">
          CLOUD SYNC &amp; BACKUP
        </h3>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] overflow-hidden shadow-none">
          {/* Cloud Sync */}
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[14px] font-medium text-[#111827]">
                Cloud Backup Sync
              </div>
              <div className="text-[12px] text-[#6B7280]">
                {currentUser ? 'Automatic real-time sync active' : 'Sign in to sync across devices'}
              </div>
            </div>

            {/* Native iOS style toggle button */}
            <button
              type="button"
              id="profile-cloud-sync-toggle"
              onClick={handleToggleCloudSync}
              className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                currentUser ? 'bg-[#111827]' : 'bg-[#E5E7EB]'
              }`}
              title={currentUser ? 'Click to view sync status' : 'Sign in to enable cloud sync'}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform duration-200 ${
                  currentUser ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. GROUP: FEEDBACK & SUPPORT */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1">
          FEEDBACK &amp; SUPPORT
        </h3>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] overflow-hidden shadow-none">
          {/* Share Idea or Report Bug */}
          <button
            type="button"
            id="profile-feedback-modal-btn"
            onClick={onOpenFeedbackModal}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div>
              <div className="text-[14px] font-medium text-[#111827] flex items-center gap-1.5">
                <span>Share Idea or Report Issue</span>
              </div>
              <div className="text-[12px] text-[#6B7280]">
                Send feature suggestions, improvement ideas, or error reports
              </div>
            </div>
            <div className="flex items-center gap-1 text-[13px] text-[#111827]">
              <MessageSquarePlus className="w-4 h-4 text-[#111827] group-hover:scale-110 transition shrink-0" />
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. GROUP: ACCOUNT & SYSTEM SETTINGS */}
      {/* ========================================================================= */}
      <div className="space-y-1.5">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-[#9CA3AF] px-1">
          ACCOUNT &amp; SETTINGS
        </h3>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#F3F4F6] overflow-hidden shadow-none">
          {/* Install App on Phone / Desktop */}
          {onOpenInstallModal && (
            <button
              type="button"
              id="profile-install-app-btn"
              onClick={onOpenInstallModal}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
            >
              <div>
                <div className="text-[14px] font-medium text-[#111827] flex items-center gap-1.5">
                  <span>Install Note Bro App</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Standalone
                  </span>
                </div>
                <div className="text-[12px] text-[#6B7280]">
                  Full-screen experience without browser URL bar
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition shrink-0" />
            </button>
          )}

          {/* Notifications */}
          <button
            type="button"
            id="profile-notifications-btn"
            onClick={() => setActiveSheet('notifications')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div className="text-[14px] font-medium text-[#111827]">
              Notifications
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-[#6B7280] capitalize">
                {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
              </span>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition shrink-0" />
            </div>
          </button>

          {/* Storage & Cache Management */}
          <button
            type="button"
            id="profile-storage-btn"
            onClick={() => setActiveSheet('storage')}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer group"
          >
            <div className="text-[14px] font-medium text-[#111827]">
              Storage &amp; Usage
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-[#6B7280]">
                {notes.length} Notes Saved
              </span>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#111827] transition shrink-0" />
            </div>
          </button>

          {/* Sign Out / Connect Account */}
          <button
            type="button"
            id="profile-auth-action-btn"
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F9FAFB] transition cursor-pointer"
          >
            <span className={`text-[14px] font-medium ${currentUser ? 'text-red-600' : 'text-[#111827]'}`}>
              {currentUser ? 'Sign out of Account' : 'Sign in to Account'}
            </span>
            {currentUser ? (
              <LogOut className="w-4 h-4 text-red-500" />
            ) : (
              <LogIn className="w-4 h-4 text-[#111827]" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. EDIT PROFILE MODAL (Fully Dynamic & Functional) */}
      {/* ========================================================================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
              <h4 className="text-[16px] font-semibold text-[#111827]">
                Edit Profile
              </h4>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Selector */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-[#111827] text-white flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0 border border-[#E5E7EB]">
                  {editPhotoInput ? (
                    <img src={editPhotoInput} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(editNameInput.charAt(0) || 'W').toUpperCase()}</span>
                  )}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E7EB] text-[#111827] rounded-xl text-xs font-medium border border-[#E5E7EB] transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </button>
                    {editPhotoInput && (
                      <button
                        type="button"
                        onClick={() => setEditPhotoInput('')}
                        className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280]">
                    PNG, JPG, or WebP up to 2MB.
                  </p>
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label className="text-[12px] font-medium text-[#6B7280] block mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-[14px] text-[#111827] focus:outline-none focus:border-[#111827] transition"
                  autoFocus
                />
              </div>

              {/* Bio / Workplace Role */}
              <div>
                <label className="text-[12px] font-medium text-[#6B7280] block mb-1.5">
                  Workspace Status or Bio (Optional)
                </label>
                <input
                  type="text"
                  value={editBioInput}
                  onChange={(e) => setEditBioInput(e.target.value)}
                  placeholder="e.g. Product Lead • Building scalable web systems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] focus:outline-none focus:border-[#111827] transition"
                />
              </div>

              {/* Account Email (Read only) */}
              <div>
                <label className="text-[12px] font-medium text-[#6B7280] block mb-1">
                  Account Email
                </label>
                <div className="w-full px-3.5 py-2 rounded-xl bg-[#F5F5F7] border border-[#E5E7EB] text-[13px] text-[#6B7280] font-mono truncate">
                  {displayEmail}
                </div>
              </div>

              {editProfileError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editProfileError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSavingProfile}
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#6B7280] hover:bg-[#F5F5F7] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-medium hover:bg-black transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. APPEARANCE MODAL SHEET */}
      {/* ========================================================================= */}
      {activeSheet === 'appearance' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <h4 className="text-[15px] font-semibold text-[#111827]">
                Appearance &amp; Theme
              </h4>
              <button
                onClick={() => setActiveSheet(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-[#6B7280]">
              Choose how ProjectNotes looks across your devices.
            </p>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'light'
                    ? 'border-[#111827] bg-[#F5F5F7]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-[#111827]" />
                  <span className="text-[14px] font-medium text-[#111827]">Light Theme (iOS Clean)</span>
                </div>
                {themeMode === 'light' && <Check className="w-4 h-4 text-[#111827]" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'dark'
                    ? 'border-[#111827] bg-[#F5F5F7]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="w-4 h-4 text-[#111827]" />
                  <span className="text-[14px] font-medium text-[#111827]">Dark Theme (High Contrast)</span>
                </div>
                {themeMode === 'dark' && <Check className="w-4 h-4 text-[#111827]" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme('system')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                  themeMode === 'system'
                    ? 'border-[#111827] bg-[#F5F5F7]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-[#111827]" />
                  <span className="text-[14px] font-medium text-[#111827]">Match System</span>
                </div>
                {themeMode === 'system' && <Check className="w-4 h-4 text-[#111827]" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="px-4 py-1.5 rounded-xl bg-[#111827] text-white text-xs font-medium hover:bg-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. NOTIFICATIONS MODAL SHEET */}
      {/* ========================================================================= */}
      {activeSheet === 'notifications' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <h4 className="text-[15px] font-semibold text-[#111827]">
                Notification Settings
              </h4>
              <button
                onClick={() => setActiveSheet(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-[#111827]">
                  Browser Permissions
                </div>
                <div className="text-[11px] text-[#6B7280]">
                  Status: <strong className="capitalize text-[#111827]">{notificationPermission}</strong>
                </div>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotifications}
                  className="px-3 py-1.5 bg-[#111827] text-white rounded-xl text-xs font-medium hover:bg-black transition cursor-pointer"
                >
                  Enable
                </button>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#111827]">
                    Checklist &amp; Task Reminders
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Alerts for scheduled todos and task due dates
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !remindersEnabled;
                    setRemindersEnabled(next);
                    localStorage.setItem('projectnotes_reminders_enabled', String(next));
                  }}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    remindersEnabled ? 'bg-[#111827]' : 'bg-[#E5E7EB]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#111827]">
                    Cloud Sync Alerts
                  </div>
                  <div className="text-[11px] text-[#6B7280]">
                    Notify when notes are synced from other devices
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !syncAlertsEnabled;
                    setSyncAlertsEnabled(next);
                    localStorage.setItem('projectnotes_sync_alerts_enabled', String(next));
                  }}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    syncAlertsEnabled ? 'bg-[#111827]' : 'bg-[#E5E7EB]'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      syncAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Test Alert Button */}
              <div className="pt-2 border-t border-[#F3F4F6] flex justify-between items-center">
                <span className="text-[12px] text-[#6B7280]">Verify push alerts</span>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E7EB] text-[#111827] rounded-xl text-xs font-medium border border-[#E5E7EB] transition cursor-pointer"
                >
                  Send Test Alert
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="px-4 py-1.5 rounded-xl bg-[#111827] text-white text-xs font-medium hover:bg-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. STORAGE & DIAGNOSTICS SHEET */}
      {/* ========================================================================= */}
      {activeSheet === 'storage' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <h4 className="text-[15px] font-semibold text-[#111827] flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Storage &amp; Usage Diagnostics</span>
              </h4>
              <button
                onClick={() => setActiveSheet(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Storage Engine:</span>
                <span className="font-semibold text-[#111827]">IndexedDB (Client-Side)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Total Notes Cached:</span>
                <span className="font-semibold text-[#111827]">{notes.length}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Folders Created:</span>
                <span className="font-semibold text-[#111827]">{folders.length}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Estimated Local Storage:</span>
                <span className="font-mono font-semibold text-[#111827]">
                  {storageEstimate?.usedMB || '0.45'} MB / {storageEstimate?.quotaMB || '2048'} MB
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleClearCache}
                className="w-full py-2 px-3 rounded-xl border border-[#E5E7EB] hover:bg-[#F5F5F7] text-[#111827] text-xs font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#6B7280]" />
                <span>Clear Temporary UI Cache</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="px-4 py-1.5 rounded-xl bg-[#111827] text-white text-xs font-medium hover:bg-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. CLOUD SYNC DETAILS SHEET */}
      {/* ========================================================================= */}
      {activeSheet === 'sync' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
              <h4 className="text-[15px] font-semibold text-[#111827] flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span>Supabase Cloud Synchronization</span>
              </h4>
              <button
                onClick={() => setActiveSheet(null)}
                className="text-[#9CA3AF] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Authenticated User:</span>
                <span className="font-semibold text-[#111827] truncate max-w-[200px]">{displayEmail}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Network State:</span>
                <span className="font-semibold text-[#111827]">{isOnline ? 'Online (Connected)' : 'Offline (Queuing)'}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#6B7280]">Sync Pipeline:</span>
                <span className="font-semibold text-blue-600">
                  {syncStatus === 'saving' ? 'Syncing items...' : syncStatus === 'synced' ? 'Synchronized' : 'Offline / Local'}
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[#6B7280] leading-relaxed">
              Notes, tags, and folders created or edited on this device automatically sync to your Supabase PostgreSQL database securely.
            </p>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (currentUser) {
                    await syncManager.pushAllToCloud(notes, folders, []);
                    showToast('Pushed all local notes to cloud!', 'success');
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#111827] hover:bg-[#F5F5F7] cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Force Sync Now</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                className="px-4 py-1.5 rounded-xl bg-[#111827] text-white text-xs font-medium hover:bg-black cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
