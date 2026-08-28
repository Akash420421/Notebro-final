import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Upload,
  Users,
  MessageSquare,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  Bug,
  Lightbulb,
  MessageCircle,
  Laptop,
} from 'lucide-react';
import { AppBranding, AdminUserItem, FeedbackItem, AuthUser } from '../types';
import { adminService } from '../services/adminService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthUser | null;
  totalNotesCount?: number;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  totalNotesCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'branding' | 'users' | 'feedback'>('branding');

  // Branding State
  const [branding, setBranding] = useState<AppBranding>(adminService.getBranding());
  const [logoInput, setLogoInput] = useState<string>(branding.logoUrl || '');
  const [appNameInput, setAppNameInput] = useState<string>(branding.appName || 'Note Bro');
  const [showAdsBannerInput, setShowAdsBannerInput] = useState<boolean>(branding.showAdsBanner ?? false);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSuccessToast, setBrandingSuccessToast] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Feedback State
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState<'all' | 'bug' | 'idea' | 'feedback'>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<{ [id: string]: string }>({});
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<string | null>(null);

  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to branding
    const unsub = adminService.subscribeBranding((b) => {
      setBranding(b);
      setLogoInput(b.logoUrl || '');
      setAppNameInput(b.appName || 'Note Bro');
      setShowAdsBannerInput(b.showAdsBanner ?? false);
    });

    loadUsers();
    loadFeedback();

    return unsub;
  }, [isOpen]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await adminService.fetchAllUsers();
      setUsersList(users);
    } catch (e) {
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const fb = await adminService.fetchAllFeedback();
      setFeedbackList(fb);
    } catch (e) {
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  if (!isOpen) return null;

  // Handle Logo Upload from Local File
  const handleLogoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoInput(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Branding changes
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      await adminService.updateBranding(
        logoInput.trim() || null,
        appNameInput.trim() || 'Note Bro',
        showAdsBannerInput
      );
      setBrandingSuccessToast(true);
      setTimeout(() => setBrandingSuccessToast(false), 2500);
    } catch (err: any) {
      alert('Failed to save branding: ' + err.message);
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Update feedback status
  const handleUpdateStatus = async (
    id: string,
    status: 'pending' | 'reviewed' | 'resolved'
  ) => {
    const currentAdminNote = adminNoteInput[id];
    await adminService.updateFeedbackStatus(id, status, currentAdminNote);
    setFeedbackList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status, adminNote: currentAdminNote || f.adminNote } : f))
    );
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.bio && u.bio.toLowerCase().includes(query))
    );
  });

  // Filtered Feedback
  const filteredFeedback = feedbackList.filter((item) => {
    if (feedbackCategoryFilter !== 'all' && item.type !== feedbackCategoryFilter) return false;
    if (feedbackStatusFilter !== 'all' && item.status !== feedbackStatusFilter) return false;
    return true;
  });

  const formatDate = (ts?: number) => {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full h-full bg-[#F8FAFC] text-slate-900 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-xs gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                  Control Console
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Full Page Mode
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate max-w-[220px] sm:max-w-md">
                Workspace branding, user accounts &amp; reports.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold border border-slate-200 shrink-0"
          >
            <span className="hidden xs:inline">Exit</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 pt-2.5 pb-2 border-b border-slate-200 bg-white shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({usersList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Reports ({feedbackList.length})</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-slate-50/40">
          {/* ========================================================================= */}
          {/* 1. BRANDING & APP LOGO */}
          {/* ========================================================================= */}
          {activeTab === 'branding' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Custom App Logo &amp; Title</h3>
                  <p className="text-xs text-slate-500">
                    Upload your own brand logo to replace the default icon on the top header for all users.
                  </p>
                </div>

                {/* Live Preview Box */}
                <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      {logoInput ? (
                        <img src={logoInput} alt="App Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                          PN
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Header Preview
                      </div>
                      <div className="text-sm font-black text-slate-900 tracking-tight">
                        {appNameInput || 'ProjectNotes'}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    Live Synced
                  </span>
                </div>

                <form onSubmit={handleSaveBranding} className="space-y-4 pt-2">
                  {/* File Upload Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Upload Logo Image File
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-200"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Image (PNG / SVG / JPG)</span>
                      </button>
                      {logoInput && (
                        <button
                          type="button"
                          onClick={() => setLogoInput('')}
                          className="px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-semibold"
                        >
                          Reset to Default
                        </button>
                      )}
                    </div>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoFileSelected}
                    />
                  </div>

                  {/* Or Image URL */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Or Image URL Link
                    </label>
                    <input
                      type="url"
                      value={logoInput.startsWith('data:') ? '' : logoInput}
                      onChange={(e) => setLogoInput(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>

                  {/* App Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Workspace / Application Title
                    </label>
                    <input
                      type="text"
                      required
                      value={appNameInput}
                      onChange={(e) => setAppNameInput(e.target.value)}
                      placeholder="e.g. Note Bro, ProjectNotes, DevStack"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>

                  {/* Ads & Promotional Banner Toggle */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Promotional &amp; Ads Banner (Home Screen)</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          showAdsBannerInput
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {showAdsBannerInput ? 'VISIBLE / ON' : 'HIDDEN / OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Controls whether the sponsored ads &amp; promo carousel appears at the top of the home screen.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdsBannerInput(!showAdsBannerInput)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showAdsBannerInput ? 'bg-slate-900' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          showAdsBannerInput ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {brandingSuccessToast && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Settings &amp; branding updated successfully across all views!</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingBranding}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSavingBranding ? 'Saving...' : 'Apply Logo & Branding'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. REGISTERED USERS DIRECTORY */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by user name or email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-semibold text-slate-500">
                    Showing {filteredUsers.length} of {usersList.length} users
                  </span>
                  <button
                    type="button"
                    onClick={loadUsers}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                    title="Refresh user list"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users list */}
              {isLoadingUsers ? (
                <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Loading user directory from database...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                  <Users className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-800">No users found</p>
                  <p className="text-xs text-slate-500">Users who sign in will automatically appear in this registry.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUsers.map((u) => {
                    const isCurrent = currentUser?.uid === u.id || currentUser?.email === u.email;

                    return (
                      <div
                        key={u.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-start gap-3.5"
                      >
                        <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0 overflow-hidden border border-slate-200 shadow-xs">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(u.displayName || u.email || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {u.displayName || 'Unnamed User'}
                            </h4>
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {u.role || 'user'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {u.email}
                          </div>

                          {u.bio && (
                            <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                              "{u.bio}"
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              Active: {formatDate(u.lastActiveAt)}
                            </span>
                            <span className="font-semibold text-slate-600">
                              {u.notesCount || 0} Notes
                            </span>
                            {isCurrent && (
                              <span className="font-bold text-emerald-600">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. USER FEEDBACK & BUG INBOX */}
          {/* ========================================================================= */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                {/* Category filters */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Category:
                  </span>
                  {(['all', 'idea', 'bug', 'feedback'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                        feedbackCategoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Status filters */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                  {(['all', 'pending', 'reviewed', 'resolved'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFeedbackStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition capitalize cursor-pointer ${
                        feedbackStatusFilter === st
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback List */}
              {isLoadingFeedback ? (
                <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Loading feedback from database...</span>
                </div>
              ) : filteredFeedback.length === 0 ? (
                <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
                  <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-800">No submissions found</p>
                  <p className="text-xs text-slate-500">
                    When users submit bugs, errors, or ideas from the profile section, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFeedback.map((item) => {
                    const isExpanded = expandedFeedbackId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
                      >
                        <div
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50"
                          onClick={() => setExpandedFeedbackId(isExpanded ? null : item.id)}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.type === 'bug' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                  <Bug className="w-3 h-3" /> Bug Report
                                </span>
                              ) : item.type === 'idea' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  <Lightbulb className="w-3 h-3" /> Feature Idea
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <MessageCircle className="w-3 h-3" /> Suggestion
                                </span>
                              )}

                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.title}
                              </h4>

                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  item.status === 'resolved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'reviewed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-1">
                              {item.description}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>From: {item.userName || item.userEmail || 'User'}</span>
                              <span>•</span>
                              <span>{formatDate(item.createdAt)}</span>
                              {item.attachment && (
                                <>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-semibold flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> Has Screenshot
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-500 font-medium">
                              {isExpanded ? 'Collapse' : 'Details'}
                            </span>
                            <ChevronRight
                              className={`w-4 h-4 text-slate-400 transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded details & status actions */}
                        {isExpanded && (
                          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                Full Message Description
                              </label>
                              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {item.description}
                              </div>
                            </div>

                            {item.attachment && (
                              <div>
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                  Attached Screenshot
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setPreviewAttachmentUrl(item.attachment || null)}
                                  className="group relative rounded-xl overflow-hidden border border-slate-200 inline-block cursor-pointer shadow-xs"
                                >
                                  <img
                                    src={item.attachment}
                                    alt="Screenshot preview"
                                    className="max-h-48 rounded-xl object-cover group-hover:scale-105 transition"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                                    <ExternalLink className="w-4 h-4" /> Click to Zoom
                                  </div>
                                </button>
                              </div>
                            )}

                            {/* Status Change & Admin Note */}
                            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-700">Set Status:</span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, 'pending')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    item.status === 'pending'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Pending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    item.status === 'reviewed'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Reviewed
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(item.id, 'resolved')}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                    item.status === 'resolved'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  Resolved
                                </button>
                              </div>

                              <div className="text-xs text-slate-400 font-mono">
                                ID: {item.id}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>ProjectNotes System Database · Connected</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Screenshot Zoom Modal */}
      {previewAttachmentUrl && (
        <div
          className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewAttachmentUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto rounded-2xl bg-white p-2">
            <button
              onClick={() => setPreviewAttachmentUrl(null)}
              className="absolute top-4 right-4 p-2 bg-black/70 text-white rounded-full hover:bg-black transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewAttachmentUrl}
              alt="Screenshot Preview"
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
