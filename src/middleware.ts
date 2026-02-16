import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes and their allowed roles
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/parking': ['admin', 'guard'],
  '/resident': ['admin', 'resident'],
  '/dashboard': ['admin', 'guard', 'resident'],
};

// API route protection
const protectedApiRoutes: Record<string, string[]> = {
  '/api/admin': ['admin'],
  '/api/parking': ['admin', 'guard'],
  '/api/vehicles': ['admin', 'guard'],
  '/api/resident': ['admin', 'resident'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's an API route
  if (pathname.startsWith('/api/')) {
    // Skip auth routes
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check role-based access for API routes
    for (const [route, roles] of Object.entries(protectedApiRoutes)) {
      if (pathname.startsWith(route)) {
        if (!roles.includes(token.role as string)) {
          return NextResponse.json(
            { success: false, error: 'Forbidden' },
            { status: 403 }
          );
        }
        break;
      }
    }

    return NextResponse.next();
  }

  // Handle page routes
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if trying to access login page while authenticated
  if (pathname === '/login') {
    if (token) {
      // Redirect to appropriate dashboard based on role
      const redirectUrl = getRedirectUrl(token.role as string);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // Check protected routes
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!token) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      if (!roles.includes(token.role as string)) {
        // Redirect to appropriate dashboard if not authorized
        const redirectUrl = getRedirectUrl(token.role as string);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }

      break;
    }
  }

  // Redirect root to dashboard if authenticated
  if (pathname === '/') {
    if (token) {
      const redirectUrl = getRedirectUrl(token.role as string);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

function getRedirectUrl(role: string): string {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'guard':
      return '/parking';
    case 'resident':
      return '/resident';
    default:
      return '/login';
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/admin/:path*',
    '/parking/:path*',
    '/resident/:path*',
    '/api/:path*',
  ],
};
