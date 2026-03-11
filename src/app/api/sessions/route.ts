import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cases } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

// الحصول على جلسات قضية أو جميع الجلسات
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصارح' }, { status: 401 });
    }

    const caseId = request.nextUrl.searchParams.get('caseId');
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const session = await db.select().from(sessions).where(eq(sessions.id, parseInt(id))).limit(1);
      return NextResponse.json(session[0] || null);
    }

    // جلب كل الجلسات مع بيانات القضية
    const allSessions = await db
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
      .orderBy(desc(sessions.sessionDate));

    return NextResponse.json(allSessions);
  } catch (error) {
    console.error('خطأ في جلب الجلسات:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الجلسات' }, { status: 500 });
  }
}

// إضافة جلسة جديدة
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, sessionDate, adjournmentReason, decision, rulingText, notes } = body;

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    const result = await db.insert(sessions).values({
      caseId: parseInt(caseId),
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
    const body = await request.json();
    const { id, sessionDate, adjournmentReason, decision, rulingText, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الجلسة مطلوب' }, { status: 400 });
    }

    const result = await db.update(sessions)
      .set({
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        adjournmentReason,
        decision,
        rulingText,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, parseInt(id)))
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
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'معرف الجلسة مطلوب' }, { status: 400 });
    }

    await db.delete(sessions).where(eq(sessions.id, parseInt(id)));

    return NextResponse.json({ message: 'تم حذف الجلسة بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الجلسة:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف الجلسة' }, { status: 500 });
  }
}
