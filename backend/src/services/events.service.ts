import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import type {
  EventData,
  EventRecord,
  EventResponse,
  EventStatus,
} from '../types/event.types.ts';

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
