# EAS Production Setup Instructions

This guide will help you set up the Expo Application Services (EAS) project with production environment variables using your ebillyweb account.

## Prerequisites

- EAS CLI installed (`npm install -g eas-cli`)
- Access to the ebillyweb Expo account

## Step 1: Log in to EAS

Navigate to the mobile-app directory and log in with your ebillyweb account:

```bash
cd mobile-app
eas login
```

When prompted, enter your ebillyweb account credentials (email/username).

Verify you're logged in with the correct account:

```bash
eas whoami
```

## Step 2: Verify Project Configuration

The project is already configured with:

- Project ID: `05c24793-5e28-4cf6-a513-0bf67e5ac7a3` (in `app.json`)
- EAS build profiles: development, preview, and production (in `eas.json`)

If you need to link the project to your ebillyweb account or create a new project:

```bash
# To link existing project
eas project:info

# Or to create a new project (if needed)
eas init
```

## Step 3: Create Production Environment Variables

Run the setup script to create the production secrets:

```bash
./setup-eas-prod-secrets.sh
```

Or manually run the commands:

```bash
# Create EXPO_PUBLIC_API_URL for production
eas env:create production --name EXPO_PUBLIC_API_URL --value https://onekappa.herokuapp.com --scope project

# Create EXPO_PUBLIC_WEB_URL for production
eas env:create production --name EXPO_PUBLIC_WEB_URL --value https://www.one-kappa.com --scope project
```

## Step 4: Verify Environment Variables

List all environment variables to confirm they were created:

```bash
eas env:list
```

You should see:

- `EXPO_PUBLIC_API_URL` set to `https://onekappa.herokuapp.com`
- `EXPO_PUBLIC_WEB_URL` set to `https://www.one-kappa.com`

Both should be scoped to `production` environment.

## Step 5: Build for Production

Once the environment variables are set, you can build for production:

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Or build for both
eas build --platform all --profile production
```

## Troubleshooting

### If you get "An Expo user account is required"

- Make sure you're logged in: `eas whoami`
- If logged in with wrong account, logout and login again: `eas logout && eas login`

### If secrets already exist

- Use the `--force` flag to overwrite: `eas env:create production --name EXPO_PUBLIC_API_URL --value https://onekappa.herokuapp.com --scope project --force`

### To view project information

```bash
eas project:info
```

### To check build status

```bash
eas build:list
```

## Notes

- Environment variables are embedded at build time, not runtime
- The `production` profile in `eas.json` will use these environment variables
- These variables will be available in your app as `process.env.EXPO_PUBLIC_API_URL` and `process.env.EXPO_PUBLIC_WEB_URL`
- The app already has fallback values in `lib/constants.ts`, but production builds will use the EAS secrets





