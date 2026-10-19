export const EVENT_STATUSES = ['open', 'in progress', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventRecord {
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

export interface EventTypeRecord {
  event_type_id: string;
  display_name: string;
  tasks: string[];
}

export interface EventData {
  events: EventRecord[];
  event_types: EventTypeRecord[];
}

export type EventResponse = EventRecord & {
  event_type: EventTypeRecord | null;
};