import React, { useState } from 'react';
import { YoutubeLink, WebResourceLink } from '../types';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../utils/youtube';
import {
  Youtube,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Check,
  Video,
  Link2,
} from 'lucide-react';

interface StudentMediaLinksSectionProps {
  youtubeLinks: YoutubeLink[];
  webLinks: WebResourceLink[];
  onUpdateYoutubeLinks: (links: YoutubeLink[]) => void;
  onUpdateWebLinks: (links: WebResourceLink[]) => void;
  isAddingYoutubeExternal?: boolean;
  onCloseAddingYoutubeExternal?: () => void;
  isAddingWebLinkExternal?: boolean;
  onCloseAddingWebLinkExternal?: () => void;
}

export const StudentMediaLinksSection: React.FC<StudentMediaLinksSectionProps> = ({
  youtubeLinks,
  webLinks,
  onUpdateYoutubeLinks,
  onUpdateWebLinks,
  isAddingYoutubeExternal = false,
  onCloseAddingYoutubeExternal,
  isAddingWebLinkExternal = false,
  onCloseAddingWebLinkExternal,
}) => {
  const [internalAddYoutube, setInternalAddYoutube] = useState(false);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [youtubeTitleInput, setYoutubeTitleInput] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

  const [internalAddWebLink, setInternalAddWebLink] = useState(false);
  const [webTitleInput, setWebTitleInput] = useState('');
  const [webUrlInput, setWebUrlInput] = useState('');
  const [webDescInput, setWebDescInput] = useState('');
  const [webError, setWebError] = useState('');

  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const showAddYoutube = isAddingYoutubeExternal || internalAddYoutube;
  const showAddWebLink = isAddingWebLinkExternal || internalAddWebLink;

  const closeYoutubeForm = () => {
    setInternalAddYoutube(false);
    setYoutubeError('');
    if (onCloseAddingYoutubeExternal) onCloseAddingYoutubeExternal();
  };

  const closeWebLinkForm = () => {
    setInternalAddWebLink(false);
    setWebError('');
    if (onCloseAddingWebLinkExternal) onCloseAddingWebLinkExternal();
  };

  // Add YouTube video
  const handleAddYoutube = (e: React.FormEvent) => {
    e.preventDefault();
    setYoutubeError('');

    const videoId = extractYouTubeId(youtubeUrlInput);
    if (!videoId) {
      setYoutubeError('Please enter a valid YouTube video URL or ID.');
      return;
    }

    const newLink: YoutubeLink = {
      id: `yt-${Date.now()}`,
      url: youtubeUrlInput.trim(),
      title: youtubeTitleInput.trim() || `YouTube Lecture #${youtubeLinks.length + 1}`,
      videoId,
    };

    onUpdateYoutubeLinks([...youtubeLinks, newLink]);
    setYoutubeUrlInput('');
    setYoutubeTitleInput('');
    closeYoutubeForm();
  };

  const handleRemoveYoutube = (id: string) => {
    onUpdateYoutubeLinks(youtubeLinks.filter((l) => l.id !== id));
  };

  // Add Web resource link
  const handleAddWebLink = (e: React.FormEvent) => {
    e.preventDefault();
    setWebError('');

    let cleanUrl = webUrlInput.trim();
    if (!cleanUrl) {
      setWebError('Please enter a website URL.');
      return;
    }

    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const newLink: WebResourceLink = {
      id: `web-${Date.now()}`,
      title: webTitleInput.trim() || 'Reference Website',
      url: cleanUrl,
      description: webDescInput.trim() || undefined,
    };

    onUpdateWebLinks([...webLinks, newLink]);
    setWebTitleInput('');
    setWebUrlInput('');
    setWebDescInput('');
    closeWebLinkForm();
  };

  const handleRemoveWebLink = (id: string) => {
    onUpdateWebLinks(webLinks.filter((l) => l.id !== id));
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const hasContent = youtubeLinks.length > 0 || showAddYoutube || webLinks.length > 0 || showAddWebLink;
  if (!hasContent) {
    return null;
  }

  return (
    <div className="my-3 space-y-3">
      {/* 1. YOUTUBE VIDEO LECTURES CONTAINER */}
      {(youtubeLinks.length > 0 || showAddYoutube) && (
        <div className="p-3 sm:p-4 rounded-2xl bg-red-50/50 border border-red-200/70 shadow-2xs space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Youtube className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                  YouTube Lectures
                </h4>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-red-200/80 text-red-900 rounded-full border border-red-300">
                  {youtubeLinks.length}
                </span>
              </div>
            </div>

            {!showAddYoutube && (
              <button
                type="button"
                onClick={() => setInternalAddYoutube(true)}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add Video</span>
              </button>
            )}
          </div>

          {/* Add YouTube Form */}
          {showAddYoutube && (
            <form
              onSubmit={handleAddYoutube}
              className="p-3.5 rounded-xl bg-white border border-red-300 shadow-sm space-y-2.5 animate-in fade-in zoom-in-98 duration-150"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-red-600" />
                Embed YouTube Lecture
              </div>

              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={youtubeUrlInput}
                  onChange={(e) => setYoutubeUrlInput(e.target.value)}
                  placeholder="Paste YouTube link (e.g. https://youtu.be/...)"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
                {youtubeError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">{youtubeError}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={youtubeTitleInput}
                  onChange={(e) => setYoutubeTitleInput(e.target.value)}
                  placeholder="Lecture / Topic title (optional)..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={closeYoutubeForm}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                >
                  Embed Video
                </button>
              </div>
            </form>
          )}

          {/* Embedded YouTube Videos Grid */}
          {youtubeLinks.length > 0 && (
            <div className="space-y-2.5">
              {youtubeLinks.map((yt) => (
                <div
                  key={yt.id}
                  className="rounded-xl bg-white border border-red-200/70 overflow-hidden shadow-2xs group"
                >
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {yt.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={getYouTubeWatchUrl(yt.videoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>YouTube</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveYoutube(yt.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Remove video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      src={getYouTubeEmbedUrl(yt.videoId)}
                      title={yt.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. WEB RESOURCE & REFERENCE LINKS CONTAINER */}
      {(webLinks.length > 0 || showAddWebLink) && (
        <div className="p-3 sm:p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 shadow-2xs space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
                  Web & Study Links
                </h4>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 bg-blue-200/80 text-blue-900 rounded-full border border-blue-300">
                  {webLinks.length}
                </span>
              </div>
            </div>

            {!showAddWebLink && (
              <button
                type="button"
                onClick={() => setInternalAddWebLink(true)}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Add Link</span>
              </button>
            )}
          </div>

          {/* Add Web Link Form */}
          {showAddWebLink && (
            <form
              onSubmit={handleAddWebLink}
              className="p-3.5 rounded-xl bg-white border border-blue-300 shadow-sm space-y-2.5 animate-in fade-in zoom-in-98 duration-150"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                Add Study Reference Link
              </div>

              <div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={webUrlInput}
                  onChange={(e) => setWebUrlInput(e.target.value)}
                  placeholder="Paste URL (e.g. https://wikipedia.org/...)"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
                {webError && (
                  <p className="text-[11px] font-bold text-red-600 mt-1">{webError}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  value={webTitleInput}
                  onChange={(e) => setWebTitleInput(e.target.value)}
                  placeholder="Website title / Reference name..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={closeWebLinkForm}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                >
                  Save Link
                </button>
              </div>
            </form>
          )}

          {/* Web Links List */}
          {webLinks.length > 0 && (
            <div className="space-y-2">
              {webLinks.map((wl) => (
                <div
                  key={wl.id}
                  className="p-2.5 rounded-xl bg-white border border-blue-200/70 hover:border-blue-300 transition shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {wl.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {wl.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(wl.id, wl.url)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
                      title="Copy link"
                    >
                      {copiedLinkId === wl.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={wl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-blue-600 hover:text-blue-800 rounded-md transition cursor-pointer"
                      title="Visit link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveWebLink(wl.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md transition cursor-pointer"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
