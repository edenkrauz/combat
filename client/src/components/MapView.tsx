import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Globe,
  Sparkles,
  Flame,
  Maximize2,
} from 'lucide-react';

export const MapView: React.FC = () => {
  const [showHeatmap, setShowHeatmap] = useState(true);

  return (
    <div className="relative flex-1 h-[calc(100vh-5.5rem)] rounded-2xl overflow-hidden border border-slate-200/80 bg-[#eaf1f8] select-none dark:border-slate-800 dark:bg-slate-950">
      
      {/* SVG Canvas for Coastline, Land, Sea and Heatmap */}
      <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 1000 650">
        <defs>
          {/* Radial gradient for Heatmap */}
          <radialGradient id="dangerHeatmap" cx="44%" cy="46%" r="35%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#f97316" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#eab308" stopOpacity="0.45" />
            <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>

        {/* Sea (West / Left in map) */}
        <rect width="1000" height="650" fill="#dce9f5" className="dark:fill-[#0c1829]" />

        {/* Land (East / Right in map) */}
        {/* Coastline shape curving along central Israel / Tel Aviv / Bat Yam */}
        <path
          d="M 380,0 
             L 375,100 
             L 360,180 
             L 320,280 
             L 310,360 
             L 315,440 
             L 260,540 
             L 245,650 
             L 1000,650 
             L 1000,0 Z"
          fill="#edf3f8"
          stroke="#94a3b8"
          strokeWidth="1.2"
          className="dark:fill-[#131f33] dark:stroke-slate-700"
        />

        {/* Administrative Sector Boundaries / Roads */}
        <path
          d="M 520,0 L 530,120 L 590,260 L 630,360 L 570,440 L 590,520 L 610,650"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          className="dark:stroke-slate-750"
        />

        {/* Heatmap overlay */}
        {showHeatmap && (
          <ellipse
            cx="430"
            cy="330"
            rx="190"
            ry="240"
            fill="url(#dangerHeatmap)"
            filter="url(#blurFilter)"
            className="mix-blend-multiply opacity-90 transition-opacity dark:mix-blend-screen"
          />
        )}

        {/* Impact / Alert Radius Circle (Dashed) */}
        <circle
          cx="420"
          cy="460"
          r="130"
          fill="rgba(56, 189, 248, 0.04)"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Geographic labels */}
        <text x="560" y="240" fill="#64748b" fontSize="13" fontWeight="bold" fontFamily="Assistant, sans-serif" className="dark:fill-slate-400">
          מרכז
        </text>
        <text x="350" y="260" fill="#ffffff" stroke="#334155" strokeWidth="0.5" fontSize="12" fontWeight="bold" fontFamily="Assistant, sans-serif">
          בת-ים
        </text>
      </svg>

      {/* Map Control Toolbar (Floating on Left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-md p-1 gap-1 text-slate-700 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-300">
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="התקרב"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="התרחק"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-200 my-0.5 dark:bg-slate-800" />
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="מרכז מפה"
        >
          <Globe className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="שכבות תצוגה"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer ${
            showHeatmap ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="הצג / הסתר מפת חום"
        >
          <Flame className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-lg transition cursor-pointer dark:hover:bg-slate-800"
          title="מסך מלא"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Event Markers Overlay (Matching Image 1) */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Rocket Impact Marker (bat yam) */}
        <div className="absolute top-[26%] left-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="relative group cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs hover:scale-110 transition">
              <span className="font-bold">🚀</span>
            </div>
            <div className="absolute bottom-full mb-1.5 right-1/2 translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[11px] font-medium py-1 px-2 rounded-md whitespace-nowrap shadow-lg z-20">
              נפילה באזור תעשייה (בת ים)
            </div>
          </div>
        </div>

        {/* Building Damage Marker */}
        <div className="absolute top-[24%] left-[41%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs hover:scale-110 transition cursor-pointer">
            <span className="font-bold">🏢</span>
          </div>
        </div>

        {/* Interception Debris Marker */}
        <div className="absolute top-[35%] left-[35%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs hover:scale-110 transition cursor-pointer">
            <span className="font-bold">💥</span>
          </div>
        </div>

        {/* Medical Incident Marker */}
        <div className="absolute top-[36%] left-[37.5%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs hover:scale-110 transition cursor-pointer">
            <span className="font-bold">➕</span>
          </div>
        </div>

        {/* Interception Success / Drone Marker */}
        <div className="absolute top-[47%] left-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-teal-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs hover:scale-110 transition cursor-pointer">
            <span className="font-bold">🎯</span>
          </div>
        </div>
      </div>

      {/* Bottom-Left Information Box: Scale & Coordinates */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-sm text-right text-xs leading-relaxed dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-300">
        <div className="font-bold text-slate-900 dark:text-white">
          מרכז תצוגה - 32.02 N 34.75 E
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          100 פיקסלים = 6 ק״מ • גרירה להזזה, גלגול לזום
        </div>
      </div>

      {/* Bottom-Right Risk Legend Box */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-3 shadow-sm text-right text-xs min-w-[210px] space-y-2.5 dark:bg-slate-900/95 dark:border-slate-800 dark:text-slate-200">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700 dark:text-slate-300">
            <span>גבוה</span>
            <span>ריכוז סיכון 8 אירועים מוצגים</span>
            <span>נמוך</span>
          </div>
          {/* Gradient bar matching Image 1 */}
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-red-600" />
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] dark:border-slate-800">
          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold dark:bg-amber-950/60 dark:text-amber-300">
            בינונית
          </span>
          <span className="text-slate-600 font-medium dark:text-slate-400">
            מתיחות אזורית בגזרה: מרכז • ישראל
          </span>
        </div>
      </div>

    </div>
  );
};
