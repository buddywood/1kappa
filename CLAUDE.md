# 1Kappa Project Instructions

## Project Overview

1Kappa is a marketplace and community platform for Kappa Alpha Psi fraternity members. It includes seller storefronts, event promotion, steward services, and member verification.

## Tech Stack

- **Backend**: Express.js + TypeScript, Sequelize ORM, PostgreSQL
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: React Native + Expo
- **Auth**: AWS Cognito
- **Payments**: Stripe Connect
- **Storage**: AWS S3
- **Hosting**: Heroku (backend), Vercel (frontend)

## Project Structure

```
/backend     - Express API server
/frontend    - Next.js web application
/mobile-app  - React Native mobile app
/docs        - Documentation
/scripts     - Deployment and utility scripts
```

## Development Commands

### Backend (`cd backend`)
```bash
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm test             # Run tests
npm run type-check   # TypeScript check only
npm run dev:worker   # Run cron worker in dev
npm run migrate      # Run database migrations
npm run seed         # Seed foundational data
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run typecheck    # TypeScript check
npm test             # Run Jest tests
npm run test:e2e     # Run Playwright tests
```

## Database

- Uses PostgreSQL with Sequelize ORM
- Models in `backend/src/db/models/`
- Query functions in `backend/src/db/queries-sequelize.ts`
- Prefer Sequelize over raw `pool.query()` calls

## Key Patterns

### Services
Business logic belongs in `backend/src/services/`:
- `userRole.ts` - Role-specific ID lookups
- `seller.ts` - Seller operations
- `checkout.ts` - Checkout flow
- `member.ts` - Member operations
- `stripe.ts` - Payment processing

### Authentication
- Middleware in `backend/src/middleware/auth.ts`
- Uses `authenticate`, `requireAdmin`, `requireSteward`, `requireVerifiedMember`

### User Roles
`ADMIN`, `SELLER`, `PROMOTER`, `STEWARD`, `MEMBER`, `GUEST`

## Testing

- Backend: Jest with mocked database queries
- Frontend: Jest for unit tests, Playwright for E2E
- Mock `pool.connect()` when testing routes with transactions

## Git Workflow

- `main` - Production branch
- `development` - Integration branch
- Feature branches merge to `development`

## Environment Variables

Backend requires: `DATABASE_URL`, `COGNITO_*`, `STRIPE_*`, `AWS_*`
See `backend/.env.local` for local development.

## Deployment

- Backend deploys to Heroku via git push
- Frontend deploys to Vercel automatically
- Worker dyno runs cron jobs (member/seller verification)
