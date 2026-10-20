/**
 * Exact representation of the AUDIT_LOG entity in PostgreSQL.
 * Reference: db/schema.sql (audit_log)
 */
export type AuditActorType = 'user' | 'system';
export type AuditOutcome = 'success' | 'blocked';

export interface DbAuditLogEntry {
  log_id: string; // PK, BIGINT identity (pg returns BIGINT as string)
  reality_id: number; // 0 = real, non-zero for drill
  occurred_at: string; // ISO 8601 UTC
  sector: string; // e.g. "מרכז"
  actor_type: AuditActorType;
  user_name: string; // e.g. "ד. כהן" or "מערכת"
  event_id: string | null; // NULL = not tied to an event
  action_type: string; // e.g. 'event_ingested', 'status_change', 'login'
  action: string; // Human-readable text
  outcome: AuditOutcome;
}

/**
 * Fields a caller provides when appending an entry (log_id and occurred_at are set by the DB).
 */
export type NewAuditLogEntry = Omit<DbAuditLogEntry, 'log_id' | 'occurred_at'>;
