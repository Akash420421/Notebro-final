import React, { useState } from 'react';
import { DevVideoResourceItem } from '../types';
import {
  Video,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';

interface DevVideoResourcesSectionProps {
  devVideos: DevVideoResourceItem[];
  onChange: (videos: DevVideoResourceItem[]) => void;
  isOpenDefault?: boolean;
  isAddingExternal?: boolean;
  onCloseAddingExternal?: () => void;
}

export const DevVideoResourcesSection: React.FC<DevVideoResourcesSectionProps> = ({
  devVideos,
  onChange,
  isOpenDefault = true,
  isAddingExternal = false,
  onCloseAddingExternal,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(isOpenDefault);
  const [internalAddingVideo, setInternalAddingVideo] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  const isAddingVideo = isAddingExternal || internalAddingVideo;

  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const closeVideoForm = () => {
    setInternalAddingVideo(false);
    setEditingVideoId(null);
    setTitle('');
    setUrl('');
    setNotes('');
    if (onCloseAddingExternal) onCloseAddingExternal();
  };

  const extractYoutubeId = (linkUrl: string): string | undefined => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = linkUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : undefined;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartAdd = () => {
    setEditingVideoId(null);
    setTitle('');
    setUrl('');
    setNotes('');
    setInternalAddingVideo(true);
    setIsSectionOpen(true);
  };

  const handleStartEdit = (item: DevVideoResourceItem) => {
    setEditingVideoId(item.id);
    setTitle(item.title);
    setUrl(item.url);
    setNotes(item.notes || '');
    setInternalAddingVideo(true);
    setIsSectionOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    const videoId = extractYoutubeId(cleanUrl);

    if (editingVideoId) {
      onChange(
        devVideos.map((v) =>
          v.id === editingVideoId
            ? {
                ...v,
                title: title.trim(),
                url: cleanUrl,
                videoId,
                notes: notes.trim() || undefined,
              }
            : v
        )
      );
    } else {
      const newItem: DevVideoResourceItem = {
        id: `video-${Date.now()}`,
        title: title.trim(),
        url: cleanUrl,
        videoId,
        notes: notes.trim() || undefined,
      };
      onChange([...devVideos, newItem]);
    }

    closeVideoForm();
  };

  const handleDeleteVideo = (id: string) => {
    onChange(devVideos.filter((v) => v.id !== id));
  };

  return (
    <div className="w-full my-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
      {/* Header */}
      <div
        onClick={() => setIsSectionOpen(!isSectionOpen)}
        className="w-full px-3 sm:px-3.5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition select-none gap-2"
      >
        <div className="flex items-center gap-2 min-w-0 pr-1 flex-1">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-700 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span>Videos & Architecture</span>
              {devVideos.length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 shrink-0">
                  {devVideos.length}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate hidden xs:block">
              Architecture tutorials, conference talks, and demos
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
            <span className="whitespace-nowrap">Add Video</span>
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
          {isAddingVideo && (
            <form
              onSubmit={handleSaveVideo}
              className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-600" />
                  {editingVideoId ? 'Edit Video Link' : 'New Video Resource'}
                </span>
                <button
                  type="button"
                  onClick={closeVideoForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  VIDEO TITLE / TOPIC
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Next.js 15 Server Actions Deep Dive, PostgreSQL Indexing..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  VIDEO URL (YOUTUBE / LOOM / WEB)
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-900 font-mono"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional timestamps or key takeaways..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-400 focus:bg-white text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeVideoForm}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-lg font-bold cursor-pointer transition shadow-2xs"
                >
                  {editingVideoId ? 'Save Changes' : 'Save Video'}
                </button>
              </div>
            </form>
          )}

          {/* List of Videos */}
          {devVideos.length > 0 ? (
            <div className="space-y-3">
              {devVideos.map((item) => {
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {item.title}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-rose-200/60"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Watch</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.url)}
                          className={`p-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                            isCopied ? 'bg-emerald-100 text-emerald-800' : 'hover:bg-slate-100 text-slate-600'
                          }`}
                          title="Copy Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

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
                          onClick={() => handleDeleteVideo(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Embedded YouTube preview if available */}
                    {item.videoId && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 aspect-video max-w-sm bg-black">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube-nocookie.com/embed/${item.videoId}`}
                          title={item.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
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
            !isAddingVideo && (
              <div className="text-center py-4 bg-white/60 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No tutorial or video links saved yet.</p>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="mt-1.5 text-xs text-rose-700 hover:text-rose-800 font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Video Link</span>
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
