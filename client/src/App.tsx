import React, { useEffect, useState } from 'react';
import { TopNavbar, type OperationalMode } from './components/TopNavbar';
import { OperationalBanner } from './components/OperationalBanner';
import { ChecklistTemplatesModal } from './components/ChecklistTemplatesModal';
import { StatisticsModal } from './components/StatisticsModal';
import { EventsPanel } from './components/EventsPanel';
import { EventDetails } from './components/EventDetails';
import { Map } from './components/Map';
import { getEvents, updateEventStatus } from './api/events';
import type { EventItem, EventStatus, SectorGroup } from './types/event';
import { getEventKey } from './types/event';

const STATISTICS_DASHBOARD_URL = 'http://localhost:3001/public/dashboard/a7f8ed94-7838-4b04-a4ce-a96d8539599e';

export const App: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  // Initially null so EventDetails is not open right away, only when the user clicks an event
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [operationalMode, setOperationalMode] = useState<OperationalMode>('real');
  const [isChecklistsOpen, setIsChecklistsOpen] = useState(false);
  useEffect(() => {
    let isCurrentRequest = true;

    getEvents()
      .then((result) => {
        if (isCurrentRequest) {
          setEvents(result);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setLoadError(
            error instanceof Error ? error.message : 'טעינת האירועים נכשלה',
          );
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [reloadCount]);

  const visibleEvents = events.filter((event) =>
    operationalMode === 'real' ? event.reality_id === 0 : event.reality_id !== 0,
  );
  const sectorsState = visibleEvents.reduce<SectorGroup[]>((sectors, event) => {
    const sectorName = event.sector;
    const existingSector = sectors.find((sector) => sector.name === sectorName);
    if (existingSector) {
      existingSector.events.push(event);
      if (event.threat_level >= 70) {
        existingSector.tension_level = 'high';
        existingSector.tension_label = 'מתיחות גבוהה';
      } else if (event.threat_level >= 40 && existingSector.tension_level === 'low') {
        existingSector.tension_level = 'medium';
        existingSector.tension_label = 'מתיחות בינונית';
      }
      return sectors;
    }

    const tensionLevel =
      event.threat_level >= 70 ? 'high' : event.threat_level >= 40 ? 'medium' : 'low';
    sectors.push({
      sector_id: sectorName,
      name: sectorName,
      display_name: `${sectorName} • ישראל`,
      tension_level: tensionLevel,
      tension_label:
        tensionLevel === 'high'
          ? 'מתיחות גבוהה'
          : tensionLevel === 'medium'
            ? 'מתיחות בינונית'
            : 'מתיחות נמוכה',
      events: [event],
    });
    return sectors;
  }, []);
  const allEvents = sectorsState.flatMap((sector) => sector.events);
  const activeSector = sectorsState[0];
  const selectedEvent =
    allEvents.find((event) => getEventKey(event) === selectedEventId) || null;

  const handleSelectEvent = (event: EventItem) => {
    // If clicking the currently selected event, toggle it closed
    const eventKey = getEventKey(event);
    setSelectedEventId((prev) => (prev === eventKey ? null : eventKey));
  };

  const handleUpdateEvent = (updated: EventItem) => {
    setEvents((previous) =>
      previous.map((event) =>
        getEventKey(event) === getEventKey(updated) ? updated : event,
      ),
    );
  };
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);

  const handleStatusChange = async (
    event: EventItem,
    status: EventStatus,
  ): Promise<EventItem> => {
    const updated = await updateEventStatus(event, status);
    handleUpdateEvent(updated);
    return updated;
  };

  const handleModeChange = (mode: OperationalMode) => {
    setOperationalMode(mode);
    setSelectedEventId(null);
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
        onModeChange={handleModeChange}
        onOpenChecklists={() => setIsChecklistsOpen(true)}
        onOpenStatistics={() => setIsStatisticsOpen(true)}
      />

      {/* Operational alert strip directly under the navbar */}
      <OperationalBanner mode={operationalMode} />

      {/* Main workspace layout: 
          1. Events List Panel (right)
          2. Event Details Panel (adjacent to the events panel when an event is selected)
          3. Tactical Leaflet Map (fills the remaining space on the left)
      */}
      <main className="flex-1 p-4 flex justify-start items-start gap-4 overflow-hidden">
        {isLoading ? (
          <div className="flex-1 rounded-2xl bg-white p-8 text-center text-slate-600" role="status">
            טוען אירועים מהשרת...
          </div>
        ) : loadError ? (
          <div className="flex-1 rounded-2xl border border-rose-200 bg-white p-8 text-center" role="alert">
            <p className="font-semibold text-rose-700">לא ניתן לטעון אירועים מהשרת</p>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                setReloadCount((count) => count + 1);
              }}
            >
              ניסיון חוזר
            </button>
          </div>
        ) : (
          <>
            <div className="w-[380px] shrink-0 h-[calc(100vh-8.5rem)] flex flex-col">
              <EventsPanel
                sectors={sectorsState}
                selectedEventId={selectedEventId}
                onSelectEvent={handleSelectEvent}
              />
            </div>

            {selectedEvent && (
              <div className="w-[500px] shrink-0 h-[calc(100vh-8.5rem)] flex flex-col">
                <EventDetails
                  key={getEventKey(selectedEvent)}
                  event={selectedEvent}
                  onClose={() => setSelectedEventId(null)}
                  onUpdateEvent={handleUpdateEvent}
                  onUpdateStatus={handleStatusChange}
                />
              </div>
            )}

            <div className="flex-1 h-[calc(100vh-8.5rem)] min-w-[300px] flex flex-col">
              <Map
                events={allEvents}
                sector={activeSector}
                onEventSelect={handleSelectEvent}
              />
            </div>
          </>
        )}
      </main>

      {/* Checklist Templates Modal Popup */}
      <ChecklistTemplatesModal
        isOpen={isChecklistsOpen}
        onClose={() => setIsChecklistsOpen(false)}
      />

      {/* Statistics Modal Popup */}
      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        title="סטטיסטיקה"
        maxWidthClassName="max-w-5xl"
        contentClassName="h-[80vh]"
      >
        <iframe src={STATISTICS_DASHBOARD_URL} title="סטטיסטיקה" className="w-full h-full" />
      </StatisticsModal>
    </div>
  );
};

export default App;
