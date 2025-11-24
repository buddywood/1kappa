# Using Real S3 Images for Test Data

This guide explains how to use real S3 images instead of Unsplash placeholders for test products and events.

## Overview

The seed file (`src/db/seed-test.ts`) has been updated to use real S3 images by default. All test products and events now reference actual images stored in your S3 bucket.

## Current Setup

### Products
- **22 product images** available in S3 at `products/`
- Seed file uses a `getS3ImageUrl()` helper function to generate proper S3 URLs
- Images are distributed across all test products

### Events
- **1 event image** currently available in S3 at `events/`
- All test events use the same image (you can upload more for variety)

## Updating Existing Test Data

If you have existing test data in your database with Unsplash URLs, you can update them using the migration script:

```bash
cd backend
npm run update:test-images
```

This script will:
- Find all products with Unsplash URLs
- Update them to use real S3 product images
- Find all events with Unsplash URLs
- Update them to use real S3 event images

## Adding More Event Images

Currently, there's only 1 event image. To add more:

```bash
# Upload a new event image to S3
aws s3 cp <your-image-file> s3://1kappa-uploads/events/ --profile buddy@ebilly.com

# Then update the EVENT_IMAGES array in:
# backend/src/scripts/update-test-images.ts
```

Or update the seed file directly to use different images for different events.

## How It Works

1. **Seed File**: Uses `getS3ImageUrl(key)` helper to generate S3 URLs
   - Format: `https://1kappa-uploads.s3.us-east-1.amazonaws.com/{key}`
   - Automatically uses bucket name and region from environment variables

2. **CloudFront**: Once environment variables are set, images automatically use CloudFront:
   - Mobile: `EXPO_PUBLIC_CLOUDFRONT_DOMAIN`
   - Web: `NEXT_PUBLIC_CLOUDFRONT_DOMAIN`
   - The `imageUtils.ts` files handle the conversion

3. **Migration Script**: Updates existing database records from Unsplash to S3 URLs

## Benefits

✅ **Faster Loading**: Real S3 images (with CloudFront) load faster than external Unsplash URLs  
✅ **Consistent Testing**: Test with the same images users will see  
✅ **No External Dependencies**: Don't rely on Unsplash being available  
✅ **Better Performance**: CloudFront CDN provides global edge caching  

## Next Steps

1. **Run the seed script** to create new test data with real images:
   ```bash
   npm run seed:test
   ```

2. **Update existing data** (if needed):
   ```bash
   npm run update:test-images
   ```

3. **Upload more event images** if you want variety:
   ```bash
   aws s3 cp event-image.jpg s3://1kappa-uploads/events/ --profile buddy@ebilly.com
   ```

