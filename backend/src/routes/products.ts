import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { createProduct, getActiveProducts, getProductById } from '../db/queries';
import { uploadToS3 } from '../services/s3';
import { z } from 'zod';

const router: ExpressRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const createProductSchema = z.object({
  seller_id: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string(),
  price_cents: z.number().int().positive(),
  sponsored_chapter_id: z.number().int().positive().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await getActiveProducts();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await getProductById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const body = createProductSchema.parse({
      ...req.body,
      seller_id: parseInt(req.body.seller_id),
      price_cents: parseInt(req.body.price_cents),
      sponsored_chapter_id: req.body.sponsored_chapter_id ? parseInt(req.body.sponsored_chapter_id) : undefined,
    });

    // Upload image to S3
    let imageUrl: string | undefined;
    if (req.file) {
      const uploadResult = await uploadToS3(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'products'
      );
      imageUrl = uploadResult.url;
    }

    const product = await createProduct({
      ...body,
      image_url: imageUrl,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;

