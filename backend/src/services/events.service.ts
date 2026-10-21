import { pool } from '../config/database.ts';
import type { EventResponse, EventStatus } from '../types/event.types.ts';

const eventSelection = `
  e.event_id,
  e.reality_id,
  e.version,
  CASE e.status WHEN 'in_progress' THEN 'in progress' ELSE e.status END AS status,
  ARRAY(
    SELECT COALESCE(category.display_name, event_category.name)
    FROM unnest(e.categories) WITH ORDINALITY AS event_category(name, position)
    LEFT JOIN event_categories category
      ON category.category_id::text = event_category.name
    ORDER BY event_category.position
  ) AS categories,
  e.is_deleted,
  e.title,
  e.description,
  e.notes,
  e.sector,
  e.sector_description,
  e.start_time::text AS start_time,
  e.red_injured_count,
  e.red_death_count,
  e.blue_injured_count,
  e.blue_death_count,
  e.threat_level,
  e.deployed_forces,
  e.created_at::text AS created_at,
  e.updated_at::text AS updated_at
`;

function toDatabaseStatus(status: EventStatus): string {
  return status === 'in progress' ? 'in_progress' : status;
}

export async function getEvents(): Promise<EventResponse[]> {
  const { rows } = await pool.query<EventResponse>(`
    SELECT ${eventSelection}
    FROM events e
    WHERE e.is_deleted = false
    ORDER BY e.start_time DESC
  `);
  return rows;
}

export async function getEvent(
  eventId: string,
  realityId: number,
): Promise<EventResponse | undefined> {
  const { rows } = await pool.query<EventResponse>(
    `
      SELECT ${eventSelection}
      FROM events e
      WHERE e.event_id = $1 AND e.reality_id = $2 AND e.is_deleted = false
      LIMIT 1
    `,
    [eventId, realityId],
  );
  return rows[0];
}

export async function updateEventStatus(
  eventId: string,
  realityId: number,
  status: EventStatus,
): Promise<EventResponse | undefined> {
  const { rows } = await pool.query<EventResponse>(
    `
      WITH updated AS (
        UPDATE events
        SET status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $1 AND reality_id = $2 AND is_deleted = false
        RETURNING *
      )
      SELECT ${eventSelection}
      FROM updated e
    `,
    [eventId, realityId, toDatabaseStatus(status)],
  );
  return rows[0];
}
