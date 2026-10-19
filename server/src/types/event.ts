/**
 * Exact representation of the EVENT entity in PostgreSQL / DataForge DB.
 * Reference: schemas.html (topic: events.state)
 */
export type EventStatus = 'open' | 'in_progress' | 'closed';

export interface DbEvent {
  event_id: string; // PK: (reality_id, event_id)
  reality_id: number; // 0 = real; non-zero for Cobra simulated events
  version: number; // +1 on every change
  status: EventStatus;
  event_type: string; // Free text (e.g. 'rocket_impact', 'shrapnel', 'uav_intercept')
  is_deleted: boolean; // Logical delete: true = deleted, apps hide it
  title: string;
  description: string; // Content of the event
  notes: string | null; // e.g. "מוקד 101", "דיווח לתושבים • כוחות בשטח"
  sector: string; // e.g. "מרכז", "צפון", "דרום"
  sector_description: string | null; // e.g. "מרכז • אזור תעשייה, בת ים"
  start_time: string; // ISO 8601 UTC string
  red_injured_count: number | null; // NULL = unknown, 0 = reported zero
  red_death_count: number | null;
  blue_injured_count: number | null;
  blue_death_count: number | null;
  threat_level: number; // 0–100
  deployed_forces: number;
  created_at: string; // ISO 8601 UTC
  updated_at: string; // ISO 8601 UTC
  // Optional embedding columns from DataForge DB
  content_embedding?: number[] | null;
  full_embedding?: number[] | null;
  embedding_error?: string | null;
  embedded_at?: string | null;
}
