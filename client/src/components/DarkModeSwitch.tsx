import React, { useEffect, useState } from 'react';

interface DarkModeSwitchProps {
  className?: string;
}

export const DarkModeSwitch: React.FC<DarkModeSwitchProps> = ({ className = '' }) => {
  // Initialize state from localStorage or system preference
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('combat_theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Keep DOM class and localStorage in sync
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('combat_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('combat_theme', 'light');
    }
  }, [isDark]);

  const toggle = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <button
      type="button"
      role="switch"
      dir="ltr"
      aria-checked={isDark}
      onClick={toggle}
      title={isDark ? 'מעבר למצב יום (Light Mode)' : 'מעבר למצב לילה (Dark Mode)'}
      aria-label="החלף בין מצב יום למצב לילה"
      className={`group relative inline-block h-7 w-[58px] shrink-0 cursor-pointer rounded-full transition-all duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        isDark
          ? 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.7),0_0_10px_rgba(99,102,241,0.3)]'
          : 'bg-gradient-to-r from-sky-400 via-sky-300 to-amber-200 border border-sky-300/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1),0_0_10px_rgba(251,191,36,0.35)]'
      } ${className}`}
    >
      {/* Track Background Elements (Celestial backdrop clipped within pill) */}
      <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        {/* DAY SCENE: Floating Soft Clouds (Left side, visible in day mode) */}
        <span
          className={`absolute inset-0 transition-opacity duration-500 ${
            isDark ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
          }`}
        >
          {/* Cloud cluster on left */}
          <span className="absolute -bottom-1 left-2 w-4 h-4 rounded-full bg-white/80 blur-[0.3px]" />
          <span className="absolute -bottom-1.5 left-4 w-3.5 h-3.5 rounded-full bg-white/70 blur-[0.3px]" />
          <span className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-white/60" />
        </span>

        {/* NIGHT SCENE: Twinkling Stars (Right side, visible in night mode) */}
        <span
          className={`absolute inset-0 transition-opacity duration-500 ${
            isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          {/* 4-pointed Diamond Star on right */}
          <svg
            className="absolute top-1.5 right-2.5 w-2 h-2 text-indigo-200 animate-pulse"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0L14 9L23 12L14 15L12 24L10 15L1 12L10 9Z" />
          </svg>

          {/* Glowing dot star */}
          <span className="absolute bottom-1.5 right-5 w-1 h-1 rounded-full bg-cyan-200 shadow-[0_0_4px_#a5f3fc]" />

          {/* Micro twinkle */}
          <span className="absolute top-3 right-8 w-0.5 h-0.5 rounded-full bg-white/90" />
        </span>
      </span>

      {/* The Animated Celestial Sliding Thumb (Absolute, exact coordinates) */}
      <span
        style={{
          transform: isDark ? 'translateX(0px)' : 'translateX(30px)',
        }}
        className={`absolute top-[3px] left-[3px] z-10 flex items-center justify-center w-[22px] h-[22px] rounded-full transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isDark
            ? 'bg-gradient-to-tr from-slate-200 via-slate-100 to-slate-300 shadow-[0_0_10px_rgba(165,180,252,0.85),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-slate-300 group-hover:scale-105'
            : 'bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.95),inset_0_1px_2px_rgba(255,255,255,0.9)] border border-amber-300 group-hover:scale-105'
        }`}
      >
        {isDark ? (
          /* Detailed Cratered Moon (In Dark Mode, sits on the LEFT) */
          <span className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden">
            {/* Crater 1 */}
            <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-300/90 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.25)]" />
            {/* Crater 2 */}
            <span className="absolute bottom-1 right-1.5 w-1 h-1 rounded-full bg-slate-300/80 shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.2)]" />
            {/* Crater 3 */}
            <span className="absolute top-2.5 right-1 w-0.5 h-0.5 rounded-full bg-slate-300/70" />
          </span>
        ) : (
          /* Radiant Sun with rotating rays (In Light Mode, slides to the RIGHT) */
          <span className="relative w-full h-full flex items-center justify-center">
            {/* Sun flare ping */}
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/20 animate-ping absolute" />
            {/* Corona SVG */}
            <svg
              className="w-3.5 h-3.5 text-amber-900/60 transition-transform duration-700 group-hover:rotate-45"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="1" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
              <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
            </svg>
          </span>
        )}
      </span>
    </button>
  );
};
