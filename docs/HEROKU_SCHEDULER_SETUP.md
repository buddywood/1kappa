# Heroku Scheduler Setup for Verification Jobs

## Problem

The verification jobs defined in `backend/src/server.ts` using `node-cron` don't run on Heroku hobby dynos because:

- Hobby dynos sleep after 30 minutes of inactivity
- At 2-3 AM, the dyno is asleep, so cron jobs never execute
- In-process cron jobs only work when the web dyno is actively running

## Solution: Heroku Scheduler

Heroku Scheduler is a free add-on that runs one-off dynos at scheduled times, independent of your web dyno's sleep state.

## Setup Instructions

### 1. Install Heroku Scheduler Add-on

```bash
heroku addons:create scheduler:standard --app your-app-name
```

This is **free** for up to 3 jobs and doesn't require a credit card for hobby dynos.

### 2. Open Heroku Scheduler Dashboard

```bash
heroku addons:open scheduler --app your-app-name
```

Or visit: https://dashboard.heroku.com/apps/your-app-name/scheduler

### 3. Add Member Verification Job

Click **"Add Job"** and configure:

- **Schedule**: Every day at 2:00 AM (in your timezone or UTC)
- **Command**:
  ```bash
  cd backend && npm run verify:members
  ```
- **Dyno size**: Standard-1X (or your default)

Click **"Save Job"**

### 4. Add Seller Verification Job

Click **"Add Job"** again and configure:

- **Schedule**: Every day at 3:00 AM (in your timezone or UTC)
- **Command**:
  ```bash
  cd backend && npm run verify:sellers
  ```
- **Dyno size**: Standard-1X (or your default)

Click **"Save Job"**

### 5. Verify Environment Variables

Ensure these environment variables are set in Heroku:

```bash
heroku config:set KAPPA_USERNAME="your-username" --app your-app-name
heroku config:set KAPPA_PASSWORD="your-password" --app your-app-name
heroku config:set KAPPA_LOGIN_URL="https://members.kappaalphapsi1911.com/s/login/" --app your-app-name
```

To verify they're set:
```bash
heroku config --app your-app-name | grep KAPPA
```

### 6. Add Puppeteer Buildpack

Puppeteer requires additional system dependencies on Heroku:

```bash
heroku buildpacks:add --index 1 jontewks/puppeteer --app your-app-name
```

Verify buildpacks are in the correct order:
```bash
heroku buildpacks --app your-app-name
```

You should see:
```
1. jontewks/puppeteer
2. heroku/nodejs
```

If the order is wrong, remove and re-add them:
```bash
heroku buildpacks:clear --app your-app-name
heroku buildpacks:add jontewks/puppeteer --app your-app-name
heroku buildpacks:add heroku/nodejs --app your-app-name
```

### 7. Deploy Changes

```bash
git add .
git commit -m "feat: Add Heroku Scheduler for verification jobs"
git push heroku main
```

## Testing

### Test Locally First

Before scheduling on Heroku, test the scripts locally:

```bash
cd backend

# Test member verification (visible mode for debugging)
npm run verify:members:watch

# Test seller verification
npm run verify:sellers
```

### Test on Heroku (One-off Dyno)

Run the verification manually on Heroku to ensure it works:

```bash
# Test member verification
heroku run "cd backend && npm run verify:members" --app your-app-name

# Test seller verification
heroku run "cd backend && npm run verify:sellers" --app your-app-name
```

### Monitor Scheduled Jobs

View logs when the scheduled jobs run:

```bash
# View real-time logs
heroku logs --tail --app your-app-name

# View logs from a specific time
heroku logs --source scheduler --tail --app your-app-name
```

Look for these log messages:
- `🚀 Starting member verification process...`
- `🚀 Starting seller verification process...`
- `✅ No pending verifications. Exiting.` (if no pending)
- `📊 Verification Summary:` (with results)

## Troubleshooting

### Jobs Not Running

1. **Check if add-on is installed:**
   ```bash
   heroku addons --app your-app-name
   ```
   You should see `scheduler` in the list.

2. **Check job configuration:**
   ```bash
   heroku addons:open scheduler --app your-app-name
   ```
   Verify the schedule and command are correct.

3. **Check for errors in logs:**
   ```bash
   heroku logs --source scheduler --tail --app your-app-name
   ```

### Puppeteer Errors

If you see errors like "Chrome/Chromium not found":

1. **Verify buildpack is installed:**
   ```bash
   heroku buildpacks --app your-app-name
   ```

2. **Clear build cache and rebuild:**
   ```bash
   heroku repo:purge_cache --app your-app-name
   git commit --allow-empty -m "Rebuild with Puppeteer buildpack"
   git push heroku main
   ```

### Environment Variables Missing

If you see "KAPPA_USERNAME is undefined":

```bash
# Check current config
heroku config --app your-app-name

# Set missing variables
heroku config:set KAPPA_USERNAME="your-username" --app your-app-name
heroku config:set KAPPA_PASSWORD="your-password" --app your-app-name
```

### Login Failures

If member verification can't log in:

1. **Test with visible mode locally:**
   ```bash
   npm run verify:members:watch
   ```
   Watch the browser to see what's failing.

2. **Check if login page changed:**
   The portal may have changed its HTML structure. Run:
   ```bash
   npm run verify:members:record
   ```
   This will show you the current form structure.

3. **Update selectors in `memberVerification.ts`** if needed.

## Cost

- **Heroku Scheduler**: Free for up to 3 jobs
- **One-off Dynos**: Each job runs for a few minutes. On hobby plan, you get 1000 dyno hours/month, which is more than enough.

Estimated monthly usage:
- 2 jobs/day × 5 minutes each = 10 minutes/day
- 10 minutes × 30 days = 300 minutes = **5 hours/month**

This is well within the free tier limits.

## Alternative: External Cron Service

If you need more control or want to keep the web dyno asleep, you can use external services:

1. **EasyCron** (https://www.easycron.com/) - Free tier available
2. **Cron-job.org** (https://cron-job.org/) - Free
3. **GitHub Actions** - Use workflow schedules to hit an API endpoint

These would call an API endpoint on your backend (e.g., `/api/admin/run-verification`) that triggers the verification.

## Removing In-Process Cron (Optional)

Once Heroku Scheduler is working, you can optionally remove the `node-cron` jobs from `backend/src/server.ts` (lines 209-250) since they won't run on a sleeping hobby dyno anyway.

However, keeping them doesn't hurt - they'll run if the dyno happens to be awake at 2-3 AM (unlikely but possible if there's traffic).

## Email Reports

Both verification scripts send email reports when complete using `sendVerificationReportEmail()`. You'll receive:

- Success reports with verification counts
- Failure reports if the job crashes
- Reports sent via AWS SES to the configured admin email

Make sure `ADMIN_EMAIL` environment variable is set:

```bash
heroku config:set ADMIN_EMAIL="your-email@example.com" --app your-app-name
```
