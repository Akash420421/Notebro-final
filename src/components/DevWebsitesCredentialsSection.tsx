import React, { useState } from 'react';
import { DevWebsiteCredentialItem } from '../types';
import {
  Globe,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User,
  Lock,
} from 'lucide-react';

interface DevWebsitesCredentialsSectionProps {
  devWebsites: DevWebsiteCredentialItem[];
  onChange: (websites: DevWebsiteCredentialItem[]) => void;
  isOpenDefault?: boolean;
  isAddingExternal?: boolean;
  onCloseAddingExternal?: () => void;
}

export const DevWebsitesCredentialsSection: React.FC<DevWebsitesCredentialsSectionProps> = ({
  devWebsites,
  onChange,
  isOpenDefault = true,
  isAddingExternal = false,
  onCloseAddingExternal,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isOpenDefault);
  const [internalAddingSite, setInternalAddingSite] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  const isAddingSite = isAddingExternal || internalAddingSite;

  // Form State
  const [serviceName, setServiceName] = useState('');
  const [url, setUrl] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [passwordOrToken, setPasswordOrToken] = useState('');
  const [notes, setNotes] = useState('');

  // Visible masked states & copy states
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedType, setCopiedType] = useState<{ id: string; field: 'email' | 'password' } | null>(null);

  const closeSiteForm = () => {
    setInternalAddingSite(false);
    setEditingSiteId(null);
    setServiceName('');
    setUrl('');
    setEmailOrUsername('');
    setPasswordOrToken('');
    setNotes('');
    if (onCloseAddingExternal) onCloseAddingExternal();
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, field: 'email' | 'password', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType({ id, field });
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleStartAdd = () => {
    setEditingSiteId(null);
    setServiceName('');
    setUrl('');
    setEmailOrUsername('');
    setPasswordOrToken('');
    setNotes('');
    setInternalAddingSite(true);
    setIsSectionOpen(true);
  };

  const handleStartEdit = (item: DevWebsiteCredentialItem) => {
    setEditingSiteId(item.id);
    setServiceName(item.serviceName);
    setUrl(item.url);
    setEmailOrUsername(item.emailOrUsername || '');
    setPasswordOrToken(item.passwordOrToken || '');
    setNotes(item.notes || '');
    setInternalAddingSite(true);
    setIsSectionOpen(true);
  };

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (editingSiteId) {
      onChange(
        devWebsites.map((s) =>
          s.id === editingSiteId
            ? {
                ...s,
                serviceName: serviceName.trim(),
                url: cleanUrl,
                emailOrUsername: emailOrUsername.trim() || undefined,
                passwordOrToken: passwordOrToken.trim() || undefined,
                notes: notes.trim() || undefined,
              }
            : s
        )
      );
    } else {
      const newItem: DevWebsiteCredentialItem = {
        id: `site-${Date.now()}`,
        serviceName: serviceName.trim(),
        url: cleanUrl,
        emailOrUsername: emailOrUsername.trim() || undefined,
        passwordOrToken: passwordOrToken.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      onChange([...devWebsites, newItem]);
    }

    closeSiteForm();
  };

  const handleDeleteSite = (id: string) => {
    onChange(devWebsites.filter((s) => s.id !== id));
  };

  const quickPortals = [
    { name: 'Supabase', url: 'https://supabase.com/dashboard' },
    { name: 'AWS Console', url: 'https://console.aws.amazon.com' },
    { name: 'Vercel', url: 'https://vercel.com/dashboard' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Figma', url: 'https://figma.com' },
    { name: 'Stripe', url: 'https://dashboard.stripe.com' },
  ];

  const handleQuickPortal = (p: typeof quickPortals[0]) => {
    setServiceName(p.name);
    setUrl(p.url);
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
      {/* Header */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full px-3 sm:px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>Websites & Portals</span>
              {devWebsites.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 shrink-0">
                  {devWebsites.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden xs:block">
              Dev portals, admin links, and project credentials
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
            <span className="whitespace-nowrap">Add Portal</span>
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
          {isAddingSite && (
            <form
              onSubmit={handleSaveSite}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  {editingSiteId ? 'Edit Website & Credentials' : 'New Website & Credentials'}
                </span>
                <button
                  type="button"
                  onClick={closeSiteForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Portals */}
              {!editingSiteId && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">Quick:</span>
                  {quickPortals.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPortal(p)}
                      className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-medium shrink-0 cursor-pointer transition border border-blue-200/60"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    SERVICE / WEBSITE NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Supabase Dashboard, AWS Console..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    WEBSITE URL
                  </label>
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    LOGIN EMAIL / USERNAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="developer@example.com / admin"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    LOGIN PASSWORD / TOKEN (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={passwordOrToken}
                    onChange={(e) => setPasswordOrToken(e.target.value)}
                    placeholder="Password / Secret Token"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes / 2FA instructions..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeSiteForm}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
                >
                  {editingSiteId ? 'Save Changes' : 'Save Website & Login'}
                </button>
              </div>
            </form>
          )}

          {/* List of Websites */}
          {devWebsites.length > 0 ? (
            <div className="space-y-2.5">
              {devWebsites.map((item) => {
                const isRevealed = revealedIds[item.id];
                const isCopiedEmail = copiedType?.id === item.id && copiedType?.field === 'email';
                const isCopiedPass = copiedType?.id === item.id && copiedType?.field === 'password';

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.serviceName}
                        </span>
                      </div>

                      {/* Top Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-blue-200/60"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Link</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSite(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-mono truncate mb-2 select-all">
                      {item.url}
                    </div>

                    {/* Login Credentials Sub-Block */}
                    {(item.emailOrUsername || item.passwordOrToken) && (
                      <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.emailOrUsername && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Login / Email</span>
                                <span className="text-xs font-medium text-slate-800 truncate block select-all">
                                  {item.emailOrUsername}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id, 'email', item.emailOrUsername!)}
                              className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer shrink-0 ${
                                isCopiedEmail ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-200 text-slate-600'
                              }`}
                              title="Copy Email"
                            >
                              {isCopiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}

                        {item.passwordOrToken && (
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Password / Token</span>
                                <span className="text-xs font-mono text-slate-800 truncate block select-all">
                                  {isRevealed ? item.passwordOrToken : '••••••••••••'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => toggleReveal(item.id)}
                                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-md cursor-pointer"
                                title={isRevealed ? 'Hide' : 'Reveal'}
                              >
                                {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(item.id, 'password', item.passwordOrToken!)}
                                className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                                  isCopiedPass ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-200 text-slate-600'
                                }`}
                                title="Copy Password"
                              >
                                {isCopiedPass ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 mt-2 px-0.5">{item.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingSite && (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No important websites or logins saved yet.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="mt-1.5 text-xs text-blue-700 hover:text-blue-800 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Website & Credentials</span>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
