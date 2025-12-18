import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import multer from "multer";
import { uploadToS3 } from "../services/s3";
import {
  getPendingSellers,
  updateSellerStatus,
  getAllOrders,
  getChapterDonations,
  getSellerById,
  getPendingPromoters,
  updatePromoterStatus,
  getPromoterById,
  getUserByEmail,
  linkUserToSeller,
  updateSellerInvitationToken,
  getPendingStewards,
  updateStewardStatus,
  getStewardById,
  linkUserToSteward,
  getStewardActivity,
  getChapterDonationsFromStewards,
  getPlatformSetting,
  setPlatformSetting,
  getAllPlatformSettings,
  getChapterById,
  getPendingMembersForVerification,
  updateMemberVerification,
} from "../db/queries-sequelize";
import {
  createConnectAccount,
  createChapterConnectAccount,
} from "../services/stripe";
import { sendSellerApprovedEmail } from "../services/email";
import { generateInvitationToken } from "../utils/tokens";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth";
import pool from "../db/connection";

const router: ExpressRouter = Router();

// Use Cognito authentication middleware
router.use(authenticate);
router.use(requireAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const approveSellerSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

router.get("/sellers/pending", async (req: Request, res: Response) => {
  try {
    const sellers = await getPendingSellers();
    res.json(sellers);
  } catch (error) {
    console.error("Error fetching pending sellers:", error);
    res.status(500).json({ error: "Failed to fetch pending sellers" });
  }
});

router.put("/sellers/:id", async (req: Request, res: Response) => {
  try {
    const sellerId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);

    let stripeAccountId: string | undefined;
    let invitationToken: string | undefined;
    let stripeWarning: string | undefined;

    // If approving, create Stripe Connect account and generate invitation token
    if (body.status === "APPROVED") {
      const seller = await getSellerById(sellerId);

      if (!seller) {
        return res.status(404).json({ error: "Seller not found" });
      }

      // Check if seller already has a Cognito account (if they're already a member)
      const existingUser = await getUserByEmail(seller.email);

      if (existingUser) {
        // Seller already has an account - link it to seller role
        await linkUserToSeller(existingUser.id, sellerId);
      } else {
        // Generate invitation token for new seller account
        invitationToken = generateInvitationToken();
        await updateSellerInvitationToken(sellerId, invitationToken);
      }

      // Check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (stripeKey && stripeKey.trim() !== "" && !stripeKey.includes("here")) {
        try {
          const account = await createConnectAccount(seller.email);
          stripeAccountId = account.id;
        } catch (error: any) {
          console.error("Error creating Stripe account for seller:", error);
          if (
            error.type === "StripeAuthenticationError" ||
            error.message?.includes("Invalid API Key")
          ) {
            stripeWarning =
              "Seller approved, but Stripe payment setup failed. Stripe account will need to be set up manually.";
          } else {
            stripeWarning =
              "Seller approved, but Stripe payment setup encountered an issue. Stripe account will need to be set up manually.";
          }
        }
      } else {
        stripeWarning =
          "Seller approved, but Stripe is not configured. Stripe account will need to be set up manually.";
      }
    }

    const updatedSeller = await updateSellerStatus(
      sellerId,
      body.status,
      stripeAccountId
    );

    // Send approval email if seller was approved
    if (body.status === "APPROVED" && updatedSeller) {
      sendSellerApprovedEmail(
        updatedSeller.email,
        updatedSeller.name,
        invitationToken || undefined
      ).catch((error) => {
        console.error("Failed to send seller approved email:", error);
      });

      // If Stripe account was just set up, notify interested users
      if (stripeAccountId && updatedSeller) {
        const { notifyInterestedUsersForSeller } = await import(
          "../services/notifications"
        );
        notifyInterestedUsersForSeller(
          updatedSeller.id,
          updatedSeller.name
        ).catch((error) => {
          console.error("Failed to notify interested users:", error);
        });
      }
    }

    // Include warning in response if present
    if (body.status === "APPROVED" && stripeWarning) {
      return res.json({ ...updatedSeller, warning: stripeWarning });
    }

    res.json(updatedSeller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    console.error("Error updating seller status:", error);
    res.status(500).json({ error: "Failed to update seller status" });
  }
});

router.get("/orders", async (req: Request, res: Response) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/donations", async (req: Request, res: Response) => {
  try {
    const donations = await getChapterDonations();
    res.json(donations);
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).json({ error: "Failed to fetch donations" });
  }
});

// Promoter admin routes
router.get("/promoters/pending", async (req: Request, res: Response) => {
  try {
    const promoters = await getPendingPromoters();
    res.json(promoters);
  } catch (error) {
    console.error("Error fetching pending promoters:", error);
    res.status(500).json({ error: "Failed to fetch pending promoters" });
  }
});

router.put("/promoters/:id", async (req: Request, res: Response) => {
  try {
    const promoterId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);

    let stripeAccountId: string | undefined;
    let stripeWarning: string | undefined;

    // If approving, create Stripe Connect account
    if (body.status === "APPROVED") {
      const promoter = await getPromoterById(promoterId);

      if (!promoter) {
        return res.status(404).json({ error: "Promoter not found" });
      }

      // Check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (stripeKey && stripeKey.trim() !== "" && !stripeKey.includes("here")) {
        try {
          const account = await createConnectAccount(promoter.email);
          stripeAccountId = account.id;
        } catch (error: any) {
          console.error("Error creating Stripe account for promoter:", error);
          if (
            error.type === "StripeAuthenticationError" ||
            error.message?.includes("Invalid API Key")
          ) {
            stripeWarning =
              "Promoter approved, but Stripe payment setup failed. Stripe account will need to be set up manually.";
          } else {
            stripeWarning =
              "Promoter approved, but Stripe payment setup encountered an issue. Stripe account will need to be set up manually.";
          }
        }
      } else {
        stripeWarning =
          "Promoter approved, but Stripe is not configured. Stripe account will need to be set up manually.";
      }
    }

    const updatedPromoter = await updatePromoterStatus(
      promoterId,
      body.status,
      stripeAccountId
    );

    // Include warning in response if present
    if (body.status === "APPROVED" && stripeWarning) {
      return res.json({ ...updatedPromoter, warning: stripeWarning });
    }

    res.json(updatedPromoter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    console.error("Error updating promoter status:", error);
    res.status(500).json({ error: "Failed to update promoter status" });
  }
});

// Member verification admin routes
router.get("/members/pending", async (req: Request, res: Response) => {
  try {
    const members = await getPendingMembersForVerification();

    // Enrich with chapter info
    const enrichedMembers = await Promise.all(
      members.map(async (member) => {
        let chapter = null;
        if (member.initiated_chapter_id) {
          const chapterResult = await pool.query(
            "SELECT * FROM chapters WHERE id = $1",
            [member.initiated_chapter_id]
          );
          chapter = chapterResult.rows[0];
        }
        return {
          ...member,
          social_links:
            typeof member.social_links === "string"
              ? JSON.parse(member.social_links)
              : member.social_links,
          chapter: chapter,
        };
      })
    );

    res.json(enrichedMembers);
  } catch (error) {
    console.error("Error fetching pending members:", error);
    res.status(500).json({ error: "Failed to fetch pending members" });
  }
});

const updateMemberVerificationSchema = z.object({
  verification_status: z.enum([
    "PENDING",
    "VERIFIED",
    "FAILED",
    "MANUAL_REVIEW",
  ]),
  verification_notes: z.string().optional().nullable(),
});

router.put("/members/:id/verification", async (req: Request, res: Response) => {
  try {
    const memberId = parseInt(req.params.id);
    const body = updateMemberVerificationSchema.parse(req.body);

    const updatedMember = await updateMemberVerification(
      memberId,
      body.verification_status,
      body.verification_notes || null
    );

    res.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    console.error("Error updating member verification:", error);
    res.status(500).json({ error: "Failed to update member verification" });
  }
});

// Steward admin routes
router.get("/stewards/pending", async (req: Request, res: Response) => {
  try {
    const stewards = await getPendingStewards();

    // Enrich with member and chapter info
    const enrichedStewards = await Promise.all(
      stewards.map(async (steward) => {
        // Get member via users table -> email/cognito_sub -> fraternity_members
        let userResult: {
          rows: { email: string | null; cognito_sub: string | null }[];
        } = { rows: [] };
        if (steward.user_id) {
          userResult = await pool.query(
            "SELECT email, cognito_sub FROM users WHERE id = $1",
            [steward.user_id]
          );
        }
        const user = userResult.rows[0];
        let memberResult = { rows: [] };
        if (user) {
          memberResult = await pool.query(
            "SELECT * FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
            [user.email, user.cognito_sub]
          );
        }
        const chapterResult = await pool.query(
          "SELECT * FROM chapters WHERE id = $1",
          [steward.sponsoring_chapter_id]
        );
        return {
          ...steward,
          member: memberResult.rows[0],
          chapter: chapterResult.rows[0],
        };
      })
    );

    res.json(enrichedStewards);
  } catch (error) {
    console.error("Error fetching pending stewards:", error);
    res.status(500).json({ error: "Failed to fetch pending stewards" });
  }
});

router.put("/stewards/:id", async (req: Request, res: Response) => {
  try {
    const stewardId = parseInt(req.params.id);
    const body = approveSellerSchema.parse(req.body);

    const steward = await getStewardById(stewardId);
    if (!steward) {
      return res.status(404).json({ error: "Steward not found" });
    }

    // Update steward status
    const updatedSteward = await updateStewardStatus(stewardId, body.status);

    // If approving, link user to steward
    if (body.status === "APPROVED" && steward.user_id) {
      // Get member via users table -> email/cognito_sub -> fraternity_members
      const userResult = await pool.query(
        "SELECT id, email, cognito_sub FROM users WHERE id = $1",
        [steward.user_id]
      );
      const user = userResult.rows[0];

      if (user) {
        // Find member by email or cognito_sub
        const memberResult = await pool.query(
          "SELECT id, email, cognito_sub FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
          [user.email, user.cognito_sub]
        );
        const member = memberResult.rows[0];

        if (user) {
          await linkUserToSteward(user.id, stewardId);
        }
      }
    }

    res.json(updatedSteward);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    console.error("Error updating steward status:", error);
    res.status(500).json({ error: "Failed to update steward status" });
  }
});

router.get("/stewards/activity", async (req: Request, res: Response) => {
  try {
    const activity = await getStewardActivity();
    res.json(activity);
  } catch (error) {
    console.error("Error fetching steward activity:", error);
    res.status(500).json({ error: "Failed to fetch steward activity" });
  }
});

router.get("/stewards/donations", async (req: Request, res: Response) => {
  try {
    const donations = await getChapterDonationsFromStewards();
    res.json(donations);
  } catch (error) {
    console.error("Error fetching steward donations:", error);
    res.status(500).json({ error: "Failed to fetch steward donations" });
  }
});

// Chapter Stripe account management
const chapterStripeAccountSchema = z.object({
  stripe_account_id: z.string().min(1),
});

router.put(
  "/chapters/:id/stripe-account",
  async (req: Request, res: Response) => {
    try {
      const chapterId = parseInt(req.params.id);
      const body = chapterStripeAccountSchema.parse(req.body);

      const chapter = await getChapterById(chapterId);
      if (!chapter) {
        return res.status(404).json({ error: "Chapter not found" });
      }

      await pool.query(
        "UPDATE chapters SET stripe_account_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [body.stripe_account_id, chapterId]
      );

      const updatedChapter = await getChapterById(chapterId);
      res.json(updatedChapter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Validation error", details: error.errors });
        return;
      }
      console.error("Error updating chapter Stripe account:", error);
      res
        .status(500)
        .json({ error: "Failed to update chapter Stripe account" });
    }
  }
);

// Platform settings routes
router.get("/platform-settings", async (req: Request, res: Response) => {
  try {
    const settings = await getAllPlatformSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    res.status(500).json({ error: "Failed to fetch platform settings" });
  }
});

const platformSettingSchema = z.object({
  value: z.string(),
  description: z.string().optional().nullable(),
});

router.put("/platform-settings/:key", async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    const body = platformSettingSchema.parse(req.body);

    const setting = await setPlatformSetting(
      key,
      body.value,
      body.description || null
    );
    res.json(setting);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res
        .status(400)
        .json({ error: "Validation error", details: error.errors });
      return;
    }
    console.error("Error updating platform setting:", error);
    res.status(500).json({ error: "Failed to update platform setting" });
  }
});

// ============================================================================
// ADMIN COMMON ROUTES
// ============================================================================

// Admin image upload
router.post("/upload", upload.single("image"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const uploadResult = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      "admin-uploads"
    );

    res.json({ url: uploadResult.url });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// ============================================================================
// ADMIN PRODUCT MANAGEMENT ROUTES
// ============================================================================

const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price_cents: z.number().int().positive().optional(),
  image_url: z.string().optional().nullable(),
  category_id: z.number().int().optional().nullable(),
  is_kappa_branded: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ADMIN_DELETE', 'PENDING', 'SOLD', 'SHIPPED', 'CLOSED']).optional(),
  reason: z.string().min(1, "Reason is required for admin modifications"),
});

const deleteProductSchema = z.object({
  reason: z.string().min(1, "Reason is required for deletion"),
});

// Get all products (admin view)
router.get("/products", async (req: Request, res: Response) => {
  try {
    const { getAllProducts } = await import("../db/queries-sequelize");
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get specific product by ID
router.get("/products/:id", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const { getProductWithOwnerInfo } = await import("../db/queries-sequelize");
    const product = await getProductWithOwnerInfo(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Update product
router.put("/products/:id", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const validatedData = updateProductSchema.parse(req.body);
    const { reason, ...updates } = validatedData;
    
    const { getProductWithOwnerInfo, updateProduct } = await import("../db/queries-sequelize");
    const { sendProductModifiedEmail } = await import("../services/email");
    const { notifyProductModified } = await import("../services/notifications");
    
    // Get product with owner info before update
    const productBefore = await getProductWithOwnerInfo(productId);
    if (!productBefore) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Update product
    const updatedProduct = await updateProduct(productId, updates);
    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Send notifications and email
    await Promise.all([
      notifyProductModified(productBefore.owner_email, productBefore.name, reason),
      sendProductModifiedEmail(productBefore.owner_email, productBefore.owner_name, productBefore.name, reason)
    ]);
    
    console.log(`✅ Admin updated product ${productId}: ${productBefore.name}`);
    res.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete product (soft delete)
router.delete("/products/:id", async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.id);
    const validatedData = deleteProductSchema.parse(req.body);
    const { reason } = validatedData;
    
    const { getProductWithOwnerInfo, deleteProduct } = await import("../db/queries-sequelize");
    const { sendProductDeletedEmail } = await import("../services/email");
    const { notifyProductDeleted } = await import("../services/notifications");
    
    // Get product with owner info before deletion
    const product = await getProductWithOwnerInfo(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Soft delete product
    const deletedProduct = await deleteProduct(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Send notifications and email
    await Promise.all([
      notifyProductDeleted(product.owner_email, product.name, reason),
      sendProductDeletedEmail(product.owner_email, product.owner_name, product.name, reason)
    ]);
    
    console.log(`✅ Admin deleted product ${productId}: ${product.name}`);
    res.json({ message: "Product deleted successfully", product: deletedProduct });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ============================================================================
// ADMIN EVENT MANAGEMENT ROUTES
// ============================================================================

const updateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  event_date: z.string().optional(), // Handled manually in route
  location: z.string().optional(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  sponsored_chapter_id: z.number().int().optional().nullable(),
  event_type_id: z.number().int().optional().nullable(),
  event_audience_type_id: z.number().int().optional().nullable(),
  all_day: z.boolean().optional(),
  duration_minutes: z.number().int().optional().nullable(),
  event_link: z.string().optional().nullable(),
  is_featured: z.boolean().optional(),
  ticket_price_cents: z.number().int().optional(),
  dress_codes: z.array(z.string()).optional(),
  dress_code_notes: z.string().optional().nullable(),
  reason: z.string().min(1, "Reason is required for admin modifications"),
});

const deleteEventSchema = z.object({
  reason: z.string().min(1, "Reason is required for cancellation"),
});

// Get all events (admin view)
router.get("/events", async (req: Request, res: Response) => {
  try {
    const { getAllEventsForAdmin } = await import("../db/queries-sequelize");
    const events = await getAllEventsForAdmin();
    res.json(events);
  } catch (error) {
    console.error("Error fetching all events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Get specific event by ID
router.get("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const { getEventWithOwnerInfo } = await import("../db/queries-sequelize");
    const event = await getEventWithOwnerInfo(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// Update event
router.put("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const validatedData = updateEventSchema.parse(req.body);
    const { reason, event_date, ...otherUpdates } = validatedData;
    
    // Convert event_date string to Date if provided
    const updates: any = { ...otherUpdates };
    if (event_date) {
      updates.event_date = new Date(event_date);
    }
    
    const { getEventWithOwnerInfo, updateEvent } = await import("../db/queries-sequelize");
    const { sendEventModifiedEmail } = await import("../services/email");
    const { notifyEventModified } = await import("../services/notifications");
    
    // Get event with owner info before update
    const eventBefore = await getEventWithOwnerInfo(eventId);
    if (!eventBefore) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Update event
    const updatedEvent = await updateEvent(eventId, updates);
    
    // Send notifications and email
    await Promise.all([
      notifyEventModified(eventBefore.owner_email, eventBefore.title, reason),
      sendEventModifiedEmail(eventBefore.owner_email, eventBefore.owner_name, eventBefore.title, reason)
    ]);
    
    console.log(`✅ Admin updated event ${eventId}: ${eventBefore.title}`);
    res.json(updatedEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// Delete event (soft delete - set status to CANCELLED)
router.delete("/events/:id", async (req: Request, res: Response) => {
  try {
    const eventId = parseInt(req.params.id);
    const validatedData = deleteEventSchema.parse(req.body);
    const { reason } = validatedData;
    
    const { getEventWithOwnerInfo, deleteEvent } = await import("../db/queries-sequelize");
    const { sendEventDeletedEmail } = await import("../services/email");
    const { notifyEventDeleted } = await import("../services/notifications");
    
    // Get event with owner info before deletion
    const event = await getEventWithOwnerInfo(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Soft delete event (set status to CANCELLED)
    const deletedEvent = await deleteEvent(eventId);
    
    // Send notifications and email
    await Promise.all([
      notifyEventDeleted(event.owner_email, event.title, reason),
      sendEventDeletedEmail(event.owner_email, event.owner_name, event.title, reason)
    ]);
    
    console.log(`✅ Admin cancelled event ${eventId}: ${event.title}`);
    res.json({ message: "Event cancelled successfully", event: deletedEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error cancelling event:", error);
    res.status(500).json({ error: "Failed to cancel event" });
  }
});

export default router;

