import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { DEFAULT_PASSCODE, getAuthConfig } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
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
        sameSite: 'none',
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
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في المصادقة', details: errorMessage },
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
