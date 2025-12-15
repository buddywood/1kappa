import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import multer from "multer";
import { createPromoter, getPromoterById } from "../db/queries-sequelize";
import { authenticate } from "../middleware/auth";
import { uploadToS3 } from "../services/s3";
import { z } from "zod";

const router: ExpressRouter = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const promoterApplicationSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  membership_number: z.string().min(1),
  initiated_chapter_id: z.number().int().positive(),
  sponsoring_chapter_id: z.number().int().positive().optional(),
  social_links: z.record(z.string()).optional(),
});

router.post(
  "/apply",
  upload.single("headshot"),
  async (req: Request, res: Response) => {
    try {
      // Validate request body
      const body = promoterApplicationSchema.parse({
        ...req.body,
        initiated_chapter_id: parseInt(req.body.initiated_chapter_id),
        sponsoring_chapter_id: req.body.sponsoring_chapter_id
          ? parseInt(req.body.sponsoring_chapter_id)
          : undefined,
        social_links: req.body.social_links
          ? JSON.parse(req.body.social_links)
          : {},
      });

      // Upload headshot to S3
      let headshotUrl: string | undefined;
      if (req.file) {
        const uploadResult = await uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          "headshots"
        );
        headshotUrl = uploadResult.url;
      }

      // Create promoter record
      // user_id will be set when user account is created and linked
      const promoter = await createPromoter({
        user_id: null, // Will be set when user is linked
        email: body.email,
        name: body.name,
        sponsoring_chapter_id: body.sponsoring_chapter_id,
        headshot_url: headshotUrl,
        social_links: body.social_links || {},
      });

      res.status(201).json(promoter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
        return;
      }
      console.error("Error creating promoter application:", error);
      res.status(500).json({ error: "Failed to create promoter application" });
    }
  }
);

// Get current promoter's profile (authenticated promoter)
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.promoterId) {
      return res.status(403).json({ error: "Not a promoter" });
    }

    const promoter = await getPromoterById(req.user.promoterId);
    if (!promoter) {
      return res.status(404).json({ error: "Promoter not found" });
    }
    res.json(promoter);
  } catch (error) {
    console.error("Error fetching promoter profile:", error);
    res.status(500).json({ error: "Failed to fetch promoter profile" });
  }
});

// Update promoter's sponsoring chapter
router.put(
  "/me/sponsoring-chapter",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.user.promoterId) {
        return res.status(403).json({ error: "Not a promoter" });
      }

      const { sponsoring_chapter_id } = req.body;
      if (!sponsoring_chapter_id || typeof sponsoring_chapter_id !== "number") {
        return res
          .status(400)
          .json({ error: "Valid sponsoring_chapter_id is required" });
      }

      // Update the promoter's sponsoring chapter
      const pool = (await import("../db/connection")).default;
      await pool.query(
        "UPDATE promoters SET sponsoring_chapter_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [sponsoring_chapter_id, req.user.promoterId]
      );

      // Fetch updated promoter
      const updatedPromoter = await getPromoterById(req.user.promoterId);
      res.json(updatedPromoter);
    } catch (error: any) {
      console.error("Error updating promoter sponsoring chapter:", error);
      res.status(500).json({ error: "Failed to update sponsoring chapter" });
    }
  }
);

export default router;
