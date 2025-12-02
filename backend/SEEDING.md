# Database Seeding Strategy

This document explains how seed data and test data are handled with our Sequelize migration system.

## Overview

We use a **hybrid approach** that combines:
1. **Sequelize Seeders** - For foundational reference data (auto-run after migrations)
2. **TypeScript Seed Scripts** - For complex/test data (manual execution)

## Seed Data Types

### 1. Foundational Reference Data (Auto-Seeded)

**Location**: `backend/src/db/seeders/`

**When**: Runs automatically after migrations

**Includes**:
- Roles (ADMIN, SELLER, PROMOTER, GUEST, STEWARD)
- Event Types (social, philanthropy, professional, etc.)
- Event Audience Types (all_members, chapter_specific, public)
- Industries (50 industries)
- Professions (32 professions)

**Characteristics**:
- ✅ Idempotent (safe to run multiple times)
- ✅ Fast (no external API calls)
- ✅ Required for app to function
- ✅ Tracked by Sequelize (in `SequelizeData` table)

**How it works**:
```bash
npm run migrate  # Automatically runs foundational seeders
```

### 2. Chapters Data (Manual Seeding)

**Location**: `backend/src/scripts/seed-chapters.ts` and `seed-alumni-chapters.ts`

**When**: Run manually when needed

**Includes**:
- Collegiate chapters (scraped from Wikipedia)
- Alumni chapters

**Why separate**:
- Requires web scraping (can be slow)
- May fail if Wikipedia is down
- Not required for local development
- Should be optional

**How to run**:
```bash
npm run seed  # Seeds foundational + chapters
```

### 3. Test Data (Optional Seeding)

**Location**: `backend/src/db/seed-test.ts`

**When**: Run manually for development/testing

**Includes**:
- Test products
- Test sellers
- Test promoters
- Test stewards
- Test users
- Test events
- Test orders

**Characteristics**:
- ❌ Not tracked by Sequelize (allows easy clearing)
- ✅ Easy to clear and re-seed
- ✅ Optional (only for dev/test environments)

**How to run**:
```bash
npm run seed:test              # Seed test data
npm run seed:test -- --clear   # Clear and re-seed test data
```

## Migration Flow

```
1. schema.sql (if database is empty)
   └─ Creates all tables with correct schema

2. Sequelize Migrations
   └─ Runs pending migrations
   └─ Tracks in SequelizeMeta table

3. Foundational Seeders (automatic)
   └─ Seeds reference data (roles, event types, industries, professions)
   └─ Tracks in SequelizeData table

4. Manual Seeding (optional)
   └─ npm run seed        # Chapters (from Wikipedia)
   └─ npm run seed:test    # Test data
```

## CI/CD Integration

### Preview/Staging Environment
```bash
# In migrate.sh or CI workflow:
npm run migrate              # Runs migrations + foundational seeders
npm run seed:test           # Seeds test data (if SEED_TEST_DATA=true)
```

### Production Environment
```bash
npm run migrate              # Runs migrations + foundational seeders
# No test data in production
```

## Best Practices

### ✅ Do:
- Keep foundational data in Sequelize seeders (auto-run)
- Make seeders idempotent (use `ON CONFLICT DO NOTHING`)
- Keep test data separate (not tracked by Sequelize)
- Document what each seeder does

### ❌ Don't:
- Put test data in Sequelize seeders (hard to clear)
- Put external API calls in foundational seeders (slow, may fail)
- Put chapters in foundational seeders (requires web scraping)

## Adding New Seed Data

### Foundational Reference Data
1. Add to `backend/src/db/seeders/20240101000000-foundational-reference-data.js`
2. Make it idempotent
3. It will run automatically after migrations

### Test Data
1. Add to `backend/src/db/seed-test.ts`
2. Keep it separate from foundational seeders
3. Run manually with `npm run seed:test`

### New Seeder File
1. Create `backend/src/db/seeders/YYYYMMDDHHMMSS-description.js`
2. Follow Sequelize seeder format
3. Make it idempotent
4. It will run automatically after migrations

## Troubleshooting

### Seeders not running?
- Check `SequelizeData` table to see which seeders have run
- Run manually: `npm run sequelize:seed`

### Test data not seeding?
- Check that `seed-test.ts` is using correct Sequelize models
- Ensure database has foundational data first
- Try: `npm run seed:test -- --clear`

### Chapters not seeding?
- Check internet connection (requires Wikipedia)
- Run manually: `npm run seed`
- Can skip for local development

