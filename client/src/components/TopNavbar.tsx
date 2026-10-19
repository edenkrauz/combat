import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Menu,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import combatEmblem from '../assets/combat-emblem.png';

export type OperationalMode = 'real' | 'drill';

interface TopNavbarProps {
  mode?: OperationalMode;
  onModeChange?: (mode: OperationalMode) => void;
  currentSector?: string;
}

const HEBREW_DAYS = [
  'יום ראשון',
  'יום שני',
  'יום שלישי',
  'יום רביעי',
  'יום חמישי',
  'יום שישי',
  'שבת',
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode = 'real',
  onModeChange,
  currentSector = 'מרכז',
}) => {
  // Live ticking clock and current date
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const dayName = HEBREW_DAYS[currentDateTime.getDay()];
  const dayNum = String(currentDateTime.getDate()).padStart(2, '0');
  const monthNum = String(currentDateTime.getMonth() + 1).padStart(2, '0');
  const yearNum = currentDateTime.getFullYear();
  const formattedDate = `${dayName}, ${dayNum}.${monthNum}.${yearNum}`;

  const hours = String(currentDateTime.getHours()).padStart(2, '0');
  const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}:${seconds}`;

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header
      className="w-full bg-white border-b border-slate-200 border-t-2 border-t-[#b91c1c] shadow-2xs select-none sticky top-0 z-50 transition-colors dark:bg-slate-900 dark:border-b-slate-800"
      dir="rtl"
    >
      <div className="h-12 px-3.5 flex items-center justify-between gap-3">
        
        {/* Right Section: Logo, Title, Divider & Sector Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Logo with Emblem & Title */}
          <div className="flex items-center gap-2">
            <img
              src={combatEmblem}
              alt="קומבט"
              className="h-8 w-auto object-contain shrink-0 drop-shadow-2xs"
            />
            <div className="flex flex-col text-right leading-none">
              <span className="text-[16px] font-extrabold text-slate-900 tracking-tight dark:text-white">
                קומבט
              </span>
              <span className="text-[10px] font-medium text-slate-500 mt-0.5 dark:text-slate-400">
                ניהול לחימה
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-5 w-px bg-slate-300 mx-1 shrink-0 dark:bg-slate-700" />

          {/* Sector Badge / Pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition hover:border-slate-300 whitespace-nowrap dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-750"
            title="גזרה"
            aria-label="גזרה"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 dark:text-slate-400" />
            <span>{currentSector}</span>
          </button>
        </div>

        {/* Center Section: Live Date & Clock Container */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center gap-2 px-3 py-1 border border-slate-200/90 rounded-lg bg-white shadow-2xs text-xs text-slate-800 whitespace-nowrap dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
            {/* In RTL: Date on right, Clock on left */}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formattedDate}
            </span>
            <span className="text-slate-300 font-light select-none dark:text-slate-600">|</span>
            <span className="font-bold text-slate-900 font-mono tracking-wider tabular-nums dark:text-white">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Left Section: Nav items, Mode Toggle, User, Dark Mode */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Navigation Action 1: Checklist Templates */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-lg transition cursor-pointer whitespace-nowrap dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800"
            title="תבניות צ'קליסט"
          >
            <Menu className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
            <span>תבניות צ'קליסט</span>
          </button>

          {/* Navigation Action 2: Audit Log */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-lg transition cursor-pointer whitespace-nowrap dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800"
            title="יומן ביקורת"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
            <span>יומן ביקורת</span>
          </button>

          {/* Mode Switcher: אמת / תרגיל */}
          <div className="bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 flex items-center gap-0.5 shadow-2xs dark:bg-slate-800 dark:border-slate-700 shrink-0">
            {/* Real / Operational Mode (Right) */}
            <button
              type="button"
              onClick={() => onModeChange?.('real')}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                mode === 'real'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] shrink-0" />
              <span>אמת</span>
            </button>

            {/* Drill / Exercise Mode (Left) */}
            <button
              type="button"
              onClick={() => onModeChange?.('drill')}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                mode === 'drill'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                  : 'text-slate-600 hover:text-slate-900 font-medium dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0" />
              <span>תרגיל</span>
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="h-5 w-px bg-slate-300 mx-1 shrink-0 dark:bg-slate-700" />

          {/* User Profile Pill */}
          <button
            type="button"
            className="flex items-center gap-1 px-1.5 py-1 text-xs font-semibold text-slate-800 hover:text-slate-950 hover:bg-slate-100/70 rounded-lg transition cursor-pointer whitespace-nowrap dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800"
            title="משתמש"
            aria-label="משתמש"
          >
            <span>ד. כהן</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 dark:text-slate-400" />
          </button>

          {/* Theme Toggle Button (Moon / Sun) */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-750"
            title={isDarkMode ? 'מעבר למצב יום' : 'מעבר למצב לילה'}
            aria-label="החלף מצב תצוגה"
          >
            {isDarkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
