# Vercel GitHub Integration Setup

This guide will help you set up Vercel's GitHub integration so that deployments are automatically triggered on push and status is reported back to GitHub.

## Benefits

- ✅ Automatic deployments on push to GitHub
- ✅ Deployment status checks in GitHub PRs and commits
- ✅ No need for manual CLI deployments in GitHub Actions
- ✅ Better visibility of deployment status in GitHub UI

## Setup Steps

### 1. Connect GitHub Repository in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **ebilly/frontend**
3. Navigate to **Settings** → **Git**
4. If not already connected:
   - Click **Connect Git Repository**
   - Select **GitHub**
   - Authorize Vercel to access your repositories
   - Select the repository: **buddywood/1kappa**
   - Select the root directory: **frontend**
   - Click **Deploy**

### 2. Configure Branch Settings

1. In **Settings** → **Git**, ensure:
   - **Production Branch**: `main` (for production deployments)
   - **Preview Deployments**: Enabled (for all other branches)

### 3. Configure Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Ensure all required variables are set for:
   - **Production** environment (for `main` branch)
   - **Preview** environment (for `development` and other branches)

Required variables:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Any other environment variables your app needs

### 4. Enable GitHub Status Checks (Optional but Recommended)

1. In **Settings** → **Git** → **Deploy Hooks**
2. Ensure **GitHub Status Checks** is enabled
3. This will show deployment status directly in GitHub PRs

### 5. Verify Integration

After setup, when you push to GitHub:
- Vercel will automatically start a deployment
- You'll see a deployment status check in your GitHub commit/PR
- The status will update as the deployment progresses

## How It Works

1. **On Push to `development` branch:**
   - Vercel automatically creates a preview deployment
   - Status is reported back to GitHub

2. **On Push to `main` branch:**
   - Vercel automatically creates a production deployment
   - Status is reported back to GitHub

3. **GitHub Actions:**
   - The workflow still runs quality checks (lint, test, typecheck)
   - Vercel handles the actual deployment automatically
   - Both statuses appear in GitHub

## Troubleshooting

### Deployment not triggering
- Check that the repository is connected in Vercel Settings → Git
- Verify the branch is configured for auto-deploy
- Check Vercel logs for any errors

### Status not showing in GitHub
- Ensure GitHub integration is properly authorized
- Check that GitHub Status Checks is enabled in Vercel
- Verify you have the correct permissions in the repository

### Environment variables missing
- Go to Vercel Settings → Environment Variables
- Ensure variables are set for the correct environment (Production/Preview)
- Redeploy after adding variables

## Current Workflow

The GitHub Actions workflow (`ci-deploy.yml`) now:
- ✅ Runs quality checks (ESLint, TypeScript, Tests)
- ✅ Runs database migrations
- ✅ Deploys backend to Heroku
- ℹ️ Vercel deployments are handled automatically by Vercel's GitHub integration

This provides the best of both worlds: automated quality checks in GitHub Actions and seamless deployments via Vercel's integration.

