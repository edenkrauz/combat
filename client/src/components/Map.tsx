import React from 'react';
import { Plus, Minus, LocateFixed } from 'lucide-react';
import type { EventItem, SectorGroup } from '../types/event';
import { useLeafletMap } from '../hooks/useLeafletMap';

export interface MapProps {
  events?: EventItem[];
  sector?: SectorGroup;
  onEventSelect?: (event: EventItem) => void;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  sector,
  className = '',
}) => {
  const {
    mapContainerRef,
    centerCoords,
    scaleKmText,
    zoomIn,
    zoomOut,
    recenter,
  } = useLeafletMap();

  const activeSectorName = sector?.display_name || 'מרכז • ישראל';
  const tensionLabel = sector?.tension_label || 'מתיחות בינונית';
  const tensionBadgeClass =
    sector?.tension_level === 'high'
      ? 'bg-red-50 text-red-700 border-red-200'
      : sector?.tension_level === 'medium'
      ? 'bg-amber-50 text-amber-800 border-amber-200/80'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200/80';

  return (
    <div
      className={`relative isolate w-full h-full min-h-0 bg-[#f1f5f9] rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden select-none ${className}`}
      dir="rtl"
    >
      {/* 1. Leaflet Map DOM Mount Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* 2. Top-Left Floating Controls Toolbar */}
      <aside
        aria-label="Map Controls"
        className="absolute top-4 left-4 z-[500] flex flex-col items-center bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-md p-1 gap-0.5 text-slate-700"
      >
        <button
          type="button"
          onClick={zoomIn}
          title="התקרב (Zoom In)"
          className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          title="התרחק (Zoom Out)"
          className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>

        <div className="w-5 h-[1px] bg-slate-200 my-0.5" />

        <button
          type="button"
          onClick={recenter}
          title="מרכז לגזרת מרכז"
          className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <LocateFixed className="w-4 h-4" strokeWidth={2} />
        </button>
      </aside>

      {/* 3. Bottom-Left Scale & Coordinates Widget */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-xs px-3.5 py-2 text-right">
        <div className="text-[13px] font-bold text-slate-800 tracking-wide">
          מרכז תצוגה • N {centerCoords.lat} E {centerCoords.lng}
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          100 פיקסלים = {scaleKmText} · גרירה להזזה, גלגלת לזום
        </div>
      </div>

      {/* 4. Bottom-Right Sector Tension Card */}
      <div className="absolute bottom-4 right-4 z-[500] flex flex-col gap-2.5 items-end">
        <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-xs px-3.5 py-2.5 w-56 text-right flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              מתיחות אזורית בגזרה
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />
              <span className="text-xs font-bold text-slate-800">
                {activeSectorName}
              </span>
            </div>
          </div>

          <div>
            <span
              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${tensionBadgeClass}`}
            >
              {tensionLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
