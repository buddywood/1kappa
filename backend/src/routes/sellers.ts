import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createSeller, getActiveProducts } from '../db/queries';
import pool from '../db/connection';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const sellerApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  membership_number: z.string().min(1),
  initiated_chapter_id: z.number().int().positive(),
  sponsoring_chapter_id: z.number().int().positive(),
  business_name: z.string().optional().nullable(),
  vendor_license_number: z.string().min(1),
  social_links: z.record(z.string()).optional(),
});

router.post('/apply', upload.single('headshot'), async (req: Request, res: Response) => {
  try {
    // Validate request body
    const body = sellerApplicationSchema.parse({
      ...req.body,
      initiated_chapter_id: parseInt(req.body.initiated_chapter_id),
      sponsoring_chapter_id: parseInt(req.body.sponsoring_chapter_id),
      business_name: req.body.business_name || null,
      vendor_license_number: req.body.vendor_license_number,
      social_links: req.body.social_links ? JSON.parse(req.body.social_links) : {},
    });

    // Upload headshot to S3
    let headshotUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'headshots'
      );
      headshotUrl = uploadResult.url;
    }

    // Create seller record
    const seller = await createSeller({
      ...body,
      headshot_url: headshotUrl,
      social_links: body.social_links || {},
    });

    res.status(201).json(seller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating seller application:', error);
    res.status(500).json({ error: 'Failed to create seller application' });
  }
});

// Get all approved sellers with their products for collections page
// Note: This must come after POST /apply to avoid route conflicts
router.get('/collections', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.business_name,
        s.headshot_url,
        s.initiated_chapter_id,
        s.sponsoring_chapter_id,
        s.membership_number,
        s.social_links,
        COUNT(p.id) as product_count
      FROM sellers s
      LEFT JOIN products p ON s.id = p.seller_id
      WHERE s.status = 'APPROVED'
      GROUP BY s.id, s.name, s.business_name, s.headshot_url, s.initiated_chapter_id, s.sponsoring_chapter_id, s.membership_number, s.social_links
      HAVING COUNT(p.id) > 0
      ORDER BY s.name ASC`
    );
    
    // For each seller, get their products
    const sellersWithProducts = await Promise.all(
      result.rows.map(async (seller) => {
        const productsResult = await pool.query(
          'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
          [seller.id]
        );
        // Parse social_links if it's a string
        const socialLinks = typeof seller.social_links === 'string' 
          ? JSON.parse(seller.social_links) 
          : (seller.social_links || {});
        
        return {
          ...seller,
          social_links: socialLinks,
          products: productsResult.rows,
        };
      })
    );
    
    res.json(sellersWithProducts);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

export default router;

