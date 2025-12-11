# Fixing Vercel Environment Variables for Both Preview and Production

## The Problem

"Failed to fetch" errors are occurring in both preview and production because `NEXT_PUBLIC_API_URL` is not being embedded correctly at build time.

## Root Cause

In Next.js, `NEXT_PUBLIC_*` environment variables are **replaced at BUILD TIME**, not runtime. If the variable isn't available during the build, it falls back to `http://localhost:3001`, which doesn't work in production.

## Solution Steps

### 1. Verify Environment Variables in Vercel

Go to **Vercel Dashboard** → **Your Project (1kappa)** → **Settings** → **Environment Variables**

**For Production:**
- ✅ `NEXT_PUBLIC_API_URL` = `https://onekappa.herokuapp.com` (no spaces, no quotes)
- ✅ `NEXTAUTH_URL` = `https://www.one-kappa.com`
- ✅ `NEXTAUTH_SECRET` = (your secret)

**For Preview:**
- ⚠️ `NEXT_PUBLIC_API_URL` = `https://onekappa-dev-6985dc9958b2.herokuapp.com` (remove leading spaces!)
- ✅ `NEXTAUTH_URL` = (your preview URL)
- ✅ `NEXTAUTH_SECRET` = (your secret)

### 2. Fix Preview Environment Variable

The Preview environment variable has **leading spaces**. This must be fixed:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXT_PUBLIC_API_URL` for **Preview** environment
3. Click **Edit**
4. Remove any leading/trailing spaces
5. Value should be exactly: `https://onekappa-dev-6985dc9958b2.herokuapp.com`
6. Click **Save**

### 3. Ensure Variables Are Set for Build

In Vercel, environment variables are automatically available during build. However, you need to ensure:

- Variables are set for the correct **Environment** (Production, Preview, Development)
- No typos or extra spaces
- Values don't have quotes around them (Vercel adds quotes automatically)

### 4. Redeploy After Fixing Variables

**Important:** After fixing environment variables, you MUST redeploy:

**Option A: Via Vercel Dashboard**
1. Go to **Deployments**
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Select the environment (Production or Preview)

**Option B: Via Git Push**
```bash
# Make a small change and push
git commit --allow-empty -m "Trigger redeploy to pick up environment variables"
git push origin main  # for production
git push origin development  # for preview
```

### 5. Verify After Redeploy

After redeploy, check the browser console. You should see:

✅ **Success:**
```
[API] ✅ Using production API URL: https://onekappa.herokuapp.com
```

❌ **Failure (still using localhost):**
```
[API] ❌ CRITICAL: Using localhost API URL in production!
```

If you still see the error, the environment variable wasn't available during build. Check:
- Variable is set for the correct environment
- No spaces or typos
- Redeploy was done AFTER setting the variable

## Current Status

✅ **Backend is accessible** - Tested and working
✅ **CORS is fixed** - Updated to allow both www and non-www domains
✅ **Error logging added** - Will show which API URL is being used
⚠️ **Environment variables need verification** - Check for spaces/typos
⚠️ **Redeploy required** - After fixing variables

## Quick Checklist

- [ ] Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel (Production)
- [ ] Fix Preview `NEXT_PUBLIC_API_URL` (remove leading spaces)
- [ ] Redeploy Production
- [ ] Redeploy Preview
- [ ] Check browser console for `[API] ✅ Using production API URL`
- [ ] Test registration flow

## Testing

After redeploy, test the registration:

1. Go to `https://one-kappa.com/register` (or preview URL)
2. Open browser DevTools → Console
3. Look for: `[API] API_URL configured as: ...`
4. Try to register
5. Check Network tab for API calls

If you see `localhost:3001` in the console, the environment variable wasn't available at build time.

