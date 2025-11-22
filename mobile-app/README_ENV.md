# Mobile App Environment Variables

This document explains how to set up environment variables for the 1Kappa mobile app.

## Required Environment Variables

The mobile app requires the following environment variables to be set:

### Cognito Configuration
- `EXPO_PUBLIC_COGNITO_USER_POOL_ID` - Your AWS Cognito User Pool ID
- `EXPO_PUBLIC_COGNITO_CLIENT_ID` - Your AWS Cognito App Client ID

### API Configuration
- `EXPO_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:3001`)
- `EXPO_PUBLIC_WEB_URL` - Web app URL for deep linking (default: `http://localhost:3000`)

## Setting Environment Variables

### Option 1: Using .env file (Recommended for Development)

1. Create a `.env` file in the `mobile-app` directory:
```bash
cd mobile-app
cp .env.example .env
```

2. Edit `.env` and add your values:
```env
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
EXPO_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_WEB_URL=http://localhost:3000
```

3. Install `expo-constants` if not already installed (it's usually included with Expo):
```bash
npm install expo-constants
```

4. Restart your Expo development server:
```bash
npm start
```

### Option 2: Using EAS Secrets (Recommended for Production)

For production builds with EAS (Expo Application Services):

```bash
# Set secrets
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_USER_POOL_ID --value your-pool-id
eas secret:create --scope project --name EXPO_PUBLIC_COGNITO_CLIENT_ID --value your-client-id
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://api.1kappa.com
eas secret:create --scope project --name EXPO_PUBLIC_WEB_URL --value https://1kappa.com
```

### Option 3: Using app.config.js (Alternative)

You can also use `app.config.js` instead of `app.json` to use environment variables:

1. Rename `app.json` to `app.config.js`
2. Convert it to JavaScript and use `process.env`:

```javascript
export default {
  expo: {
    // ... other config
    extra: {
      cognitoUserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
      cognitoClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
      webUrl: process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000',
    },
  },
};
```

## Getting Your Cognito Values

To find your Cognito User Pool ID and Client ID:

1. Go to AWS Console → Cognito → User Pools
2. Select your user pool
3. Note the **User Pool ID** (format: `us-east-1_xxxxxxxxx`)
4. Go to **App integration** → **App clients**
5. Note the **Client ID** (a long alphanumeric string)

## Important Notes

- All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app
- Environment variables are embedded at build time, not runtime
- After changing environment variables, you must restart the Expo development server
- Never commit `.env` files with actual credentials to version control
- The `.env.example` file is a template and should not contain real values

## Security Note: Why These Are Safe

The Cognito User Pool ID and Client ID are **public identifiers** (similar to OAuth client IDs), not secrets:
- They're designed to be embedded in client applications
- Security comes from the authentication flow, not from hiding these IDs
- Anyone can extract them from the app bundle anyway
- They're safe to store in environment variables

**Never store actual secrets** (database passwords, API keys, etc.) in mobile apps. See `../docs/SECRETS_MANAGEMENT.md` for details on managing secrets for the backend.

## Verification

To verify your environment variables are loaded:

1. Check `mobile-app/lib/constants.ts` - it should use the environment variables
2. Check `mobile-app/lib/cognito.ts` - it should import from constants
3. Run the app and check console logs for any missing configuration errors

## Troubleshooting

If environment variables aren't loading:

1. Make sure the `.env` file is in the `mobile-app` directory (not the root)
2. Restart the Expo development server completely
3. Clear Expo cache: `expo start -c`
4. For production builds, ensure EAS secrets are set correctly

