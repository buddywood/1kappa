/**
 * Image optimization utilities for web app
 * Helps generate optimized image URLs using CloudFront CDN
 */

// CloudFront CDN domain for optimized image delivery
// Set this in your .env file: NEXT_PUBLIC_CLOUDFRONT_DOMAIN=https://d3hxb8yyqrw9hb.cloudfront.net
const CLOUDFRONT_DOMAIN = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || '';
const IMAGE_CDN_ENABLED = !!CLOUDFRONT_DOMAIN;

/**
 * Generate an optimized image URL for web
 * If CloudFront is configured, uses CDN. Otherwise falls back to S3 URL.
 * 
 * @param originalUrl - Original S3 image URL
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined
): string | null {
  if (!originalUrl) return null;

  // If CloudFront is enabled, use CDN URL
  if (IMAGE_CDN_ENABLED && CLOUDFRONT_DOMAIN) {
    // Extract S3 key from URL
    const s3Key = extractS3Key(originalUrl);
    if (!s3Key) return originalUrl;

    // Build CloudFront URL
    // Note: CloudFront doesn't support query-parameter image transformation by default
    // For image resizing/optimization, you'd need Lambda@Edge or a service like Cloudinary
    // For now, CloudFront provides CDN caching benefits (faster delivery, edge caching)
    const cloudfrontDomain = CLOUDFRONT_DOMAIN.replace(/^https?:\/\//, ''); // Remove protocol if present
    return `https://${cloudfrontDomain}/${s3Key}`;
  }

  // Fallback to original URL
  return originalUrl;
}

/**
 * Extract S3 key from S3 URL
 */
function extractS3Key(url: string): string | null {
  try {
    // Handle different S3 URL formats:
    // https://bucket.s3.region.amazonaws.com/key
    // https://s3.region.amazonaws.com/bucket/key
    const urlObj = new URL(url);
    
    // Pattern 1: bucket.s3.region.amazonaws.com
    if (urlObj.hostname.includes('.s3.')) {
      const parts = urlObj.hostname.split('.');
      const bucketIndex = parts.findIndex(p => p.includes('s3'));
      if (bucketIndex > 0) {
        const key = urlObj.pathname.substring(1); // Remove leading /
        return key;
      }
    }
    
    // Pattern 2: s3.region.amazonaws.com/bucket/key
    if (urlObj.hostname.includes('amazonaws.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length >= 2) {
        return pathParts.slice(1).join('/'); // Skip bucket name
      }
    }
    
    // Fallback: use pathname as key
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

/**
 * Get thumbnail URL for event images (smaller size for lists)
 * Uses CloudFront CDN for faster delivery
 */
export function getEventThumbnailUrl(imageUrl: string | null | undefined): string | null {
  // For now, just use CloudFront CDN (no transformation)
  // TODO: Add Lambda@Edge or image processing service for resizing
  return getOptimizedImageUrl(imageUrl);
}

/**
 * Get full-size URL for event detail view
 * Uses CloudFront CDN for faster delivery
 */
export function getEventFullSizeUrl(imageUrl: string | null | undefined): string | null {
  // For now, just use CloudFront CDN (no transformation)
  // TODO: Add Lambda@Edge or image processing service for resizing
  return getOptimizedImageUrl(imageUrl);
}

