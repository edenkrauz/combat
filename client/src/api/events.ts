import {
  formatDbEventToItem,
  type DbEvent,
  type EventItem,
  type EventStatus,
} from '../types/event';

interface ApiEvent {
  event_id: string;
  reality_id: number;
  version: number;
  status: 'open' | 'in progress' | 'closed';
  categories: string[];
  is_deleted: boolean;
  title: string;
  description: string | null;
  notes: string | null;
  sector: string | null;
  sector_description: string | null;
  start_time: string | null;
  red_injured_count: number | null;
  red_death_count: number | null;
  blue_injured_count: number | null;
  blue_death_count: number | null;
  threat_level: number | null;
  deployed_forces: number | null;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function toEventItem(event: ApiEvent): EventItem {
  const normalizedEvent: DbEvent = {
    ...event,
    status: event.status === 'in progress' ? 'in_progress' : event.status,
    event_type: 'unknown',
    description: event.description ?? '',
    sector: event.sector ?? 'לא ידוע',
    start_time: event.start_time ?? event.created_at,
    threat_level: event.threat_level ?? 0,
    deployed_forces: event.deployed_forces ?? 0,
    categories: event.categories ?? [],
  };
  return formatDbEventToItem(normalizedEvent);
}

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  if (body) {
    try {
      const payload: unknown = JSON.parse(body);
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
      ) {
        return payload.error;
      }
    } catch {
      return body;
    }
  }
  return `בקשת השרת נכשלה (${response.status})`;
}

async function requestEvent(path: string, init?: RequestInit): Promise<EventItem> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return toEventItem((await response.json()) as ApiEvent);
}

export async function getEvents(): Promise<EventItem[]> {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error('השרת החזיר רשימת אירועים לא תקינה');
  }
  return (payload as ApiEvent[]).map(toEventItem);
}

export function updateEventStatus(
  event: Pick<EventItem, 'event_id' | 'reality_id'>,
  status: EventStatus,
): Promise<EventItem> {
  const apiStatus = status === 'in_progress' ? 'in progress' : status;
  return requestEvent(
    `/events/${encodeURIComponent(event.event_id)}/${event.reality_id}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: apiStatus }),
    },
  );
}
