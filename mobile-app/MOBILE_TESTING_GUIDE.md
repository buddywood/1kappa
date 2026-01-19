# Mobile App Testing Guide

This guide covers E2E testing for the React Native/Expo mobile app with a focus on access control testing.

## Testing Framework Options

### 1. ✅ Detox (Recommended - "Playwright for React Native")

**Detox** is the most popular E2E testing framework for React Native. It's fast, reliable, and works like Playwright but for mobile apps.

#### Features:
- Gray box testing (synchronization with app internals)
- Fast and reliable
- Works with iOS and Android
- Excellent documentation
- Active community support

#### Installation:

```bash
cd mobile-app

# Install Detox CLI globally
npm install -g detox-cli

# Install Detox dependencies
npm install --save-dev detox jest

# For iOS (macOS only)
brew tap wix/brew
brew install applesimutils

# For Android - ensure you have Android SDK and emulator installed
```

#### Setup for Expo:

Since you're using Expo, you'll need to use development builds (Expo Go doesn't work with Detox):

```bash
# Create development build
npx expo prebuild

# Build for iOS
npx expo run:ios

# Build for Android
npx expo run:android
```

#### Update package.json:

```json
{
  "scripts": {
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "test:e2e:ios:release": "detox test --configuration ios.sim.release",
    "test:e2e:android:release": "detox test --configuration android.emu.release",
    "build:e2e:ios": "detox build --configuration ios.sim.debug",
    "build:e2e:android": "detox build --configuration android.emu.debug"
  }
}
```

#### Running Tests:

```bash
# Build the app first
npm run build:e2e:ios

# Run tests on iOS
npm run test:e2e:ios

# Run tests on Android
npm run build:e2e:android
npm run test:e2e:android

# Run specific test
detox test e2e/seller-dashboard-access.test.ts --configuration ios.sim.debug
```

#### Test ID Setup:

Add `testID` props to components for Detox to find them:

```tsx
// Example: ProfileScreen.tsx
<View testID="profile-screen">
  <TouchableOpacity testID="seller-dashboard-button" onPress={onSellerDashboardPress}>
    <Text>Seller Dashboard</Text>
  </TouchableOpacity>
</View>

// SellerDashboardScreen.tsx
<View testID="seller-dashboard-screen">
  <Text>Seller Dashboard</Text>
</View>
```

---

### 2. 🚀 Maestro (Simpler Alternative)

**Maestro** is a newer, simpler mobile testing tool. It's easier to set up than Detox but less powerful.

#### Features:
- Simple YAML-based tests
- No code required for basic tests
- Works with iOS and Android
- No need to rebuild app for tests
- Cloud testing available

#### Installation:

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Or with Homebrew
brew tap mobile-dev-inc/tap
brew install maestro
```

#### Example Test (YAML):

```yaml
# e2e/seller-dashboard-access.yaml
appId: com.yourcompany.yourapp

---
# Test: SELLER can access seller dashboard
- launchApp
- tapOn: "Profile"
- inputText:
    id: "login-email-input"
    text: "buddy+seller@ebilly.com"
- inputText:
    id: "login-password-input"
    text: "${SELLER_PASSWORD}"
- tapOn: "Login"
- tapOn: "Seller Dashboard"
- assertVisible: "Total Sales"
```

#### Running Tests:

```bash
# Run test
maestro test e2e/seller-dashboard-access.yaml

# Run on specific device
maestro test --device "iPhone 15 Pro" e2e/seller-dashboard-access.yaml
```

---

### 3. 🌐 Appium (Cross-Platform, Most Complex)

**Appium** is the most powerful but also most complex option. Use it if you need to test across many platforms or devices.

#### Features:
- Works with iOS, Android, Web
- Language agnostic (JavaScript, Python, Java, etc.)
- Industry standard
- Most complex setup

#### Installation:

```bash
# Install Appium
npm install -g appium

# Install drivers
appium driver install xcuitest  # iOS
appium driver install uiautomator2  # Android
```

---

## Comparison Table

| Feature | Detox | Maestro | Appium |
|---------|-------|---------|--------|
| **Ease of Setup** | Medium | Easy | Hard |
| **Test Speed** | Fast | Medium | Slow |
| **React Native Support** | Excellent | Good | Good |
| **Code vs Config** | Code | YAML | Code |
| **Reliability** | High | Medium | Medium |
| **Learning Curve** | Medium | Low | High |
| **Best For** | React Native | Simple tests | Multi-platform |

---

## Recommended Approach

### For Your Project (React Native/Expo):

**Use Detox** because:
1. ✅ Best for React Native
2. ✅ Fast and reliable
3. ✅ Mirrors your Playwright tests (similar API)
4. ✅ Good TypeScript support
5. ✅ Active development and community

### Test Strategy:

```
┌─────────────────────────────────────┐
│  Component Tests (Jest + RNTL)     │  <- Unit/component level
├─────────────────────────────────────┤
│  E2E Tests (Detox)                  │  <- User flow level
├─────────────────────────────────────┤
│  API Tests (Existing backend tests) │  <- Backend validation
└─────────────────────────────────────┘
```

---

## Access Control Test Coverage

The `seller-dashboard-access.test.ts` test mirrors your web Playwright tests:

✅ **Authorized Users:**
- SELLER can access seller dashboard
- ADMIN can access seller dashboard

✅ **Unauthorized Users:**
- GUEST sees "apply to become seller" message
- MEMBER sees "apply to become seller" message
- STEWARD sees access denied
- PROMOTER sees "separate dashboards" message

---

## CI/CD Integration

### GitHub Actions Example:

```yaml
name: Mobile E2E Tests

on: [push, pull_request]

jobs:
  test-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd mobile-app && npm ci

      - name: Install Detox
        run: npm install -g detox-cli

      - name: Build iOS app
        run: cd mobile-app && npm run build:e2e:ios

      - name: Run Detox tests
        run: cd mobile-app && npm run test:e2e:ios
        env:
          TEST_SELLER_PASSWORD: ${{ secrets.TEST_SELLER_PASSWORD }}
          TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}

  test-android:
    runs-on: macos-latest
    steps:
      # Similar setup for Android
      # ...
```

---

## Required Component Updates

To make the mobile app testable, add these `testID` props:

### 1. Bottom Tab Bar (`BottomTabBar.tsx`):
```tsx
<TouchableOpacity testID="bottom-tab-profile" ...>
```

### 2. Profile Screen (`ProfileScreen.tsx`):
```tsx
<View testID="profile-screen">
  <TextInput testID="login-email-input" />
  <TextInput testID="login-password-input" />
  <TouchableOpacity testID="login-button">
  <TouchableOpacity testID="seller-dashboard-button">
```

### 3. Seller Dashboard Screen (`SellerDashboardScreen.tsx`):
```tsx
<View testID="seller-dashboard-screen">
```

### 4. Home Screen:
```tsx
<View testID="home-screen">
```

---

## Next Steps

1. **Add testID props** to components (see Required Component Updates above)
2. **Install Detox** following the installation steps
3. **Run the seller dashboard access tests**
4. **Add more E2E tests** for other critical flows
5. **Set up CI/CD** to run tests automatically

---

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Maestro Documentation](https://maestro.mobile.dev/)
- [Appium Documentation](https://appium.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

---

## Troubleshooting

### iOS Simulator Issues:
```bash
# Reset simulator
xcrun simctl erase all

# List available simulators
xcrun simctl list devices
```

### Android Emulator Issues:
```bash
# List emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_7_API_34
```

### Detox Build Errors:
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Clean Android build
cd android && ./gradlew clean && cd ..

# Rebuild
npm run build:e2e:ios
```
