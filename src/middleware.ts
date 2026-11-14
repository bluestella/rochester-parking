import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authSecret } from '@/lib/auth-secret';

// Page sections and the roles allowed in them.
const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/parking': ['admin', 'guard'],
  '/resident': ['admin', 'resident'],
  '/dashboard': ['admin'],
};

// Coarse API guard. Every handler also checks its own role/permission.
const protectedApiRoutes: Record<string, string[]> = {
  '/api/admin': ['admin'],
  '/api/parking': ['admin', 'guard'],
  '/api/vehicles': ['admin', 'guard'],
  '/api/resident': ['admin', 'resident'],
};

/** Match on whole path segments so `/api/resident` does not catch `/api/residents`. */
function inSection(pathname: string, section: string) {
  return pathname === section || pathname.startsWith(section + '/');
}

function rolesFor(pathname: string, table: Record<string, string[]>) {
  const match = Object.keys(table).find((section) => inSection(pathname, section));
  return match ? table[match] : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: authSecret });

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) return NextResponse.next();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const roles = rolesFor(pathname, protectedApiRoutes);
    if (roles && !roles.includes(token.role as string)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    return token
      ? NextResponse.redirect(new URL(homeFor(token.role as string), request.url))
      : NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? homeFor(token.role as string) : '/login', request.url)
    );
  }

  const roles = rolesFor(pathname, protectedRoutes);
  if (roles) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!roles.includes(token.role as string)) {
      return NextResponse.redirect(new URL(homeFor(token.role as string), request.url));
    }
  }

  return NextResponse.next();
}

function homeFor(role: string): string {
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
