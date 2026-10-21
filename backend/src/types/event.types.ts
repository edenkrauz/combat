export const EVENT_STATUSES = ['open', 'in progress', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventRecord {
  event_id: string;
  reality_id: number;
  version: number;
  status: EventStatus;
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
  created_at: string | null;
  updated_at: string | null;
}

export type EventResponse = EventRecord;

export interface UserPayload {
  name: string;
  email: string;
  country: string;
  timestamp: number;
} 

export interface RandomUserApiResponse {
  status : number,
  results: Array<{
    name: { first: string; last: string };
    email: string;
    location: { country: string };
  }>;
}
