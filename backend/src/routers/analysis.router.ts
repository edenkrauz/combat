import { type Request, type Response, Router } from 'express';
import OpenAI from 'openai';

import { AiNotConfiguredError } from '../config/ai.ts';
import {
  AnalysisFormatError,
  analyzeEvent,
} from '../services/event-analysis.service.ts';

const analysisRouter = Router();

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 30;

function getWindowDays(value: unknown): number | undefined {
  if (value === undefined) return DEFAULT_WINDOW_DAYS;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  const days = Number(value);
  return days >= 1 && days <= MAX_WINDOW_DAYS ? days : undefined;
}

/** Maps AI failures to a status and a message the UI can show. */
function getAnalysisError(
  err: unknown,
): { status: number; error: string } | undefined {
  if (err instanceof AiNotConfiguredError) {
    return {
      status: 503,
      error: 'AI analysis is not configured on the server',
    };
  }
  // Timeout extends APIConnectionError, so it must be checked first.
  if (err instanceof OpenAI.APIConnectionTimeoutError) {
    return { status: 504, error: 'The AI took too long to answer, try again' };
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return { status: 503, error: 'The AI gateway is unreachable' };
  }
  if (err instanceof OpenAI.RateLimitError) {
    return { status: 503, error: 'The AI is busy, try again shortly' };
  }
  if (err instanceof OpenAI.APIError) {
    return {
      status: 502,
      error: `The AI gateway returned an error: ${err.message}`,
    };
  }
  if (err instanceof AnalysisFormatError) {
    return { status: 502, error: err.message };
  }
  return undefined;
}

/**
 * GET /events/:eventId/:realityId/analysis?days=7&refresh=true
 * AI analysis of an event: similar nearby events and recommended actions.
 * days: look for similar events in this many days before the event (1-30, default 7).
 * refresh=true: skip the cache and ask the AI again.
 */
analysisRouter.get(
  '/events/:eventId/:realityId/analysis',
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    if (typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId must be a string' });
    }

    const realityId = Number(req.params.realityId);
    if (!Number.isInteger(realityId)) {
      return res.status(400).json({ error: 'realityId must be an integer' });
    }

    const windowDays = getWindowDays(req.query.days);
    if (windowDays === undefined) {
      return res.status(400).json({
        error: `days must be an integer from 1 to ${MAX_WINDOW_DAYS}`,
      });
    }

    try {
      const analysis = await analyzeEvent(eventId, realityId, {
        windowDays,
        refresh: req.query.refresh === 'true',
      });
      if (!analysis) {
        return res.status(404).json({ error: 'Event not found' });
      }
      return res.json(analysis);
    } catch (err) {
      const analysisError = getAnalysisError(err);
      if (!analysisError) throw err;
      return res
        .status(analysisError.status)
        .json({ error: analysisError.error });
    }
  },
);

export default analysisRouter;
