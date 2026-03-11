import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLogs } from '@/db/schema';
import { desc, eq, and, gte, lte, sql } from 'drizzle-orm';

// جلب سجل النشاطات
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // بناء شروط البحث
    const conditions = [];
    
    if (entityType) {
      conditions.push(eq(activityLogs.entityType, entityType));
    }
    
    if (entityId) {
      conditions.push(eq(activityLogs.entityId, parseInt(entityId)));
    }
    
    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }
    
    if (fromDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(fromDate)));
    }
    
    if (toDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(toDate)));
    }

    // جلب السجلات
    const logs = await db
      .select()
      .from(activityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // جلب العدد الإجمالي
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const total = countResult[0]?.count || 0;

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('خطأ في جلب سجل النشاطات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب سجل النشاطات' },
      { status: 500 }
    );
  }
}

// إضافة سجل نشاط جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { action, entityType, entityId, description, details } = body;
    
    if (!action || !description) {
      return NextResponse.json(
        { error: 'الإجراء والوصف مطلوبان' },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(activityLogs)
      .values({
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        description,
        details: details ? JSON.stringify(details) : null,
      })
      .returning();

    return NextResponse.json(log);
  } catch (error) {
    console.error('خطأ في إضافة سجل النشاط:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة سجل النشاط' },
      { status: 500 }
    );
  }
}

// حذف سجلات النشاطات القديمة (أقدم من عدد أيام محدد)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '90');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await db
      .delete(activityLogs)
      .where(lte(activityLogs.createdAt, cutoffDate))
      .returning();

    return NextResponse.json({
      message: `تم حذف ${result.length} سجل نشاط`,
      deletedCount: result.length
    });
  } catch (error) {
    console.error('خطأ في حذف سجلات النشاطات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف سجلات النشاطات' },
      { status: 500 }
    );
  }
}
