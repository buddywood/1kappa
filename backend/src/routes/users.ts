import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import { authenticate } from "../middleware/auth";
import { getUserById, upsertUserOnLogin } from "../db/queries-sequelize";
import {
  verifyCognitoToken,
  extractUserInfoFromToken,
} from "../services/cognito";
import pool from "../db/connection";

const router: ExpressRouter = Router();

// Get current user's orders
router.get("/me/orders", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT 
        o.id,
        o.product_id,
        o.amount_cents,
        o.status,
        o.stripe_session_id,
        o.created_at,
        o.updated_at,
        p.name as product_name,
        p.image_url as product_image_url,
        s.name as seller_name,
        c.name as chapter_name
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN chapters c ON o.chapter_id = c.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Get current user info
router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get name and role flags based on role
    let name: string | null = null;
    let fraternity_member_id: number | null = null;
    let is_fraternity_member = false;
    let is_seller = false;
    let is_promoter = false;
    let is_steward = false;

    // Get fraternity_member_id from role-specific tables via email matching
    // Look up seller/promoter/steward by user_id
    let sellerId: number | null = null;
    let promoterId: number | null = null;
    let stewardId: number | null = null;

    if (user.role === "SELLER") {
      const sellerIdResult = await pool.query(
        "SELECT id FROM sellers WHERE user_id = $1",
        [user.id]
      );
      sellerId = sellerIdResult.rows[0]?.id || null;
      if (sellerId) {
        const sellerResult = await pool.query(
          "SELECT name, email, status FROM sellers WHERE id = $1",
          [sellerId]
        );
        if (sellerResult.rows.length > 0) {
          name = sellerResult.rows[0]?.name || null;
          const sellerEmail = sellerResult.rows[0]?.email;
          if (sellerResult.rows[0]?.status === "APPROVED") {
            is_seller = true;
          }
          // Match seller email with fraternity_members
          if (sellerEmail) {
            const memberResult = await pool.query(
              "SELECT id, verification_status FROM fraternity_members WHERE email = $1",
              [sellerEmail]
            );
            if (memberResult.rows.length > 0) {
              fraternity_member_id = memberResult.rows[0]?.id || null;
              if (memberResult.rows[0]?.verification_status === "VERIFIED") {
                is_fraternity_member = true;
              }
            }
          }
        }
      }
    } else if (user.role === "PROMOTER") {
      const promoterIdResult = await pool.query(
        "SELECT id FROM promoters WHERE user_id = $1",
        [user.id]
      );
      promoterId = promoterIdResult.rows[0]?.id || null;
      if (promoterId) {
        const promoterResult = await pool.query(
          "SELECT name, email, status FROM promoters WHERE id = $1",
          [promoterId]
        );
        if (promoterResult.rows.length > 0) {
          name = promoterResult.rows[0]?.name || null;
          const promoterEmail = promoterResult.rows[0]?.email;
          if (promoterResult.rows[0]?.status === "APPROVED") {
            is_promoter = true;
          }
          // Match promoter email with fraternity_members
          if (promoterEmail) {
            const memberResult = await pool.query(
              "SELECT id FROM fraternity_members WHERE email = $1",
              [promoterEmail]
            );
            if (memberResult.rows.length > 0) {
              fraternity_member_id = memberResult.rows[0]?.id || null;
            }
          }
        }
      }
    } else if (user.role === "STEWARD") {
      const stewardIdResult = await pool.query(
        "SELECT id FROM stewards WHERE user_id = $1",
        [user.id]
      );
      stewardId = stewardIdResult.rows[0]?.id || null;
      if (stewardId) {
        const stewardResult = await pool.query(
          "SELECT status FROM stewards WHERE id = $1",
          [stewardId]
        );
        if (stewardResult.rows.length > 0) {
          if (stewardResult.rows[0]?.status === "APPROVED") {
            is_steward = true;
          }
          // Match user email/cognito_sub with fraternity_members (stewards linked via users table)
          const memberResult = await pool.query(
            "SELECT id, name FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
            [user.email, user.cognito_sub]
          );
          if (memberResult.rows.length > 0) {
            fraternity_member_id = memberResult.rows[0]?.id || null;
            name = memberResult.rows[0]?.name || null;
          }
        }
      }
    } else if (user.role === "GUEST") {
      // For GUEST, match by email/cognito_sub with fraternity_members table
      const memberResult = await pool.query(
        "SELECT id, name, verification_status FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
        [user.email, user.cognito_sub]
      );
      if (memberResult.rows.length > 0) {
        fraternity_member_id = memberResult.rows[0]?.id || null;
        name = memberResult.rows[0]?.name || null;
        // Only set is_fraternity_member to true if member is verified
        is_fraternity_member =
          memberResult.rows[0]?.verification_status === "VERIFIED";
        
        // Auto-upgrade GUEST to MEMBER if they have verified fraternity membership
        if (is_fraternity_member && user.role === "GUEST") {
          const { updateUserRole } = await import('../db/queries-sequelize');
          await updateUserRole(user.id, "MEMBER");
          user.role = "MEMBER";
        }
      }
    } else if (user.role === "MEMBER") {
      // For MEMBER, match by email/cognito_sub with fraternity_members table
      const memberResult = await pool.query(
        "SELECT id, name, verification_status FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
        [user.email, user.cognito_sub]
      );
      if (memberResult.rows.length > 0) {
        fraternity_member_id = memberResult.rows[0]?.id || null;
        name = memberResult.rows[0]?.name || null;
        // MEMBER role implies verified fraternity membership
        is_fraternity_member = memberResult.rows[0]?.verification_status === "VERIFIED";
      }
    }

    // Check for steward role (even if not primary role) via users table
    if (fraternity_member_id && !is_steward) {
      const stewardResult = await pool.query(
        `SELECT st.status FROM stewards st
         JOIN users u ON st.user_id = u.id
         JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
         WHERE m.id = $1 AND st.status = $2`,
        [fraternity_member_id, "APPROVED"]
      );
      if (stewardResult.rows.length > 0) {
        is_steward = true;
      }
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      fraternity_member_id: fraternity_member_id,
      seller_id: sellerId,
      promoter_id: promoterId,
      steward_id: stewardId,
      features: user.features,
      name: name,
      last_login: user.last_login,
      created_at: user.created_at,
      is_fraternity_member,
      is_seller,
      is_promoter,
      is_steward,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Upsert user on login (insert or update with last_login)
// This endpoint verifies the Cognito token directly (not using authenticate middleware)
// because the user might not exist in the database yet
router.post("/upsert-on-login", async (req: Request, res: Response) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Extract user info from token
    const { cognitoSub: tokenCognitoSub, email: tokenEmail } =
      extractUserInfoFromToken(payload);

    const { cognito_sub, email } = req.body;

    if (!cognito_sub || !email) {
      return res
        .status(400)
        .json({ error: "cognito_sub and email are required" });
    }

    // Verify the cognito_sub matches the token
    if (tokenCognitoSub !== cognito_sub) {
      return res.status(403).json({ error: "Forbidden: cognito_sub mismatch" });
    }

    // Use email from token if provided, otherwise use body email
    const userEmail = tokenEmail || email;

    const user = await upsertUserOnLogin(cognito_sub, userEmail);

    // Get name and role flags based on role
    let name: string | null = null;
    let fraternity_member_id: number | null = null;
    let is_fraternity_member = false;
    let is_seller = false;
    let is_promoter = false;
    let is_steward = false;

    // Get fraternity_member_id from role-specific tables via email matching
    // Look up seller/promoter/steward by user_id
    let sellerId: number | null = null;
    let promoterId: number | null = null;
    let stewardId: number | null = null;

    if (user.role === "SELLER") {
      const sellerIdResult = await pool.query(
        "SELECT id FROM sellers WHERE user_id = $1",
        [user.id]
      );
      sellerId = sellerIdResult.rows[0]?.id || null;
      if (sellerId) {
        const sellerResult = await pool.query(
          "SELECT name, email, status FROM sellers WHERE id = $1",
          [sellerId]
        );
        if (sellerResult.rows.length > 0) {
          name = sellerResult.rows[0]?.name || null;
          const sellerEmail = sellerResult.rows[0]?.email;
          if (sellerResult.rows[0]?.status === "APPROVED") {
            is_seller = true;
          }
          // Match seller email with fraternity_members
          if (sellerEmail) {
            const memberResult = await pool.query(
              "SELECT id, verification_status FROM fraternity_members WHERE email = $1",
              [sellerEmail]
            );
            if (memberResult.rows.length > 0) {
              fraternity_member_id = memberResult.rows[0]?.id || null;
              if (memberResult.rows[0]?.verification_status === "VERIFIED") {
                is_fraternity_member = true;
              }
            }
          }
        }
      }
    } else if (user.role === "PROMOTER") {
      const promoterIdResult = await pool.query(
        "SELECT id FROM promoters WHERE user_id = $1",
        [user.id]
      );
      promoterId = promoterIdResult.rows[0]?.id || null;
      if (promoterId) {
        const promoterResult = await pool.query(
          "SELECT name, email, status FROM promoters WHERE id = $1",
          [promoterId]
        );
        if (promoterResult.rows.length > 0) {
          name = promoterResult.rows[0]?.name || null;
          const promoterEmail = promoterResult.rows[0]?.email;
          if (promoterResult.rows[0]?.status === "APPROVED") {
            is_promoter = true;
          }
          // Match promoter email with fraternity_members
          if (promoterEmail) {
            const memberResult = await pool.query(
              "SELECT id FROM fraternity_members WHERE email = $1",
              [promoterEmail]
            );
            if (memberResult.rows.length > 0) {
              fraternity_member_id = memberResult.rows[0]?.id || null;
            }
          }
        }
      }
    } else if (user.role === "STEWARD") {
      const stewardIdResult = await pool.query(
        "SELECT id FROM stewards WHERE user_id = $1",
        [user.id]
      );
      stewardId = stewardIdResult.rows[0]?.id || null;
      if (stewardId) {
        const stewardResult = await pool.query(
          "SELECT status FROM stewards WHERE id = $1",
          [stewardId]
        );
        if (stewardResult.rows.length > 0) {
          if (stewardResult.rows[0]?.status === "APPROVED") {
            is_steward = true;
          }
          // Match user email/cognito_sub with fraternity_members (stewards linked via users table)
          const memberResult = await pool.query(
            "SELECT id, name FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
            [user.email, user.cognito_sub]
          );
          if (memberResult.rows.length > 0) {
            fraternity_member_id = memberResult.rows[0]?.id || null;
            name = memberResult.rows[0]?.name || null;
          }
        }
      }
    } else if (user.role === "GUEST") {
      // For GUEST, match by email/cognito_sub with fraternity_members table
      const memberResult = await pool.query(
        "SELECT id, name, verification_status FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
        [user.email, user.cognito_sub]
      );
      if (memberResult.rows.length > 0) {
        fraternity_member_id = memberResult.rows[0]?.id || null;
        name = memberResult.rows[0]?.name || null;
        // Only set is_fraternity_member to true if member is verified
        is_fraternity_member =
          memberResult.rows[0]?.verification_status === "VERIFIED";
        
        // Auto-upgrade GUEST to MEMBER if they have verified fraternity membership
        if (is_fraternity_member && user.role === "GUEST") {
          const { updateUserRole } = await import('../db/queries-sequelize');
          await updateUserRole(user.id, "MEMBER");
          user.role = "MEMBER";
        }
      }
    } else if (user.role === "MEMBER") {
      // For MEMBER, match by email/cognito_sub with fraternity_members table
      const memberResult = await pool.query(
        "SELECT id, name, verification_status FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
        [user.email, user.cognito_sub]
      );
      if (memberResult.rows.length > 0) {
        fraternity_member_id = memberResult.rows[0]?.id || null;
        name = memberResult.rows[0]?.name || null;
        // MEMBER role implies verified fraternity membership
        is_fraternity_member = memberResult.rows[0]?.verification_status === "VERIFIED";
      }
    }

    // Check for steward role (even if not primary role) via users table
    if (fraternity_member_id && !is_steward) {
      const stewardResult = await pool.query(
        `SELECT st.status FROM stewards st
         JOIN users u ON st.user_id = u.id
         JOIN fraternity_members m ON (u.email = m.email OR u.cognito_sub = m.cognito_sub)
         WHERE m.id = $1 AND st.status = $2`,
        [fraternity_member_id, "APPROVED"]
      );
      if (stewardResult.rows.length > 0) {
        is_steward = true;
      }
    }

    res.json({
      id: user.id,
      cognito_sub: user.cognito_sub,
      email: user.email,
      role: user.role,
      onboarding_status: user.onboarding_status,
      fraternity_member_id: fraternity_member_id,
      seller_id: sellerId,
      promoter_id: promoterId,
      steward_id: stewardId,
      features: user.features,
      name: name,
      last_login: user.last_login,
      is_fraternity_member,
      is_seller,
      is_promoter,
      is_steward,
    });
  } catch (error) {
    console.error("Error upserting user on login:", error);
    res.status(500).json({ error: "Failed to upsert user" });
  }
});

// Delete current user's account
router.delete(
  "/me/delete",
  authenticate,
  async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
      if (!req.user) {
        client.release();
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await getUserById(req.user.id);
      if (!user) {
        client.release();
        return res.status(404).json({ error: "User not found" });
      }

      // Start transaction to ensure atomic deletion
      await client.query('BEGIN');

      // Store IDs before deleting - get memberId from role-specific tables via email matching
      let memberId: number | null = null;
      if (user.role === "SELLER") {
        const sellerIdResult = await client.query(
          "SELECT id FROM sellers WHERE user_id = $1",
          [user.id]
        );
        const sellerId = sellerIdResult.rows[0]?.id || null;
        if (sellerId) {
          const sellerResult = await client.query(
            "SELECT email FROM sellers WHERE id = $1",
            [sellerId]
          );
          const sellerEmail = sellerResult.rows[0]?.email;
          if (sellerEmail) {
            const memberResult = await client.query(
              "SELECT id FROM fraternity_members WHERE email = $1",
              [sellerEmail]
            );
            memberId = memberResult.rows[0]?.id || null;
          }
        }
      } else if (user.role === "PROMOTER") {
        const promoterIdResult = await client.query(
          "SELECT id FROM promoters WHERE user_id = $1",
          [user.id]
        );
        const promoterId = promoterIdResult.rows[0]?.id || null;
        if (promoterId) {
          const promoterResult = await client.query(
            "SELECT email FROM promoters WHERE id = $1",
            [promoterId]
          );
          const promoterEmail = promoterResult.rows[0]?.email;
          if (promoterEmail) {
            const memberResult = await client.query(
              "SELECT id FROM fraternity_members WHERE email = $1",
              [promoterEmail]
            );
            memberId = memberResult.rows[0]?.id || null;
          }
        }
      } else if (user.role === "STEWARD") {
        // Match user email/cognito_sub with fraternity_members
        const memberResult = await client.query(
          "SELECT id FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
          [user.email, user.cognito_sub]
        );
        memberId = memberResult.rows[0]?.id || null;
      } else if (user.role === "GUEST") {
        const memberResult = await client.query(
          "SELECT id FROM fraternity_members WHERE email = $1 OR cognito_sub = $2",
          [user.email, user.cognito_sub]
        );
        memberId = memberResult.rows[0]?.id || null;
      }

      // Look up role IDs from role tables
      const sellerIdResult = await client.query(
        "SELECT id FROM sellers WHERE user_id = $1",
        [user.id]
      );
      const sellerId = sellerIdResult.rows[0]?.id || null;

      const promoterIdResult = await client.query(
        "SELECT id FROM promoters WHERE user_id = $1",
        [user.id]
      );
      const promoterId = promoterIdResult.rows[0]?.id || null;

      const stewardIdResult = await client.query(
        "SELECT id FROM stewards WHERE user_id = $1",
        [user.id]
      );
      const stewardId = stewardIdResult.rows[0]?.id || null;

      // Delete role-specific data first (to handle foreign key constraints)

      // Delete seller-related data
      if (sellerId) {
        // Get product IDs first before deleting
        const productIdsResult = await client.query(
          "SELECT id FROM products WHERE seller_id = $1",
          [sellerId]
        );
        const productIds = productIdsResult.rows.map((row) => row.id);

        // Delete orders for this seller's products (if any products exist)
        if (productIds.length > 0) {
          await client.query(
            "DELETE FROM orders WHERE product_id = ANY($1::int[])",
            [productIds]
          );
        }

        // Delete products (they reference seller)
        await client.query("DELETE FROM products WHERE seller_id = $1", [
          sellerId,
        ]);

        // Delete seller record
        await client.query("DELETE FROM sellers WHERE id = $1", [sellerId]);
      }

      // Delete promoter-related data
      if (promoterId) {
        // Delete events first (they reference promoter)
        await client.query("DELETE FROM events WHERE promoter_id = $1", [
          promoterId,
        ]);

        // Delete promoter record
        await client.query("DELETE FROM promoters WHERE id = $1", [promoterId]);
      }

      // Delete steward-related data
      if (stewardId) {
        // Delete steward claims first
        await client.query(
          "DELETE FROM steward_claims WHERE steward_listing_id IN (SELECT id FROM steward_listings WHERE steward_id = $1)",
          [stewardId]
        );

        // Delete steward listings
        await client.query("DELETE FROM steward_listings WHERE steward_id = $1", [
          stewardId,
        ]);

        // Delete steward record
        await client.query("DELETE FROM stewards WHERE id = $1", [stewardId]);
      }

      // Delete notifications
      await client.query("DELETE FROM notifications WHERE user_email = $1", [
        user.email,
      ]);

      // Delete favorites
      await client.query("DELETE FROM favorites WHERE user_email = $1", [
        user.email,
      ]);

      // Delete orders where user is buyer
      await client.query("DELETE FROM orders WHERE user_id = $1", [
        user.id,
      ]);

      // Delete member record if exists
      if (memberId) {
        await client.query("DELETE FROM fraternity_members WHERE id = $1", [
          memberId,
        ]);
      }

      // Finally, delete the user record
      await client.query("DELETE FROM users WHERE id = $1", [user.id]);

      // Commit the transaction
      await client.query('COMMIT');
      client.release();

      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error: any) {
      await client.query('ROLLBACK');
      client.release();
      console.error("Error deleting account:", error);
      res
        .status(500)
        .json({ error: "Failed to delete account", details: error.message });
    }
  }
);

export default router;
