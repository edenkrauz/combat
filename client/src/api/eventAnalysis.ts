import { formatDbEventToItem, type EventItem } from '../types/event';

// Shape of GET /events/:eventId/:realityId/analysis (backend event-analysis.types.ts).
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

export type MatchLevel = 'high' | 'medium';

export interface Insight {
  text: string;
  /** IDs of the similar events the statement is based on. */
  based_on: string[];
}

export interface SimilarEvent {
  event: EventItem;
  match: MatchLevel;
  reasons: string[];
}

export interface EventAnalysis {
  similar_events: SimilarEvent[];
  insights: {
    patterns: Insight[];
    lessons: Insight[];
    recommendations: Insight[];
  };
  window_days: number;
  generated_at: string;
}

interface ApiEventAnalysis extends Omit<EventAnalysis, 'similar_events'> {
  similar_events: { event: ApiEvent; match: MatchLevel; reasons: string[] }[];
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

// The backend's error texts are English; the status tells us enough to explain it in Hebrew.
const ERROR_MESSAGES: Record<number, string> = {
  404: 'האירוע לא נמצא',
  502: 'לא התקבלה תשובה תקינה ממערכת ה-AI',
  503: 'מערכת ה-AI אינה זמינה כרגע',
  504: 'הניתוח נמשך זמן רב מדי',
};

function toEventItem(event: ApiEvent): EventItem {
  return formatDbEventToItem({
    ...event,
    status: event.status === 'in progress' ? 'in_progress' : event.status,
    event_type: 'unknown',
    description: event.description ?? '',
    sector: event.sector ?? 'לא ידוע',
    start_time: event.start_time ?? event.created_at,
    threat_level: event.threat_level ?? 0,
    deployed_forces: event.deployed_forces ?? 0,
    categories: event.categories ?? [],
  });
}

export async function getEventAnalysis(
  event: Pick<EventItem, 'event_id' | 'reality_id'>,
  options: { refresh?: boolean; signal?: AbortSignal } = {},
): Promise<EventAnalysis> {
  const query = options.refresh ? '?refresh=true' : '';
  const response = await fetch(
    `${API_BASE_URL}/events/${encodeURIComponent(event.event_id)}/${event.reality_id}/analysis${query}`,
    { signal: options.signal },
  );

  if (!response.ok) {
    throw new Error(
      ERROR_MESSAGES[response.status] ?? `בקשת השרת נכשלה (${response.status})`,
    );
  }

  const analysis = (await response.json()) as ApiEventAnalysis;
  return {
    ...analysis,
    similar_events: analysis.similar_events.map((similar) => ({
      ...similar,
      event: toEventItem(similar.event),
    })),
  };
}
