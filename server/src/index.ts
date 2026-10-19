import express, { Request, Response } from 'express';
import cors from 'cors';
import { eventsRepository } from './db/eventsRepository';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'combat-backend',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/events - fetch all active events (reality_id = 0)
app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const realityId = Number(req.query.reality_id) || 0;
    const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
    const events = await eventsRepository.getEvents(realityId, sector);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:event_id - fetch single event
app.get('/api/events/:event_id', async (req: Request, res: Response) => {
  try {
    const realityId = Number(req.query.reality_id) || 0;
    const event = await eventsRepository.getEventById(realityId, req.params.event_id);
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

app.listen(PORT, () => {
  console.log(`Combat backend running on http://localhost:${PORT}`);
});
