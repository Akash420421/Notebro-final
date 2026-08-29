import React from 'react';
import { FolderItem } from '../types';

interface FolderChipsProps {
  folders: FolderItem[];
  selectedFolderId: string | 'all' | 'uncategorised' | 'archived';
  onSelectFolder: (folderId: string | 'all' | 'uncategorised' | 'archived') => void;
  onCreateFolder?: (name: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  folderCounts?: Record<string, number>;
}

export const FolderChips: React.FC<FolderChipsProps> = ({
  folders = [],
  selectedFolderId,
  onSelectFolder,
  folderCounts = {},
}) => {
  const allCount = folderCounts['all'] ?? 0;
  const uncategorisedCount = folderCounts['uncategorised'] ?? 0;

  // Filter folders: only show folders with at least 1 note
  const visibleFolders = folders.filter((folder) => {
    const count = folderCounts[folder.id] || 0;
    return count > 0;
  });

  return (
    <div className="w-full">
      {/* Horizontal row, flex-start, left aligned, gap: 8px, overflow-x: auto, no wrap */}
      <div className="flex items-center justify-start gap-2 overflow-x-auto select-none py-0.5 scrollbar-none smooth-scroll overscroll-contain touch-pan-x">
        {/* 1) 'All' Chip */}
        <button
          type="button"
          id="folder-chip-all"
          onClick={() => onSelectFolder('all')}
          className={`w-max shrink-0 px-3 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
            selectedFolderId === 'all'
              ? 'bg-[#111827] text-white'
              : 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
          }`}
        >
          <span>All</span>
          <span className={selectedFolderId === 'all' ? 'text-slate-300 font-normal' : 'text-[#9CA3AF] font-normal'}>
            {allCount}
          </span>
        </button>

        {/* 2) Visible Folders with count > 0 */}
        {visibleFolders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          const count = folderCounts[folder.id] || 0;

          return (
            <button
              key={folder.id}
              type="button"
              id={`folder-chip-${folder.id}`}
              onClick={() => onSelectFolder(folder.id)}
              className={`w-max shrink-0 px-3 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                isSelected
                  ? 'bg-[#111827] text-white'
                  : 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
              }`}
            >
              {/* Optional 6px color dot only if that folder has a color AND count > 0 */}
              {folder.color && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
              )}
              <span>{folder.name}</span>
              <span className={isSelected ? 'text-slate-300 font-normal' : 'text-[#9CA3AF] font-normal'}>
                {count}
              </span>
            </button>
          );
        })}

        {/* 3) Uncategorised Chip (only if count > 0) */}
        {uncategorisedCount > 0 && (
          <button
            type="button"
            id="folder-chip-uncategorised"
            onClick={() => onSelectFolder('uncategorised')}
            className={`w-max shrink-0 px-3 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
              selectedFolderId === 'uncategorised'
                ? 'bg-[#111827] text-white'
                : 'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#F9FAFB]'
            }`}
          >
            <span>Uncategorised</span>
            <span className={selectedFolderId === 'uncategorised' ? 'text-slate-300 font-normal' : 'text-[#9CA3AF] font-normal'}>
              {uncategorisedCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
