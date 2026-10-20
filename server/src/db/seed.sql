-- Seeds for Combat events (Sector: מרכז)
INSERT INTO events (
    reality_id, event_id, version, status, event_type, is_deleted,
    title, description, notes, sector, sector_description, start_time,
    red_injured_count, red_death_count, blue_injured_count, blue_death_count,
    threat_level, deployed_forces
) VALUES
(
    0, 'evt-101', 1, 'open', 'rocket_impact', false,
    'נפילה באזור תעשייה',
    'דיווח ראשוני על נפילה באזור תעשייה ועל פצועים.',
    'מוקד 101',
    'מרכז',
    'מרכז • אזור תעשייה, בת ים',
    '2026-10-19 07:38:00+00',
    NULL, NULL, 2, NULL,
    85, 4
),
(
    0, 'evt-102', 1, 'in_progress', 'interception_debris', false,
    'נפילת רסיסי יירוט ברחוב סואן',
    'רסיסי יירוט נפלו ברחוב מסחרי. דווח על פצוע קל ועל נזק לכלי רכב.',
    'דיווח לתושבים • כוחות בשטח',
    'מרכז',
    'מרכז • רחוב מסחרי, רמת גן',
    '2026-10-19 07:18:00+00',
    NULL, NULL, 1, NULL,
    75, 2
),
(
    0, 'evt-103', 1, 'in_progress', 'fire_hazard', false,
    'שריפה כתוצאה מנפילת נפל',
    'שריפת קוצים ושיחים בשטח פתוח ליד מחלף בעקבות יירוט מוצלח.',
    'כיבוי והצלה • מוקד 102',
    'מרכז',
    'מרכז • מחלף גנות',
    '2026-10-19 06:55:00+00',
    NULL, NULL, 0, NULL,
    50, 3
),
(
    0, 'evt-104', 1, 'open', 'building_damage', false,
    'נזק למבנה מגורים',
    'פגיעה ישירה של רסיס כבד בגג בניין מגורים, כוחות סורקים לשלילת נפגעים.',
    'פיקוד העורף',
    'מרכז',
    'מרכז • שכונת בורוכוב, גבעתיים',
    '2026-10-19 06:42:00+00',
    NULL, NULL, 4, NULL,
    80, 6
),
(
    0, 'evt-105', 1, 'closed', 'uav_interception', false,
    'התרעת חדירה למרחב האווירי',
    'זיהוי כלי טיס חשוד במרחב החוף הדרומי של גוש דן, יירוט בוצע בהצלחה.',
    'חיל האוויר',
    'מרכז',
    'מרכז • קו חוף ראשון לציון',
    '2026-10-19 06:15:00+00',
    NULL, NULL, 0, NULL,
    45, 1
),
(
    0, 'evt-106', 1, 'closed', 'traffic_block', false,
    'חסימת ציר תנועה ראשי',
    'חסימת כביש 4 לצפון עקב טיפול בנפל על ידי חבלני משטרה.',
    'משטרת ישראל • אגף התנועה',
    'מרכז',
    'מרכז • כביש 4, מחלף גהה',
    '2026-10-19 05:50:00+00',
    NULL, NULL, 0, NULL,
    25, 2
),
(
    0, 'evt-107', 1, 'open', 'smoke_hazard', false,
    'דיווח על עשן סמיך במתחם לוגיסטי',
    'עשן כבד עולה ממחסן לוגיסטי, נבדק חשד לפגיעת רסיס משני.',
    'מוקד 102',
    'מרכז',
    'מרכז • אזור תעשייה, פתח תקווה',
    '2026-10-19 05:30:00+00',
    NULL, NULL, 0, NULL,
    55, 2
),
(
    0, 'evt-108', 1, 'closed', 'medical_panic', false,
    'טיפול בנפגע חרדה',
    'צוותי רפואה מעניקים טיפול רפואי ורגשי לנפגע חרדה בעקבות שמיעת פיצוצים.',
    'מד״א • מוקד 101',
    'מרכז',
    'מרכז • מרכז העיר, חולון',
    '2026-10-19 05:12:00+00',
    NULL, NULL, 1, NULL,
    20, 1
)
ON CONFLICT (reality_id, event_id) DO NOTHING;

-- Seeds for audit log (Sector: מרכז). Skipped when the log already has rows, so re-running is safe
INSERT INTO audit_log (reality_id, occurred_at, sector, actor_type, user_name, event_id, action_type, action, outcome)
SELECT * FROM (VALUES
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
