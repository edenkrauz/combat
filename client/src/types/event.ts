/**
 * Exact representation of the EVENT entity in PostgreSQL / DataForge DB.
 * Reference: schemas.html (topic: events.state)
 */
export type EventStatus = 'open' | 'in_progress' | 'closed';

export interface DbEvent {
  event_id: string; // PK: (reality_id, event_id)
  reality_id: number; // 0 = real, non-zero for simulated
  version: number; // +1 on every change
  status: EventStatus;
  event_type: string; // Free text (e.g. 'rocket_impact', 'shrapnel', 'uav_intercept')
  is_deleted: boolean; // Logical delete
  title: string;
  description: string; // Content of the event
  notes: string | null; // e.g. "מוקד 101", "דיווח לתושבים • כוחות בשטח"
  sector: string; // e.g. "מרכז", "צפון", "דרום"
  sector_description: string | null; // e.g. "מרכז • אזור תעשייה, בת ים"
  start_time: string; // ISO 8601 UTC string, e.g. "2026-10-19T07:38:00Z"
  red_injured_count: number | null; // NULL = unknown, 0 = reported zero
  red_death_count: number | null;
  blue_injured_count: number | null;
  blue_death_count: number | null;
  threat_level: number; // 0–100
  deployed_forces: number;
  lat?: number | null;
  lng?: number | null;
  created_at: string; // ISO 8601 UTC
  updated_at: string; // ISO 8601 UTC
  // Optional embedding columns from DataForge DB
  content_embedding?: number[] | null;
  full_embedding?: number[] | null;
  embedding_error?: string | null;
  embedded_at?: string | null;
}

export type ThreatSeverity = 'high' | 'medium' | 'low';

/**
 * UI-extended EventItem. Inherits all DbEvent fields directly so DB migration is transparent.
 */
export interface EventItem extends DbEvent {
  // Pre-formatted presentation helpers (optional, can be auto-derived by helper)
  time_display?: string; // e.g. "19/10 • 10:38"
  threat_severity?: ThreatSeverity;
  threat_label?: string; // e.g. "סיכון גבוה"
  code?: string;
  categories?: string[];
  involved_count?: number | null;
  urgency_label?: string;
  geo_location_hierarchy?: string;
  exact_location?: string;
  source_label?: string;
}

export interface SectorGroup {
  sector_id: string; // e.g. "center"
  name: string; // e.g. "מרכז"
  display_name: string; // e.g. "מרכז • ישראל"
  tension_level: 'high' | 'medium' | 'low';
  tension_label: string; // e.g. "מתיחות בינונית"
  events: EventItem[];
}

/**
 * Utility function to transform a raw DB event row into a UI-ready EventItem.
 */
export function formatDbEventToItem(event: DbEvent): EventItem {
  // Severity classification based on threat_level (0-100)
  let threat_severity: ThreatSeverity = 'low';
  let threat_label = 'סיכון נמוך';

  if (event.threat_level >= 70) {
    threat_severity = 'high';
    threat_label = 'סיכון גבוה';
  } else if (event.threat_level >= 40) {
    threat_severity = 'medium';
    threat_label = 'סיכון בינוני';
  }

  // Format UTC start_time to DD/MM • HH:mm in Israel local time
  let time_display = '';
  try {
    const date = new Date(event.start_time);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    time_display = `${day}/${month} • ${hours}:${minutes}`;
  } catch {
    time_display = event.start_time;
  }

  return {
    ...event,
    threat_severity,
    threat_label,
    time_display,
  };
}
