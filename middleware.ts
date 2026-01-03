import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add comprehensive security headers
  const response = NextResponse.next();

  // Security headers - Critical for production
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Content Security Policy - Prevent XSS attacks
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js
    "style-src 'self' 'unsafe-inline'", // Needed for Tailwind
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
  
  // Permissions Policy - Restrict browser features
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for static assets
  if (request.nextUrl.pathname.startsWith('/_next/static') || 
      request.nextUrl.pathname.startsWith('/logos') ||
      request.nextUrl.pathname.startsWith('/photos')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // CORS headers (adjust as needed for your domain)
  const origin = request.headers.get('origin');
  if (origin && origin.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost')) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
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
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};




