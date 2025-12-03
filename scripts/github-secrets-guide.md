# GitHub Actions Secrets Setup Guide

## Required Secrets

Go to: **https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions**

### Deployment Secrets

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with full access
   - Used for deploying frontend to Vercel

2. **HEROKU_API_KEY** (Production)
   - Get from: https://dashboard.heroku.com/account
   - Scroll to "API Key" section
   - Click "Reveal" to show your API key
   - Used for deploying backend to production Heroku app

3. **HEROKU_STAGING_API_KEY** (Staging)
   - Same as above (usually the same key for both)
   - Or create a separate Heroku account for staging
   - Used for deploying backend to staging Heroku app

4. **HEROKU_APP_NAME** (Production)
   - Value: `onekappa`
   - Your production Heroku app name

5. **HEROKU_STAGING_APP_NAME** (Staging)
   - Value: `onekappa-dev` (or your staging app name)
   - Your staging/preview Heroku app name

6. **HEROKU_EMAIL**
   - Your Heroku account email
   - Example: `buddy.talton@outlook.com`

### Database Migration Secrets (Production)

These are used by GitHub Actions to run database migrations on production.

7. **DATABASE_HOST**
   - Extract from your `DATABASE_URL` in Heroku
   - Run: `heroku config:get DATABASE_URL --app onekappa`
   - Extract the host part (e.g., `ep-xxx.us-east-1.aws.neon.tech`)

8. **DATABASE_USERNAME**
   - Extract from your `DATABASE_URL`
   - Usually the part before `@` in the connection string

9. **DATABASE_PASSWORD**
   - Extract from your `DATABASE_URL`
   - The password part of the connection string

10. **DATABASE_NAME**
    - Extract from your `DATABASE_URL`
    - Usually the part after the last `/` in the connection string

### Database Migration Secrets (Staging)

Same as above, but for your staging database.

11. **STAGING_DATABASE_HOST**
12. **STAGING_DATABASE_USERNAME**
13. **STAGING_DATABASE_PASSWORD**
14. **STAGING_DATABASE_NAME**

### Optional Secrets (Recommended)

These have fallbacks in the workflow but should be set for production:

15. **NEXT_PUBLIC_API_URL**
    - Value: `https://onekappa.herokuapp.com`
    - Your production backend API URL

16. **NEXTAUTH_URL**
    - Value: `https://www.one-kappa.com`
    - Your production frontend URL

17. **NEXTAUTH_SECRET**
    - Generate with: `openssl rand -base64 32`
    - Should match the one in Vercel

## Quick Setup Commands

### Extract Database Credentials from Heroku

```bash
# Production database
heroku config:get DATABASE_URL --app onekappa

# Staging database (if different)
heroku config:get DATABASE_URL --app onekappa-dev
```

The DATABASE_URL format is:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

Parse it to extract:
- **HOST**: The part between `@` and `:`
- **USERNAME**: The part before `:` after `postgresql://`
- **PASSWORD**: The part between `:` and `@`
- **DATABASE_NAME**: The part after the last `/`

## Setting Secrets in GitHub

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the name and value
5. Click **Add secret**

Repeat for each secret listed above.

## Verification

After setting all secrets, the GitHub Actions workflow should be able to:
- Deploy to Heroku (production and staging)
- Deploy to Vercel (production)
- Run database migrations (production and staging)

