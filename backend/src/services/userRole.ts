import {
  getStewardByUserId,
  getMemberByEmail,
  getMemberByEmailOrCognitoSub,
} from '../db/queries-sequelize';
import sequelize from '../db/sequelize';
import { QueryTypes } from 'sequelize';

export interface RoleSpecificIds {
  sellerId: number | null;
  promoterId: number | null;
  stewardId: number | null;
}

export interface UserForRoleLookup {
  id: number;
  email: string;
  cognito_sub: string;
  role: 'ADMIN' | 'SELLER' | 'PROMOTER' | 'GUEST' | 'STEWARD' | 'MEMBER';
}

/**
 * Get role-specific IDs (sellerId, promoterId, stewardId) for a user
 * Used by authentication middleware to populate request.user
 */
export async function getRoleSpecificIds(user: UserForRoleLookup): Promise<RoleSpecificIds> {
  let sellerId: number | null = null;
  let promoterId: number | null = null;
  let stewardId: number | null = null;

  if (user.role === 'SELLER') {
    const seller = await getSellerByUserId(user.id);
    sellerId = seller?.id ?? null;
  } else if (user.role === 'PROMOTER') {
    const promoter = await getPromoterByUserId(user.id);
    promoterId = promoter?.id ?? null;
  } else if (user.role === 'STEWARD') {
    const steward = await getStewardByUserId(user.id);
    stewardId = steward?.id ?? null;
  }

  return { sellerId, promoterId, stewardId };
}

/**
 * Get seller by user_id (helper function)
 */
async function getSellerByUserId(userId: number): Promise<{ id: number; email: string } | null> {
  const result = await sequelize.query(
    'SELECT id, email FROM sellers WHERE user_id = :userId LIMIT 1',
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  ) as { id: number; email: string }[];
  return result[0] ?? null;
}

/**
 * Get promoter by user_id (helper function)
 */
async function getPromoterByUserId(userId: number): Promise<{ id: number; email: string } | null> {
  const result = await sequelize.query(
    'SELECT id, email FROM promoters WHERE user_id = :userId LIMIT 1',
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
    }
  ) as { id: number; email: string }[];
  return result[0] ?? null;
}

/**
 * Get fraternity member ID for a user
 * Lookups use email/cognito_sub matching since fraternity_member_id columns have been removed
 */
export async function getFraternityMemberIdForUser(user: UserForRoleLookup): Promise<number | null> {
  if (user.role === 'SELLER') {
    const seller = await getSellerByUserId(user.id);
    if (seller?.email) {
      const member = await getMemberByEmail(seller.email);
      return member?.id ?? null;
    }
    return null;
  }

  if (user.role === 'PROMOTER') {
    const promoter = await getPromoterByUserId(user.id);
    if (promoter?.email) {
      const member = await getMemberByEmail(promoter.email);
      return member?.id ?? null;
    }
    return null;
  }

  if (user.role === 'STEWARD' || user.role === 'GUEST' || user.role === 'MEMBER') {
    const member = await getMemberByEmailOrCognitoSub(user.email, user.cognito_sub);
    return member?.id ?? null;
  }

  return null;
}
