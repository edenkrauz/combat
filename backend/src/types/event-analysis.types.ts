import type { EventResponse } from './event.types.ts';

export const MATCH_LEVELS = ['high', 'medium'] as const;
export type MatchLevel = (typeof MATCH_LEVELS)[number];

export interface SimilarEvent {
  event: EventResponse;
  match: MatchLevel;
  /** Short reasons for the match, in Hebrew (e.g. "אותה קטגוריה"). */
  reasons: string[];
}

export interface Insight {
  text: string;
  /** IDs of the similar events the statement is based on. */
  based_on: string[];
}

export interface EventInsights {
  /** דפוסים שזוהו */
  patterns: Insight[];
  /** מסקנות מהעבר */
  lessons: Insight[];
  /** המלצות לטיפול */
  recommendations: Insight[];
}

export interface EventAnalysis {
  event_id: string;
  reality_id: number;
  /** The event version the analysis was made for. */
  event_version: number;
  model: string;
  generated_at: string;
  /** Similar events were searched for in this many days before the event. */
  window_days: number;
  /** How many earlier events were given to the model to compare against. */
  candidates_considered: number;
  similar_events: SimilarEvent[];
  insights: EventInsights;
  /** True when served from the in-memory cache instead of a new AI call. */
  cached: boolean;
}
