import React, { useState } from 'react';
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
  const [workflows, setWorkflows] = useState<Record<string, EventWorkflow>>({});

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

  return (
    <div className="relative w-full max-w-[420px]" dir="rtl">
      <aside className="flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">אירועים</h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
          {sectors.map((sector) => (
            <SectorAccordion
              key={sector.sector_id}
              sector={sector}
              defaultExpanded
              selectedEventId={selectedEvent?.event_id}
              onSelectEvent={setSelectedEvent}
            />
          ))}
        </div>
      </aside>

      {selectedEvent && workflow && (
        <div className="absolute right-[calc(100%+0.75rem)] top-0 z-30 h-[calc(100vh-2rem)] w-[min(715px,calc(100vw-460px))]">
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
            onTaskNoteChange={(taskId, note) =>
              updateWorkflow(selectedEvent, (current) => ({
                ...current,
                taskNotes: { ...current.taskNotes, [taskId]: note },
              }))
            }
            onCloseEvent={() =>
              updateWorkflow(selectedEvent, (current) => ({
                ...current,
                status: 'closed',
              }))
            }
          />
        </div>
      )}
    </div>
  );
};
