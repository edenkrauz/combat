import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { EventItem, SectorGroup } from '../types/event';
import { EventCard } from './EventCard';

interface SectorAccordionProps {
  sector: SectorGroup;
  defaultExpanded?: boolean;
  selectedEventId?: string | null;
  onSelectEvent?: (event: EventItem) => void;
}

export const SectorAccordion: React.FC<SectorAccordionProps> = ({
  sector,
  defaultExpanded = true,
  selectedEventId,
  focusedEventId,
  onFocusEvent,
  onSelectEvent,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getTensionBadge = () => {
    switch (sector.tension_level) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium':
        return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    }
  };

  return (
    <div className="w-full">
      {/* Sector Header / Clickable accordion trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-right group select-none"
        aria-expanded={isExpanded}
      >
        {/* Right side (in RTL): Title + Count Pill + Chevron */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-black text-[14px]">
            {sector.name}
          </span>
          <span className="text-slate-600 text-xs font-medium">
            ישראל
          </span>

          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-semibold">
            {sector.events.length}
          </span>

          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-black transition-transform" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-black transition-transform" />
          )}
        </div>

        {/* Left side: Tension Level badge */}
        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getTensionBadge()}`}
          >
            {sector.tension_label}
          </span>
        </div>
      </button>

      {/* Expanded Events List */}
      {isExpanded && (
        <div className="mt-2 space-y-2.5">
          {sector.events.map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              isSelected={selectedEventId === event.event_id}
              onClick={() => onSelectEvent?.(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
