import type { DbAuditLogEntry, NewAuditLogEntry } from '../types/auditLog';
import { pool } from './pool';

export const auditLogRepository = {
  /**
   * Fetch audit log entries for one mode (reality_id) and optional sector, newest first.
   * Returns an empty list when no database is configured.
   */
  async getEntries(realityId = 0, sector?: string): Promise<DbAuditLogEntry[]> {
    if (!pool) return [];

    const query = sector
      ? 'SELECT * FROM audit_log WHERE reality_id = $1 AND sector = $2 ORDER BY occurred_at DESC, log_id DESC'
      : 'SELECT * FROM audit_log WHERE reality_id = $1 ORDER BY occurred_at DESC, log_id DESC';
    const params = sector ? [realityId, sector] : [realityId];
    const res = await pool.query(query, params);
    return res.rows;
  },

  /**
   * Append one audit log entry. occurred_at is set by the database (NOW()).
   */
  async addEntry(entry: NewAuditLogEntry): Promise<DbAuditLogEntry> {
    if (!pool) throw new Error('Database not configured');

    const res = await pool.query(
      `INSERT INTO audit_log (reality_id, sector, actor_type, user_name, event_id, action_type, action, outcome)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        entry.reality_id,
        entry.sector,
        entry.actor_type,
        entry.user_name,
        entry.event_id,
        entry.action_type,
        entry.action,
        entry.outcome,
      ]
    );
    return res.rows[0];
  },
};
