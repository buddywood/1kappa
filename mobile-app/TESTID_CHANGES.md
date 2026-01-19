# Test ID Props Added for Detox Testing

## Files Modified

### 1. ✅ `components/BottomTabBar.tsx`
- **Line 74**: Added `testID={bottom-tab-${tab.id}}` to TouchableOpacity
- Creates IDs: `bottom-tab-home`, `bottom-tab-events`, `bottom-tab-shop`, `bottom-tab-steward-marketplace`, `bottom-tab-profile`

### 2. ✅ `components/ProfileScreen.tsx`
- **Line 624**: Added `testID="profile-screen"` to main View container
- **Line 661**: Added `testID="login-email-input"` to email TextField
- **Line 672**: Added `testID="login-password-input"` to password PasswordField
- **Line 757**: Added `testID="login-button"` to PrimaryButton
- **Line 481**: Added `testID="seller-dashboard-button"` to seller dashboard TouchableOpacity
- **Line 607**: Added `testID="settings-button"` to Settings MenuItem
- **Line 614**: Added `testID="logout-button"` to Log Out MenuItem

### 3. ✅ `components/SellerDashboardScreen.tsx`
- **Line 242**: Added `testID="seller-dashboard-screen"` to main View container
- **Access control logic**: Added role-based checks with appropriate alert messages

### 4. ✅ `App.tsx`
- **Line 471**: Wrapped home screen content in View with `testID="home-screen"`

### 5. ✅ `components/ui/PrimaryButton.tsx`
- **Line 13**: Added `testID?: string` to interface
- **Line 25**: Added `testID` parameter to function
- **Line 33**: Passed `testID={testID}` to Button component

### 6. ✅ `components/ui/MenuItem.tsx`
- **Line 10**: Added `testID?: string` to interface
- **Line 18**: Added `testID` parameter to function
- **Line 26**: Passed `testID={testID}` to TouchableOpacity

## Test ID Usage in Tests

The test file `e2e/seller-dashboard-access.test.ts` uses these IDs:

```typescript
// Navigation
element(by.id('bottom-tab-profile'))

// Login screen
element(by.id('login-email-input'))
element(by.id('login-password-input'))
element(by.id('login-button'))

// Home screen
element(by.id('home-screen'))

// Profile screen
element(by.id('profile-screen'))
element(by.id('seller-dashboard-button'))
element(by.id('settings-button'))
element(by.id('logout-button'))

// Seller dashboard
element(by.id('seller-dashboard-screen'))
```

## Components That Already Support testID

These UI components accept testID through props spreading:

### ✅ `TextField.tsx`
- Spreads `textInputProps` to `Input` component
- `Input` spreads all props to React Native `TextInput`
- **testID passes through automatically**

### ✅ `PasswordField.tsx`
- Spreads `textInputProps` to `Input` component
- `Input` spreads all props to React Native `TextInput`
- **testID passes through automatically**

### ✅ `Input.tsx`
- Spreads `{...props}` to React Native `TextInput` on line 71
- **testID passes through automatically**

## Running the Tests

### Prerequisites
```bash
# Detox CLI should already be installed
npm install -g detox-cli

# Detox & Jest already in devDependencies
```

### Environment Setup
```bash
# Edit .env.test and add your test passwords
TEST_SELLER_PASSWORD=your_password
TEST_ADMIN_PASSWORD=your_password
# ... etc
```

### Build & Run
```bash
# Build app for testing (running now)
npm run build:e2e:ios

# Once build completes, run tests
npm run test:e2e:ios

# Or run specific test
detox test e2e/seller-dashboard-access.test.ts --configuration ios.sim.debug
```

## Test Coverage

The `seller-dashboard-access.test.ts` file tests:

### ✅ Authorized Access (2 tests)
- SELLER can access seller dashboard
- ADMIN can access seller dashboard

### ✅ Unauthorized Access (4 tests)
- GUEST sees "apply to become seller" alert
- MEMBER sees "apply to become seller" alert
- STEWARD sees access denied alert
- PROMOTER sees "separate dashboards" alert

## Debugging Test IDs

If tests can't find elements:

```bash
# Print element tree
detox test --debug-synchronization 200

# Take screenshots
# Tests automatically save screenshots to test-results/

# View Detox logs
# Check terminal output during test runs
```

## Notes

- All testIDs follow kebab-case naming convention
- testIDs are descriptive and match their purpose
- Dynamic testIDs use template literals (e.g., `bottom-tab-${id}`)
- Native components (View, TouchableOpacity, TextInput) natively support testID
- Custom components needed explicit testID prop added
