import L from 'leaflet';
import type { EventItem } from '../types/event';

export async function ensureLeafletHeat(): Promise<void> {
  if (typeof window === 'undefined') return;
  (window as unknown as { L: typeof L }).L = L;
  (globalThis as unknown as { L: typeof L }).L = L;
  if (!('heatLayer' in L)) {
    await import('leaflet.heat');
  }
}

/**
 * Validate that coordinates are finite, non-null numbers within valid WGS84 ranges.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Derives normalized point heat intensity for an event.
 * Threat levels range 0-100; single events have intensity ~0.4-0.8.
 * When multiple events are near each other (e.g. 8 events in Gush Dan),
 * leaflet.heat's additive alpha blending compounds to 1.0 (deep crimson),
 * while smaller clusters (2 events in Jerusalem) reach moderate warm heat (orange/red),
 * perfectly reflecting geographic event concentration.
 */
export function getEventHeatIntensity(event: EventItem): number {
  const threat =
    typeof event.threat_level === 'number' && !isNaN(event.threat_level)
      ? Math.max(0, Math.min(100, event.threat_level))
      : 50;
  return 0.35 + (threat / 100) * 0.45;
}

/**
 * Extracts and formats valid event coordinates as [lat, lng, intensity] tuples for L.heatLayer.
 */
export function extractHeatPoints(events?: EventItem[]): Array<[number, number, number]> {
  if (!events || !Array.isArray(events)) return [];
  return events
    .filter((e) => isValidCoordinate(e.lat, e.lng))
    .map((e) => [e.lat as number, e.lng as number, getEventHeatIntensity(e)]);
}

/**
 * Heatmap visual configuration inspired by the Figma reference:
 * - Soft cyan / sky blue halo on the outer edge
 * - Smooth transition through emerald/mint, yellow, orange
 * - Rich red to deep crimson core for high event concentration
 * - Tuned radius and blur for smooth organic blending at tactical zoom
 */
export const FIGMA_HEATMAP_OPTIONS: L.HeatMapOptions = {
  radius: 40,
  blur: 28,
  maxZoom: 11,
  max: 1.0,
  minOpacity: 0.08,
  gradient: {
    0.15: '#38bdf8', // Light sky blue halo
    0.35: '#34d399', // Mint / light green
    0.50: '#facc15', // Warm yellow
    0.65: '#fb923c', // Orange
    0.80: '#ef4444', // Bright red
    0.95: '#991b1b', // Deep crimson
    1.00: '#7f1d1d', // Dark red core
  },
};
