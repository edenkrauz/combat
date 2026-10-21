import type { EventItem } from '../types/event';

// No auth yet: matches the user shown in the TopNavbar profile pill
const CURRENT_USER_NAME = 'ד. כהן';

export interface AuditLogEntry {
  log_id: string;
  reality_id: number;
  occurred_at: string;
  sector: string;
  actor_type: 'user' | 'system';
  user_name: string;
  event_id: string | null;
  action_type: string;
  action: string;
  outcome: 'success' | 'blocked';
}

export async function logEventAction(
  event: Pick<EventItem, 'event_id' | 'reality_id' | 'sector'>,
  actionType: string,
  action: string,
): Promise<AuditLogEntry> {
  const response = await fetch('/api/audit-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reality_id: event.reality_id,
      sector: event.sector,
      actor_type: 'user',
      user_name: CURRENT_USER_NAME,
      event_id: event.event_id,
      action_type: actionType,
      action,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as AuditLogEntry;
}
