import React from 'react';
import { MapPin, Clock, Menu } from 'lucide-react';
import type { EventItem } from '../types/event';
import { getEventKey } from '../types/event';

interface EventCardProps {
  event: EventItem;
  isSelected?: boolean;
  isFocused?: boolean;
  onClick?: () => void;
  onFocus?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSelected = false,
  isFocused = false,
  onClick,
  onFocus,
}) => {
  // Threat / Urgency badge mapping
  const getThreatBadge = () => {
    const isImmediate =
      event.urgency_label === 'מיידי' ||
      event.threat_label === 'דחיפות מיידי' ||
      event.threat_level >= 90;

    if (isImmediate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff0f3] text-[#b91c1c] border border-rose-200/90 whitespace-nowrap">
          <span>דחיפות מיידי</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        </span>
      );
    }

    switch (event.threat_severity) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff0f3] text-rose-600 border border-rose-200/80 whitespace-nowrap">
            <span>{event.threat_label || 'דחיפות גבוהה'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
            <span>{event.threat_label || 'סיכון בינוני'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
            <span>{event.threat_label || 'סיכון נמוך'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </span>
        );
    }
  };

  // Helper for casualty text format: "פצועים X • הרוגים Y" or "לא ידוע"
  const formatCasualties = (injured: number | null, dead: number | null) => {
    if (injured === null && dead === null) {
      return 'לא ידוע';
    }
    const injuredPart = injured !== null ? `פצועים ${injured}` : 'פצועים -';
    const deadPart = dead !== null ? `הרוגים ${dead}` : 'הרוגים -';
    return `${injuredPart} • ${deadPart}`;
  };

  return (
    <article
      id={`event-card-${getEventKey(event)}`}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`rounded-xl p-3.5 transition-all text-right cursor-pointer select-none focus:outline-none ${
        isFocused
          ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
          : isSelected
          ? 'border-[1.5px] border-[#3b82f6] bg-[#eff6ff] shadow-xs'
          : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
      }`}
    >
      {/* 1. Top Header: Title & Urgency badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-900 text-[14px] leading-snug flex-1">
          {event.title}
        </h3>
        <div className="shrink-0">{getThreatBadge()}</div>
      </div>

      {/* 2. Categories / Tags row */}
      {event.categories && event.categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {event.categories.map((cat, idx) => (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                isSelected
                  ? 'bg-white/90 text-slate-800 border-blue-200/80'
                  : 'bg-slate-100 text-slate-700 border-slate-200/70'
              }`}
            >
              {idx === 0 ? `• ${cat}` : `+ ${cat}`}
            </span>
          ))}
        </div>
      )}

      {/* 3. Description */}
      <p className="text-slate-600 text-[12.5px] leading-relaxed mt-2 font-normal line-clamp-2">
        {event.description}
      </p>

      {/* 4. Location and Time Row */}
      <div className="flex items-center justify-between text-xs mt-2.5 pt-1">
        <div className="flex items-center gap-1 text-slate-600 min-w-0 flex-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-[12px]">
            {event.sector_description || event.sector}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 shrink-0 text-[12px]">
          <span>{event.time_display || '20/10 • 12:02'}</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* 5. Casualties Row (Blue and Red labels) */}
      <div
        className={`flex items-center gap-3 text-xs mt-2.5 pt-2 border-t ${
          isSelected ? 'border-blue-200/70' : 'border-slate-100'
        }`}
      >
        {/* Blue side */}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold text-blue-600 border border-blue-200 bg-blue-50/80">
            כחול
          </span>
          <span className="text-slate-800 text-[11.5px] font-medium">
            {formatCasualties(event.blue_injured_count, event.blue_death_count)}
          </span>
        </div>

        {/* Red side */}
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded text-[10.5px] font-bold text-rose-600 border border-rose-200 bg-rose-50/80">
            אדום
          </span>
          <span className="text-slate-800 text-[11.5px] font-medium">
            {formatCasualties(event.red_injured_count, event.red_death_count)}
          </span>
        </div>
      </div>

      {/* 6. Notes / Source / Dispatch Row */}
      {event.notes && (
        <div
          className={`flex items-center gap-1.5 text-slate-600 text-[11.5px] mt-2 pt-1 border-t ${
            isSelected ? 'border-blue-200/50' : 'border-slate-50'
          }`}
        >
          <Menu className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2.2} />
          <span className="truncate">{event.notes}</span>
        </div>
      )}
    </article>
  );
};
