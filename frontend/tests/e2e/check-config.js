#!/usr/bin/env node

/**
 * Configuration Checker for Playwright Tests
 * Verifies that test credentials are properly configured
 *
 * Usage: node tests/e2e/check-config.js
 */

require('dotenv').config({ path: '.env.local' });

const roles = [
  { name: 'GUEST', envVar: 'TEST_GUEST_EMAIL' },
  { name: 'MEMBER', envVar: 'TEST_MEMBER_EMAIL' },
  { name: 'STEWARD', envVar: 'TEST_STEWARD_EMAIL' },
  { name: 'SELLER', envVar: 'TEST_SELLER_EMAIL' },
  { name: 'PROMOTER', envVar: 'TEST_PROMOTER_EMAIL' },
  { name: 'ADMIN', envVar: 'TEST_ADMIN_EMAIL' },
];

const specialAccounts = [
  { name: 'UNVERIFIED', envVar: 'TEST_UNVERIFIED_EMAIL' },
];

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     Playwright Test Configuration Status              ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Check password
const password = process.env.TEST_PASSWORD;
const passwordConfigured = password && password !== 'TestPassword123!' && password !== 'test-password@example.com';

console.log('📝 Shared Password:');
if (!password) {
  console.log('  ❌ NOT SET - Add TEST_PASSWORD to .env.local');
} else if (password === 'TestPassword123!') {
  console.log('  ⚠️  Using default password (TestPassword123!)');
} else {
  console.log('  ✅ CONFIGURED');
}
console.log('');

// Check base URL
const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'https://preview.one-kappa.com';
console.log('🌐 Base URL:', baseUrl);
console.log('');

// Check role-based test users
console.log('👥 Test User Roles:');
let configuredCount = 0;
let totalCount = roles.length;

roles.forEach(role => {
  const email = process.env[role.envVar];
  const isExample = !email || email.includes('@example.com');
  const configured = email && !isExample;

  if (configured) {
    configuredCount++;
    console.log(`  ✅ ${role.name.padEnd(10)} - ${email}`);
  } else {
    console.log(`  ❌ ${role.name.padEnd(10)} - NOT CONFIGURED`);
  }
});

console.log('');
console.log('📊 Configuration Status:');
console.log(`  ${configuredCount}/${totalCount} roles configured (${Math.round(configuredCount/totalCount*100)}%)`);
console.log('');

// Check special accounts
console.log('🔐 Special Test Accounts:');
specialAccounts.forEach(account => {
  const email = process.env[account.envVar];
  const isExample = !email || email.includes('@example.com');
  const configured = email && !isExample;

  if (configured) {
    console.log(`  ✅ ${account.name.padEnd(12)} - ${email}`);
  } else {
    console.log(`  ℹ️  ${account.name.padEnd(12)} - Optional (not configured)`);
  }
});

console.log('');

// Provide recommendations
if (configuredCount === 0) {
  console.log('⚠️  No test users configured!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('  1. Edit .env.local file in the frontend directory');
  console.log('  2. Replace example emails with real test user emails');
  console.log('  3. Ensure TEST_PASSWORD is set to: TestPassword123!');
  console.log('  4. Run this script again to verify');
  console.log('');
  console.log('📖 For detailed setup instructions, see:');
  console.log('   tests/e2e/SETUP_CREDENTIALS.md');
} else if (configuredCount < totalCount) {
  console.log('⚠️  Some test users are not configured');
  console.log('');
  console.log('💡 Tip: Tests for unconfigured roles will be skipped automatically');
  console.log('   You can still run tests for the configured roles.');
} else {
  console.log('✅ All test users are configured!');
  console.log('');
  console.log('🚀 Ready to run tests:');
  console.log('   npm run test:e2e                 - Run all tests');
  console.log('   npm run test:e2e:ui              - Run tests in UI mode');
  console.log('   npm run test:e2e -- login-roles.spec.ts - Run role tests only');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════\n');

// Exit with error code if nothing is configured (for CI)
if (configuredCount === 0 && process.argv.includes('--strict')) {
  process.exit(1);
}
