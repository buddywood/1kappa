import { Router, Request, Response } from 'express';
import { reverseGeocode } from '../services/location';
import { z } from 'zod';

const router = Router();

const reverseGeocodeSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Reverse geocode endpoint - convert coordinates to address
router.post('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = reverseGeocodeSchema.parse(req.body);

    const result = await reverseGeocode(latitude, longitude);

    if (!result) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid coordinates', details: error.errors });
    }
    console.error('Error reverse geocoding:', error);
    res.status(500).json({ error: 'Failed to reverse geocode location' });
  }
});

export default router;

