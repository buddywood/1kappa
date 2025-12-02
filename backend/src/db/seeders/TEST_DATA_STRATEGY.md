# Test Data Strategy

## Overview

Test data is managed via **TypeScript scripts** (not Sequelize seeders) for maximum flexibility and control.

## Why Scripts Instead of Sequelize Seeders?

1. **Flexibility**: Easy to clear, modify, and re-seed without migration tracking
2. **External Dependencies**: Cognito user creation requires AWS SDK calls
3. **Environment-Specific**: Test data should never run in production
4. **Complex Logic**: Test data often requires conditional logic and relationships
5. **Frequent Changes**: Test data changes frequently during development

## Current Test Data Scripts

### 1. `seed-test.ts` (Main Test Data)
**Location**: `backend/src/db/seed-test.ts`  
**Purpose**: Seeds products, sellers, promoters, events, orders, stewards  
**Complexity**: Simple database inserts  
**Dependencies**: Requires foundational data (chapters, industries, etc.)

**What it seeds:**
- Test users (buddy+ users, no Cognito)
- Products and sellers
- Promoters
- Events
- Orders
- Steward sellers and products

**Usage:**
```bash
npm run seed:test              # Seed test data
npm run seed:test -- --clear   # Clear and re-seed test data
```

### 2. `seed-test-users.ts` (Cognito Users)
**Location**: `backend/src/scripts/seed-test-users.ts`  
**Purpose**: Creates test users with Cognito integration  
**Complexity**: Complex (external API calls)  
**Dependencies**: AWS Cognito, foundational data

**What it seeds:**
- Cognito users (buddy+seller, buddy+member, buddy+steward, buddy+promoter)
- Database user records
- Fraternity member records
- Seller/Promoter/Steward records tied to users

**Usage:**
```bash
npm run seed:test-users  # Seed Cognito test users
```

## Test Data Categories

### Simple Test Data (Database Only)
These could theoretically be Sequelize seeders, but are kept as scripts for consistency:
- Products
- Events
- Orders
- Steward listings

**Why scripts?** They're often modified during development and need easy clearing.

### Complex Test Data (External Dependencies)
These must be scripts:
- Cognito users (`seed-test-users.ts`)
- Any data requiring external API calls

## Best Practices

### 1. Idempotency
Test data scripts should be idempotent where possible:
- Check for existing data before creating
- Use `--clear` flag to remove old data first
- Handle duplicate key errors gracefully

### 2. Environment Awareness
Test data should:
- Only run in development/test environments
- Never run in production
- Check for required environment variables (e.g., `COGNITO_USER_POOL_ID`)

### 3. Clear Separation
- **Foundational data** → Sequelize seeders (auto-run)
- **Test data** → TypeScript scripts (manual run)
- **Chapters** → Hybrid (seeder with web scraping)

### 4. Documentation
Each test data script should:
- Document what it seeds
- List dependencies
- Show usage examples
- Note any external service requirements

## Future Considerations

### Option 1: Keep Current Approach (Recommended)
**Pros:**
- Maximum flexibility
- Easy to modify
- No migration tracking overhead
- Works well with external dependencies

**Cons:**
- Not tracked by Sequelize
- Manual execution required

### Option 2: Hybrid Approach
Create Sequelize seeders for simple test data, keep scripts for complex:
- **Sequelize seeders**: Products, events (simple inserts)
- **Scripts**: Cognito users, complex relationships

**Pros:**
- Some test data tracked by Sequelize
- Can be run with `db:seed:all`

**Cons:**
- Mixed approach (less consistent)
- Still need scripts for Cognito
- Harder to clear selectively

### Option 3: Environment-Based Seeders
Create Sequelize seeders that only run in test/dev:
- Use environment checks in seeders
- Track in SequelizeData
- Can be undone with `db:seed:undo`

**Pros:**
- All data tracked by Sequelize
- Can be undone

**Cons:**
- Less flexible
- Harder to clear/re-seed frequently
- Still need scripts for Cognito

## Recommendation

**Keep the current script-based approach** for test data because:
1. Test data changes frequently during development
2. Cognito integration requires scripts
3. Flexibility is more important than tracking for test data
4. Clear separation between foundational (auto-run) and test (manual) data

## Migration Path (If Needed)

If you want to move some test data to Sequelize seeders:

1. **Identify simple test data** (products, events without external deps)
2. **Create Sequelize seeders** with environment checks:
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     return; // Skip in production
   }
   ```
3. **Keep complex data as scripts** (Cognito users)
4. **Update documentation** to reflect hybrid approach

## Current Workflow

```bash
# 1. Run migrations (includes foundational seeders)
npm run migrate

# 2. Seed test data (optional, for development)
npm run seed:test

# 3. Seed Cognito test users (optional, requires AWS credentials)
npm run seed:test-users
```

## Summary

**Test data = Scripts** ✅  
**Foundational data = Sequelize seeders** ✅  
**Chapters = Hybrid (seeder with web scraping)** ✅

This approach provides the right balance of flexibility, control, and maintainability.

