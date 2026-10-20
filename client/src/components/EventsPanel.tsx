import React from 'react';
import type { SectorGroup } from '../types/event';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ sectors }) => {
  return (
    <aside className="w-full h-full bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="pb-3 border-b border-slate-100 mb-3 flex items-center justify-between shrink-0">
        <h2 className="text-lg font-bold text-slate-800">אירועים</h2>
      </div>

      {/* Note: Search and filter fields are omitted per current requirements */}

      {/* Sectors & Events List */}
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-0.5">
        {sectors.map((sector) => (
          <SectorAccordion
            key={sector.sector_id}
            sector={sector}
            defaultExpanded={true}
          />
        ))}
      </div>
    </aside>
  );
};
