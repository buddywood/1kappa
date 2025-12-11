# Vercel Cognito Registration Troubleshooting

## Issue
Cognito registration is not working on the Vercel deployment.

## Root Cause Analysis

The registration flow works as follows:
1. User fills out registration form on frontend (Vercel)
2. Frontend calls `${API_URL}/api/members/cognito/signup`
3. Backend (Heroku) handles Cognito signup via AWS Cognito
4. User receives verification code via email
5. User verifies email and completes registration

## What to Check in Vercel

### 1. Environment Variables (CRITICAL)

Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Verify these are set for **Production** environment:

#### Required Variables:
- ✅ **`NEXT_PUBLIC_API_URL`** 
  - Should be: `https://onekappa.herokuapp.com` (or your actual Heroku backend URL)
  - **This is the most common issue!** If this is missing or wrong, registration will fail
  - Must start with `https://` (not `http://`)
  - Must be accessible from the internet (not localhost)

- ✅ **`NEXTAUTH_URL`**
  - Should be: `https://one-kappa.com` (or your actual frontend domain)
  - Used for authentication callbacks

- ✅ **`NEXTAUTH_SECRET`**
  - Should be a secure random string
  - Generate with: `openssl rand -base64 32`
  - Must match between deployments

#### Optional but Recommended:
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID` (if used client-side)
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` (if used client-side)

### 2. Check Deployment Logs

Go to **Vercel Dashboard** → **Your Project** → **Deployments** → **Latest Deployment** → **Logs**

Look for:
- ❌ Errors about `NEXT_PUBLIC_API_URL` being undefined
- ❌ Network errors when calling `/api/members/cognito/signup`
- ❌ CORS errors
- ❌ 404 errors (backend not found)

### 3. Check Browser Console

On the registration page, open browser DevTools → Console and look for:
- ❌ `Failed to fetch` errors
- ❌ `NetworkError` when calling the API
- ❌ CORS errors
- ❌ 404 or 500 errors from the backend

### 4. Verify Backend is Accessible

Test the backend endpoint directly:
```bash
curl https://onekappa.herokuapp.com/api/members/cognito/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

Expected response:
- ✅ `200 OK` with `userSub` and `codeDeliveryDetails`
- ❌ `404 Not Found` - Backend URL is wrong
- ❌ `500 Internal Server Error` - Backend has issues
- ❌ `CORS error` - Backend CORS not configured

### 5. Check Backend Environment Variables (Heroku)

The backend also needs Cognito credentials:

```bash
heroku config --app onekappa
```

Verify these are set:
- ✅ `COGNITO_USER_POOL_ID`
- ✅ `COGNITO_CLIENT_ID`
- ✅ `AWS_REGION` (usually `us-east-1`)
- ✅ `AWS_ACCESS_KEY_ID`
- ✅ `AWS_SECRET_ACCESS_KEY`

## Common Issues and Fixes

### Issue 1: `NEXT_PUBLIC_API_URL` is missing or wrong
**Symptom:** Registration form submits but nothing happens, or console shows "Failed to fetch"

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add/Update `NEXT_PUBLIC_API_URL` = `https://your-backend.herokuapp.com`
3. **Redeploy** the application (environment variables require redeploy)

### Issue 2: Backend CORS not configured
**Symptom:** Browser console shows CORS errors

**Fix:**
1. Check backend CORS configuration in `backend/src/server.ts`
2. Ensure `FRONTEND_URL` in Heroku includes `https://one-kappa.com`
3. Verify CORS allows requests from your Vercel domain

### Issue 3: Backend not accessible
**Symptom:** 404 or connection timeout errors

**Fix:**
1. Verify Heroku app is running: `heroku ps --app onekappa`
2. Check Heroku logs: `heroku logs --tail --app onekappa`
3. Ensure backend is deployed and healthy

### Issue 4: Cognito credentials missing
**Symptom:** Backend returns 500 error with Cognito-related errors

**Fix:**
1. Check Heroku config has all Cognito/AWS credentials
2. Verify AWS credentials have permissions for Cognito
3. Check Cognito User Pool exists and is accessible

## Quick Fix Steps

1. **Verify `NEXT_PUBLIC_API_URL` in Vercel:**
   ```
   Vercel Dashboard → Project → Settings → Environment Variables
   → Check NEXT_PUBLIC_API_URL = https://onekappa.herokuapp.com
   ```

2. **Redeploy after changing environment variables:**
   ```
   Vercel Dashboard → Deployments → ... (three dots) → Redeploy
   ```

3. **Test the registration flow:**
   - Go to `https://one-kappa.com/register`
   - Try to register with a test email
   - Check browser console for errors
   - Check Vercel function logs

4. **Verify backend is working:**
   ```bash
   curl https://onekappa.herokuapp.com/api/members/cognito/signup \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test1234!"}'
   ```

## Testing Checklist

- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel (Production environment)
- [ ] `NEXT_PUBLIC_API_URL` points to correct Heroku backend URL
- [ ] Backend is accessible (curl test works)
- [ ] Backend has Cognito credentials configured
- [ ] Vercel deployment was redeployed after setting environment variables
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls to backend

## Still Not Working?

1. Check Vercel Function Logs:
   - Vercel Dashboard → Project → Functions → View Logs

2. Check Heroku Logs:
   ```bash
   heroku logs --tail --app onekappa
   ```

3. Test locally with production URLs:
   ```bash
   NEXT_PUBLIC_API_URL=https://onekappa.herokuapp.com npm run dev
   ```

4. Check AWS Cognito directly:
   - AWS Console → Cognito → User Pools
   - Verify user pool exists and is configured correctly

