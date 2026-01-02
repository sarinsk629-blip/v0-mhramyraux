import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require premium access after trial expires
const PROTECTED_ROUTES = ['/pulse', '/void', '/zenith'];

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth', '/api', '/upgrade'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if accessing protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get user data from headers or cookies
  // Note: In a real implementation, you would get this from your auth system
  // For now, this is a placeholder structure
  const userDataHeader = request.headers.get('x-user-data');
  
  if (!userDataHeader) {
    // No user data, redirect to auth
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  try {
    const userData = JSON.parse(userDataHeader);
    const { isPremium, trialExpiresAt } = userData;

    // If user is premium, allow access
    if (isPremium) {
      return NextResponse.next();
    }

    // If user has no trial expiration date, redirect to upgrade
    if (!trialExpiresAt) {
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }

    // Check if trial has expired
    const trialExpiry = new Date(trialExpiresAt);
    const now = new Date();

    if (now > trialExpiry) {
      // Trial expired, redirect to upgrade page
      return NextResponse.redirect(new URL('/upgrade', request.url));
    }

    // Trial still active, allow access
    return NextResponse.next();
  } catch (error) {
    console.error('Error parsing user data:', error);
    // On error, redirect to auth
    return NextResponse.redirect(new URL('/auth', request.url));
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
