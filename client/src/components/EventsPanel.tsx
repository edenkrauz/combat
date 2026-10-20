import React, { useEffect, useState, useRef } from 'react';
import { Check, X } from 'lucide-react';
import { INITIAL_CHECKLISTS, type CategoryKey } from './ChecklistTemplatesModal';
import type { EventItem, EventStatus, SectorGroup } from '../types/event';
import { EventDetailsPanel, type EventTask } from './EventDetailsPanel';
import { SectorAccordion } from './SectorAccordion';

interface EventsPanelProps {
  sectors: SectorGroup[];
}

interface EventWorkflow {
  status: EventStatus;
  completedTasks: Record<string, boolean>;
  taskNotes: Record<string, string>;
}

interface ClosedEventNotice {
  title: string;
  duration: string;
}

const formatDuration = (seconds: number | null): string => {
  if (seconds === null) return '--:--:--';
  return `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(
    Math.floor((seconds % 3600) / 60),
  ).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

const getEventCategories = (event: EventItem): CategoryKey[] => {
  switch (event.event_type) {
    case 'rocket_impact':
    case 'interception_debris':
    case 'uav_interception':
      return ['rocket'];
    case 'fire_hazard':
    case 'building_damage':
      return ['rocket', 'civil'];
    case 'smoke_hazard':
    case 'medical_panic':
      return ['civil'];
    case 'traffic_block':
    case 'crowd_alert':
      return ['riot'];
    default:
      return ['hostile'];
  }
};

const getEventTasks = (event: EventItem): EventTask[] =>
  getEventCategories(event).flatMap((category) =>
    INITIAL_CHECKLISTS[category].map((title, index) => ({
      id: `${category}-${index}`,
      title,
    })),
  );

export const EventsPanel: React.FC<EventsPanelProps> = ({ sectors }) => {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [workflows, setWorkflows] = useState<Record<string, EventWorkflow>>({});
  const [closedEventNotice, setClosedEventNotice] = useState<ClosedEventNotice | null>(null);

  useEffect(() => {
    if (!closedEventNotice) return;
    const timeout = window.setTimeout(() => setClosedEventNotice(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [closedEventNotice]);

  const updateWorkflow = (
    event: EventItem,
    update: (workflow: EventWorkflow) => EventWorkflow,
  ) => {
    setWorkflows((previous) => {
      const existing = previous[event.event_id] ?? {
        status: event.status,
        completedTasks: Object.fromEntries(
          event.status === 'closed' ? getEventTasks(event).map((task) => [task.id, true]) : [],
        ),
        taskNotes: {},
      };
      return { ...previous, [event.event_id]: update(existing) };
    });
  };

  const workflow = selectedEvent
    ? workflows[selectedEvent.event_id] ?? {
        status: selectedEvent.status,
        completedTasks: Object.fromEntries(
          selectedEvent.status === 'closed'
            ? getEventTasks(selectedEvent).map((task) => [task.id, true])
            : [],
        ),
        taskNotes: {},
      }
    : null;
  const selectedTasks = selectedEvent ? getEventTasks(selectedEvent) : [];
  const activeSectors = sectors
    .map((sector) => ({
      ...sector,
      events: sector.events.filter(
        (event) => (workflows[event.event_id]?.status ?? event.status) !== 'closed',
      ),
    }))
    .filter((sector) => sector.events.length > 0);

  const allVisibleEvents = activeSectors.flatMap((sector) => sector.events);

  const closeSelectedEvent = (event: EventItem) => {
    const currentWorkflow = workflows[event.event_id] ?? {
      status: event.status,
      completedTasks: Object.fromEntries(
        event.status === 'closed' ? getEventTasks(event).map((task) => [task.id, true]) : [],
      ),
      taskNotes: {},
    };
    const tasks = getEventTasks(event);
    if (
      currentWorkflow.status !== 'in_progress' ||
      !tasks.every((task) => currentWorkflow.completedTasks[task.id])
    ) {
      return;
    }

    const elapsed = Date.parse(event.start_time);
    const duration =
      Number.isNaN(elapsed) ? null : Math.max(0, Math.floor((Date.now() - elapsed) / 1000));
    setWorkflows((previous) => ({
      ...previous,
      [event.event_id]: { ...currentWorkflow, status: 'closed' },
    }));
    setSelectedEvent(null);
    const closedIndex = allVisibleEvents.findIndex((e) => e.event_id === event.event_id);
    const remaining = allVisibleEvents.filter((e) => e.event_id !== event.event_id);
    if (remaining.length > 0) {
      const nextIndex = Math.min(closedIndex, remaining.length - 1);
      setFocusedEventId(remaining[nextIndex].event_id);
    } else {
      setFocusedEventId(null);
    }
    setClosedEventNotice({
      title: event.title,
      duration: formatDuration(duration),
    });
  };

  // Scroll focused card smoothly into view inside the events panel container ONLY (never moving the screen/page)
  useEffect(() => {
    if (!focusedEventId) return;
    const cardEl = document.getElementById(`event-card-${focusedEventId}`);
    const container = scrollContainerRef.current;
    if (cardEl && container) {
      cardEl.focus({ preventScroll: true });

      const containerRect = container.getBoundingClientRect();
      const cardRect = cardEl.getBoundingClientRect();

      // If card is above container view
      if (cardRect.top < containerRect.top) {
        container.scrollTo({
          top: container.scrollTop - (containerRect.top - cardRect.top) - 10,
          behavior: 'smooth',
        });
      }
      // If card is below container view
      else if (cardRect.bottom > containerRect.bottom) {
        container.scrollTo({
          top: container.scrollTop + (cardRect.bottom - containerRect.bottom) + 10,
          behavior: 'smooth',
        });
      }
    }
  }, [focusedEventId]);

  // Global keyboard navigation: ArrowUp/ArrowDown, Enter, Escape, Home, End
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Never intercept when typing inside text inputs, textareas, or selects
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Ignore if a modal dialog is open
      if (document.querySelector('[role="dialog"], .fixed.z-\\[9999\\]')) {
        return;
      }

      // 3. Escape: Close event details panel if open
      if (e.key === 'Escape') {
        if (selectedEvent) {
          e.preventDefault();
          setSelectedEvent(null);
          return;
        }
      }

      // 4. Arrow navigation (ArrowDown / ArrowUp)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();

        const currentActiveId = focusedEventId ?? selectedEvent?.event_id;
        const currentIndex = allVisibleEvents.findIndex(
          (item) => item.event_id === currentActiveId
        );

        let nextIndex = 0;
        if (currentIndex === -1) {
          nextIndex = e.key === 'ArrowDown' ? 0 : allVisibleEvents.length - 1;
        } else {
          if (e.key === 'ArrowDown') {
            nextIndex = Math.min(currentIndex + 1, allVisibleEvents.length - 1);
          } else {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
        }

        const nextEvent = allVisibleEvents[nextIndex];
        if (nextEvent) {
          setFocusedEventId(nextEvent.event_id);
          // If the details drawer is already open, immediately preview the new event
          if (selectedEvent) {
            setSelectedEvent(nextEvent);
          }
        }
        return;
      }

      // 5. Enter: Open / Click the focused event
      if (e.key === 'Enter') {
        const currentActiveId = focusedEventId ?? selectedEvent?.event_id;
        const currentEvent = allVisibleEvents.find((item) => item.event_id === currentActiveId);
        if (currentEvent) {
          e.preventDefault();
          setSelectedEvent(currentEvent);
          setFocusedEventId(currentEvent.event_id);
        }
        return;
      }

      // 6. Home / End: Quick jump to first / last event
      if (e.key === 'Home') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();
        const first = allVisibleEvents[0];
        setFocusedEventId(first.event_id);
        if (selectedEvent) setSelectedEvent(first);
        return;
      }

      if (e.key === 'End') {
        if (allVisibleEvents.length === 0) return;
        e.preventDefault();
        const last = allVisibleEvents[allVisibleEvents.length - 1];
        setFocusedEventId(last.event_id);
        if (selectedEvent) setSelectedEvent(last);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allVisibleEvents, focusedEventId, selectedEvent]);

  return (
    <div className="relative w-full max-w-[420px] h-full min-h-0 flex flex-col" dir="rtl">
      <aside className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">אירועים</h2>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/80 rounded-md px-2 py-0.5 select-none" title="ניווט באמצעות חיצים ו-Enter">
            <span>ניווט:</span>
            <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↑</kbd>
            <kbd className="px-1 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">↓</kbd>
            <span className="text-slate-300 mx-0.5">•</span>
            <kbd className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600 font-mono text-[10px]">Enter</kbd>
          </div>
        </div>
        <div ref={scrollContainerRef} className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 pl-1 custom-scrollbar">
          {activeSectors.map((sector) => (
            <SectorAccordion
              key={sector.sector_id}
              sector={sector}
              defaultExpanded
              selectedEventId={selectedEvent?.event_id}
              focusedEventId={focusedEventId}
              onSelectEvent={(event) => {
                setFocusedEventId(event.event_id);
                setSelectedEvent(event);
              }}
              onFocusEvent={(event) => {
                setFocusedEventId(event.event_id);
              }}
            />
          ))}
        </div>
      </aside>

      {selectedEvent && workflow && (
        <div className="absolute right-[calc(100%+0.75rem)] top-0 z-30 h-full w-[min(715px,calc(100vw-460px))]">
          <EventDetailsPanel
            key={selectedEvent.event_id}
            event={selectedEvent}
            status={workflow.status}
            tasks={selectedTasks}
            completedTasks={workflow.completedTasks}
            taskNotes={workflow.taskNotes}
            onClose={() => setSelectedEvent(null)}
            onStart={() =>
              updateWorkflow(selectedEvent, (current) => ({
                ...current,
                status: 'in_progress',
              }))
            }
            onToggleTask={(taskId) =>
              updateWorkflow(selectedEvent, (current) => ({
                ...current,
                completedTasks: {
                  ...current.completedTasks,
                  [taskId]: !current.completedTasks[taskId],
                },
              }))
            }
            onTaskNoteSave={(taskId, note) =>
              updateWorkflow(selectedEvent, (current) => ({
                ...current,
                taskNotes: { ...current.taskNotes, [taskId]: note },
              }))
            }
            onCloseEvent={() => closeSelectedEvent(selectedEvent)}
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
