import { analysisModel, getAiClient } from '../config/ai.ts';
import { pool } from '../config/database.ts';
import type { EventAnalysis } from '../types/event-analysis.types.ts';
import type { EventResponse } from '../types/event.types.ts';
import {
  AnalysisFormatError,
  buildAnalysisMessages,
  parseAnalysisResponse,
} from './event-analysis.prompt.ts';
import { getEvent } from './events.service.ts';
import type { TaskCategoryTasks } from './task-categories.service.ts';

export { AnalysisFormatError };

const MAX_CANDIDATES = 30;
const MAX_CACHE_ENTRIES = 200;

/**
 * Events from the days before the target event (same reality), as candidates
 * for "similar events". Same sector and shared categories rank first, then
 * the most recent. Events without a start_time are anchored to now.
 * The column list mirrors eventSelection in events.service.ts.
 */
async function getSimilarEventCandidates(
  eventId: string,
  realityId: number,
  windowDays: number,
): Promise<EventResponse[]> {
  const { rows } = await pool.query<EventResponse>(
    `
      WITH target AS (
        SELECT event_id, reality_id, sector, categories,
          COALESCE(start_time, CURRENT_TIMESTAMP) AS anchor
        FROM events
        WHERE event_id = $1 AND reality_id = $2 AND is_deleted = false
      )
      SELECT
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
      FROM events e
      JOIN target t ON e.reality_id = t.reality_id AND e.event_id <> t.event_id
      WHERE e.is_deleted = false
        AND e.start_time >= t.anchor - make_interval(days => $3)
        AND e.start_time < t.anchor
      ORDER BY
        (e.sector IS NOT DISTINCT FROM t.sector) DESC,
        cardinality(ARRAY(
          SELECT unnest(e.categories) INTERSECT SELECT unnest(t.categories)
        )) DESC,
        e.start_time DESC
      LIMIT $4
    `,
    [eventId, realityId, windowDays, MAX_CANDIDATES],
  );
  return rows;
}

/**
 * The checklist templates of the categories an event belongs to.
 * events.categories holds category IDs, display names or English names, so
 * all three are matched. Other tags (e.g. "security") have no checklist.
 */
async function getEventChecklists(
  eventId: string,
  realityId: number,
): Promise<TaskCategoryTasks[]> {
  const { rows } = await pool.query<TaskCategoryTasks>(
    `
      WITH event_category AS (
        SELECT unnest(categories) AS name
        FROM events
        WHERE event_id = $1 AND reality_id = $2 AND is_deleted = false
      )
      SELECT category_id, display_name,
        COALESCE(tasks, ARRAY[]::text[]) AS tasks,
        cardinality(COALESCE(tasks, ARRAY[]::text[])) AS task_count
      FROM event_categories
      WHERE EXISTS (
        SELECT 1 FROM event_category
        WHERE event_category.name = category_id::text
          OR event_category.name = display_name
          OR lower(event_category.name) = lower(english_name)
      )
      ORDER BY category_id
    `,
    [eventId, realityId],
  );
  return rows;
}

// Each AI call takes seconds and costs money, so results are kept until the
// event or one of its candidate events changes (a new version or a new event
// changes the key). Pending calls are shared, so double clicks cost one call.
const cache = new Map<string, Promise<Omit<EventAnalysis, 'cached'>>>();

function remember(
  key: string,
  analysis: Promise<Omit<EventAnalysis, 'cached'>>,
) {
  cache.delete(key);
  cache.set(key, analysis);
  // Forget failures so the next click retries, unless a newer call took the slot.
  analysis.catch(() => {
    if (cache.get(key) === analysis) cache.delete(key);
  });
  // Map keeps insertion order, so the first key is the least recently used.
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export interface AnalyzeOptions {
  windowDays: number;
  /** Skip the cache and ask the model again. */
  refresh?: boolean;
}

export async function analyzeEvent(
  eventId: string,
  realityId: number,
  { windowDays, refresh = false }: AnalyzeOptions,
): Promise<EventAnalysis | undefined> {
  // Fails fast with AiNotConfiguredError before touching the database.
  const ai = getAiClient();

  const event = await getEvent(eventId, realityId);
  if (!event) return undefined;

  const [candidates, checklists] = await Promise.all([
    getSimilarEventCandidates(eventId, realityId, windowDays),
    getEventChecklists(eventId, realityId),
  ]);

  const key = [
    analysisModel,
    windowDays,
    `${event.reality_id}:${event.event_id}:${event.version}`,
    ...candidates.map((c) => `${c.event_id}:${c.version}`).sort(),
    ...checklists.map((c) => `${c.category_id}:${c.tasks.join('|')}`),
  ].join('\n');

  const cached = refresh ? undefined : cache.get(key);
  if (cached) {
    remember(key, cached);
    return { ...(await cached), cached: true };
  }

  const analysis = (async () => {
    const completion = await ai.chat.completions.create({
      model: analysisModel,
      messages: buildAnalysisMessages(event, candidates, checklists),
      max_tokens: 2000,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new AnalysisFormatError('The AI returned an empty response');
    }
    return {
      event_id: event.event_id,
      reality_id: event.reality_id,
      event_version: event.version,
      model: analysisModel,
      generated_at: new Date().toISOString(),
      window_days: windowDays,
      candidates_considered: candidates.length,
      ...parseAnalysisResponse(content, candidates),
    };
  })();
  remember(key, analysis);
  return { ...(await analysis), cached: false };
}
