import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activities } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { safeParseInt } from '@/lib/validations';

// GET - جلب آخر النشاطات
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(safeParseInt(searchParams.get('limit')) || 20, 100);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    let query = db.select().from(activities);

    if (entityType && entityId) {
      query = query.where(
        eq(activities.entityType, entityType),
        eq(activities.entityId, safeParseInt(entityId) || 0)
      ) as any;
    }

    const result = await query.orderBy(desc(activities.createdAt)).limit(limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في جلب النشاطات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - إضافة نشاط جديد
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    
    const [activity] = await db.insert(activities).values({
      action: body.action,
      entityType: body.entityType,
      entityId: body.entityId,
      description: body.description,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
    }).returning();

    return NextResponse.json(activity);
  } catch (error) {
    console.error('خطأ في إضافة النشاط:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
