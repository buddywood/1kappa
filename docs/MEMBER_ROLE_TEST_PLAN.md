# Member Role Functionality Test Plan

## Overview

This document outlines the test plan for verifying member role functionality across backend, frontend, and mobile app. Members are verified Brothers within the 1Kappa community with access to exclusive features including Stewardship, Promoter capabilities, chapter-directed donations, legacy item claims, and member-only search and profile visibility.

## Backend Tests

### File: `backend/src/__tests__/member-role.test.ts`

**Test Cases:**

1. ✅ Member registration with all required fields (name, chapter, initiation year, member number, social links, headshot, industry, profession)
2. ✅ Member verification workflow (PENDING → VERIFIED)
3. ✅ Admin verification endpoints (`PUT /api/admin/members/:id/verification`)
4. ✅ Member profile retrieval (`GET /api/members/profile`)
5. ✅ Member profile updates (`PUT /api/members/profile`)
6. ✅ Connect directory search (`GET /api/members/`) with filters:
   - By name
   - By chapter
   - By initiation year
   - By role (Seller, Promoter, Steward)
   - By industry
   - By profession/job title
   - By region/state
7. ✅ Member-only steward marketplace access (`GET /api/stewards/marketplace`)
8. ✅ Steward listing claim (`POST /api/stewards/listings/:id/claim`) - requires verified member
9. ✅ Steward checkout session creation (`POST /api/steward-checkout/:listingId`) - requires verified member
10. ✅ Member → Seller transition (`POST /api/sellers/apply`)
11. ✅ Member → Promoter transition (`POST /api/promoters/apply`)
12. ✅ Member → Steward transition (`POST /api/stewards/apply`)
13. ✅ Shopping capabilities (purchase seller items)
14. ✅ Donation history tracking
15. ✅ Member data privacy (guests cannot see full member details)

**Run tests:**

```bash
cd backend
npm test -- member-role.test.ts
```

### File: `backend/src/__tests__/member-integration.test.ts`

**End-to-End Flows:**

1. **Member Registration → Verification → Dashboard Access**

   - User registers as member
   - Admin verifies member
   - Member can access dashboard
   - Member can access Connect directory
   - Member can claim steward listings

2. **Guest → Member Transition**

   - Guest views steward marketplace
   - Guest attempts to claim (redirected)
   - Guest becomes member
   - Member can now claim

3. **Member → Seller/Promoter/Steward Transitions**

   - Member applies to become seller
   - Member applies to become promoter
   - Member applies to become steward
   - Member retains purchasing/claiming capabilities

4. **Member Shopping Flow**

   - Member browses seller products
   - Member adds to cart
   - Member completes checkout
   - Order recorded with member association

5. **Member Steward Claim Flow**
   - Member views steward listing
   - Member claims listing
   - Member completes checkout (donation + platform fee + shipping)
   - Claim recorded with member association

**Run tests:**

```bash
cd backend
npm test -- member-integration.test.ts
```

## Frontend Tests

### Manual Test Checklist

**Member Dashboard:**

- [ ] Member dashboard renders for verified members
- [ ] Member dashboard redirects non-members to member-setup
- [ ] Verification status badge displays correctly
- [ ] Stats cards show donations and purchases
- [ ] Role transition buttons show for non-activated roles
- [ ] Recent activity displays claims and purchases
- [ ] Profile completion status shows missing fields

**Connect Page:**

- [ ] Connect page shows member-only content for verified members
- [ ] Connect page shows "Sign in to Connect" for guests
- [ ] Connect search filters work (chapter, industry, profession, location)
- [ ] Member profiles display with full details for members
- [ ] Guests cannot see member details

**Steward Marketplace:**

- [ ] Steward marketplace shows claim buttons for verified members
- [ ] Steward marketplace shows "Members Only" for guests
- [ ] Steward listing detail page allows claim for verified members
- [ ] Steward listing detail page redirects guests to member-setup

**Header & Navigation:**

- [ ] "Become a Member" button disappears for verified members
- [ ] "Become a Seller/Promoter/Steward" buttons show until activated
- [ ] Member dashboard link appears in user menu for verified members
- [ ] Member-only banners appear on protected areas

**Role Transitions:**

- [ ] Member can navigate to seller setup
- [ ] Member can navigate to promoter setup
- [ ] Member can navigate to steward setup
- [ ] Role transition buttons work correctly

### Automated Test File: `frontend/__tests__/member-functionality.test.tsx`

**Key test scenarios:**

- Mock `useSession` to return authenticated member state
- Test that member dashboard renders for verified members
- Test that Connect page shows member-only content
- Test that steward marketplace shows claim buttons
- Test that "Become a Member" button is hidden for verified members
- Test role transition navigation

## Mobile App Tests

### Manual Test Checklist

**Member Authentication:**

- [ ] Member registration flow works (sign-up → email verification → member setup)
- [ ] Member sign-in flow works (email/password → token storage → session persistence)
- [ ] Member authentication state persists across app restarts
- [ ] Token refresh works when token expires
- [ ] Sign-out clears tokens and user state

**Member Dashboard:**

- [ ] Member dashboard accessible from profile screen
- [ ] Verification status displays correctly
- [ ] Stats show donations and purchases
- [ ] Role transition buttons work
- [ ] Profile link navigates correctly

**Member-Only Features:**

- [ ] Steward marketplace shows claim buttons for members
- [ ] Steward marketplace shows "Members Only" for guests
- [ ] ProductCard shows "Members Only" badge for steward items when guest
- [ ] ProductCard enables press for steward items when member
- [ ] Member setup screen accessible from guest state
- [ ] Header shows member profile when authenticated

### Automated Test File: `mobile-app/__tests__/member-functionality.test.tsx`

**Key test scenarios:**

- Mock `useAuth` to return member state
- Test component rendering with member state
- Test that steward items show claim buttons for members
- Test that onboarding CTAs are visible for guests
- Test navigation/redirect behavior

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

3. **Member Registration → Verification → Full Access**

   - User registers as member
   - Admin verifies member
   - Member can access all member features
   - Member can claim steward listings
   - Member can access Connect directory

4. **Member Role Transitions**
   - Member applies to become seller
   - Member applies to become promoter
   - Member applies to become steward
   - Member retains all member capabilities

## Test Data Requirements

### Backend Test Data

- At least 5 verified members with different:
  - Chapters
  - Industries
  - Professions
  - Initiation years
  - Roles (some with Seller, Promoter, Steward roles)
- At least 3 pending members for verification testing
- At least 3 active steward listings
- At least 5 seller products
- Test chapters with Stripe accounts configured

### Frontend Test Data

- Same as backend
- Mock session states (authenticated member, guest, authenticated non-member)
- Mock user roles (member only, member+seller, member+promoter, member+steward)

### Mobile App Test Data

- Same as backend
- Mock auth states (guest, authenticated member)
- Mock user profiles with memberId

## Performance Considerations

- Member search queries should be optimized with proper indexes
- Connect directory should support pagination
- Member dashboard should load quickly with cached data
- API responses should be consistent across web and mobile

## Security Considerations

- Connect directory must require member authentication
- Member profile updates must verify ownership
- Steward claims must require verified member status
- Member data must not be exposed to guests
- Admin verification endpoints must require admin role
- Member dashboard must require verified member status

## Known Issues & Future Enhancements

### Phase 2 Features (Not Required at Launch)

- Member-to-member messaging in Connect directory
- Advanced search filters (multiple criteria)
- Member activity feed
- Member recommendations

### Mobile App Cognito Integration

- Full Cognito SDK integration (currently uses backend proxy)
- Native token refresh handling
- Biometric authentication support
- Social login integration
