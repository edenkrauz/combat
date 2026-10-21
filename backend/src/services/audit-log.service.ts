import { pool } from '../config/database.ts';
import type {
  AuditLogEntry,
  NewAuditLogEntry,
} from '../types/audit-log.types.ts';

export async function getAuditLogEntries(
  realityId: number,
  sector?: string,
  eventId?: string,
): Promise<AuditLogEntry[]> {
  const { rows } = await pool.query<AuditLogEntry>(
    `
      SELECT *
      FROM audit_log
      WHERE reality_id = $1
        AND ($2::text IS NULL OR sector = $2)
        AND ($3::text IS NULL OR event_id = $3)
      ORDER BY occurred_at DESC, log_id DESC
    `,
    [realityId, sector ?? null, eventId ?? null],
  );
  return rows;
}

export async function addAuditLogEntry(
  entry: NewAuditLogEntry,
): Promise<AuditLogEntry> {
  const { rows } = await pool.query<AuditLogEntry>(
    `
      INSERT INTO audit_log
        (reality_id, sector, actor_type, user_name, event_id, action_type, action, outcome)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      entry.reality_id,
      entry.sector,
      entry.actor_type,
      entry.user_name,
      entry.event_id,
      entry.action_type,
      entry.action,
      entry.outcome,
    ],
  );
  return rows[0];
}
