import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { DEFAULT_PASSCODE, getAuthConfig } from '@/lib/auth-config';

// FIX 3: Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // max 5 attempts per window

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // FIX 3: Check rate limit
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز عدد المحاولات المسموح. حاول مجدداً بعد 15 دقيقة' },
        { status: 429 }
      );
    }

    const { passcode } = await request.json();

    if (!passcode || passcode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'الرمز يجب أن يكون 6 أرقام' },
        { status: 400 }
      );
    }

    // محاولة الحصول على الرمز المخزن من قاعدة البيانات
    let storedPasscode: string | null = null;

    try {
      const result = await db.select().from(settings).where(eq(settings.key, 'passcode'));
      if (result.length > 0 && result[0].value) {
        storedPasscode = result[0].value;
      }
    } catch (dbError) {
      console.warn('تعذر الوصول لقاعدة البيانات، استخدام الرمز الافتراضي');
    }

    // استخدام الرمز الافتراضي إذا لم يوجد رمز مخزن
    const validPasscode = storedPasscode || DEFAULT_PASSCODE;

    if (passcode === validPasscode) {
      // تعيين جلسة المصادقة
      const cookieStore = await cookies();
      cookieStore.set('authenticated', 'true', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax', // FIX 2: changed from 'none' to 'lax'
        maxAge: 60 * 60 * 24 * 7, // أسبوع
        path: '/',
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'رمز غير صحيح' },
      { status: 401 }
    );
  } catch (error) {
    console.error('خطأ في المصادقة:', error);
    // FIX 4: Removed details: errorMessage from response
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في المصادقة' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    return NextResponse.json({
      authenticated: authenticated?.value === 'true'
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('authenticated');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
