import { Request, Response, NextFunction } from 'express';
import { verifyCognitoToken, extractUserInfoFromToken } from '../services/cognito';
import { getUserByCognitoSub, createUser } from '../db/queries';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        cognitoSub: string;
        email: string;
        role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER';
        memberId: number | null;
        sellerId: number | null;
        promoterId: number | null;
        features: Record<string, any>;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using Cognito JWT tokens
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = await verifyCognitoToken(token);
    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Extract user info from token
    const { cognitoSub, email } = extractUserInfoFromToken(payload);

    // Get user in database - user must exist (created during registration)
    const user = await getUserByCognitoSub(cognitoSub);
    if (!user) {
      res.status(403).json({ 
        error: 'User not found. Please complete registration first.',
        code: 'USER_NOT_REGISTERED'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      cognitoSub: user.cognito_sub,
      email: user.email,
      role: user.role,
      memberId: user.member_id,
      sellerId: user.seller_id,
      promoterId: user.promoter_id,
      features: user.features,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'SELLER' | 'PROMOTER' | 'CONSUMER'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Middleware specifically for admin routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

