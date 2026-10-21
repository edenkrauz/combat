import React, { useState } from 'react';
import { TopNavbar, type OperationalMode } from './components/TopNavbar';
import { OperationalBanner } from './components/OperationalBanner';
import { ChecklistTemplatesModal } from './components/ChecklistTemplatesModal';
import { EventsPanel } from './components/EventsPanel';
import { EventDetails } from './components/EventDetails';
import { Map } from './components/Map';
import { mockSectorsData } from './data/mockEvents';
import type { EventItem, SectorGroup } from './types/event';

export const App: React.FC = () => {
  const [sectorsState, setSectorsState] = useState<SectorGroup[]>(mockSectorsData);
  // Initially null so EventDetails is not open right away, only when the user clicks an event
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('real');
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false);

  const activeSector = sectorsState[0];
  const allEvents = sectorsState.flatMap((s) => s.events);
  const selectedEvent = allEvents.find((e) => e.event_id === selectedEventId) || null;

  const handleSelectEvent = (event: EventItem) => {
    // If clicking the currently selected event, toggle it closed
    setSelectedEventId((prev) => (prev === event.event_id ? null : event.event_id));
  };

  const handleUpdateEvent = (updated: EventItem) => {
    setSectorsState((prev) =>
      prev.map((sector) => ({
        ...sector,
        events: sector.events.map((e) =>
          e.event_id === updated.event_id ? updated : e
        ),
      }))
    );
  };

  return (
    <div
      className="min-h-screen bg-[#f3f5f8] flex flex-col font-sans transition-colors dark:bg-slate-950"
      dir="rtl"
    >
      {/* 
        Top Navigation Bar with Combat Logo, Sector badge, dynamic Live Clock,
        Operational Actions (Checklists, Audit Log), Mode toggle (אמת / תרגיל),
        User profile and Dark Mode switcher.
      */}
      <TopNavbar
        mode={operationalMode}
        onModeChange={setOperationalMode}
        onOpenChecklists={() => setIsChecklistsOpen(true)}
      />

      {/* Operational alert strip directly under the navbar */}
      <OperationalBanner mode={operationalMode} />

      {/* Main workspace layout: 
          1. Events List Panel (right)
          2. Event Details Panel (adjacent to the events panel when an event is selected)
          3. Tactical Leaflet Map (fills the remaining space on the left)
      */}
      <main className="flex-1 p-4 flex justify-start items-start gap-4 overflow-hidden">
        {/* Events Panel */}
        <div className="w-[380px] shrink-0 h-[calc(100vh-8.5rem)] flex flex-col">
          <EventsPanel
            sectors={sectorsState}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
          />
        </div>

        {/* Event Details Component - opens when an event is clicked */}
        {selectedEvent && (
          <div className="w-[500px] shrink-0 h-[calc(100vh-8.5rem)] flex flex-col">
            <EventDetails
              key={selectedEvent.event_id}
              event={selectedEvent}
              onClose={() => setSelectedEventId(null)}
              onUpdateEvent={handleUpdateEvent}
            />
          </div>
        )}

        {/* Tactical Map */}
        <div className="flex-1 h-[calc(100vh-8.5rem)] min-w-[300px] flex flex-col">
          <Map
            events={allEvents}
            sector={activeSector}
            selectedEventId={selectedEventId}
            onEventSelect={handleSelectEvent}
          />
        </div>
      </main>

      {/* Checklist Templates Modal Popup */}
      <ChecklistTemplatesModal
        isOpen={isChecklistsOpen}
        onClose={() => setIsChecklistsOpen(false)}
      />
    </div>
  );
};

export default App;
