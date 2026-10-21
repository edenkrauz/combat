export const AUDIT_ACTOR_TYPES = ['user', 'system'] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export const AUDIT_OUTCOMES = ['success', 'blocked'] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export interface AuditLogEntry {
  log_id: string; // BIGINT identity, pg returns it as a string
  reality_id: number;
  occurred_at: string;
  sector: string;
  actor_type: AuditActorType;
  user_name: string;
  event_id: string | null; // NULL = not tied to an event
  action_type: string;
  action: string;
  outcome: AuditOutcome;
}

export type NewAuditLogEntry = Omit<AuditLogEntry, 'log_id' | 'occurred_at'>;
