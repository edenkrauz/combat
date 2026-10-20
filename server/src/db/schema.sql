-- ====================================================================
-- DataForge / Combat Database Schema
-- Aligned with schemas.html (Aligned 19.10.2026)
-- Database: PostgreSQL (with optional pgvector for content embeddings)
-- ====================================================================

-- Optional: enable pgvector if available
-- CREATE EXTENSION IF NOT EXISTS vector;

-- 1. EVENT table (topic: events.state)
CREATE TABLE IF NOT EXISTS events (
    reality_id INT NOT NULL DEFAULT 0, -- 0 = real; non-zero for Cobra simulated
    event_id VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1, -- +1 on every change
    status VARCHAR(50) NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')),
    event_type VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Logical delete: apps hide it
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    sector VARCHAR(100) NOT NULL, -- e.g. 'מרכז'
    sector_description VARCHAR(255), -- e.g. 'מרכז • אזור תעשייה, בת ים'
    start_time TIMESTAMPTZ NOT NULL, -- UTC
    red_injured_count INT, -- NULL = unknown, 0 = reported zero
    red_death_count INT,
    blue_injured_count INT,
    blue_death_count INT,
    threat_level INT NOT NULL DEFAULT 0 CHECK (threat_level BETWEEN 0 AND 100),
    deployed_forces INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Embedding columns (pgvector)
    -- content_embedding vector(1536),
    -- full_embedding vector(1536),
    embedding_error TEXT,
    embedded_at TIMESTAMPTZ,
    PRIMARY KEY (reality_id, event_id)
);

-- Index for fast sector lookups
CREATE INDEX IF NOT EXISTS idx_events_sector ON events (reality_id, sector) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_events_status ON events (reality_id, status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events (start_time DESC);

-- 2. EVENT_REPORTS table (topic: events.event_reports)
CREATE TABLE IF NOT EXISTS event_reports (
    reality_id INT NOT NULL DEFAULT 0,
    event_id VARCHAR(255) NOT NULL,
    report_id BIGINT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (reality_id, event_id, report_id)
);

-- 3. AUDIT_LOG table (יומן ביקורת)
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
