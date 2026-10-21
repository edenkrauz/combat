import { type Request, type Response, Router } from 'express';

import {
  getEvent,
  getEvents,
  updateEventStatus,
} from '../services/events.service.ts';
import {
  addCategoryTask,
  deleteCategoryTask,
  getTaskCategories,
  getTaskCategory,
  moveCategoryTask,
} from '../services/task-categories.service.ts';
import { EVENT_STATUSES, type EventStatus } from '../types/event.types.ts';

const apiRouter = Router();

function isEventStatus(status: unknown): status is EventStatus {
  return (
    typeof status === 'string' &&
    EVENT_STATUSES.some((eventStatus) => eventStatus === status)
  );
}

function getCategoryId(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return undefined;
  const categoryId = Number(value);
  return Number.isSafeInteger(categoryId) && categoryId > 0
    ? categoryId
    : undefined;
}

function isTaskIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/**
 * @openapi
 * components:
 *   schemas:
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
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: Hebrew display names from event_categories.
 *         is_deleted:
 *           type: boolean
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         sector:
 *           type: string
 *           nullable: true
 *         sector_description:
 *           type: string
 *           nullable: true
 *         start_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         red_injured_count:
 *           type: integer
 *           nullable: true
 *         red_death_count:
 *           type: integer
 *           nullable: true
 *         blue_injured_count:
 *           type: integer
 *           nullable: true
 *         blue_death_count:
 *           type: integer
 *           nullable: true
 *         threat_level:
 *           type: number
 *           nullable: true
 *         deployed_forces:
 *           type: number
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *     TaskCategory:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *         display_name:
 *           type: string
 *         task_count:
 *           type: integer
 *     TaskCategoryTasks:
 *       allOf:
 *         - $ref: '#/components/schemas/TaskCategory'
 *         - type: object
 *           properties:
 *             tasks:
 *               type: array
 *               items:
 *                 type: string
 */

/**
 * @openapi
 * /task-categories:
 *   get:
 *     summary: List checklist task categories
 *     tags: [Checklist Tasks]
 *     responses:
 *       200:
 *         description: Categories and task counts.
 */
apiRouter.get('/task-categories', async (_: Request, res: Response) => {
  res.json(await getTaskCategories());
});

/**
 * @openapi
 * /task-categories/{categoryId}/tasks:
 *   get:
 *     summary: List tasks in a checklist category
 *     tags: [Checklist Tasks]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The category task list.
 *       400:
 *         description: Invalid category ID.
 *       404:
 *         description: Category not found.
 *   post:
 *     summary: Add a task to a checklist category
 *     tags: [Checklist Tasks]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [task]
 *             properties:
 *               task:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Updated category task list.
 *       400:
 *         description: Invalid category ID or task.
 *       404:
 *         description: Category not found.
 */
apiRouter.get(
  '/task-categories/:categoryId/tasks',
  async (req: Request, res: Response) => {
    const categoryId = getCategoryId(req.params.categoryId);
    if (categoryId === undefined) {
      return res.status(400).json({ error: 'categoryId must be a positive integer' });
    }
    const category = await getTaskCategory(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Task category not found' });
    }
    return res.json(category);
  },
);

apiRouter.post(
  '/task-categories/:categoryId/tasks',
  async (req: Request, res: Response) => {
    const categoryId = getCategoryId(req.params.categoryId);
    if (categoryId === undefined) {
      return res.status(400).json({ error: 'categoryId must be a positive integer' });
    }
    const body: unknown = req.body;
    const task =
      typeof body === 'object' && body !== null && 'task' in body
        ? body.task
        : undefined;
    if (typeof task !== 'string' || !task.trim() || task.trim().length > 500) {
      return res.status(400).json({
        error: 'task must contain between 1 and 500 characters',
      });
    }
    const category = await addCategoryTask(categoryId, task.trim());
    if (!category) {
      return res.status(404).json({ error: 'Task category not found' });
    }
    return res.status(201).json(category);
  },
);

/**
 * @openapi
 * /task-categories/{categoryId}/tasks/reorder:
 *   patch:
 *     summary: Reorder a task within its category
 *     tags: [Checklist Tasks]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fromIndex, toIndex]
 *             properties:
 *               fromIndex:
 *                 type: integer
 *                 minimum: 0
 *               toIndex:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Updated category task list.
 *       400:
 *         description: Invalid category ID or task index.
 *       404:
 *         description: Category or task index not found.
 */
apiRouter.patch(
  '/task-categories/:categoryId/tasks/reorder',
  async (req: Request, res: Response) => {
    const categoryId = getCategoryId(req.params.categoryId);
    if (categoryId === undefined) {
      return res.status(400).json({ error: 'categoryId must be a positive integer' });
    }
    const body: unknown = req.body;
    const fromIndex =
      typeof body === 'object' && body !== null && 'fromIndex' in body
        ? body.fromIndex
        : undefined;
    const toIndex =
      typeof body === 'object' && body !== null && 'toIndex' in body
        ? body.toIndex
        : undefined;
    if (!isTaskIndex(fromIndex) || !isTaskIndex(toIndex)) {
      return res.status(400).json({ error: 'fromIndex and toIndex must be non-negative integers' });
    }
    const category = await moveCategoryTask(categoryId, fromIndex, toIndex);
    if (!category) {
      return res.status(404).json({ error: 'Task category or task index not found' });
    }
    return res.json(category);
  },
);

/**
 * @openapi
 * /task-categories/{categoryId}/tasks/{taskIndex}:
 *   delete:
 *     summary: Delete a task from its category by zero-based index
 *     tags: [Checklist Tasks]
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: taskIndex
 *         in: path
 *         required: true
 *         description: Zero-based task index.
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Updated category task list.
 *       400:
 *         description: Invalid category ID or task index.
 *       404:
 *         description: Category or task index not found.
 */
apiRouter.delete(
  '/task-categories/:categoryId/tasks/:taskIndex',
  async (req: Request, res: Response) => {
    const categoryId = getCategoryId(req.params.categoryId);
    const taskIndexParam = req.params.taskIndex;
    const taskIndex =
      typeof taskIndexParam === 'string' && /^\d+$/.test(taskIndexParam)
        ? Number(taskIndexParam)
        : undefined;
    if (
      categoryId === undefined ||
      taskIndex === undefined ||
      !Number.isSafeInteger(taskIndex)
    ) {
      return res.status(400).json({ error: 'categoryId and taskIndex must be valid non-negative integers' });
    }
    const category = await deleteCategoryTask(categoryId, taskIndex);
    if (!category) {
      return res.status(404).json({ error: 'Task category or task index not found' });
    }
    return res.json(category);
  },
);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: List events
 *     description: Returns all non-deleted events with their categories.
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
 *     description: Returns one non-deleted event and its categories.
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
 *       409:
 *         description: A closed event cannot be reopened.
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
      const existingEvent = await getEvent(eventId, realityId);
      if (existingEvent?.status === 'closed' && status !== 'closed') {
        return res.status(409).json({ error: 'A closed event cannot be reopened' });
      }
      return res.status(404).json({ error: 'Event not found' });
    }
    return res.json(event);
  },
);

export default apiRouter;
