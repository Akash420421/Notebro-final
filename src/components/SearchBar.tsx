import React, { useState } from 'react';
import { Search, X, Check, Filter, SlidersHorizontal } from 'lucide-react';
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
      {/* Exact Pill-Shaped Search Input with Blue Circular Filter Button */}
      <div className="flex items-center bg-white border border-slate-200/90 focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/10 rounded-full px-4 py-2 sm:py-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
        <input
          id="main-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects, notes, tags..."
          className="w-full bg-transparent border-none outline-none text-slate-800 text-xs sm:text-sm placeholder-slate-400 font-normal pr-2"
        />

        {searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => onSearchChange('')}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer mr-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Circular Blue Action Filter Button */}
        <button
          id="toggle-filter-menu-btn"
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-xs active:scale-95 ${
            showFilterMenu || selectedTag || selectedMode !== 'all'
              ? 'bg-[#1D4ED8] text-white ring-2 ring-blue-200'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
          }`}
          title="Filter categories & modes"
        >
          <SlidersHorizontal className="w-4 h-4 text-white stroke-[2.4]" />
        </button>
      </div>

      {/* Filter Dropdown Drawer */}
      {showFilterMenu && (
        <div className="absolute left-0 right-0 top-14 z-30 bg-white/98 backdrop-blur-md border border-slate-200 rounded-3xl shadow-[0_12px_36px_rgba(0,0,0,0.1)] p-4 transition-all animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 tracking-tight">
              <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
              Filter & Sort
            </div>
            <button
              onClick={() => setShowFilterMenu(false)}
              className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter by Mode */}
          <div className="mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Filter by Mode:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => {
                  onSelectMode('all');
                  setShowFilterMenu(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition cursor-pointer text-left ${
                  selectedMode === 'all'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#EAF1FB]/60 text-slate-700 hover:bg-[#EAF1FB] border border-[#D4E4FA]/60'
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
                  className={`px-3 py-1.5 text-xs rounded-xl font-semibold capitalize transition cursor-pointer text-left ${
                    selectedMode === m
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {m === 'normal' ? 'Normal' : m} Mod
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Tag */}
          {availableTags.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Filter by Tag:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <button
                  onClick={() => onSelectTag(null)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition cursor-pointer ${
                    selectedTag === null
                      ? 'bg-[#2563EB] text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Tags
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition flex items-center gap-1 cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-[#2563EB] text-white font-medium'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
