import { pool } from '../config/database.ts';
import type { EventRecord, EventResponse, EventStatus } from '../types/event.types.ts';

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

export async function addEvent(event: EventRecord): Promise<EventResponse> {
  const { rows } = await pool.query<EventResponse>(
    `
      WITH inserted AS (
        INSERT INTO events (
          event_id,
          reality_id,
          version,
          status,
          categories,
          is_deleted,
          title,
          description,
          notes,
          sector,
          sector_description,
          start_time,
          red_injured_count,
          red_death_count,
          blue_injured_count,
          blue_death_count,
          threat_level,
          deployed_forces,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *
      )
      SELECT ${eventSelection}
      FROM inserted e
    `,
    [
      event.event_id,
      event.reality_id,
      event.version,
      toDatabaseStatus(event.status),
      event.categories,
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
      event.created_at,
      event.updated_at,
    ],
  );

  const insertedEvent = rows[0];
  if (!insertedEvent) {
    throw new Error('The event insert completed without returning a row');
  }
  return insertedEvent;
}

export async function updateEvent(
  eventId: string,
  realityId: number,
  event: EventRecord,
): Promise<EventResponse | undefined> {
  const { rows } = await pool.query<EventResponse>(
    `
      WITH updated AS (
        UPDATE events
        SET
          version = $3,
          status = $4,
          categories = $5,
          is_deleted = $6,
          title = $7,
          description = $8,
          notes = $9,
          sector = $10,
          sector_description = $11,
          start_time = $12,
          red_injured_count = $13,
          red_death_count = $14,
          blue_injured_count = $15,
          blue_death_count = $16,
          threat_level = $17,
          deployed_forces = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE event_id = $1 AND reality_id = $2 AND is_deleted = false
        RETURNING *
      )
      SELECT ${eventSelection}
      FROM updated e
    `,
    [
      eventId,
      realityId,
      event.version,
      toDatabaseStatus(event.status),
      event.categories,
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
    ],
  );
  return rows[0];
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

