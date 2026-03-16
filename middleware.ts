import { NextRequest, NextResponse } from 'next/server';

// FIX 1: Auth middleware + security headers

const PUBLIC_PATHS = ['/api/auth', '/api/init-db'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers to all responses
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Skip auth check for public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // Protect API routes
  if (pathname.startsWith('/api/')) {
    const authenticated = request.cookies.get('authenticated');
    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
