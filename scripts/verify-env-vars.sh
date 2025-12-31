#!/bin/bash
# Script to actually verify environment variables are set
# This checks Heroku, Vercel, and GitHub secrets

set -e

echo "🔍 Verifying Environment Variables"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if commands are available
command -v heroku >/dev/null 2>&1 || { echo "❌ Heroku CLI not installed"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI not installed"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "⚠️  GitHub CLI not installed (skipping GitHub secrets check)"; }

# Function to check if variable exists
check_var() {
    local name=$1
    local value=$2
    if [ -z "$value" ]; then
        echo -e "${RED}  ❌ $name: MISSING${NC}"
        return 1
    else
        echo -e "${GREEN}  ✅ $name: SET${NC}"
        return 0
    fi
}

# Function to check Heroku config
check_heroku_var() {
    local app=$1
    local var=$2
    local value=$(heroku config:get $var --app $app 2>/dev/null || echo "")
    check_var "$var (Heroku $app)" "$value"
}

# Function to check Vercel env
check_vercel_var() {
    local var=$1
    local env=$2
    local value=$(cd frontend && vercel env pull .env.tmp --environment=$env --yes 2>/dev/null && grep "^$var=" .env.tmp 2>/dev/null | cut -d'=' -f2- | tr -d '"' | tr -d '\n' || echo "")
    rm -f frontend/.env.tmp 2>/dev/null || true
    check_var "$var (Vercel $env)" "$value"
}

echo "📋 BACKEND (Heroku Production - onekappa)"
echo "----------------------------------------"
check_heroku_var "onekappa" "COGNITO_USER_POOL_ID"
check_heroku_var "onekappa" "COGNITO_CLIENT_ID"
check_heroku_var "onekappa" "COGNITO_REGION"
check_heroku_var "onekappa" "FRONTEND_URL"
check_heroku_var "onekappa" "DATABASE_URL"
check_heroku_var "onekappa" "AWS_ACCESS_KEY_ID"
check_heroku_var "onekappa" "AWS_SECRET_ACCESS_KEY"
check_heroku_var "onekappa" "AWS_S3_BUCKET_NAME"
check_heroku_var "onekappa" "AWS_REGION"
check_heroku_var "onekappa" "FROM_EMAIL"
echo ""

echo "📋 BACKEND (Heroku Development - onekappa-dev)"
echo "----------------------------------------"
check_heroku_var "onekappa-dev" "COGNITO_USER_POOL_ID"
check_heroku_var "onekappa-dev" "COGNITO_CLIENT_ID"
check_heroku_var "onekappa-dev" "COGNITO_REGION"
check_heroku_var "onekappa-dev" "FRONTEND_URL"
check_heroku_var "onekappa-dev" "DATABASE_URL"
echo ""

echo "📋 FRONTEND (Vercel Production)"
echo "----------------------------------------"
check_vercel_var "NEXT_PUBLIC_COGNITO_USER_POOL_ID" "production"
check_vercel_var "NEXT_PUBLIC_COGNITO_CLIENT_ID" "production"
check_vercel_var "NEXT_PUBLIC_COGNITO_REGION" "production"
check_vercel_var "NEXT_PUBLIC_API_URL" "production"
check_vercel_var "NEXTAUTH_SECRET" "production"
check_vercel_var "NEXTAUTH_URL" "production"
echo ""

echo "📋 FRONTEND (Vercel Development/Preview)"
echo "----------------------------------------"
check_vercel_var "NEXT_PUBLIC_COGNITO_USER_POOL_ID" "development"
check_vercel_var "NEXT_PUBLIC_COGNITO_CLIENT_ID" "development"
check_vercel_var "NEXT_PUBLIC_COGNITO_REGION" "development"
check_vercel_var "NEXT_PUBLIC_API_URL" "development"
check_vercel_var "NEXTAUTH_SECRET" "development"
check_vercel_var "NEXTAUTH_URL" "development"
echo ""

echo "📋 GITHUB ACTIONS Secrets"
echo "----------------------------------------"
if command -v gh >/dev/null 2>&1; then
    # Check GitHub secrets
    secrets=$(gh secret list 2>/dev/null | awk '{print $1}' || echo "")
    required_secrets=("VERCEL_TOKEN" "HEROKU_API_KEY" "HEROKU_STAGING_API_KEY" "HEROKU_APP_NAME" "HEROKU_STAGING_APP_NAME" "HEROKU_EMAIL" "DATABASE_HOST" "DATABASE_USERNAME" "DATABASE_PASSWORD" "DATABASE_NAME" "STAGING_DATABASE_HOST" "STAGING_DATABASE_USERNAME" "STAGING_DATABASE_PASSWORD" "STAGING_DATABASE_NAME" "EXPO_TOKEN")
    
    for secret in "${required_secrets[@]}"; do
        if echo "$secrets" | grep -q "^$secret$"; then
            echo -e "${GREEN}  ✅ $secret: SET${NC}"
        else
            echo -e "${RED}  ❌ $secret: MISSING${NC}"
        fi
    done
else
    echo -e "${YELLOW}  ⚠️  GitHub CLI not available - skipping GitHub secrets check${NC}"
fi
echo ""

echo "💡 To fix missing variables:"
echo "  • Heroku: heroku config:set VAR=value --app APP_NAME"
echo "  • Vercel: cd frontend && vercel env add VAR"
echo "  • GitHub: gh secret set SECRET_NAME"

