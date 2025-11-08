import { Router, Request, Response } from 'express';
import { getAllChapters } from '../db/queries';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const chapters = await getAllChapters();
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

export default router;

