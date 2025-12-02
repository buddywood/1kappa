import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getAllIndustries, getIndustryById, createIndustry, updateIndustry, deleteIndustry } from '../db/queries-sequelize';
import { authenticate, requireAdmin } from '../middleware/auth';

const router: Router = Router();

// GET /api/industries - Get all active industries (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const industries = await getAllIndustries(includeInactive);
    console.log(`Fetched ${industries.length} industries (includeInactive: ${includeInactive})`);
    res.json(industries);
  } catch (error: any) {
    console.error('Error fetching industries:', error);
    // Check if table doesn't exist
    if (error.code === '42P01') {
      return res.status(500).json({ 
        error: 'Industries table does not exist. Please run database migrations.',
        code: 'TABLE_NOT_FOUND'
      });
    }
    res.status(500).json({ 
      error: 'Failed to fetch industries',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/industries/:id - Get industry by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid industry ID' });
    }
    const industry = await getIndustryById(id);
    if (!industry) {
      return res.status(404).json({ error: 'Industry not found' });
    }
    res.json(industry);
  } catch (error) {
    console.error('Error fetching industry:', error);
    res.status(500).json({ error: 'Failed to fetch industry' });
  }
});

// POST /api/industries - Create new industry (admin only)
router.post('/', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, display_order, is_active } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Industry name is required' });
    }

    const industry = await createIndustry({
      name: name.trim(),
      display_order: display_order !== undefined ? parseInt(display_order) : undefined,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    res.status(201).json(industry);
  } catch (error: any) {
    console.error('Error creating industry:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'Industry with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create industry' });
  }
});

// PUT /api/industries/:id - Update industry (admin only)
router.put('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid industry ID' });
    }

    const { name, display_order, is_active } = req.body;
    const updates: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Industry name must be a non-empty string' });
      }
      updates.name = name.trim();
    }

    if (display_order !== undefined) {
      updates.display_order = parseInt(display_order);
      if (isNaN(updates.display_order)) {
        return res.status(400).json({ error: 'Display order must be a number' });
      }
    }

    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const industry = await updateIndustry(id, updates);
    if (!industry) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    res.json(industry);
  } catch (error: any) {
    console.error('Error updating industry:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Industry with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update industry' });
  }
});

// DELETE /api/industries/:id - Delete industry (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid industry ID' });
    }

    const deleted = await deleteIndustry(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Industry not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting industry:', error);
    res.status(500).json({ error: 'Failed to delete industry' });
  }
});

export default router;

