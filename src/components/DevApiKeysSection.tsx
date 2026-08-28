import React, { useState } from 'react';
import { ApiKeyItem } from '../types';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  ChevronDown,
  ChevronUp,
  Shield,
  Edit2,
  X,
} from 'lucide-react';

interface DevApiKeysSectionProps {
  apiKeys: ApiKeyItem[];
  onChange: (keys: ApiKeyItem[]) => void;
  isOpenDefault?: boolean;
  isAddingExternal?: boolean;
  onCloseAddingExternal?: () => void;
}

export const DevApiKeysSection: React.FC<DevApiKeysSectionProps> = ({
  apiKeys,
  onChange,
  isOpenDefault = true,
  isAddingExternal = false,
  onCloseAddingExternal,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isOpenDefault);
  const [internalAddingKey, setInternalAddingKey] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);

  // Synchronize external add trigger
  const isAddingKey = isAddingExternal || internalAddingKey;

  const closeKeyForm = () => {
    setInternalAddingKey(false);
    setEditingKeyId(null);
    setKeyName('');
    setKeyValue('');
    setNotes('');
    if (onCloseAddingExternal) onCloseAddingExternal();
  };

  // Form State
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production' | 'test'>('development');
  const [notes, setNotes] = useState('');

  // Visible masked states
  const [revealedKeyIds, setRevealedKeyIds] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedKeyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleStartAdd = () => {
    setEditingKeyId(null);
    setKeyName('');
    setKeyValue('');
    setEnvironment('development');
    setNotes('');
    setInternalAddingKey(true);
    setIsSectionOpen(true);
  };

  const handleStartEdit = (item: ApiKeyItem) => {
    setEditingKeyId(item.id);
    setKeyName(item.name);
    setKeyValue(item.value);
    setEnvironment(item.environment || 'development');
    setNotes(item.notes || '');
    setInternalAddingKey(true);
    setIsSectionOpen(true);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim() || !keyValue.trim()) return;

    if (editingKeyId) {
      // Update existing
      onChange(
        apiKeys.map((k) =>
          k.id === editingKeyId
            ? {
                ...k,
                name: keyName.trim().toUpperCase().replace(/\s+/g, '_'),
                value: keyValue.trim(),
                environment,
                notes: notes.trim() || undefined,
              }
            : k
        )
      );
    } else {
      // Create new
      const newItem: ApiKeyItem = {
        id: `key-${Date.now()}`,
        name: keyName.trim().toUpperCase().replace(/\s+/g, '_'),
        value: keyValue.trim(),
        environment,
        notes: notes.trim() || undefined,
      };
      onChange([...apiKeys, newItem]);
    }

    closeKeyForm();
  };

  const handleDeleteKey = (id: string) => {
    onChange(apiKeys.filter((k) => k.id !== id));
  };

  const envColorMap: Record<string, string> = {
    development: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    staging: 'bg-amber-50 text-amber-700 border-amber-200',
    production: 'bg-rose-50 text-rose-700 border-rose-200',
    test: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
      {/* Header Bar */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full px-3 sm:px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <Key className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>API Keys & Secrets</span>
              {apiKeys.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                  {apiKeys.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden xs:block">
              Store & quick-copy credentials, tokens, and service keys
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
            <span className="whitespace-nowrap">Add Key</span>
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

      {/* Body Content */}
      {isSectionOpen && (
        <div className="p-3 sm:p-4 space-y-3">
          {/* Add / Edit Form */}
          {isAddingKey && (
            <form
              onSubmit={handleSaveKey}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  {editingKeyId ? 'Edit API Key' : 'New API Key Block'}
                </span>
                <button
                  type="button"
                  onClick={closeKeyForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    KEY / SERVICE NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. OPENAI_API_KEY, STRIPE_SECRET"
                    className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                    ENVIRONMENT
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-800"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                    <option value="test">Test</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  API KEY SECRET VALUE
                </label>
                <input
                  type="text"
                  required
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes / usage info..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeKeyForm}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
                >
                  {editingKeyId ? 'Save Changes' : 'Save Key Block'}
                </button>
              </div>
            </form>
          )}

          {/* List of Saved API Keys */}
          {apiKeys.length > 0 ? (
            <div className="space-y-2">
              {apiKeys.map((item) => {
                const isRevealed = revealedKeyIds[item.id];
                const isCopied = copiedKeyId === item.id;
                const env = item.environment || 'development';

                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="text-xs font-mono font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md border font-medium uppercase tracking-wider ${
                            envColorMap[env] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {env}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {/* Copy Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.value)}
                          className={`px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title="Copy API Key"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteKey(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Value Field with Mask toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                      <div className="flex-1 font-mono text-xs text-slate-800 truncate select-all">
                        {isRevealed ? (
                          item.value
                        ) : (
                          <span className="tracking-widest text-slate-400 font-bold">
                            ••••••••••••••••••••••••••••••••
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleReveal(item.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer shrink-0"
                        title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-slate-500 mt-1.5 px-0.5">{item.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            !isAddingKey && (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No API keys saved yet in this note.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="mt-1.5 text-xs text-amber-700 hover:text-amber-800 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First API Key</span>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
