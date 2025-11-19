#!/bin/bash
set -e  # Exit on any error

echo "🔄 Running database migrations..."

# Construct DATABASE_URL from individual variables if DATABASE_URL is not set
if [ -z "$DATABASE_URL" ] && [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_USERNAME" ] && [ -n "$DATABASE_PASSWORD" ] && [ -n "$DATABASE_NAME" ]; then
  export DATABASE_URL="postgresql://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${DATABASE_HOST}/${DATABASE_NAME}"
  echo "✅ Constructed DATABASE_URL from individual variables"
fi

# Run migrations
npm run migrate

# If SEED_TEST_DATA is set to "true", run test data seeding
if [ "$SEED_TEST_DATA" = "true" ]; then
  echo "🌱 Seeding test data..."
  npm run seed -- --test
else
  echo "⏭️  Skipping test data seeding (SEED_TEST_DATA is not 'true')"
fi

echo "✅ Migration and seeding completed successfully"

