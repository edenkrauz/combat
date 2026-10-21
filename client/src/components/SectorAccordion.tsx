import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { EventItem, SectorGroup } from '../types/event';
import { getEventKey } from '../types/event';
import { EventCard } from './EventCard';

interface SectorAccordionProps {
  sector: SectorGroup;
  defaultExpanded?: boolean;
  selectedEventId?: string | null;
  focusedEventId?: string | null;
  onFocusEvent?: (event: EventItem) => void;
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
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
      case 'medium':
        return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
      case 'low':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60';
    }
  };

  return (
    <div className="w-full">
      {/* Sector Header / Clickable accordion trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 px-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-right group select-none dark:hover:bg-slate-800/60"
        aria-expanded={isExpanded}
      >
        {/* Right side (in RTL): Title + Count Pill + Chevron */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-black text-[14px] dark:text-white">
            {sector.name}
          </span>
          <span className="text-slate-600 text-xs font-medium dark:text-slate-400">
            ישראל
          </span>

          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-semibold dark:bg-slate-800 dark:text-slate-300">
            {sector.events.length}
          </span>

          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-black transition-transform dark:text-slate-400 dark:group-hover:text-white" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-black transition-transform dark:text-slate-400 dark:group-hover:text-white" />
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
              key={getEventKey(event)}
              event={event}
              isSelected={selectedEventId === getEventKey(event)}
              isFocused={focusedEventId === getEventKey(event)}
              onFocus={() => onFocusEvent?.(event)}
              onClick={() => onSelectEvent?.(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
