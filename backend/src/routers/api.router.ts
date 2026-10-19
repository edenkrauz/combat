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

/**
 * @openapi
 * components:
 *   schemas:
 *     EventType:
 *       type: object
 *       required: [event_type_id, display_name, tasks]
 *       properties:
 *         event_type_id:
 *           type: string
 *           example: security_tension
 *         display_name:
 *           type: string
 *           example: Security tension
 *         tasks:
 *           type: array
 *           items:
 *             type: string
 *     Event:
 *       type: object
 *       properties:
 *         event_id:
 *           type: string
 *           example: INC-2060
 *         reality_id:
 *           type: integer
 *           example: 1
 *         version:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [open, in progress, closed]
 *         event_type_id:
 *           type: string
 *         is_deleted:
 *           type: boolean
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         notes:
 *           type: string
 *         sector:
 *           type: string
 *         sector_description:
 *           type: string
 *         start_time:
 *           type: string
 *           format: date-time
 *         red_injured_count:
 *           type: integer
 *         red_death_count:
 *           type: integer
 *         blue_injured_count:
 *           type: integer
 *         blue_death_count:
 *           type: integer
 *         threat_level:
 *           type: integer
 *         deployed_forces:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         event_type:
 *           allOf:
 *             - $ref: '#/components/schemas/EventType'
 *           nullable: true
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List events
 *     description: Returns all non-deleted events with their category and task list.
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Events returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
apiRouter.get('/events', async (_: Request, res: Response) => {
  res.json(await getEvents());
});

/**
 * @openapi
 * /events/{eventId}/{realityId}:
 *   get:
 *     summary: Get an event
 *     description: Returns one non-deleted event and its category task list.
 *     tags: [Events]
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: INC-2060
 *       - name: realityId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Event returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: The realityId must be an integer.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @openapi
 * /events/{eventId}/{realityId}/status:
 *   patch:
 *     summary: Update event status
 *     description: Changes the status of an event.
 *     tags: [Events]
 *     parameters:
 *       - name: eventId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         example: INC-2060
 *       - name: realityId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in progress, closed]
 *                 example: in progress
 *     responses:
 *       200:
 *         description: Event status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid realityId or status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
