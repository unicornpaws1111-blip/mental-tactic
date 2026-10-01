import React from 'react';

export const HeroTransitionDivider: React.FC = () => {
  return (
    <div className="relative w-full py-3 overflow-hidden flex items-center justify-center select-none" aria-hidden="true">
      {/* Background soft ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-12 bg-red-600/10 rounded-full blur-xl" />
      </div>

      {/* Main Hairline Divider with Crimson Glow */}
      <div className="relative w-full max-w-6xl mx-auto px-4 flex items-center justify-center">
        {/* Left Taper */}
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-800 to-red-600/60" />

        {/* Center Minimal Tactical Marker */}
        <div className="relative mx-3 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-ping opacity-75" />
          <span className="w-1 h-1 rounded-full bg-red-600 dark:bg-white" />
          <span className="text-[9px] font-mono tracking-[0.25em] text-neutral-800 dark:text-neutral-300 font-semibold uppercase">
            INTELLIGENCE ARCHIVE
          </span>
          <span className="w-1 h-1 rounded-full bg-red-600 dark:bg-white" />
        </div>

        {/* Right Taper */}
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-neutral-300 dark:via-neutral-800 to-red-600/60" />
      </div>
    </div>
  );
};
