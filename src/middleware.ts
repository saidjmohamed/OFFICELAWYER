/**
 * Middleware للمصادقة والأمان
 * يعمل على حماية مسارات API والتحقق من الجلسات
 *
 * ملاحظة: هذا الـ middleware يعمل في بيئة Edge Runtime ولا يمكنه الوصول لقاعدة البيانات.
 * التحقق الكامل من صلاحية الجلسة (session_id) يتم في requireAuth() داخل مسارات API.
 * هنا نتحقق فقط من وجود cookie للمصادقة كطبقة حماية أولى.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// المسارات التي لا تتطلب مصادقة
const publicPaths = [
  '/api/auth',
  '/api/health',
];

// المسارات الثابتة
const isStaticPath = (pathname: string) =>
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.startsWith('/public') ||
  pathname.includes('.');

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // تجاهل المسارات الثابتة
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // التحقق من المسارات العامة
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // حماية مسارات API
  if (pathname.startsWith('/api/')) {
    // التحقق من وجود جلسة مستخدم (الطريقة المفضلة)
    // التحقق الكامل من صلاحية الجلسة يتم في requireAuth()
    const sessionId = request.cookies.get('session_id')?.value;

    // @deprecated التحقق من cookie المصادقة القديمة (passcode) - للتوافق الخلفي فقط
    // سيتم إزالة هذا التحقق في إصدار مستقبلي لصالح نظام الجلسات الجديد
    const authenticated = request.cookies.get('authenticated')?.value;

    if (!sessionId && authenticated !== 'true') {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }
  }

  // إضافة headers للأمان
  const response = NextResponse.next();

  // منع clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // حماية من XSS
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // منع كشف نوع المحتوى
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // سياسة أمنية للمحتوى - بدون unsafe-eval لمنع تنفيذ الكود الديناميكي
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none';"
  );

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - تقييد الوصول للميزات الحساسة
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );

  // Strict Transport Security
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * مطابقة جميع المسارات ما عدا:
     * - _next/static (ملفات ثابتة)
     * - _next/image (ملفات الصور)
     * - favicon.ico (أيقونة الموقع)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
