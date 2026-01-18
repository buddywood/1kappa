import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');

  if (!host) {
    return NextResponse.next();
  }

  // Define top-level domains (ordered by specificity - longest first)
  // Note: localhost might have subdomains if configured in /etc/hosts
  const tlds = ['preview.one-kappa.com', 'one-kappa.com', 'localhost:3000'];
  
  // Sort by length (longest first) to match most specific TLD first
  const sortedTlds = [...tlds].sort((a, b) => b.length - a.length);
  
  let currentTld = sortedTlds.find(tld => host.endsWith(tld));
  
  if (!currentTld) {
    // Handle cases where the port isn't in host but is in currentTld
    if (host === 'localhost' || host.startsWith('localhost:')) {
      currentTld = 'localhost';
    } else {
      return NextResponse.next();
    }
  }

  // Extract subdomain
  // For nested subdomains like "kappa-gear.preview.one-kappa.com"
  // We want to extract "kappa-gear" as the subdomain
  let subdomain = '';
  if (host.endsWith(currentTld) && host.length > currentTld.length) {
    // Remove the TLD from the end to get the prefix
    const prefix = host.slice(0, -(currentTld.length + 1)); // +1 for the dot
    // Get the first part (the actual subdomain, not "preview" if it's nested)
    if (prefix.includes('.')) {
      // For nested: "kappa-gear.preview" -> extract "kappa-gear"
      subdomain = prefix.split('.')[0];
    } else {
      // For simple: "subdomain" -> use as is
      subdomain = prefix;
    }
  }
  
  // Debug logging for subdomain extraction
  console.log(`[Middleware] Host: ${host}, TLD: ${currentTld}, Prefix: "${host.slice(0, -(currentTld.length + 1))}", Extracted subdomain: "${subdomain}"`);
  
  // Special case: if subdomain is "preview", it's not a seller subdomain
  if (subdomain === 'preview') {
    console.log(`[Middleware] Subdomain is "preview", skipping rewrite`);
    return NextResponse.next();
  }

  // If no subdomain or it's 'www', continue normally
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // Avoid rewriting internal paths
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.') // for files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // Rewrite root of subdomain to the seller's store page
  if (url.pathname === '/') {
    url.pathname = `/collections/slug/${subdomain}`;
    console.log(`[Middleware] Rewriting ${host}${request.nextUrl.pathname} to ${url.pathname}`);
    return NextResponse.rewrite(url);
  }

  // For other paths, we could decide to keep them as is (global login/register)
  // or wrap them in the seller's theme. For now, we only rewrite the homepage.
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - apply (seller application route)
     * - seller-setup-intro (seller setup route)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|apply|seller-setup-intro).*)',
  ],
};
