#!/bin/bash
# Script to set GitHub Actions secrets using GitHub CLI
# Usage: ./scripts/set-github-secrets.sh

set -e

echo "🔐 Setting GitHub Actions Secrets"
echo "===================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Install it: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "   Run: gh auth login"
    exit 1
fi

echo "📋 Setting deployment secrets..."
echo ""

# Deployment secrets that need user input
read -p "VERCEL_TOKEN (get from https://vercel.com/account/tokens): " VERCEL_TOKEN
if [ -n "$VERCEL_TOKEN" ]; then
    gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
    echo "   ✅ Set VERCEL_TOKEN"
fi

read -sp "HEROKU_API_KEY (get from https://dashboard.heroku.com/account, hidden input): " HEROKU_API_KEY
echo ""
if [ -n "$HEROKU_API_KEY" ]; then
    gh secret set HEROKU_API_KEY --body "$HEROKU_API_KEY"
    echo "   ✅ Set HEROKU_API_KEY"
    
    # Use same key for staging
    gh secret set HEROKU_STAGING_API_KEY --body "$HEROKU_API_KEY"
    echo "   ✅ Set HEROKU_STAGING_API_KEY (same as production)"
fi

# Known values
echo ""
echo "📋 Setting known deployment secrets..."
gh secret set HEROKU_APP_NAME --body "onekappa"
echo "   ✅ Set HEROKU_APP_NAME = onekappa"

gh secret set HEROKU_STAGING_APP_NAME --body "onekappa-dev"
echo "   ✅ Set HEROKU_STAGING_APP_NAME = onekappa-dev"

gh secret set HEROKU_EMAIL --body "buddy.talton@outlook.com"
echo "   ✅ Set HEROKU_EMAIL = buddy.talton@outlook.com"

# Production database credentials
echo ""
echo "📋 Setting production database secrets..."
gh secret set DATABASE_HOST --body "ep-raspy-term-ahecpsxb-pooler.c-3.us-east-1.aws.neon.tech"
echo "   ✅ Set DATABASE_HOST"

gh secret set DATABASE_USERNAME --body "neondb_owner"
echo "   ✅ Set DATABASE_USERNAME"

gh secret set DATABASE_PASSWORD --body "npg_Bdh65FajoxkZ"
echo "   ✅ Set DATABASE_PASSWORD"

gh secret set DATABASE_NAME --body "1kappa_db"
echo "   ✅ Set DATABASE_NAME"

# Staging database credentials
echo ""
echo "📋 Setting staging database secrets..."
gh secret set STAGING_DATABASE_HOST --body "ep-icy-bar-a46bm73a-pooler.us-east-1.aws.neon.tech"
echo "   ✅ Set STAGING_DATABASE_HOST"

gh secret set STAGING_DATABASE_USERNAME --body "neondb_owner"
echo "   ✅ Set STAGING_DATABASE_USERNAME"

gh secret set STAGING_DATABASE_PASSWORD --body "npg_nsqmiePG6w7Q"
echo "   ✅ Set STAGING_DATABASE_PASSWORD"

gh secret set STAGING_DATABASE_NAME --body "neondb"
echo "   ✅ Set STAGING_DATABASE_NAME"

# Optional secrets
echo ""
echo "📋 Setting optional secrets (recommended)..."
read -p "Set optional secrets? (y/n): " SET_OPTIONAL
if [ "$SET_OPTIONAL" = "y" ] || [ "$SET_OPTIONAL" = "Y" ]; then
    gh secret set NEXT_PUBLIC_API_URL --body "https://onekappa.herokuapp.com"
    echo "   ✅ Set NEXT_PUBLIC_API_URL = https://onekappa.herokuapp.com"
    
    gh secret set NEXTAUTH_URL --body "https://www.one-kappa.com"
    echo "   ✅ Set NEXTAUTH_URL = https://www.one-kappa.com"
    
    read -sp "NEXTAUTH_SECRET (generate with: openssl rand -base64 32, hidden input): " NEXTAUTH_SECRET
    echo ""
    if [ -n "$NEXTAUTH_SECRET" ]; then
        gh secret set NEXTAUTH_SECRET --body "$NEXTAUTH_SECRET"
        echo "   ✅ Set NEXTAUTH_SECRET"
    else
        echo "   ⚠️  Skipped NEXTAUTH_SECRET (you can set it later)"
    fi
else
    echo "   ⏭️  Skipped optional secrets"
fi

echo ""
echo "✅ All secrets have been set!"
echo ""
echo "📋 Verify secrets:"
echo "   gh secret list"
echo ""
echo "🔍 Or view in GitHub:"
echo "   https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
echo ""

