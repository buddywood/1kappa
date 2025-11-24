/**
 * Image optimization utilities for mobile app
 * Helps generate optimized image URLs for better performance
 */

// CloudFront CDN domain for optimized image delivery
// Set this in your .env file: EXPO_PUBLIC_CLOUDFRONT_DOMAIN=https://d3hxb8yyqrw9hb.cloudfront.net
const CLOUDFRONT_DOMAIN = process.env.EXPO_PUBLIC_CLOUDFRONT_DOMAIN || '';
const IMAGE_CDN_ENABLED = !!CLOUDFRONT_DOMAIN;

/**
 * Generate an optimized image URL for mobile
 * If CloudFront is configured, uses CDN. Otherwise falls back to S3 URL.
 * 
 * @param originalUrl - Original S3 image URL
 * @param options - Optimization options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  options?: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
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
        const bucket = parts[bucketIndex - 1];
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

/**
 * Preload image for better UX (React Native compatible)
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve();
      return;
    }

    // In React Native, we can use Image.prefetch
    const { Image } = require('react-native');
    Image.prefetch(url)
      .then(() => resolve())
      .catch((error: Error) => reject(new Error(`Failed to load image: ${url}`)));
  });
}

