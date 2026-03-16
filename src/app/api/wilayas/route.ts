import { NextResponse } from 'next/server';
import { db } from '@/db';
import { wilayas } from '@/db/schema';
import { requireAuth } from '@/lib/helpers';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const wilayaList = await db.select().from(wilayas);
    return NextResponse.json(wilayaList);
  } catch (error) {
    console.error('خطأ في جلب الولايات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
