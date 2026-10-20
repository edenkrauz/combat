import React from 'react';
import { MapPin, Clock, Menu } from 'lucide-react';
import type { EventItem } from '../types/event';

interface EventCardProps {
  event: EventItem;
  isSelected?: boolean;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, isSelected = false, onClick }) => {
  // Threat badge color mapping based on threat severity / threat level
  const getThreatBadge = () => {
    switch (event.threat_severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            {event.threat_label || 'סיכון גבוה'}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            {event.threat_label || 'סיכון בינוני'}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {event.threat_label || 'סיכון נמוך'}
          </span>
        );
    }
  };

  // Helper for casualty text format: "פצועים X • הרוגים Y" or "לא ידוע"
  const formatCasualties = (injured: number | null, dead: number | null) => {
    if (injured === null && dead === null) {
      return 'לא ידוע';
    }
    const injuredText = `פצועים ${injured ?? '-'}`;
    const deadText = `הרוגים ${dead ?? '-'}`;
    return `${injuredText} • ${deadText}`;
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`rounded-lg border bg-white p-3.5 shadow-xs hover:border-blue-300 transition-all text-right cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isSelected ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'
      }`}
    >
      {/* 1. Top Header: Title & Threat badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-800 text-[15px] leading-tight flex-1">
          {event.title}
        </h3>
        <div className="shrink-0">{getThreatBadge()}</div>
      </div>

      {/* 2. Description */}
      <p className="text-slate-500 text-[13px] leading-relaxed mt-1.5 font-normal">
        {event.description}
      </p>

      {/* 3. Location and Time Row */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5 pt-1">
        <div className="flex items-center gap-1 text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{event.sector_description || event.sector}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{event.time_display}</span>
        </div>
      </div>

      {/* 4. Casualties Row (Blue and Red labels) */}
      <div className="flex items-center gap-3 text-xs mt-2.5 pt-2 border-t border-slate-100">
        {/* Blue side */}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/70">
            כחול
          </span>
          <span className="text-slate-600 text-[12px]">
            {formatCasualties(event.blue_injured_count, event.blue_death_count)}
          </span>
        </div>

        {/* Red side */}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200/70">
            אדום
          </span>
          <span className="text-slate-600 text-[12px]">
            {formatCasualties(event.red_injured_count, event.red_death_count)}
          </span>
        </div>
      </div>

      {/* 5. Notes / Source / Dispatch Row (3 little stripes icon + text on its own separate line below) */}
      {event.notes && (
        <div className="flex items-center gap-1.5 text-slate-500 text-[12px] mt-2 pt-1 border-t border-slate-50">
          <Menu className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span>{event.notes}</span>
        </div>
      )}
    </article>
  );
};
