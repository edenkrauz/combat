import React from 'react';
import type { OperationalMode } from './TopNavbar';

interface OperationalBannerProps {
  mode: OperationalMode;
}

export const OperationalBanner: React.FC<OperationalBannerProps> = ({ mode }) => {
  const isReal = mode === 'real';

  return (
    <div
      className={`w-full py-1 px-4 flex items-center justify-center gap-2 text-[12.5px] font-semibold border-b transition-colors select-none ${
        isReal
          ? 'bg-[#fce8e8] text-[#9b2121] border-[#f9d2d2] dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50'
          : 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50'
      }`}
      dir="rtl"
    >
      {/* Concentric circles target bullseye icon */}
      <svg
        className={`w-4 h-4 shrink-0 ${isReal ? 'text-[#9b2121] dark:text-red-400' : 'text-[#92400e] dark:text-amber-400'}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>

      <span>
        {isReal
          ? 'מצב אמת • מוצגים אירועי אמת בלבד'
          : 'מצב תרגיל • מוצגים אירועי תרגיל בלבד'}
      </span>
    </div>
  );
};
