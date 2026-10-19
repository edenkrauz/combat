import React, { useState } from 'react';
import { ChevronDown, ChevronLeft } from 'lucide-react';
import type { SectorGroup } from '../types/event';
import { EventCard } from './EventCard';

interface SectorAccordionProps {
  sector: SectorGroup;
  defaultExpanded?: boolean;
}

export const SectorAccordion: React.FC<SectorAccordionProps> = ({
  sector,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getTensionBadge = () => {
    switch (sector.tension_level) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
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
        className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer text-right group select-none"
        aria-expanded={isExpanded}
      >
        {/* Right side (in RTL): Chevron + Sector Title + Event count */}
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-800 transition-transform" />
          )}

          <span className="font-semibold text-slate-800 text-[14px]">
            {sector.display_name}
          </span>

          <span className="text-slate-400 text-xs font-medium mr-1">
            {sector.events.length}
          </span>
        </div>

        {/* Left side: Tension Level badge */}
        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${getTensionBadge()}`}
          >
            {sector.tension_label}
          </span>
        </div>
      </button>

      {/* Expanded Events List */}
      {isExpanded && (
        <div className="mt-2 space-y-2.5">
          {sector.events.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
