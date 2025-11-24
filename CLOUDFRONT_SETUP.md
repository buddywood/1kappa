# CloudFront CDN Setup for 1Kappa

## ✅ CloudFront Distribution Created

**Distribution ID:** `E1SQ77TVO7KRPY`  
**Domain Name:** `d3hxb8yyqrw9hb.cloudfront.net`  
**Status:** Deploying (takes 10-15 minutes to become fully active)

## Configuration

- **Origin:** `1kappa-uploads.s3.amazonaws.com`
- **Price Class:** PriceClass_100 (US, Canada, Europe - lowest cost)
- **Compression:** Enabled
- **HTTPS:** Redirect HTTP to HTTPS
- **Caching:**
  - Default TTL: 1 day (86400 seconds)
  - Max TTL: 1 year (31536000 seconds)
  - Min TTL: 0 seconds

## Environment Variables

Add to your `.env` files:

**Mobile App (`mobile-app/.env`):**

```bash
EXPO_PUBLIC_CLOUDFRONT_DOMAIN=https://d3hxb8yyqrw9hb.cloudfront.net
```

**Web App (`frontend/.env.local` or `.env`):**

```bash
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://d3hxb8yyqrw9hb.cloudfront.net
```

## Current Status

The distribution is currently deploying. You can check status with:

```bash
aws cloudfront get-distribution --id E1SQ77TVO7KRPY --profile buddy@ebilly.com --query "Distribution.Status" --output text
```

Wait until it shows `Deployed` before using in production.

## Benefits

1. **Faster Image Loading:** Images served from edge locations closer to users
2. **Better Mobile Performance:** Reduced latency on mobile networks
3. **Cost Savings:** Reduced S3 data transfer costs
4. **Automatic Compression:** Gzip/Brotli compression enabled
5. **HTTPS:** Secure delivery with automatic HTTP to HTTPS redirect

## Future Enhancements

To add image resizing/optimization (WebP conversion, thumbnails):

1. **Option A:** Use AWS Lambda@Edge to resize images on-the-fly
2. **Option B:** Use a service like Cloudinary or Imgix
3. **Option C:** Generate multiple sizes on upload and store in S3

## Testing

Once deployed, test with:

```bash
# Test CloudFront URL
curl -I https://d3hxb8yyqrw9hb.cloudfront.net/events/your-image-key.jpg

# Compare with S3 direct URL
curl -I https://1kappa-uploads.s3.amazonaws.com/events/your-image-key.jpg
```

## Monitoring

View CloudFront metrics in AWS Console:

- CloudFront → Distributions → E1SQ77TVO7KRPY → Monitoring
