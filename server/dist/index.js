"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const eventsRepository_1 = require("./db/eventsRepository");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'combat-backend',
        timestamp: new Date().toISOString(),
    });
});
// GET /api/events - fetch all active events (reality_id = 0)
app.get('/api/events', async (req, res) => {
    try {
        const realityId = Number(req.query.reality_id) || 0;
        const sector = typeof req.query.sector === 'string' ? req.query.sector : undefined;
        const events = await eventsRepository_1.eventsRepository.getEvents(realityId, sector);
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});
// GET /api/events/:event_id - fetch single event
app.get('/api/events/:event_id', async (req, res) => {
    try {
        const realityId = Number(req.query.reality_id) || 0;
        const event = await eventsRepository_1.eventsRepository.getEventById(realityId, req.params.event_id);
        if (!event) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json(event);
    }
    catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});
app.listen(PORT, () => {
    console.log(`Combat backend running on http://localhost:${PORT}`);
});
