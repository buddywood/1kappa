# GitHub Deployment Troubleshooting Guide

## Quick Diagnosis Steps

### 1. Check GitHub Actions Logs

1. Go to your repository: `https://github.com/buddywood/1kappa/actions`
2. Click on the most recent failed workflow run
3. Expand each job to see which step failed
4. Look for error messages in red

### 2. Common Failure Points

#### A. Missing GitHub Secrets

The workflow requires these secrets. Check at: `https://github.com/buddywood/1kappa/settings/secrets/actions`

**Required Secrets:**
- ✅ `VERCEL_TOKEN` - Vercel API token (get from https://vercel.com/account/tokens)
- ✅ `HEROKU_API_KEY` - Heroku API key (get from https://dashboard.heroku.com/account)
- ✅ `HEROKU_STAGING_API_KEY` - Usually same as `HEROKU_API_KEY`
- ✅ `HEROKU_APP_NAME` - Should be `onekappa`
- ✅ `HEROKU_STAGING_APP_NAME` - Should be `onekappa-dev`
- ✅ `HEROKU_EMAIL` - Your Heroku account email
- ✅ `EXPO_TOKEN` - Expo API token (for mobile builds, get from https://expo.dev/accounts/[your-account]/settings/access-tokens)

**Database Secrets (Production):**
- ✅ `DATABASE_HOST`
- ✅ `DATABASE_USERNAME`
- ✅ `DATABASE_PASSWORD`
- ✅ `DATABASE_NAME`

**Database Secrets (Staging/Preview):**
- ✅ `STAGING_DATABASE_HOST`
- ✅ `STAGING_DATABASE_USERNAME`
- ✅ `STAGING_DATABASE_PASSWORD`
- ✅ `STAGING_DATABASE_NAME`

**Optional (but recommended):**
- `NEXT_PUBLIC_API_URL` - Frontend API URL
- `NEXTAUTH_URL` - NextAuth URL
- `NEXTAUTH_SECRET` - NextAuth secret

#### B. Vercel Project Linking Issues

**Error:** `Project not found` or `Permission denied`

**Solution:**
1. Verify the Vercel project name is `1kappa`
   - Go to https://vercel.com/dashboard
   - Check your project name
   - Update the workflow if needed (line 184, 249 in `.github/workflows/web-build.yml`)

2. Verify Vercel token has correct permissions
   - Go to https://vercel.com/account/tokens
   - Create a new token with full access
   - Update the `VERCEL_TOKEN` secret

3. Verify project root directory is set to `frontend` in Vercel
   - Go to Vercel project settings → General
   - Root Directory should be: `frontend`

#### C. Database Migration Failures

**Error:** `Connection refused` or `Authentication failed`

**Solution:**
1. Verify database credentials are correct
   - Check the secrets match your Neon database
   - Test connection locally with the same credentials

2. Verify database allows connections from GitHub Actions IPs
   - Check Neon dashboard → Settings → IP Allowlist
   - May need to allow all IPs (0.0.0.0/0) for CI/CD

3. Check the migration script has execute permissions
   ```bash
   chmod +x backend/scripts/migrate.sh
   ```

#### D. Heroku Deployment Failures

**Error:** `App not found` or `Authentication failed`

**Solution:**
1. Verify Heroku app names are correct
   - Production: `onekappa`
   - Staging: `onekappa-dev`
   - Check: `heroku apps --all`

2. Verify Heroku API key is valid
   - Get from: https://dashboard.heroku.com/account
   - Update `HEROKU_API_KEY` secret

3. Verify Heroku email matches your account
   - Update `HEROKU_EMAIL` secret

#### E. Frontend Build Failures

**Error:** TypeScript errors, ESLint errors, or test failures

**Solution:**
1. Run checks locally:
   ```bash
   cd frontend
   npm install
   npm run lint
   npm run typecheck
   npm test
   ```

2. Fix any errors locally before pushing

#### F. Backend Build Failures

**Error:** TypeScript errors or test failures

**Solution:**
1. Run checks locally:
   ```bash
   cd backend
   npm install
   npm run type-check
   npm test
   ```

2. Fix any errors locally before pushing

#### G. Mobile Build Failures

**Error:** `EXPO_TOKEN` missing or invalid

**Solution:**
1. Get Expo token from: https://expo.dev/accounts/[your-account]/settings/access-tokens
2. Create a new token if needed
3. Update `EXPO_TOKEN` secret in GitHub

**Error:** TypeScript errors

**Solution:**
1. Run typecheck locally:
   ```bash
   cd mobile-app
   npm install
   npm run typecheck
   ```

## Quick Fix Commands

### Check if secrets are set (using GitHub CLI)
```bash
gh secret list
```

### Set missing secrets
```bash
# Use the provided script
./scripts/set-github-secrets.sh

# Or manually
gh secret set VERCEL_TOKEN --body "your-token"
gh secret set HEROKU_API_KEY --body "your-key"
# ... etc
```

### Test Vercel connection locally
```bash
cd frontend
vercel login
vercel link --project=1kappa
vercel pull
```

### Test Heroku connection locally
```bash
heroku login
heroku apps --all
heroku config --app onekappa
```

### Test database connection locally
```bash
cd backend
export DATABASE_HOST="your-host"
export DATABASE_USERNAME="your-username"
export DATABASE_PASSWORD="your-password"
export DATABASE_NAME="your-db-name"
npm run migrate
```

## Workflow-Specific Issues

### Web Build Workflow (`web-build.yml`)

**Jobs that run:**
1. `frontend-quality` - ESLint, TypeScript, Tests
2. `backend-quality` - ESLint, TypeScript, Tests
3. `migrate-preview-db` - Database migrations (development branch only)
4. `migrate-prod-db` - Database migrations (main branch only)
5. `deploy-frontend-preview` - Vercel preview (development branch only)
6. `deploy-frontend-prod` - Vercel production (main branch only)
7. `deploy-backend-preview` - Heroku staging (development branch only)
8. `deploy-backend-prod` - Heroku production (main branch only)

**Which branch triggers what:**
- `main` → Production deployments (frontend + backend)
- `development` → Preview deployments (frontend + backend)

### Mobile Build Workflow (`mobile-build.yml`)

**Jobs that run:**
1. `mobile-quality` - TypeScript type check
2. `mobile-build` - EAS build (main branch only)

**Triggers:**
- `main` → Full build with EAS

## Debugging Tips

1. **Check the exact error message** in GitHub Actions logs
2. **Look for the first failing step** - earlier steps might have passed
3. **Check if it's a secret issue** - errors like "secret not found" or "authentication failed"
4. **Check if it's a configuration issue** - wrong project names, wrong paths, etc.
5. **Check if it's a code issue** - TypeScript errors, test failures, etc.

## Getting Help

If you're still stuck:
1. Copy the exact error message from GitHub Actions
2. Check which job and step failed
3. Verify all secrets are set correctly
4. Check if the same commands work locally

