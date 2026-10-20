import type { DbAuditLogEntry } from '../types/auditLog';
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
};
