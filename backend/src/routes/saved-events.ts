import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { 
  addSavedEvent, 
  removeSavedEvent, 
  isEventSaved, 
  getSavedEventsByUser 
} from '../db/queries-sequelize';
import { authenticate } from '../middleware/auth';

const router: ExpressRouter = Router();

// Get all saved events for the current user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const savedEvents = await getSavedEventsByUser(req.user.email);
    res.json(savedEvents);
  } catch (error) {
    console.error('Error fetching saved events:', error);
    res.status(500).json({ error: 'Failed to fetch saved events' });
  }
});

// Check if an event is saved by the current user
router.get('/check/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const saved = await isEventSaved(req.user.email, eventId);
    res.json({ saved });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ error: 'Failed to check saved status' });
  }
});

// Save an event
router.post('/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const savedEvent = await addSavedEvent(req.user.email, eventId);
    res.json(savedEvent);
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ error: 'Failed to save event' });
  }
});

// Unsave an event
router.delete('/:eventId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const eventId = parseInt(req.params.eventId);
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const removed = await removeSavedEvent(req.user.email, eventId);
    res.json({ removed });
  } catch (error) {
    console.error('Error unsaving event:', error);
    res.status(500).json({ error: 'Failed to unsave event' });
  }
});

export default router;
