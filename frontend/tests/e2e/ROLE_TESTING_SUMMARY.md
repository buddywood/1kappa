# Role-Based Login Testing - Complete Setup

This document summarizes the role-based testing configuration for your 5 user types.

## 🎯 Overview

Your Playwright test suite now supports **5 different user roles** with unique email addresses but a **shared password** (`TestPassword123!`):

1. **GUEST** - Basic guest access
2. **MEMBER** - Standard member with full site access
3. **STEWARD** - Steward with elevated privileges
4. **SELLER** - Seller/vendor with selling privileges
5. **PROMOTER** - Promoter with promotional privileges
6. **ADMIN** (bonus) - Administrator with full system access

## 📝 Current Configuration Status

Run this command to check your configuration anytime:

```bash
npm run test:e2e:config
```

This will show you which roles are configured and which need setup.

## 🚀 Quick Start

### 1. Configure Your Test User Emails

Edit `.env.local` and replace the example emails with your actual test user emails:

```env
TEST_PASSWORD=TestPassword123!

TEST_GUEST_EMAIL=your-guest-user@example.com
TEST_MEMBER_EMAIL=your-member-user@example.com
TEST_STEWARD_EMAIL=your-steward-user@example.com
TEST_SELLER_EMAIL=your-seller-user@example.com
TEST_PROMOTER_EMAIL=your-promoter-user@example.com
TEST_ADMIN_EMAIL=your-admin-user@example.com
```

**Note:** The `.env.local` file already has placeholder values. Just replace the email addresses with your real test accounts.

### 2. Verify Configuration

```bash
npm run test:e2e:config
```

You should see ✅ checkmarks for configured roles.

### 3. Run Role-Based Tests

```bash
# Test all roles (in UI mode - recommended)
npm run test:e2e:ui login-roles.spec.ts

# Test all roles (headless)
npm run test:e2e:roles

# Test specific role
npm run test:e2e -- login-roles.spec.ts -g "GUEST"
npm run test:e2e -- login-roles.spec.ts -g "MEMBER"
npm run test:e2e -- login-roles.spec.ts -g "SELLER"
```

## 📋 What Tests Are Included

### Basic Role Tests (`login-roles.spec.ts`)
- ✅ Login with each role (GUEST, MEMBER, STEWARD, SELLER, PROMOTER, ADMIN)
- ✅ Verify correct redirects after login (role-specific)
- ✅ Remember Me functionality per role
- ✅ Session management per role
- ✅ Cross-role access verification (GUEST cannot access admin routes)
- ✅ Sequential login with different roles
- ✅ Configuration status check

### Standard Login Tests (`login.spec.ts`)
- ✅ Page load and rendering
- ✅ Form validation
- ✅ Error handling
- ✅ Navigation
- ✅ Accessibility
- ✅ Mobile responsiveness

### Advanced Security Tests (`login-advanced.spec.ts`)
- 🔒 XSS and SQL injection protection
- 🌐 Network error handling
- ⚡ Performance testing
- 🌍 Cross-browser compatibility

## 📊 Total Test Coverage

- **Total Tests**: ~300+ tests
- **Role-Specific Tests**: 20+ tests
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Roles Supported**: 6 (GUEST, MEMBER, STEWARD, SELLER, PROMOTER, ADMIN)

## 🔧 Available Commands

```bash
# Configuration
npm run test:e2e:config          # Check configuration status

# Role-specific testing
npm run test:e2e:roles           # Run all role tests
npm run test:e2e:ui login-roles.spec.ts  # Interactive UI mode

# General testing
npm run test:e2e                 # Run all tests
npm run test:e2e:headed          # Run with visible browser
npm run test:e2e:ui              # Interactive UI mode
npm run test:e2e:report          # View test report

# Browser-specific
npm run test:e2e:chromium        # Chromium only
npm run test:e2e:firefox         # Firefox only
npm run test:e2e:webkit          # WebKit only
```

## 📂 File Structure

```
tests/e2e/
├── login-roles.spec.ts          # ⭐ NEW: Role-based login tests
├── login.spec.ts                # Standard login tests
├── login-advanced.spec.ts       # Advanced security tests
├── pages/
│   └── login.page.ts            # Page Object Model
├── fixtures/
│   └── auth.fixture.ts          # Test fixtures
├── utils/
│   └── test-helpers.ts          # ⭐ UPDATED: Role-based helpers
├── check-config.js              # ⭐ NEW: Configuration checker
├── SETUP_CREDENTIALS.md         # ⭐ NEW: Detailed setup guide
├── ROLE_TESTING_SUMMARY.md      # ⭐ NEW: This file
├── QUICK_START.md               # Quick start guide
└── README.md                    # Comprehensive documentation
```

## 🎯 Expected Behavior Per Role

### GUEST
- **After Login**: Redirects to homepage (/)
- **Access Level**: Basic public access
- **Tests**: Login, session management, cannot access admin

### MEMBER
- **After Login**: Homepage (/) or /register if onboarding incomplete
- **Access Level**: Full member privileges
- **Tests**: Login, session management, onboarding flow

### STEWARD
- **After Login**: Homepage (/) or /register if onboarding incomplete
- **Access Level**: Steward-level privileges
- **Tests**: Login, session management, steward-specific access

### SELLER
- **After Login**: Seller dashboard or /register if onboarding incomplete
- **Access Level**: Can create and manage products/services
- **Tests**: Login, session management, seller-specific features

### PROMOTER
- **After Login**: Promoter dashboard or /register if onboarding incomplete
- **Access Level**: Can create and manage promotions
- **Tests**: Login, session management, promoter-specific features

### ADMIN
- **After Login**: Admin panel (/admin)
- **Access Level**: Full administrative privileges
- **Tests**: Login, admin access, elevated permissions

## 🔄 Typical Workflow

### For Development
1. Check configuration: `npm run test:e2e:config`
2. Configure any missing roles in `.env.local`
3. Run tests in UI mode: `npm run test:e2e:ui login-roles.spec.ts`
4. Make changes to your app
5. Re-run tests to verify

### For CI/CD
1. Set environment variables as secrets in your CI system
2. Run: `npm run test:e2e`
3. View artifacts (test reports, screenshots, videos)

## 📖 Detailed Documentation

- **[SETUP_CREDENTIALS.md](./SETUP_CREDENTIALS.md)** - Complete setup guide
- **[README.md](./README.md)** - Full testing documentation
- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes

## 🆘 Troubleshooting

### Tests are being skipped
- **Cause**: Role not configured in `.env.local`
- **Solution**: Run `npm run test:e2e:config` to see what's missing

### "Invalid email or password" errors
- **Cause**: Credentials don't match users in system
- **Solution**: Verify users exist and password is `TestPassword123!`

### Wrong redirects after login
- **Cause**: User onboarding status or permissions issue
- **Solution**: Check user state in admin panel or database

### Can't see test results
- **Cause**: Tests ran in headless mode
- **Solution**: Use `npm run test:e2e:ui` or `npm run test:e2e:headed`

## 🔐 Security Notes

- ⚠️ **Never commit** `.env.local` to git (already in .gitignore)
- ✅ Use dedicated test accounts, not real users
- ✅ Use test-specific email pattern (e.g., `qa-*@yourdomain.com`)
- ✅ Store CI credentials as secrets, not in code
- ✅ Rotate test passwords periodically

## 💡 Tips

1. **Use UI Mode** during development: `npm run test:e2e:ui`
2. **Test one role at a time** when debugging: `npm run test:e2e -- login-roles.spec.ts -g "GUEST"`
3. **Check config first** before running tests: `npm run test:e2e:config`
4. **Keep test accounts clean** - reset to known state periodically
5. **Update tests** as your role logic evolves

## 🎉 Next Steps

1. ✅ Run `npm run test:e2e:config` to check current status
2. ✅ Configure missing test user emails in `.env.local`
3. ✅ Run `npm run test:e2e:config` again to verify
4. ✅ Test with UI mode: `npm run test:e2e:ui login-roles.spec.ts`
5. ✅ Add role-specific test scenarios as needed
6. ✅ Set up CI/CD with test credentials (if applicable)

## 📞 Getting Help

- Check the [SETUP_CREDENTIALS.md](./SETUP_CREDENTIALS.md) for detailed setup
- Review [README.md](./README.md) for general testing info
- Run `npm run test:e2e:config` to diagnose configuration issues
- Check test output for specific error messages

---

**Happy Testing! 🎭**

Your Playwright test suite is now ready to test all 5 user roles + admin with role-specific behaviors and permissions.
