import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cases } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { sessionSchema, sessionUpdateSchema, safeParseInt } from '@/lib/validations';

// الحصول على جلسات قضية أو جميع الجلسات
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const caseId = request.nextUrl.searchParams.get('caseId');
    const id = request.nextUrl.searchParams.get('id');
    const page = safeParseInt(request.nextUrl.searchParams.get('page')) || 1;
    const limit = Math.min(safeParseInt(request.nextUrl.searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;

    if (id) {
      const parsedId = safeParseInt(id);
      if (!parsedId) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
      const session = await db.select().from(sessions).where(eq(sessions.id, parsedId)).limit(1);
      return NextResponse.json(session[0] || null);
    }

    // بناء شرط التصفية
    const parsedCaseId = caseId ? safeParseInt(caseId) : null;
    if (caseId && !parsedCaseId) return NextResponse.json({ error: 'معرف القضية غير صالح' }, { status: 400 });
    const whereClause = parsedCaseId ? eq(sessions.caseId, parsedCaseId) : undefined;

    // جلب العدد الإجمالي
    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // جلب الجلسات مع بيانات القضية
    let query = db
      .select({
        id: sessions.id,
        caseId: sessions.caseId,
        sessionDate: sessions.sessionDate,
        adjournmentReason: sessions.adjournmentReason,
        decision: sessions.decision,
        rulingText: sessions.rulingText,
        notes: sessions.notes,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        caseNumber: cases.caseNumber,
        caseSubject: cases.subject,
        caseStatus: cases.status,
      })
      .from(sessions)
      .leftJoin(cases, eq(sessions.caseId, cases.id))
      .where(whereClause)
      .orderBy(desc(sessions.sessionDate))
      .limit(limit)
      .offset(offset);

    const allSessions = await query;

    return NextResponse.json({
      data: allSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('خطأ في جلب الجلسات:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الجلسات' }, { status: 500 });
  }
}

// إضافة جلسة جديدة
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = sessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { caseId, sessionDate, adjournmentReason, decision, rulingText, notes } = validation.data;

    const result = await db.insert(sessions).values({
      caseId,
      sessionDate: sessionDate ? new Date(sessionDate) : null,
      adjournmentReason,
      decision,
      rulingText,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('خطأ في إضافة الجلسة:', error);
    return NextResponse.json({ error: 'حدث خطأ في إضافة الجلسة' }, { status: 500 });
  }
}

// تحديث جلسة
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const validation = sessionUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0]?.message || 'بيانات غير صالحة' }, { status: 400 });
    }

    const { id, sessionDate, adjournmentReason, decision, rulingText, notes } = validation.data;

    const result = await db.update(sessions)
      .set({
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        adjournmentReason,
        decision,
        rulingText,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('خطأ في تحديث الجلسة:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث الجلسة' }, { status: 500 });
  }
}

// حذف جلسة
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const id = request.nextUrl.searchParams.get('id');
    const parsedId = safeParseInt(id);

    if (!parsedId) {
      return NextResponse.json({ error: 'معرف الجلسة مطلوب أو غير صالح' }, { status: 400 });
    }

    await db.delete(sessions).where(eq(sessions.id, parsedId));

    return NextResponse.json({ message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الجلسة:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف الجلسة' }, { status: 500 });
  }
}
