import React, { useState, useEffect } from 'react';
import { AdSlide } from '../types';
import { ChevronLeft, ChevronRight, Sparkles, ArrowUpRight } from 'lucide-react';

interface AdsBannerProps {
  slides: AdSlide[];
}

export const AdsBanner: React.FC<AdsBannerProps> = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const currentSlide = slides[currentIndex] || {
    id: 'default',
    tag: 'BUILDER KIT',
    title: 'Ads',
    description: 'Roadmaps, kanban boards, sprints, bug reports and launch checklists to plan, build and launch.',
    ctaText: 'Explore Build Mod',
  };

  return (
    <div className="w-full">
      {/* Clean Gradient Banner Card */}
      <div
        id="ads-banner-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-4 sm:p-5 flex items-center justify-between shadow-[0_4px_20px_rgba(91,134,229,0.2)] overflow-hidden transition-all group min-h-[140px]"
      >
        {/* Soft decorative background glows */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute left-1/3 -top-8 w-28 h-28 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

        {/* Left Content Area */}
        <div className="relative z-10 flex flex-col items-start max-w-[70%] sm:max-w-[75%]">
          <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase mb-1.5 border border-white/20">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{currentSlide.tag || 'FEATURED'}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
            {currentSlide.title}
          </h2>

          <p className="text-[11px] sm:text-xs text-blue-100 font-normal mt-1 line-clamp-2 leading-relaxed">
            {currentSlide.description}
          </p>

          {currentSlide.ctaText && (
            <button
              onClick={() => {}}
              className="mt-3 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-slate-900 bg-white hover:bg-blue-50 px-3 py-1 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>{currentSlide.ctaText}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Icon Illustration */}
        <div className="relative z-10 shrink-0 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
          <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-amber-300 animate-pulse" />
        </div>

        {/* Carousel arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  prev === 0 ? slides.length - 1 : prev - 1
                )
              }
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
              title="Previous"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev + 1) % slides.length)
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
              title="Next"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-200 rounded-full cursor-pointer ${
                currentIndex === idx
                  ? 'w-5 h-1.5 bg-[#5B86E5]'
                  : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
