# Sequelize Seeders

This directory contains Sequelize seeders that run automatically after migrations.

## Seeder Types

### 1. Foundational Seeders (Auto-run)
- **20240101000000-foundational-reference-data.js**: Seeds reference data (roles, event types, industries, professions)
  - Runs automatically after migrations
  - Idempotent (safe to run multiple times)
  - Required for all environments

### 2. Test Data Seeders (Optional)
- Test data is managed via **TypeScript scripts** (not Sequelize seeders)
- Run manually with `npm run seed:test`
- Not tracked by Sequelize (to allow easy clearing/re-seeding)
- See [TEST_DATA_STRATEGY.md](./TEST_DATA_STRATEGY.md) for detailed rationale

## Usage

### Automatic (Foundational Data)
Foundational seeders run automatically after migrations:
```bash
npm run migrate  # Runs migrations + foundational seeders
```

### Manual (Test Data)
Test data is seeded separately:
```bash
npm run seed:test  # Seed test data (products, sellers, promoters, test users)
```

### Chapters Seeding
Chapters require web scraping, so they're in a separate script:
```bash
npm run seed  # Seeds foundational data + chapters (from Wikipedia)
```

## Best Practices

1. **Foundational seeders** should be:
   - Idempotent (use `ON CONFLICT DO NOTHING`)
   - Fast (no external API calls)
   - Required for app to function

2. **Test data** should be:
   - Separate from foundational seeders
   - Easy to clear and re-seed
   - Not tracked by Sequelize (allows flexibility)

3. **Chapters** are separate because:
   - Require web scraping (slow)
   - May fail if Wikipedia is down
   - Should be optional for local development

## Running Seeders Manually

```bash
# Run all seeders
npm run sequelize:seed

# Undo all seeders
npm run sequelize:seed:undo

# Run specific seeder
npx sequelize-cli db:seed --seed 20240101000000-foundational-reference-data.js
```

