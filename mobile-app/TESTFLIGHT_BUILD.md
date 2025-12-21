# TestFlight Build Instructions

## Prerequisites

1. **Apple Developer Account**: You need an active Apple Developer Program membership ($99/year)
2. **App Store Connect Access**: Your Apple ID must have access to App Store Connect
3. **EAS Account**: Already logged in (✓ confirmed)

## Step 1: Set Up iOS Credentials

Run the credentials setup command interactively:

```bash
cd mobile-app
eas credentials
```

When prompted:

1. Select **iOS** platform
2. Choose to **Set up credentials for production**
3. EAS will ask if you want to log in to your Apple account - choose **Yes**
4. Enter your Apple ID credentials when prompted
5. EAS will automatically generate:
   - Distribution Certificate
   - Provisioning Profile
   - App Store Connect API Key (if needed)

## Step 2: Verify Environment Variables

Make sure production environment variables are set:

```bash
eas env:list
```

You should see:

- `EXPO_PUBLIC_API_URL` = `https://onekappa.herokuapp.com`
- `EXPO_PUBLIC_WEB_URL` = `https://www.one-kappa.com`

## Step 3: Build for TestFlight

Once credentials are set up, start the build:

```bash
eas build --platform ios --profile production
```

This will:

- Build the iOS app for App Store distribution
- Upload it to EAS servers
- Generate an `.ipa` file ready for TestFlight

## Step 4: Submit to TestFlight (Optional)

After the build completes, you can automatically submit to TestFlight:

```bash
eas submit --platform ios --profile production
```

Or submit manually:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app
3. Go to TestFlight tab
4. Upload the build from EAS

## Build Status

Check build status:

```bash
eas build:list
```

View build details:

```bash
eas build:view [BUILD_ID]
```

## Troubleshooting

### "Credentials are not set up"

- Run `eas credentials` interactively to set up iOS credentials
- Make sure you have Apple Developer Program access

### "Distribution Certificate is not validated"

- Run the build command interactively (without `--non-interactive`)
- EAS will validate credentials during the build process

### Build fails with code signing errors

- Check that your Apple Developer account is active
- Verify bundle identifier matches: `com.onekappa.app`
- Run `eas credentials` to regenerate certificates if needed

## Notes

- The production build profile is configured for App Store distribution
- Environment variables are automatically loaded from the "production" environment
- Builds typically take 10-20 minutes to complete
- You'll receive an email notification when the build is ready





