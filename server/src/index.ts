import 'dotenv/config'
import express, { Request, Response } from 'express';
import cors from 'cors';
import { eventsRepository } from './db/eventsRepository';
import { auditLogRepository } from './db/auditLogRepository';

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

// GET /api/audit-log - fetch audit log entries for a mode (reality_id) and sector
app.get('/api/audit-log', async (req: Request, res: Response) => {
  try {
    const realityId = Number(req.query.reality_id) || 0;
    const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
    const entries = await auditLogRepository.getEntries(realityId, sector);
    res.json(entries);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// POST /api/audit-log - append one audit log entry
// Body: { sector, actor_type, user_name, action_type, action, reality_id?, event_id?, outcome? }
app.post('/api/audit-log', async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const isText = (value: unknown) => typeof value === 'string' && value.trim() !== '';

  const missing = ['sector', 'actor_type', 'user_name', 'action_type', 'action'].filter((key) => !isText(body[key]));
  if (missing.length > 0) {
    res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    return;
  }

  try {
    const entry = await auditLogRepository.addEntry({
      reality_id: Number(body.reality_id) || 0,
      sector: body.sector,
      actor_type: body.actor_type,
      user_name: body.user_name,
      event_id: isText(body.event_id) ? body.event_id : null,
      action_type: body.action_type,
      action: body.action,
      outcome: body.outcome ?? 'success',
    });
    res.status(201).json(entry);
  } catch (error) {
    // 23514 = CHECK violation (bad actor_type / outcome), 23503 = event_id not in events
    const code = (error as { code?: string }).code;
    if (code === '23514' || code === '23503') {
      res.status(400).json({ error: code === '23503' ? 'Unknown event_id' : 'Invalid actor_type or outcome' });
      return;
    }
    console.error('Error adding audit log entry:', error);
    res.status(500).json({ error: 'Failed to add audit log entry' });
  }
});

app.listen(PORT, () => {
  console.log(`Combat backend running on http://localhost:${PORT}`);
});
