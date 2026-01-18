# Playwright E2E Tests for 1KAPPA Login

This directory contains end-to-end tests for the login functionality of 1KAPPA using Playwright.

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts       # Custom test fixtures for authentication
├── pages/
│   └── login.page.ts         # Page Object Model for login page
├── utils/
│   └── test-helpers.ts       # Helper functions and test data
├── login.spec.ts             # Main login tests
├── login-advanced.spec.ts    # Advanced tests (security, edge cases)
└── README.md                 # This file
```

## Setup

### Install Dependencies

```bash
npm install
```

This will install Playwright and all required dependencies.

### Install Browsers

```bash
npx playwright install
```

This downloads the required browser binaries (Chromium, Firefox, WebKit).

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

### Run Specific Test File

```bash
npx playwright test login.spec.ts
```

### Run Tests on Specific Browser

```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# WebKit only
npx playwright test --project=webkit
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

## Environment Variables

Configure these environment variables to customize test behavior:

### Required for Full Test Coverage

- `TEST_USER_EMAIL` - Email for a valid test user account
- `TEST_USER_PASSWORD` - Password for the valid test user account
- `TEST_UNVERIFIED_EMAIL` - Email for an unverified test user
- `TEST_UNVERIFIED_PASSWORD` - Password for the unverified user
- `TEST_TEMP_PASSWORD_EMAIL` - Email for user that needs password change
- `TEST_TEMP_PASSWORD` - Temporary password for password change test

### Optional

- `PLAYWRIGHT_BASE_URL` - Base URL for tests (default: https://preview.one-kappa.com)
- `CI` - Set to `true` when running in CI environment

### Setting Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
# Test Credentials
TEST_USER_EMAIL=your-test-user@example.com
TEST_USER_PASSWORD=YourSecurePassword123!

# For verification tests
TEST_UNVERIFIED_EMAIL=unverified@example.com
TEST_UNVERIFIED_PASSWORD=TestPassword123!

# For password change tests
TEST_TEMP_PASSWORD_EMAIL=temp@example.com
TEST_TEMP_PASSWORD=TempPassword123!

# Base URL (optional)
PLAYWRIGHT_BASE_URL=https://preview.one-kappa.com
```

**Note:** Never commit the `.env.local` file to version control!

## Test Categories

### 1. Basic Login Tests (`login.spec.ts`)

- ✅ Page load and rendering
- ✅ Form validation
- ✅ Login functionality
- ✅ Error handling
- ✅ Remember me feature
- ✅ Verification flow
- ✅ Password change flow
- ✅ Navigation
- ✅ Accessibility
- ✅ Mobile responsiveness

### 2. Advanced Tests (`login-advanced.spec.ts`)

- 🔒 Security tests (XSS, SQL injection)
- 🌐 Network error handling
- 🔗 URL parameter handling
- 🍪 Session management
- 🔢 Verification code input
- 🔑 Password requirements
- 🌍 Browser compatibility
- ⚡ Performance tests
- 🌐 Localization

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This will open an interactive report showing:
- Test results
- Screenshots of failures
- Videos of test runs
- Traces for debugging

## Writing New Tests

### Using Page Object Model

```typescript
import { test, expect } from './fixtures/auth.fixture';

test('my new test', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  // ... your test assertions
});
```

### Using Test Helpers

```typescript
import { testUsers, generateRandomEmail } from './utils/test-helpers';

test('test with random email', async ({ loginPage }) => {
  const email = generateRandomEmail();
  await loginPage.login(email, 'password123');
});
```

## Debugging Tests

### Playwright Inspector

```bash
npx playwright test --debug
```

Opens the Playwright Inspector where you can:
- Step through tests
- Inspect locators
- View console logs
- See network requests

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

View detailed traces including:
- DOM snapshots
- Network activity
- Console logs
- Screenshots at each step

### Visual Studio Code Extension

Install the [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) extension for:
- Running tests from the editor
- Debugging with breakpoints
- Recording new tests
- Viewing test results inline

## Best Practices

1. **Use Page Objects** - Keep selectors in page objects, not in tests
2. **Use Fixtures** - Leverage custom fixtures for reusable setup
3. **Avoid Hard Waits** - Use Playwright's auto-waiting instead of `setTimeout`
4. **Isolate Tests** - Each test should be independent
5. **Use Descriptive Names** - Test names should clearly describe what they test
6. **Skip Tests Properly** - Use `test.skip()` for tests requiring special setup
7. **Clean Up** - Reset state between tests using `beforeEach`/`afterEach`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run tests
        run: npm run test:e2e
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests are failing with "Target closed" error

- This usually means the page crashed or navigated unexpectedly
- Check for JavaScript errors in the console
- Ensure the application is running and accessible

### Tests are slow

- Run tests in parallel: `npx playwright test --workers=4`
- Use headed mode only for debugging
- Consider running fewer browser projects locally

### Can't find elements

- Use Playwright Inspector to debug selectors
- Check if elements are in shadow DOM
- Verify element is visible and not covered by other elements

### Authentication issues

- Verify test credentials are correct
- Check if test accounts are in the correct state
- Review session/cookie handling

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Writing Tests Guide](https://playwright.dev/docs/writing-tests)

## Support

For issues or questions:
1. Check the [Playwright documentation](https://playwright.dev)
2. Review existing test examples in this directory
3. Check the project's issue tracker
4. Contact the development team
