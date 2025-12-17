import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { reverseGeocode } from '../services/location';
import { z } from 'zod';

const router: ExpressRouter = Router();

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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid coordinates', details: error.errors });
    }
    
    // Log detailed error information
    console.error('Error reverse geocoding:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    
    // Provide specific error messages for common issues
    let userMessage = 'Failed to reverse geocode location';
    if (error.message?.includes('AWS_LOCATION_PLACE_INDEX_NAME is not configured')) {
      userMessage = 'Location service is not configured. Please contact support.';
    } else if (error.message?.includes('signature') || error.name === 'SignatureDoesNotMatch') {
      userMessage = 'Location service authentication error. Please contact support.';
      console.error('⚠️  AWS Location Signature Error - Check AWS credentials in Heroku config');
    } else if (error.name === 'AccessDeniedException' || error.code === 'AccessDeniedException') {
      userMessage = 'Location service access denied. Please contact support.';
      console.error('⚠️  AWS Location Access Denied - Check IAM permissions for Location service');
    }
    
    res.status(500).json({ error: userMessage });
  }
});

export default router;

