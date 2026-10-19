import { type Request, type Response, Router } from 'express';

import {
  EVENT_STATUSES,
  type EventStatus,
  getEvent,
  getEvents,
  updateEventStatus,
} from '../services/events.service.ts';

const apiRouter = Router();

function isEventStatus(status: unknown): status is EventStatus {
  return (
    typeof status === 'string' &&
    EVENT_STATUSES.some((eventStatus) => eventStatus === status)
  );
}

apiRouter.get('/events', async (_: Request, res: Response) => {
  res.json(await getEvents());
});

apiRouter.get(
  '/events/:eventId/:realityId',
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    if (typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId must be a string' });
    }

    const realityId = Number(req.params.realityId);
    if (!Number.isInteger(realityId)) {
      return res.status(400).json({ error: 'realityId must be an integer' });
    }

    const event = await getEvent(eventId, realityId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(event);
  },
);

apiRouter.patch(
  '/events/:eventId/:realityId/status',
  async (req: Request, res: Response) => {
    const { eventId } = req.params;
    if (typeof eventId !== 'string') {
      return res.status(400).json({ error: 'eventId must be a string' });
    }

    const realityId = Number(req.params.realityId);
    if (!Number.isInteger(realityId)) {
      return res.status(400).json({ error: 'realityId must be an integer' });
    }

    const body: unknown = req.body;
    const status =
      typeof body === 'object' && body !== null && 'status' in body
        ? body.status
        : undefined;
    if (!isEventStatus(status)) {
      return res.status(400).json({
        error: `status must be one of: ${EVENT_STATUSES.join(', ')}`,
      });
    }

    const event = await updateEventStatus(eventId, realityId, status);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(event);
  },
);

export default apiRouter;
