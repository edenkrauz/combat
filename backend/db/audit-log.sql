-- AUDIT_LOG table (יומן ביקורת)
-- Backs the AuditLogModal table: זמן | משתמש | אירוע | פעולה
CREATE TABLE IF NOT EXISTS audit_log (
    log_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reality_id INT NOT NULL DEFAULT 0, -- 0 = real; non-zero for drill. Same meaning as events.reality_id
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- UTC. UI column: זמן
    sector VARCHAR(100) NOT NULL, -- e.g. 'מרכז'. Modal shows one sector at a time
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'system')),
    user_name VARCHAR(255) NOT NULL, -- e.g. 'ד. כהן' or 'מערכת'. UI column: משתמש
    event_id VARCHAR(255), -- NULL = not tied to an event (login, mode change). UI column: אירוע
    action_type VARCHAR(100) NOT NULL, -- Machine code, e.g. 'event_ingested', 'status_change', 'login'
    action TEXT NOT NULL, -- Human-readable text. UI column: פעולה
    outcome VARCHAR(20) NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'blocked')), -- 'blocked' = ניסיון שנחסם
    FOREIGN KEY (reality_id, event_id) REFERENCES events (reality_id, event_id)
);

-- Main read path: one sector + mode, newest first
CREATE INDEX IF NOT EXISTS idx_audit_log_sector_time ON audit_log (reality_id, sector, occurred_at DESC);

-- Read-only records: block UPDATE / DELETE so the log can't be rewritten
CREATE OR REPLACE FUNCTION audit_log_prevent_change() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_append_only ON audit_log;
CREATE TRIGGER audit_log_append_only
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_prevent_change();

-- Seeds (Sector: מרכז). Skipped when the log already has rows, so re-running is safe.
-- event_id falls back to NULL when that event doesn't exist in this database, to satisfy the FK.
INSERT INTO audit_log (reality_id, occurred_at, sector, actor_type, user_name, event_id, action_type, action, outcome)
SELECT
    seed.reality_id, seed.occurred_at, seed.sector, seed.actor_type, seed.user_name,
    (SELECT e.event_id FROM events e WHERE e.reality_id = seed.reality_id AND e.event_id = seed.event_id),
    seed.action_type, seed.action, seed.outcome
FROM (VALUES
    (0, '2026-10-20 12:05:00+03'::timestamptz, 'מרכז', 'system', 'מערכת', 'evt-104', 'event_ingested', 'האירוע נקלט מ-2 מקורות', 'success'),
    (0, '2026-10-20 12:10:00+03'::timestamptz, 'מרכז', 'user', 'ד. כהן', NULL, 'login', 'התחברות למערכת', 'success'),
    (0, '2026-10-20 12:15:00+03'::timestamptz, 'מרכז', 'user', 'ר. לוי', NULL, 'checklist_template_edit', 'ניסיון עריכת תבנית צ''קליסט נחסם: אין הרשאה', 'blocked'),
    (0, '2026-10-20 12:21:00+03'::timestamptz, 'מרכז', 'system', 'מערכת', 'evt-104', 'status_change', 'סטטוס האירוע עודכן ל"בטיפול"', 'success'),
    (0, '2026-10-20 12:26:00+03'::timestamptz, 'מרכז', 'user', 'ד. כהן', 'evt-104', 'checklist_task_done', 'בוצע: הזנקת כוחות רפואה והצלה בהתאם לצורך.', 'success'),
    (0, '2026-10-20 12:28:00+03'::timestamptz, 'מרכז', 'user', 'ד. כהן', 'evt-104', 'note_added', 'צוותי חילוץ באתר; שני לכודים חולצו.', 'success'),
    (0, '2026-10-20 12:30:00+03'::timestamptz, 'מרכז', 'system', 'מערכת', 'evt-103', 'event_ingested', 'האירוע נקלט מ-3 מקורות פומביים', 'success'),
    (0, '2026-10-20 12:30:00+03'::timestamptz, 'מרכז', 'user', 'ד. כהן', 'evt-104', 'recommendation', 'המלצה: לבחון תגבור כוח חילוץ נוסף לאתר', 'success'),
    (0, '2026-10-20 12:40:00+03'::timestamptz, 'מרכז', 'system', 'מערכת', 'evt-107', 'event_ingested', 'האירוע נקלט בזמן אמת מ-1 מקורות', 'success'),
    (0, '2026-10-20 12:52:00+03'::timestamptz, 'מרכז', 'user', 'ד. כהן', NULL, 'mode_change', 'מעבר למצב אמת', 'success')
) AS seed (reality_id, occurred_at, sector, actor_type, user_name, event_id, action_type, action, outcome)
WHERE NOT EXISTS (SELECT 1 FROM audit_log);
