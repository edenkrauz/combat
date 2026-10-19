import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const EVENT_STATUSES = ['open', 'in progress', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

interface EventRecord {
  event_id: string;
  reality_id: number;
  version: number;
  status: EventStatus;
  event_type_id: string;
  is_deleted: boolean;
  title: string;
  description: string;
  notes: string;
  sector: string;
  sector_description: string;
  start_time: string;
  red_injured_count: number;
  red_death_count: number;
  blue_injured_count: number;
  blue_death_count: number;
  threat_level: number;
  deployed_forces: number;
  created_at: string;
  updated_at: string;
}

interface EventTypeRecord {
  event_type_id: string;
  display_name: string;
  tasks: string[];
}

interface EventData {
  events: EventRecord[];
  event_types: EventTypeRecord[];
}

type EventResponse = EventRecord & { event_type: EventTypeRecord | null };

const dataPath = fileURLToPath(new URL('../../data.json', import.meta.url));

async function readData(): Promise<EventData> {
  return JSON.parse(await readFile(dataPath, 'utf8')) as EventData;
}

function withEventType(data: EventData, event: EventRecord): EventResponse {
  return {
    ...event,
    event_type:
      data.event_types.find(
        (eventType) => eventType.event_type_id === event.event_type_id,
      ) ?? null,
  };
}

export async function getEvents(): Promise<EventResponse[]> {
  const data = await readData();
  return data.events
    .filter((event) => !event.is_deleted)
    .map((event) => withEventType(data, event));
}

export async function getEvent(
  eventId: string,
  realityId: number,
): Promise<EventResponse | undefined> {
  const data = await readData();
  const event = data.events.find(
    (item) =>
      item.event_id === eventId &&
      item.reality_id === realityId &&
      !item.is_deleted,
  );
  return event ? withEventType(data, event) : undefined;
}

export async function updateEventStatus(
  eventId: string,
  realityId: number,
  status: EventStatus,
): Promise<EventResponse | undefined> {
  const data = await readData();
  const event = data.events.find(
    (item) =>
      item.event_id === eventId &&
      item.reality_id === realityId &&
      !item.is_deleted,
  );
  if (!event) {
    return undefined;
  }

  event.status = status;
  event.updated_at = new Date().toISOString();
  await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
  return withEventType(data, event);
}