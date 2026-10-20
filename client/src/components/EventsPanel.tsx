import React from 'react';
import type { SectorGroup, EventItem } from '../types/event';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: EventItem) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({
  sectors,
  selectedEventId,
  onSelectEvent,
}) => {
  return (
    <aside className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-black">אירועים</h2>
      </div>

      {/* Sectors & Events List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {sectors.map((sector) => (
          <SectorAccordion
            key={sector.sector_id}
            sector={sector}
            defaultExpanded={true}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </aside>
  );
};
