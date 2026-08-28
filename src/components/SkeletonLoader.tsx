import React from 'react';

export const SkeletonNotesLoader: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Category Chips Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="h-8 w-16 bg-slate-200/80 rounded-full shrink-0" />
        <div className="h-8 w-24 bg-slate-200/80 rounded-full shrink-0" />
        <div className="h-8 w-28 bg-slate-200/80 rounded-full shrink-0" />
        <div className="h-8 w-20 bg-slate-200/80 rounded-full shrink-0" />
        <div className="h-8 w-24 bg-slate-200/80 rounded-full shrink-0" />
      </div>

      {/* 2-Column Masonry Notes Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Skeleton Card 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-4 w-4 bg-slate-200 rounded-full" />
          </div>
          <div className="h-5 w-3/4 bg-slate-200 rounded-md" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3.5 w-5/6 bg-slate-100 rounded" />
            <div className="h-3.5 w-2/3 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Skeleton Card 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 bg-slate-200 rounded-full" />
          </div>
          <div className="h-5 w-2/3 bg-slate-200 rounded-md" />
          <div className="h-24 w-full bg-slate-100 rounded-xl" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Skeleton Card 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-18 bg-slate-200 rounded-full" />
          </div>
          <div className="h-5 w-4/5 bg-slate-200 rounded-md" />
          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 rounded-full shrink-0" />
              <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-slate-200 rounded-full shrink-0" />
              <div className="h-3.5 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-16 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Skeleton Card 4 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 bg-slate-200 rounded-full" />
            <div className="h-4 w-4 bg-slate-200 rounded-full" />
          </div>
          <div className="h-5 w-3/5 bg-slate-200 rounded-md" />
          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full bg-slate-100 rounded" />
            <div className="h-3.5 w-11/12 bg-slate-100 rounded" />
            <div className="h-3.5 w-4/6 bg-slate-100 rounded" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <div className="h-3 w-14 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
