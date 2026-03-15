import { NextResponse } from 'next/server';
import { db } from '@/db';
import { wilayas } from '@/db/schema';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const wilayaList = await db.select().from(wilayas);
    return NextResponse.json(wilayaList);
  } catch (error) {
    console.error('خطأ في جلب الولايات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
