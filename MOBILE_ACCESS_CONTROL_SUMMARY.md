# Mobile App Access Control Implementation Summary

## ✅ What Was Implemented

### 1. **Mobile App Access Control** (`mobile-app/components/SellerDashboardScreen.tsx`)

Added role-based access control that mirrors the web app:

```typescript
// Checks user role and permissions before loading dashboard
const userRole = user?.role;
const isSeller = user?.is_seller || user?.sellerId;
const onboardingStatus = user?.onboarding_status;

// Allow access if: ADMIN, SELLER, or has is_seller flag/sellerId
const hasAccess = userRole === 'ADMIN' || userRole === 'SELLER' || isSeller;

if (!hasAccess) {
  // Show appropriate alert based on role
  // - GUEST: "Apply to become a seller"
  // - MEMBER/STEWARD: "Apply to become a seller"
  // - PROMOTER: "Separate dashboards"
  // - Incomplete onboarding: "Complete registration"
}
```

**Also handles 403 responses** from API when backend denies access.

---

### 2. **Backend Access Control** (Already Implemented ✅)

Backend routes (`backend/src/routes/sellers.ts`) already enforce access:

```typescript
// Lines 675-809: All /me endpoints require authentication + seller role
router.get("/me/products", authenticate, async (req, res) => {
  if (!req.user || !req.user.sellerId) {
    return res.status(403).json({ error: "Not a seller" });
  }
  // ... fetch products
});
```

**Protected Endpoints:**
- `GET /api/sellers/me` → Seller profile
- `GET /api/sellers/me/products` → Seller's products
- `GET /api/sellers/me/orders` → Seller's orders
- `GET /api/sellers/me/metrics` → Sales metrics

---

## 📱 Mobile Testing Setup

### **Detox** (Recommended - "Playwright for React Native")

**Files Created:**
- ✅ `.detoxrc.js` - Detox configuration
- ✅ `e2e/seller-dashboard-access.test.ts` - Access control tests
- ✅ `e2e/jest.config.js` - Jest configuration for Detox
- ✅ `MOBILE_TESTING_GUIDE.md` - Complete testing guide

**Test Coverage** (mirrors web Playwright tests):
```typescript
✅ SELLER can access seller dashboard
✅ ADMIN can access seller dashboard
✅ GUEST sees "apply to become seller" alert
✅ MEMBER sees "apply to become seller" alert
✅ STEWARD sees access denied alert
✅ PROMOTER sees "separate dashboards" alert
```

---

## 🚀 Quick Start Guide

### Step 1: Add testID Props to Components

Components need `testID` props for Detox to find them:

#### `BottomTabBar.tsx`:
```tsx
<TouchableOpacity testID="bottom-tab-profile" onPress={...}>
```

#### `ProfileScreen.tsx`:
```tsx
<View testID="profile-screen">
  <TextInput testID="login-email-input" {...} />
  <TextInput testID="login-password-input" {...} />
  <TouchableOpacity testID="login-button" {...} />
  <TouchableOpacity testID="seller-dashboard-button" {...} />
</View>
```

#### `SellerDashboardScreen.tsx`:
```tsx
<View testID="seller-dashboard-screen">
  <Text>Seller Dashboard</Text>
</View>
```

#### Home screen component:
```tsx
<View testID="home-screen">
```

### Step 2: Install Detox

```bash
cd mobile-app

# Install Detox
npm install -g detox-cli
npm install --save-dev detox jest

# iOS prerequisites (macOS only)
brew tap wix/brew
brew install applesimutils
```

### Step 3: Create Development Build

Since you're using Expo, create a development build:

```bash
# Generate native projects
npx expo prebuild

# Build for iOS
npx expo run:ios

# Build for Android
npx expo run:android
```

### Step 4: Add Test Scripts to package.json

```json
{
  "scripts": {
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "build:e2e:ios": "detox build --configuration ios.sim.debug",
    "build:e2e:android": "detox build --configuration android.emu.debug"
  }
}
```

### Step 5: Run Tests

```bash
# Build app for testing
npm run build:e2e:ios

# Run tests
npm run test:e2e:ios

# Run specific test
detox test e2e/seller-dashboard-access.test.ts --configuration ios.sim.debug
```

---

## 🔒 Access Control Flow

### Web App (Next.js):
```
1. User navigates to /seller-dashboard
2. Page checks session status (loading/unauthenticated/authenticated)
3. If unauthenticated → redirect to /login
4. If authenticated → check role
5. If no access → redirect based on role:
   - GUEST → /register or /apply
   - MEMBER/STEWARD → /member-dashboard
   - PROMOTER → /promote
6. If has access → fetch dashboard data
7. If API returns 403 → redirect appropriately
```

### Mobile App (React Native):
```
1. User taps "Seller Dashboard" button
2. SellerDashboardScreen checks user object
3. If not authenticated → show alert, go back
4. If authenticated → check role
5. If no access → show alert with appropriate message, go back
6. If has access → fetch dashboard data
7. If API returns 403 → show alert, go back
```

---

## 🎯 Key Differences: Web vs Mobile

| Aspect | Web (Next.js) | Mobile (React Native) |
|--------|---------------|----------------------|
| **Navigation** | `router.push()` | `onBack()` callback + state |
| **User Feedback** | Page redirect | Alert dialog |
| **Session Check** | `useSession` hook | `useAuth` context |
| **Testing** | Playwright | Detox |
| **Access Denied** | Redirect to appropriate page | Alert + go back |

---

## 📊 Testing Options Comparison

| Framework | Best For | Difficulty | Speed | TypeScript |
|-----------|----------|------------|-------|------------|
| **Detox** ⭐ | React Native | Medium | Fast | ✅ Excellent |
| **Maestro** | Simple tests | Easy | Medium | ❌ YAML only |
| **Appium** | Multi-platform | Hard | Slow | ✅ Good |

**Recommendation:** Use **Detox** - it's the React Native equivalent of Playwright.

---

## ✅ Security Checklist

- [x] **Backend** enforces role checks (authenticate middleware + sellerId check)
- [x] **Web Frontend** checks role before API calls + handles 403 responses
- [x] **Mobile App** checks role before API calls + handles 403 responses
- [x] **Web Tests** verify all 6 role combinations (Playwright)
- [ ] **Mobile Tests** verify all 6 role combinations (Detox) - *Ready to run after testID setup*
- [ ] **CI/CD** runs both web and mobile E2E tests automatically

---

## 📝 Next Steps

1. ✅ **Backend access control** - Already implemented
2. ✅ **Web access control** - Implemented with Playwright tests
3. ✅ **Mobile access control** - Implemented (code changes complete)
4. 🔄 **Add testID props** - Need to update components
5. 🔄 **Install Detox** - Follow installation guide
6. 🔄 **Run mobile tests** - Verify access control works
7. 🔄 **CI/CD integration** - Add mobile tests to pipeline

---

## 🆘 Need Help?

- **Web Testing**: See `frontend/tests/e2e/login-seller-dashboard-access.spec.ts`
- **Mobile Testing**: See `mobile-app/MOBILE_TESTING_GUIDE.md`
- **Backend API**: See `backend/src/routes/sellers.ts`
- **Access Control Logic**: See `frontend/app/seller-dashboard/page.tsx:61-100`

---

## 📚 Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Playwright Documentation](https://playwright.dev/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Expo Development Builds](https://docs.expo.dev/development/introduction/)
