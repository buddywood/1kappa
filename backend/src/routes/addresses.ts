import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserAddresses,
  getDefaultUserAddress,
  getUserAddressById,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultAddress,
} from '../db/queries-addresses';
import { z } from 'zod';

const router: ExpressRouter = Router();

const addressSchema = z.object({
  label: z.string().max(100).optional().nullable(),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  country: z.string().length(2).default('US'),
  is_default: z.boolean().optional(),
});

/**
 * GET /api/addresses
 * Get all addresses for the authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const addresses = await getUserAddresses(req.user!.id);
    res.json({ addresses });
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

/**
 * GET /api/addresses/default
 * Get the default address for the authenticated user
 */
router.get('/default', authenticate, async (req: Request, res: Response) => {
  try {
    const address = await getDefaultUserAddress(req.user!.id);
    if (!address) {
      return res.status(404).json({ error: 'No default address found' });
    }
    res.json({ address });
  } catch (error) {
    console.error('Error fetching default address:', error);
    res.status(500).json({ error: 'Failed to fetch default address' });
  }
});

/**
 * GET /api/addresses/:id
 * Get a specific address by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }

    const address = await getUserAddressById(addressId, req.user!.id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ error: 'Failed to fetch address' });
  }
});

/**
 * POST /api/addresses
 * Create a new address
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const body = addressSchema.safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: body.error.errors,
      });
    }

    const address = await createUserAddress({
      user_id: req.user!.id,
      ...body.data,
    });

    res.status(201).json({ address });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

/**
 * PUT /api/addresses/:id
 * Update an existing address
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }

    const body = addressSchema.partial().safeParse(req.body);
    if (!body.success) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: body.error.errors,
      });
    }

    const address = await updateUserAddress(addressId, req.user!.id, body.data);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }

    const deleted = await deleteUserAddress(addressId, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

/**
 * POST /api/addresses/:id/set-default
 * Set an address as the default
 */
router.post('/:id/set-default', authenticate, async (req: Request, res: Response) => {
  try {
    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: 'Invalid address ID' });
    }

    const address = await setDefaultAddress(addressId, req.user!.id);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ address });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

export default router;

