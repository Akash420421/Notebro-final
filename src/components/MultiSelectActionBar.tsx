import React, { useState } from 'react';
import { FolderItem } from '../types';
import { Trash2, Pin, Folder, X, Check, ChevronUp, Archive } from 'lucide-react';

interface MultiSelectActionBarProps {
  selectedCount: number;
  allPinned: boolean;
  folders: FolderItem[];
  onTogglePinSelected: () => void;
  onArchiveSelected?: () => void;
  onDeleteSelected: () => void;
  onMoveSelectedToFolder: (folderId: string | undefined) => void;
  onCancel: () => void;
}

export const MultiSelectActionBar: React.FC<MultiSelectActionBarProps> = ({
  selectedCount,
  allPinned,
  folders,
  onTogglePinSelected,
  onArchiveSelected,
  onDeleteSelected,
  onMoveSelectedToFolder,
  onCancel,
}) => {
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md bg-slate-900/95 text-white px-4 py-2.5 rounded-[24px] shadow-[0_12px_36px_rgba(0,0,0,0.25)] backdrop-blur-md flex items-center justify-between gap-2 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Left: Count & Close */}
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-slate-200">
          {selectedCount} selected
        </span>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1 relative">
        {/* Pin / Unpin */}
        <button
          onClick={onTogglePinSelected}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
          title={allPinned ? 'Unpin selected' : 'Pin selected'}
        >
          <Pin className={`w-3.5 h-3.5 ${allPinned ? 'fill-[#5B86E5] text-[#5B86E5]' : ''}`} />
          <span className="hidden sm:inline">{allPinned ? 'Unpin' : 'Pin'}</span>
        </button>

        {/* Archive */}
        {onArchiveSelected && (
          <button
            onClick={onArchiveSelected}
            className="px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
            title="Archive selected notes"
          >
            <Archive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Archive</span>
          </button>
        )}

        {/* Move to Folder */}
        <div className="relative">
          <button
            onClick={() => setShowFolderMenu(!showFolderMenu)}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Folder className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Move</span>
            <ChevronUp className="w-3 h-3 text-slate-400" />
          </button>

          {/* Folder Menu */}
          {showFolderMenu && (
            <div className="absolute bottom-11 right-0 w-44 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50 text-white animate-in fade-in zoom-in-95">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Move to Folder
              </span>
              <button
                onClick={() => {
                  onMoveSelectedToFolder(undefined);
                  setShowFolderMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-800 flex items-center justify-between"
              >
                <span>Uncategorised</span>
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveSelectedToFolder(f.id);
                    setShowFolderMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-slate-800 flex items-center justify-between"
                >
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          className="px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-xl transition flex items-center gap-1 cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>
    </div>
  );
};
