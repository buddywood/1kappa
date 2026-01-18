import {
  getMemberById,
  getMemberByEmail,
  getMemberByMembershipNumber,
  createMember,
  updateMember,
  getChapterById,
} from '../db/queries-sequelize';

export interface MemberRegistrationData {
  name: string;
  email: string;
  phone?: string | null;
  membership_number?: string | null;
  initiated_chapter_id?: number | null;
  initiated_season?: string | null;
  initiated_year?: number | null;
  line_name?: string | null;
  line_number?: number | null;
  headshot_url?: string | null;
  social_links?: Record<string, string>;
  cognito_sub?: string | null;
}

export interface MemberRegistrationResult {
  success: boolean;
  member?: any;
  error?: string;
  code?: string;
}

/**
 * Register a new fraternity member
 */
export async function registerMember(
  data: MemberRegistrationData
): Promise<MemberRegistrationResult> {
  // Check if email already exists
  const existingByEmail = await getMemberByEmail(data.email);
  if (existingByEmail) {
    return {
      success: false,
      error: 'A member with this email already exists',
      code: 'EMAIL_EXISTS',
    };
  }

  // Check if membership number already exists
  if (data.membership_number) {
    const existingByNumber = await getMemberByMembershipNumber(data.membership_number);
    if (existingByNumber) {
      return {
        success: false,
        error: 'A member with this membership number already exists',
        code: 'MEMBERSHIP_NUMBER_EXISTS',
      };
    }
  }

  // Create the member
  const member = await createMember({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    membership_number: data.membership_number || null,
    initiated_chapter_id: data.initiated_chapter_id || null,
    initiated_season: data.initiated_season || null,
    initiated_year: data.initiated_year || null,
    line_name: data.line_name || null,
    line_number: data.line_number || null,
    headshot_url: data.headshot_url || null,
    social_links: data.social_links || {},
    cognito_sub: data.cognito_sub || null,
    registration_status: 'DRAFT',
  });

  return { success: true, member };
}

export interface MemberProfileUpdateData {
  name?: string;
  phone?: string | null;
  membership_number?: string | null;
  initiated_chapter_id?: number | null;
  initiated_season?: string | null;
  initiated_year?: number | null;
  line_name?: string | null;
  line_number?: number | null;
  headshot_url?: string | null;
  social_links?: Record<string, string>;
}

/**
 * Update a member's profile
 */
export async function updateMemberProfile(
  memberId: number,
  updates: MemberProfileUpdateData
): Promise<MemberRegistrationResult> {
  const existing = await getMemberById(memberId);
  if (!existing) {
    return {
      success: false,
      error: 'Member not found',
      code: 'MEMBER_NOT_FOUND',
    };
  }

  // If updating membership number, check for duplicates
  if (updates.membership_number && updates.membership_number !== existing.membership_number) {
    const existingByNumber = await getMemberByMembershipNumber(updates.membership_number);
    if (existingByNumber && existingByNumber.id !== memberId) {
      return {
        success: false,
        error: 'A member with this membership number already exists',
        code: 'MEMBERSHIP_NUMBER_EXISTS',
      };
    }
  }

  const member = await updateMember(memberId, updates);

  return { success: true, member };
}

/**
 * Get member profile with enriched data
 */
export async function getMemberProfile(memberId: number): Promise<
  | (any & {
      chapter?: any;
      isVerified: boolean;
    })
  | null
> {
  const member = await getMemberById(memberId);

  if (!member) {
    return null;
  }

  // Get chapter information
  let chapter = null;
  if (member.initiated_chapter_id) {
    chapter = await getChapterById(member.initiated_chapter_id);
  }

  return {
    ...member,
    chapter,
    isVerified: member.verification_status === 'VERIFIED',
  };
}

/**
 * Complete member registration (change status from DRAFT to COMPLETE)
 */
export async function completeMemberRegistration(
  memberId: number
): Promise<MemberRegistrationResult> {
  const member = await getMemberById(memberId);

  if (!member) {
    return {
      success: false,
      error: 'Member not found',
      code: 'MEMBER_NOT_FOUND',
    };
  }

  if (member.registration_status === 'COMPLETE') {
    return {
      success: true,
      member,
    };
  }

  // Validate required fields for completion
  if (!member.name || !member.email) {
    return {
      success: false,
      error: 'Name and email are required',
      code: 'MISSING_REQUIRED_FIELDS',
    };
  }

  const updatedMember = await updateMember(memberId, {
    registration_status: 'COMPLETE',
  });

  return { success: true, member: updatedMember };
}

/**
 * Check if a member is eligible for seller/promoter/steward roles
 */
export async function checkMemberEligibility(
  memberId: number
): Promise<{
  eligible: boolean;
  verified: boolean;
  hasRequiredInfo: boolean;
  reason?: string;
}> {
  const member = await getMemberById(memberId);

  if (!member) {
    return {
      eligible: false,
      verified: false,
      hasRequiredInfo: false,
      reason: 'Member not found',
    };
  }

  const verified = member.verification_status === 'VERIFIED';
  const hasRequiredInfo = !!(member.name && member.email && member.membership_number);

  if (!verified) {
    return {
      eligible: false,
      verified: false,
      hasRequiredInfo,
      reason: 'Member not verified',
    };
  }

  if (!hasRequiredInfo) {
    return {
      eligible: false,
      verified: true,
      hasRequiredInfo: false,
      reason: 'Missing required information (name, email, or membership number)',
    };
  }

  return {
    eligible: true,
    verified: true,
    hasRequiredInfo: true,
  };
}
