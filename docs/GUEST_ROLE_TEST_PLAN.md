# Guest Role Functionality Test Plan

## Overview

This document outlines the test plan for verifying guest role functionality across backend, frontend, and mobile app.

## Backend Tests

### File: `backend/src/__tests__/guest-access.test.ts`

**Test Cases:**

1. ✅ `GET /api/stewards/marketplace/public` returns listings without auth
2. ✅ `GET /api/stewards/listings/:id/public` returns listing without auth
3. ✅ Public endpoints include `can_claim: false` flag
4. ✅ Public endpoints return same data structure as authenticated (minus claim capability)
5. ✅ Claim endpoint still requires authentication

**Run tests:**

```bash
cd backend
npm test -- guest-access.test.ts
```

## Frontend Tests

### Manual Test Checklist

**Guest Viewing Capabilities:**

- [x ] Guest can view products on homepage
- [x] Guest can view events on homepage
- [x ] Guest can view steward marketplace (view-only)
- [ x] Guest can view individual steward listings (view-only)
- [ x] Guest sees "Members Only" indicators on steward items
- [ x] Guest cannot claim steward items (button disabled/redirects to member-setup)
- [ x] Guest can access onboarding flows ("Become a Member", "Become a Seller")
- [ x] Guest redirected to member-setup when accessing promoter-setup
- [ x] Guest redirected to member-setup when accessing steward-setup
- [ x] "Become a Member" always visible
- [ x] "Become a Seller" always available

**Shop Page:**

- [ ] Guest can view products in shop
- [ ] Guest can filter by steward role and see listings (view-only)
- [ ] Steward listings show "Members Only" badge for guests
- [ ] Guest cannot claim steward items from shop page

**Steward Marketplace Page:**

- [ ] Guest sees "Members Only" banner
- [ ] Guest can view all listings
- [ ] Guest sees "Become a Member" CTA
- [ ] Guest cannot claim items

**Steward Listing Detail Page:**

- [ ] Guest sees "Members Only" badge prominently
- [ ] Guest sees full listing details
- [ ] Guest sees "Login to Claim" button that redirects to member-setup
- [ ] Guest cannot proceed to checkout

## Mobile App Tests

### Manual Test Checklist

**Guest Viewing Capabilities:**

- [ ] Guest can view products
- [ ] Guest can view events
- [ ] Guest can view steward listings (if implemented)
- [ ] Guest sees "Members Only" badges on steward items
- [ ] Guest cannot claim steward items
- [ ] Guest can access onboarding CTAs in HeroBanner
- [ ] Authentication state persists (when implemented)
- [ ] Guest redirected appropriately for member-only flows

**Component Tests:**

- [x ] HeroBanner shows "Become a Member/Seller/Promoter/Steward" buttons
- [x ] ProductCard shows "Members Only" badge for steward items when guest
- [ x] ProductCard disables press for steward items when guest
- [ x] EventsSection shows "Login to RSVP" for guests
- [ ] Header shows nothing, user profile picture or initials for authenticated users

**Onboarding Flow:**

- [ x] "Become a Member" opens member-setup (web or native)
- [ x] "Become a Seller" opens seller-setup (web or native)
- [ x] "Become a Promoter" redirects to member-setup for guests
- [ x] "Become a Steward" redirects to member-setup for guests

## Integration Tests

### End-to-End Flows

1. **Guest Browse → Product View → Checkout Attempt**

   - Guest browses products
   - Guest views product detail
   - Guest attempts checkout
   - Expected: Redirected to login/member-setup

2. **Guest View Steward Listing → Claim Attempt**

   - Guest views steward listing
   - Guest attempts to claim
   - Expected: Redirected to member-setup

3. **Guest Onboarding Flows**

   - Guest clicks "Become a Promoter"
   - Expected: Redirected to member-setup
   - Guest clicks "Become a Steward"
   - Expected: Redirected to member-setup
   - Guest clicks "Become a Seller"
   - Expected: Can access seller-setup (guest seller flow)

4. **Guest → Member Transition**
   - Guest views steward marketplace
   - Guest becomes a member
   - Guest returns to steward marketplace
   - Expected: Can now claim items

## Automated Test Implementation Notes

### Frontend Tests

Create test file: `frontend/__tests__/guest-functionality.test.tsx`

**Key test scenarios:**

- Mock `useSession` to return unauthenticated state
- Test that public API functions are called for guests
- Test that "Members Only" badges are displayed
- Test that claim buttons are disabled/redirect
- Test onboarding flow redirects

### Mobile App Tests

Create test file: `mobile-app/__tests__/guest-functionality.test.tsx`

**Key test scenarios:**

- Mock `useAuth` to return guest state
- Test component rendering with guest state
- Test that steward items show "Members Only" badges
- Test that onboarding CTAs are visible
- Test navigation/redirect behavior

## Test Data Requirements

### Backend Test Data

- At least 3 active steward listings
- Stewards with and without member profiles
- Listings with different categories
- Listings with different chapters

### Frontend Test Data

- Same as backend
- Mock session states (authenticated, unauthenticated)
- Mock user roles (member, seller, promoter, steward)

### Mobile App Test Data

- Same as backend
- Mock auth states (guest, authenticated)
- Mock user profiles

## Performance Considerations

- Public endpoints should have similar performance to authenticated endpoints
- Guest state should not cause unnecessary re-renders
- API calls should be cached appropriately

## Security Considerations

- Public endpoints should never allow claim operations
- Guest state should be clearly indicated in UI
- All protected operations (claim, checkout) must require authentication
- No sensitive user data should be exposed to guests
