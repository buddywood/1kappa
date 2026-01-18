# Quick Start Guide - Playwright Login Tests

Get up and running with Playwright tests in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Install Browsers

```bash
npx playwright install
```

## 3. Run Your First Test

```bash
# Run all tests (headless)
npm run test:e2e

# Or run in headed mode to see the browser
npm run test:e2e:headed

# Or use the interactive UI mode (recommended for development)
npm run test:e2e:ui
```

## 4. View Test Results

After tests complete, view the HTML report:

```bash
npm run test:e2e:report
```

## 5. Configure Test Credentials (Optional)

For tests that require authentication, create a `.env.local` file:

```bash
# Copy the example file
cp .env.test.example .env.local

# Edit .env.local with your test credentials
# TEST_USER_EMAIL=your-test-email@example.com
# TEST_USER_PASSWORD=your-test-password
```

**Note:** Many tests will work without credentials - they just test the UI and validation.

## What Tests Are Available?

### Basic Tests (`login.spec.ts`)
- ✅ Page loads correctly
- ✅ Form validation
- ✅ Error messages
- ✅ Navigation
- ✅ Accessibility
- ✅ Mobile responsiveness

### Advanced Tests (`login-advanced.spec.ts`)
- 🔒 Security (XSS, SQL injection)
- 🌐 Network errors
- ⚡ Performance
- 🌍 Browser compatibility

## Common Commands

```bash
# Run specific test file
npx playwright test login.spec.ts

# Run tests on specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Debug a test
npm run test:e2e:debug

# Run tests matching a pattern
npx playwright test -g "should load"
```

## Troubleshooting

### Error: Cannot find module '@playwright/test'
```bash
npm install
```

### Error: Executable doesn't exist
```bash
npx playwright install
```

### Tests are slow
```bash
# Run only Chromium (faster)
npm run test:e2e:chromium
```

### Need to debug a failing test
```bash
npm run test:e2e:debug
```

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Explore the [Page Object Model](./pages/login.page.ts) to understand the test structure
3. Check out the [test fixtures](./fixtures/auth.fixture.ts) for reusable test setup
4. Review [test helpers](./utils/test-helpers.ts) for useful utilities

## Example: Running Tests Against Different Environments

```bash
# Test against preview environment (default)
npm run test:e2e

# Test against local development
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e

# Test against production (use with caution!)
PLAYWRIGHT_BASE_URL=https://one-kappa.com npm run test:e2e
```

## Tips for Success

1. **Start with UI mode**: `npm run test:e2e:ui` - It's the best way to see what's happening
2. **Run one browser locally**: Use `npm run test:e2e:chromium` for faster development
3. **Use headed mode for debugging**: `npm run test:e2e:headed` when tests fail
4. **Check the HTML report**: Always run `npm run test:e2e:report` after tests to see details

## Getting Help

- Check the [README.md](./README.md) for detailed documentation
- Visit [Playwright Documentation](https://playwright.dev)
- Review the test code for examples

Happy Testing! 🎭
