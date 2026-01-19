/**
 * Test data and helper utilities for E2E tests
 */

const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

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
    password: process.env.TEST_ADMIN_PASSWORD || TEST_PASSWORD,
    role: 'ADMIN',
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    role: 'INVALID',
  },
};

export type UserRole = 'GUEST' | 'MEMBER' | 'STEWARD' | 'SELLER' | 'PROMOTER' | 'ADMIN' | 'INVALID';

export function getTestUser(role: UserRole) {
  const roleKey = role.toLowerCase() as keyof typeof testUsers;
  return testUsers[roleKey];
}

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

export function hasTestCredentials(role: UserRole): boolean {
  const user = getTestUser(role);
  const envVarName = `TEST_${role}_EMAIL`;
  return !!process.env[envVarName];
}
