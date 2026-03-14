import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json(
        { success: false, error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const { currentPasscode, newPasscode } = await request.json();

    if (!newPasscode || newPasscode.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'الرمز الجديد يجب أن يكون 6 أرقام' },
        { status: 400 }
      );
    }

    // التحقق من الرمز الحالي
    const storedPasscode = await db.select().from(settings).where(eq(settings.key, 'passcode'));
    
    if (storedPasscode.length === 0 || storedPasscode[0].value !== currentPasscode) {
      return NextResponse.json(
        { success: false, error: 'الرمز الحالي غير صحيح' },
        { status: 401 }
      );
    }

    // تحديث الرمز
    await db.update(settings)
      .set({ value: newPasscode })
      .where(eq(settings.key, 'passcode'));

    return NextResponse.json({ success: true, message: 'تم تغيير الرمز بنجاح' });
  } catch (error) {
    console.error('خطأ في تغيير الرمز:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في تغيير الرمز' },
      { status: 500 }
    );
  }
}
