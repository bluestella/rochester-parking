import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authSecret } from '@/lib/auth-secret';
import { API_ACCESS, PAGE_ACCESS, accessFor, canOpenPage, hasAnyPermission, homeFor } from '@/lib/permissions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: authSecret });
  const role = (token?.role as string) ?? '';

  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth')) return NextResponse.next();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Coarse guard; every handler also checks its own permission.
    const needed = accessFor(pathname, API_ACCESS);
    if (needed && !hasAnyPermission(role, needed)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === '/login') {
    return token
      ? NextResponse.redirect(new URL(homeFor(role), request.url))
      : NextResponse.next();
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? homeFor(role) : '/login', request.url));
  }

  const needed = accessFor(pathname, PAGE_ACCESS);
  if (needed) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!canOpenPage(role, pathname)) {
      const home = homeFor(role);
      // Avoid a redirect loop if the role has no home page at all.
      return NextResponse.redirect(new URL(home === pathname ? '/login' : home, request.url));
    }
  }

  return NextResponse.next();
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
