#!/bin/bash
# Helper script to set Heroku environment variables
# Usage: ./scripts/set-heroku-env.sh [app-name]
# Example: ./scripts/set-heroku-env.sh onekappa

APP_NAME=${1:-onekappa}

if [ -z "$APP_NAME" ]; then
  echo "❌ Error: Please provide a Heroku app name"
  echo "Usage: ./scripts/set-heroku-env.sh [app-name]"
  echo "Available apps:"
  heroku apps --json | jq -r '.[].name' 2>/dev/null || heroku apps
  exit 1
fi

echo "🔧 Setting environment variables for Heroku app: $APP_NAME"
echo "============================================================"
echo ""
echo "⚠️  This script will prompt you for each required variable."
echo "💡 Press Enter to skip optional variables."
echo ""

# Required variables
echo "📋 Required Variables:"
echo ""

read -p "FRONTEND_URL (e.g., https://1kappa.com): " FRONTEND_URL
if [ -n "$FRONTEND_URL" ]; then
  heroku config:set FRONTEND_URL="$FRONTEND_URL" --app "$APP_NAME"
fi

read -p "DATABASE_URL (PostgreSQL connection string): " DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  heroku config:set DATABASE_URL="$DATABASE_URL" --app "$APP_NAME"
fi

read -p "STRIPE_SECRET_KEY (must start with sk_live_): " STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
  heroku config:set STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" --app "$APP_NAME"
fi

read -p "STRIPE_WEBHOOK_SECRET (must start with whsec_): " STRIPE_WEBHOOK_SECRET
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
  heroku config:set STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" --app "$APP_NAME"
fi

read -p "AWS_ACCESS_KEY_ID: " AWS_ACCESS_KEY_ID
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
  heroku config:set AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" --app "$APP_NAME"
fi

read -sp "AWS_SECRET_ACCESS_KEY (hidden input): " AWS_SECRET_ACCESS_KEY
echo ""
if [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  heroku config:set AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" --app "$APP_NAME"
fi

read -p "AWS_S3_BUCKET_NAME: " AWS_S3_BUCKET_NAME
if [ -n "$AWS_S3_BUCKET_NAME" ]; then
  heroku config:set AWS_S3_BUCKET_NAME="$AWS_S3_BUCKET_NAME" --app "$APP_NAME"
fi

read -p "AWS_REGION (e.g., us-east-1): " AWS_REGION
if [ -n "$AWS_REGION" ]; then
  heroku config:set AWS_REGION="$AWS_REGION" --app "$APP_NAME"
fi

read -p "FROM_EMAIL (verified SES email, e.g., noreply@1kappa.com): " FROM_EMAIL
if [ -n "$FROM_EMAIL" ]; then
  heroku config:set FROM_EMAIL="$FROM_EMAIL" --app "$APP_NAME"
fi

read -p "COGNITO_USER_POOL_ID (e.g., us-east-1_xxxxxxxxx): " COGNITO_USER_POOL_ID
if [ -n "$COGNITO_USER_POOL_ID" ]; then
  heroku config:set COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID" --app "$APP_NAME"
fi

read -p "COGNITO_CLIENT_ID: " COGNITO_CLIENT_ID
if [ -n "$COGNITO_CLIENT_ID" ]; then
  heroku config:set COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID" --app "$APP_NAME"
fi

echo ""
echo "📋 Optional Variables:"
echo ""

read -p "COGNITO_REGION (defaults to AWS_REGION if not set): " COGNITO_REGION
if [ -n "$COGNITO_REGION" ]; then
  heroku config:set COGNITO_REGION="$COGNITO_REGION" --app "$APP_NAME"
fi

read -sp "COGNITO_CLIENT_SECRET (only if using secret, hidden input): " COGNITO_CLIENT_SECRET
echo ""
if [ -n "$COGNITO_CLIENT_SECRET" ]; then
  heroku config:set COGNITO_CLIENT_SECRET="$COGNITO_CLIENT_SECRET" --app "$APP_NAME"
fi

read -p "NODE_ENV (defaults to production on Heroku): " NODE_ENV
if [ -n "$NODE_ENV" ]; then
  heroku config:set NODE_ENV="$NODE_ENV" --app "$APP_NAME"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Verify your configuration:"
echo "   heroku config --app $APP_NAME"
echo ""
echo "🔍 Run verification script:"
echo "   cd backend && HEROKU_APP_NAME=$APP_NAME npm run verify:env -- --platform=heroku"
echo ""

