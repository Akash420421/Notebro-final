import React, { useState } from 'react';
import { Search, X, Check, SlidersHorizontal } from 'lucide-react';
import { AppMode } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMode: AppMode | 'all';
  onSelectMode: (mode: AppMode | 'all') => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  availableTags: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedMode,
  onSelectMode,
  selectedTag,
  onSelectTag,
  availableTags,
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  return (
    <div className="relative w-full">
      {/* Clean, Refined Search Input */}
      <div className="flex items-center bg-white border border-neutral-200 focus-within:border-neutral-900 rounded-xl px-3.5 py-2 shadow-2xs transition-all">
        <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
        <input
          id="main-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes, projects, resources..."
          className="w-full bg-transparent border-none outline-none text-neutral-800 text-xs sm:text-sm placeholder-neutral-400 font-normal pr-2"
        />

        {searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => onSearchChange('')}
            className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          id="toggle-filter-menu-btn"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
            showFilterMenu || selectedTag || selectedMode !== 'all'
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
          title="Filter and sort"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* Filter Menu Dropdown */}
      {showFilterMenu && (
        <div className="absolute left-0 right-0 top-12 z-30 bg-white border border-neutral-200 rounded-xl shadow-xl p-4 transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-3">
            <span className="text-xs font-semibold text-neutral-900">
              Filter Options
            </span>
            <button
              onClick={() => setShowFilterMenu(false)}
              className="text-neutral-400 hover:text-neutral-700 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter by Mode */}
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Mode
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onSelectMode('all');
                  setShowFilterMenu(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer text-left ${
                  selectedMode === 'all'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                }`}
              >
                All Modes
              </button>
              {(['normal', 'student', 'developer'] as AppMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onSelectMode(m);
                    setShowFilterMenu(false);
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium capitalize transition cursor-pointer text-left ${
                    selectedMode === m
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200/80'
                  }`}
                >
                  {m} Mode
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Tag */}
          {availableTags.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block mb-1.5">
                Tag
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  onClick={() => onSelectTag(null)}
                  className={`px-2.5 py-1 text-xs rounded-md transition cursor-pointer ${
                    selectedTag === null
                      ? 'bg-neutral-900 text-white font-medium'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All Tags
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 text-xs rounded-md transition flex items-center gap-1 cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    #{tag}
                    {selectedTag === tag && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
