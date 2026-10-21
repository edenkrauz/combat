import { useCallback, useEffect, useState } from 'react';
import { getEventAnalysis, type EventAnalysis } from '../api/eventAnalysis';
import type { EventItem } from '../types/event';

export type EventAnalysisState =
  | { status: 'loading' }
  | { status: 'ready'; analysis: EventAnalysis }
  | { status: 'error'; error: string };

/**
 * Loads the AI analysis as soon as an event is opened, so the similar events
 * count is known before the tab is clicked. The backend caches results, so
 * reopening an event is instant. Reloads when the event changes (new version).
 */
export function useEventAnalysis(
  event: Pick<EventItem, 'event_id' | 'reality_id' | 'version'>,
) {
  const [refreshCount, setRefreshCount] = useState(0);
  // The result remembers which request it answers; anything else is still loading.
  const [result, setResult] = useState<{ key: string; state: EventAnalysisState }>();
  const { event_id, reality_id, version } = event;
  const key = `${reality_id}:${event_id}:${version}:${refreshCount}`;

  useEffect(() => {
    const controller = new AbortController();
    getEventAnalysis(
      { event_id, reality_id },
      { refresh: refreshCount > 0, signal: controller.signal },
    )
      .then((analysis) => setResult({ key, state: { status: 'ready', analysis } }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          key,
          state: {
            status: 'error',
            error: error instanceof Error ? error.message : 'טעינת הניתוח נכשלה',
          },
        });
      });
    return () => controller.abort();
  }, [key, event_id, reality_id, refreshCount]);

  const retry = useCallback(() => setRefreshCount((count) => count + 1), []);
  const state: EventAnalysisState =
    result?.key === key ? result.state : { status: 'loading' };

  return { state, retry };
}
