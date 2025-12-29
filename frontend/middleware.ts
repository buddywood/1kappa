import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host');

  if (!host) {
    return NextResponse.next();
  }

  // Define top-level domains
  // Note: localhost might have subdomains if configured in /etc/hosts
  const tlds = ['preview.one-kappa.com', 'one-kappa.com', 'localhost:3000'];
  
  let currentTld = tlds.find(tld => host.endsWith(tld));
  
  if (!currentTld) {
    // Handle cases where the port isn't in host but is in currentTld
    if (host === 'localhost' || host.startsWith('localhost:')) {
      currentTld = 'localhost';
    } else {
      return NextResponse.next();
    }
  }

  // Extract subdomain
  let subdomain = '';
  if (host.includes(`.${currentTld}`)) {
    subdomain = host.split(`.${currentTld}`)[0];
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
