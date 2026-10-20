"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRepository = void 0;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
// Optional PG Pool: reads standard PG environment variables or DATABASE_URL
const pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL })
    : null;
// Mock in-memory events store matching schemas.html
let memoryEvents = [
    {
        event_id: 'evt-101',
        reality_id: 0,
        version: 1,
        status: 'open',
        event_type: 'rocket_impact',
        is_deleted: false,
        title: 'נפילה באזור תעשייה',
        description: 'דיווח ראשוני על נפילה באזור תעשייה ועל פצועים.',
        notes: 'מוקד 101',
        sector: 'מרכז',
        sector_description: 'מרכז • אזור תעשייה, בת ים',
        start_time: '2026-10-19T07:38:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 2,
        blue_death_count: null,
        threat_level: 85,
        deployed_forces: 4,
        created_at: '2026-10-19T07:38:10Z',
        updated_at: '2026-10-19T07:38:10Z',
    },
    {
        event_id: 'evt-102',
        reality_id: 0,
        version: 1,
        status: 'in_progress',
        event_type: 'interception_debris',
        is_deleted: false,
        title: 'נפילת רסיסי יירוט ברחוב סואן',
        description: 'רסיסי יירוט נפלו ברחוב מסחרי. דווח על פצוע קל ועל נזק לכלי רכב.',
        notes: 'דיווח לתושבים • כוחות בשטח',
        sector: 'מרכז',
        sector_description: 'מרכז • רחוב מסחרי, רמת גן',
        start_time: '2026-10-19T07:18:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 1,
        blue_death_count: null,
        threat_level: 75,
        deployed_forces: 2,
        created_at: '2026-10-19T07:18:25Z',
        updated_at: '2026-10-19T07:22:00Z',
    },
    {
        event_id: 'evt-103',
        reality_id: 0,
        version: 1,
        status: 'in_progress',
        event_type: 'fire_hazard',
        is_deleted: false,
        title: 'שריפה כתוצאה מנפילת נפל',
        description: 'שריפת קוצים ושיחים בשטח פתוח ליד מחלף בעקבות יירוט מוצלח.',
        notes: 'כיבוי והצלה • מוקד 102',
        sector: 'מרכז',
        sector_description: 'מרכז • מחלף גנות',
        start_time: '2026-10-19T06:55:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 0,
        blue_death_count: null,
        threat_level: 50,
        deployed_forces: 3,
        created_at: '2026-10-19T06:55:12Z',
        updated_at: '2026-10-19T07:05:00Z',
    },
    {
        event_id: 'evt-104',
        reality_id: 0,
        version: 1,
        status: 'open',
        event_type: 'building_damage',
        is_deleted: false,
        title: 'נזק למבנה מגורים',
        description: 'פגיעה ישירה של רסיס כבד בגג בניין מגורים, כוחות סורקים לשלילת נפגעים.',
        notes: 'פיקוד העורף',
        sector: 'מרכז',
        sector_description: 'מרכז • שכונת בורוכוב, גבעתיים',
        start_time: '2026-10-19T06:42:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 4,
        blue_death_count: null,
        threat_level: 80,
        deployed_forces: 6,
        created_at: '2026-10-19T06:42:00Z',
        updated_at: '2026-10-19T06:45:00Z',
    },
    {
        event_id: 'evt-105',
        reality_id: 0,
        version: 1,
        status: 'closed',
        event_type: 'uav_interception',
        is_deleted: false,
        title: 'התרעת חדירה למרחב האווירי',
        description: 'זיהוי כלי טיס חשוד במרחב החוף הדרומי של גוש דן, יירוט בוצע בהצלחה.',
        notes: 'חיל האוויר',
        sector: 'מרכז',
        sector_description: 'מרכז • קו חוף ראשון לציון',
        start_time: '2026-10-19T06:15:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 0,
        blue_death_count: null,
        threat_level: 45,
        deployed_forces: 1,
        created_at: '2026-10-19T06:15:00Z',
        updated_at: '2026-10-19T06:30:00Z',
    },
    {
        event_id: 'evt-106',
        reality_id: 0,
        version: 1,
        status: 'closed',
        event_type: 'traffic_block',
        is_deleted: false,
        title: 'חסימת ציר תנועה ראשי',
        description: 'חסימת כביש 4 לצפון עקב טיפול בנפל על ידי חבלני משטרה.',
        notes: 'משטרת ישראל • אגף התנועה',
        sector: 'מרכז',
        sector_description: 'מרכז • כביש 4, מחלף גהה',
        start_time: '2026-10-19T05:50:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 0,
        blue_death_count: null,
        threat_level: 25,
        deployed_forces: 2,
        created_at: '2026-10-19T05:50:00Z',
        updated_at: '2026-10-19T06:10:00Z',
    },
    {
        event_id: 'evt-107',
        reality_id: 0,
        version: 1,
        status: 'open',
        event_type: 'smoke_hazard',
        is_deleted: false,
        title: 'דיווח על עשן סמיך במתחם לוגיסטי',
        description: 'עשן כבד עולה ממחסן לוגיסטי, נבדק חשד לפגיעת רסיס משני.',
        notes: 'מוקד 102',
        sector: 'מרכז',
        sector_description: 'מרכז • אזור תעשייה, פתח תקווה',
        start_time: '2026-10-19T05:30:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 0,
        blue_death_count: null,
        threat_level: 55,
        deployed_forces: 2,
        created_at: '2026-10-19T05:30:00Z',
        updated_at: '2026-10-19T05:35:00Z',
    },
    {
        event_id: 'evt-108',
        reality_id: 0,
        version: 1,
        status: 'closed',
        event_type: 'medical_panic',
        is_deleted: false,
        title: 'טיפול בנפגע חרדה',
        description: 'צוותי רפואה מעניקים טיפול רפואי ורגשי לנפגע חרדה בעקבות שמיעת פיצוצים.',
        notes: 'מד״א • מוקד 101',
        sector: 'מרכז',
        sector_description: 'מרכז • מרכז העיר, חולון',
        start_time: '2026-10-19T05:12:00Z',
        red_injured_count: null,
        red_death_count: null,
        blue_injured_count: 1,
        blue_death_count: null,
        threat_level: 20,
        deployed_forces: 1,
        created_at: '2026-10-19T05:12:00Z',
        updated_at: '2026-10-19T05:25:00Z',
    },
];
exports.eventsRepository = {
    /**
     * Fetch active events (reality_id = 0, is_deleted = false)
     */
    async getEvents(realityId = 0, sector) {
        if (pool) {
            const query = sector
                ? 'SELECT * FROM events WHERE reality_id = $1 AND is_deleted = FALSE AND sector = $2 ORDER BY start_time DESC'
                : 'SELECT * FROM events WHERE reality_id = $1 AND is_deleted = FALSE ORDER BY start_time DESC';
            const params = sector ? [realityId, sector] : [realityId];
            const res = await pool.query(query, params);
            return res.rows;
        }
        return memoryEvents.filter((e) => e.reality_id === realityId && !e.is_deleted && (!sector || e.sector === sector));
    },
    /**
     * Fetch single event
     */
    async getEventById(realityId, eventId) {
        if (pool) {
            const res = await pool.query('SELECT * FROM events WHERE reality_id = $1 AND event_id = $2 AND is_deleted = FALSE', [realityId, eventId]);
            return res.rows[0] || null;
        }
        return memoryEvents.find((e) => e.reality_id === realityId && e.event_id === eventId && !e.is_deleted) || null;
    },
    /**
     * Upsert event
     */
    async upsertEvent(event) {
        if (pool) {
            const query = `
        INSERT INTO events (
          reality_id, event_id, version, status, event_type, is_deleted,
          title, description, notes, sector, sector_description, start_time,
          red_injured_count, red_death_count, blue_injured_count, blue_death_count,
          threat_level, deployed_forces, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
        )
        ON CONFLICT (reality_id, event_id) DO UPDATE SET
          version = EXCLUDED.version,
          status = EXCLUDED.status,
          event_type = EXCLUDED.event_type,
          is_deleted = EXCLUDED.is_deleted,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          notes = EXCLUDED.notes,
          sector = EXCLUDED.sector,
          sector_description = EXCLUDED.sector_description,
          start_time = EXCLUDED.start_time,
          red_injured_count = EXCLUDED.red_injured_count,
          red_death_count = EXCLUDED.red_death_count,
          blue_injured_count = EXCLUDED.blue_injured_count,
          blue_death_count = EXCLUDED.blue_death_count,
          threat_level = EXCLUDED.threat_level,
          deployed_forces = EXCLUDED.deployed_forces,
          updated_at = NOW()
        RETURNING *;
      `;
            const res = await pool.query(query, [
                event.reality_id,
                event.event_id,
                event.version,
                event.status,
                event.event_type,
                event.is_deleted,
                event.title,
                event.description,
                event.notes,
                event.sector,
                event.sector_description,
                event.start_time,
                event.red_injured_count,
                event.red_death_count,
                event.blue_injured_count,
                event.blue_death_count,
                event.threat_level,
                event.deployed_forces,
            ]);
            return res.rows[0];
        }
        const idx = memoryEvents.findIndex((e) => e.reality_id === event.reality_id && e.event_id === event.event_id);
        if (idx >= 0) {
            memoryEvents[idx] = { ...event, updated_at: new Date().toISOString() };
            return memoryEvents[idx];
        }
        memoryEvents.push(event);
        return event;
    },
};
