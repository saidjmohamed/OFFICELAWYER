import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { passcode } = await request.json();

    if (!passcode || passcode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'الرمز يجب أن يكون 6 أرقام' },
        { status: 400 }
      );
    }

    // الحصول على الرمز المخزن
    const storedPasscode = await db.select().from(settings).where(eq(settings.key, 'passcode'));
    
    if (storedPasscode.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لم يتم إعداد الرمز' },
        { status: 500 }
      );
    }

    if (storedPasscode[0].value === passcode) {
      // تعيين جلسة المصادقة
      const cookieStore = await cookies();
      cookieStore.set('authenticated', 'true', {
        httpOnly: true,
        secure: false, // للتطوير المحلي
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // أسبوع
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
