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
        </div>
      )}

      {closedEventNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-6 z-[60] flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
          dir="rtl"
        >
          <Check className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>
            האירוע נסגר · משך טיפול {closedEventNotice.duration}
          </span>
          <span className="sr-only">{closedEventNotice.title}</span>
          <button
            type="button"
            onClick={() => setClosedEventNotice(null)}
            aria-label="סגירת הודעת אישור"
            className="ms-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
