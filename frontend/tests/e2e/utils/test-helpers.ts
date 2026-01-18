/**
 * Test data and helper utilities for E2E tests
 */

/**
 * Shared password for all test users
 * Configure via TEST_PASSWORD environment variable
 */
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

/**
 * Test user credentials organized by role
 * Each role has a different email but shares the same password
 */
export const testUsers = {
  guest: {
    email: process.env.TEST_GUEST_EMAIL || 'test-guest@example.com',
    password: TEST_PASSWORD,
    role: 'GUEST',
  },
  member: {
    email: process.env.TEST_MEMBER_EMAIL || 'test-member@example.com',
    password: TEST_PASSWORD,
    role: 'MEMBER',
  },
  steward: {
    email: process.env.TEST_STEWARD_EMAIL || 'test-steward@example.com',
    password: TEST_PASSWORD,
    role: 'STEWARD',
  },
  seller: {
    email: process.env.TEST_SELLER_EMAIL || 'test-seller@example.com',
    password: TEST_PASSWORD,
    role: 'SELLER',
  },
  promoter: {
    email: process.env.TEST_PROMOTER_EMAIL || 'test-promoter@example.com',
    password: TEST_PASSWORD,
    role: 'PROMOTER',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com',
    password: TEST_PASSWORD,
    role: 'ADMIN',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    role: 'INVALID',
  },
  unverified: {
    email: process.env.TEST_UNVERIFIED_EMAIL || 'unverified@example.com',
    password: TEST_PASSWORD,
    role: 'UNVERIFIED',
  },
};

/**
 * Type definition for user roles
 */
export type UserRole = 'GUEST' | 'MEMBER' | 'STEWARD' | 'SELLER' | 'PROMOTER' | 'ADMIN' | 'INVALID' | 'UNVERIFIED';

/**
 * Get test user by role
 */
export function getTestUser(role: UserRole) {
  const roleKey = role.toLowerCase() as keyof typeof testUsers;
  return testUsers[roleKey];
}

/**
 * Get all valid test users (excluding invalid and unverified)
 */
export function getAllValidTestUsers() {
  return [
    testUsers.guest,
    testUsers.member,
    testUsers.steward,
    testUsers.seller,
    testUsers.promoter,
    testUsers.admin,
  ];
}

/**
 * Check if test credentials are configured for a specific role
 */
export function hasTestCredentials(role: UserRole): boolean {
  const user = getTestUser(role);
  const envVarName = `TEST_${role}_EMAIL`;
  return !!process.env[envVarName];
}

/**
 * Generate a random email for testing
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random password that meets requirements
 */
export function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  // Ensure it has at least one uppercase, lowercase, number, and special char
  return 'Aa1!' + password;
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a 6-digit verification code (for testing)
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!process.env.CI;
}

/**
 * Get the base URL for tests
 */
export function getBaseURL(): string {
  return process.env.PLAYWRIGHT_BASE_URL || 'https://preview.one-kappa.com';
}
