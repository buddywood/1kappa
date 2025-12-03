import pool from '../db/connection';
import { User } from '../types';
import { getUserByCognitoSub } from '../db/queries-sequelize';

/**
 * Get fraternity_member_id from role-specific tables based on user's role
 * Returns null if user doesn't have a fraternity member ID
 * All lookups now use email/cognito_sub matching since fraternity_member_id columns have been removed
 */
export async function getFraternityMemberId(user: User): Promise<number | null> {
  if (user.role === 'SELLER') {
    // Look up seller by user_id, then match seller email with fraternity_members
    const sellerResult = await pool.query('SELECT email FROM sellers WHERE user_id = $1', [user.id]);
    const sellerEmail = sellerResult.rows[0]?.email;
    if (sellerEmail) {
      const memberResult = await pool.query(
        'SELECT id FROM fraternity_members WHERE email = $1',
        [sellerEmail]
      );
      return memberResult.rows[0]?.id || null;
    }
    return null;
  } else if (user.role === 'PROMOTER') {
    // Look up promoter by user_id, then match promoter email with fraternity_members
    const promoterResult = await pool.query('SELECT email FROM promoters WHERE user_id = $1', [user.id]);
    const promoterEmail = promoterResult.rows[0]?.email;
    if (promoterEmail) {
      const memberResult = await pool.query(
        'SELECT id FROM fraternity_members WHERE email = $1',
        [promoterEmail]
      );
      return memberResult.rows[0]?.id || null;
    }
    return null;
  } else if (user.role === 'STEWARD') {
    // Match user email/cognito_sub with fraternity_members (stewards linked via users table)
    const memberResult = await pool.query(
      'SELECT id FROM fraternity_members WHERE email = $1 OR cognito_sub = $2',
      [user.email, user.cognito_sub]
    );
    return memberResult.rows[0]?.id || null;
  } else if (user.role === 'GUEST') {
    // For GUEST, match by email/cognito_sub with fraternity_members table
    const memberResult = await pool.query(
      'SELECT id FROM fraternity_members WHERE email = $1 OR cognito_sub = $2',
      [user.email, user.cognito_sub]
    );
    return memberResult.rows[0]?.id || null;
  }
  return null;
}

/**
 * Get fraternity_member_id from request user (looks up full user from database first)
 */
export async function getFraternityMemberIdFromRequest(req: { user?: { cognitoSub: string } }): Promise<number | null> {
  if (!req.user) {
    return null;
  }
  const user = await getUserByCognitoSub(req.user.cognitoSub);
  if (!user) {
    return null;
  }
  return getFraternityMemberId(user);
}

