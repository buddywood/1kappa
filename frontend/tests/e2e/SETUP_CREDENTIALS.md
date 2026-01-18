# Setting Up Test Credentials

This guide walks you through configuring test credentials for all 5 user roles.

## Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.test.example .env.local
   ```

2. **Edit `.env.local` with your test user emails:**
   ```bash
   # Use your preferred editor
   nano .env.local
   # or
   code .env.local
   ```

3. **Configure the credentials:**
   ```env
   # Set the shared password (same for all users)
   TEST_PASSWORD=YourSharedTestPassword123!

   # Set different email addresses for each role
   TEST_GUEST_EMAIL=qa-guest@yourdomain.com
   TEST_MEMBER_EMAIL=qa-member@yourdomain.com
   TEST_STEWARD_EMAIL=qa-steward@yourdomain.com
   TEST_SELLER_EMAIL=qa-seller@yourdomain.com
   TEST_PROMOTER_EMAIL=qa-promoter@yourdomain.com
   TEST_ADMIN_EMAIL=qa-admin@yourdomain.com
   ```

4. **Verify your configuration:**
   ```bash
   npm run test:e2e -- login-roles.spec.ts -g "configuration"
   ```

   This will run a test that shows which roles are configured.

## User Roles Explained

### 1. GUEST
- **Role**: Basic guest access
- **Expected Behavior**: Can access public areas
- **Redirect After Login**: Homepage (/)
- **Environment Variable**: `TEST_GUEST_EMAIL`

### 2. MEMBER
- **Role**: Standard member with full site access
- **Expected Behavior**: Full member privileges
- **Redirect After Login**: Homepage (/) or registration completion if onboarding incomplete
- **Environment Variable**: `TEST_MEMBER_EMAIL`

### 3. STEWARD
- **Role**: Steward with elevated privileges
- **Expected Behavior**: Steward-level access and permissions
- **Redirect After Login**: Homepage (/) or registration completion if onboarding incomplete
- **Environment Variable**: `TEST_STEWARD_EMAIL`

### 4. SELLER
- **Role**: Seller/vendor with selling privileges
- **Expected Behavior**: Can create and manage products/services
- **Redirect After Login**: Seller dashboard or registration completion
- **Environment Variable**: `TEST_SELLER_EMAIL`

### 5. PROMOTER
- **Role**: Promoter with promotional privileges
- **Expected Behavior**: Can create and manage promotions
- **Redirect After Login**: Promoter dashboard or registration completion
- **Environment Variable**: `TEST_PROMOTER_EMAIL`

### 6. ADMIN (Bonus)
- **Role**: Administrator with full system access
- **Expected Behavior**: Full administrative privileges
- **Redirect After Login**: Admin panel (/admin)
- **Environment Variable**: `TEST_ADMIN_EMAIL`

## Creating Test Users

You'll need to create test accounts in your system for each role:

### Option 1: Manual Creation
1. Go to your registration page
2. Create an account for each role
3. Assign the appropriate role to each account
4. Note down the email addresses

### Option 2: Using Admin Panel
1. Login as an administrator
2. Create test users directly from the admin panel
3. Assign roles to each user
4. Set a common password for all test users

### Option 3: Using Database/Backend
1. Use your backend scripts to seed test users
2. Ensure all test users have the same password
3. Assign appropriate roles via database or API

## Example .env.local File

Here's a complete example:

```env
# =============================================================================
# PLAYWRIGHT TEST CONFIGURATION
# =============================================================================

# Base URL for tests
PLAYWRIGHT_BASE_URL=https://preview.one-kappa.com

# Shared password for all test users (for convenience)
TEST_PASSWORD=TestPass123!SecurePassword

# =============================================================================
# TEST USER EMAILS BY ROLE
# =============================================================================

# Guest user
TEST_GUEST_EMAIL=qa-guest@one-kappa.com

# Member user
TEST_MEMBER_EMAIL=qa-member@one-kappa.com

# Steward user
TEST_STEWARD_EMAIL=qa-steward@one-kappa.com

# Seller user
TEST_SELLER_EMAIL=qa-seller@one-kappa.com

# Promoter user
TEST_PROMOTER_EMAIL=qa-promoter@one-kappa.com

# Admin user
TEST_ADMIN_EMAIL=qa-admin@one-kappa.com

# =============================================================================
# SPECIAL TEST ACCOUNTS
# =============================================================================

# Unverified user (for testing verification flow)
TEST_UNVERIFIED_EMAIL=qa-unverified@one-kappa.com
```

## Verifying Your Setup

### 1. Check Configuration Status
```bash
# Run the configuration check test
npm run test:e2e -- login-roles.spec.ts -g "configuration"
```

This will output something like:
```
=== Test Role Configuration Status ===
✅ GUEST: qa-guest@one-kappa.com
✅ MEMBER: qa-member@one-kappa.com
✅ STEWARD: qa-steward@one-kappa.com
✅ SELLER: qa-seller@one-kappa.com
✅ PROMOTER: qa-promoter@one-kappa.com
✅ ADMIN: qa-admin@one-kappa.com
```

### 2. Test Individual Roles
```bash
# Test GUEST login
npm run test:e2e -- login-roles.spec.ts -g "GUEST"

# Test MEMBER login
npm run test:e2e -- login-roles.spec.ts -g "MEMBER"

# Test all roles
npm run test:e2e -- login-roles.spec.ts
```

### 3. Run All Tests
```bash
# Run all login tests including role-based tests
npm run test:e2e
```

## Troubleshooting

### ❌ "Test credentials not configured" message
- **Cause**: The environment variable is not set in `.env.local`
- **Solution**: Add the missing `TEST_*_EMAIL` variable to `.env.local`

### ❌ "Invalid email or password" error
- **Cause**: The credentials don't match any user in the system
- **Solution**: Verify the user exists and the password is correct

### ❌ Tests are being skipped
- **Cause**: Credentials not configured or test conditions not met
- **Solution**: Check the skip message in the test output for details

### ❌ Wrong redirect after login
- **Cause**: User might be in wrong state (e.g., onboarding incomplete)
- **Solution**: Check user's onboarding status and adjust or complete onboarding

## Security Best Practices

### ⚠️ DO NOT commit .env.local to git
The `.env.local` file is already in `.gitignore`. Never commit it!

### ✅ Use dedicated test accounts
Create accounts specifically for testing, separate from real users.

### ✅ Use test-specific email addresses
Use a pattern like `qa-*@yourdomain.com` or `test-*@yourdomain.com`.

### ✅ Limit test account permissions
Test accounts should have minimal necessary permissions.

### ✅ Use environment-specific credentials
- Use different credentials for local, staging, and production environments
- Store production test credentials securely (e.g., GitHub Secrets, password manager)

### ✅ Rotate test passwords regularly
Change test passwords periodically, especially if they're shared among team members.

## CI/CD Configuration

When running tests in CI/CD, set environment variables as secrets:

### GitHub Actions
```yaml
env:
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
  TEST_GUEST_EMAIL: ${{ secrets.TEST_GUEST_EMAIL }}
  TEST_MEMBER_EMAIL: ${{ secrets.TEST_MEMBER_EMAIL }}
  TEST_STEWARD_EMAIL: ${{ secrets.TEST_STEWARD_EMAIL }}
  TEST_SELLER_EMAIL: ${{ secrets.TEST_SELLER_EMAIL }}
  TEST_PROMOTER_EMAIL: ${{ secrets.TEST_PROMOTER_EMAIL }}
  TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
```

### GitLab CI
```yaml
variables:
  TEST_PASSWORD: $TEST_PASSWORD
  TEST_GUEST_EMAIL: $TEST_GUEST_EMAIL
  # ... etc
```

## Next Steps

Once credentials are configured:

1. ✅ Run the configuration check test
2. ✅ Test each role individually
3. ✅ Run the full test suite
4. ✅ Set up CI/CD secrets (if applicable)
5. ✅ Document any role-specific test scenarios
6. ✅ Add role-specific test cases as needed

## Getting Help

If you encounter issues:
1. Check the test output for specific error messages
2. Verify credentials in your application's admin panel
3. Review the [README.md](./README.md) for general testing guidance
4. Check the [QUICK_START.md](./QUICK_START.md) for basic setup

## Example Test Commands

```bash
# Check what's configured
npm run test:e2e -- login-roles.spec.ts -g "configuration"

# Test specific role
npm run test:e2e -- login-roles.spec.ts -g "GUEST"

# Test all roles with UI mode (recommended)
npm run test:e2e:ui login-roles.spec.ts

# Test in headed mode to see browser
npm run test:e2e:headed login-roles.spec.ts

# Run all tests including role tests
npm run test:e2e
```
