import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { calendarEvents, sessions, cases } from '@/db/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { safeParseInt } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    // إذا كان هناك نطاق تاريخ، نرجع الأحداث في هذا النطاق
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      // تحويل الميلي ثانية إلى ثواني للمقارنة
      const startSeconds = Math.floor(start / 1000);
      const endSeconds = Math.floor(end / 1000);

      // جلب أحداث التقويم
      let eventsQuery = db.select().from(calendarEvents)
        .where(and(
          sql`${calendarEvents.eventDate} >= ${startSeconds}`,
          sql`${calendarEvents.eventDate} <= ${endSeconds}`
        ));

      if (type) {
        eventsQuery = db.select().from(calendarEvents)
          .where(and(
            sql`${calendarEvents.eventDate} >= ${startSeconds}`,
            sql`${calendarEvents.eventDate} <= ${endSeconds}`,
            eq(calendarEvents.type, type as 'session' | 'appointment' | 'meeting' | 'task')
          ));
      }

      const events = await eventsQuery;

      // جلب الجلسات في النطاق
      const sessionsInPeriod = await db.select({
        id: sessions.id,
        sessionDate: sessions.sessionDate,
        caseId: sessions.caseId,
        caseNumber: cases.caseNumber,
        caseSubject: cases.subject,
      })
        .from(sessions)
        .leftJoin(cases, eq(sessions.caseId, cases.id))
        .where(and(
          sql`${sessions.sessionDate} >= ${startSeconds}`,
          sql`${sessions.sessionDate} <= ${endSeconds}`
        ));

      // دمج الجلسات مع الأحداث
      const sessionEvents = sessionsInPeriod.map(s => ({
        id: `session-${s.id}`,
        title: `جلسة: ${s.caseNumber || 'قضية ' + s.id}`,
        type: 'session' as const,
        eventDate: s.sessionDate,
        caseId: s.caseId,
        sessionId: s.id,
      }));

      // جلب القضايا في النطاق (تاريخ التسجيل)
      const casesByRegistration = await db.select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        subject: cases.subject,
        registrationDate: cases.registrationDate,
        status: cases.status,
      })
        .from(cases)
        .where(and(
          sql`${cases.registrationDate} >= ${startSeconds}`,
          sql`${cases.registrationDate} <= ${endSeconds}`
        ));

      // تحويل القضايا إلى أحداث (تاريخ التسجيل)
      const caseRegistrationEvents = casesByRegistration.map(c => ({
        id: `case-reg-${c.id}`,
        title: `تسجيل قضية: ${c.caseNumber || c.id}`,
        type: 'case' as const,
        eventDate: c.registrationDate,
        caseId: c.id,
        caseStatus: c.status,
      }));

      // جلب القضايا في النطاق (تاريخ أول جلسة)
      const casesByFirstSession = await db.select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        subject: cases.subject,
        firstSessionDate: cases.firstSessionDate,
        status: cases.status,
      })
        .from(cases)
        .where(and(
          sql`${cases.firstSessionDate} >= ${startSeconds}`,
          sql`${cases.firstSessionDate} <= ${endSeconds}`,
          isNotNull(cases.firstSessionDate)
        ));

      // تحويل القضايا إلى أحداث (أول جلسة)
      const caseFirstSessionEvents = casesByFirstSession.map(c => ({
        id: `case-first-${c.id}`,
        title: `أول جلسة: ${c.caseNumber || c.id}`,
        type: 'case' as const,
        eventDate: c.firstSessionDate,
        caseId: c.id,
        caseStatus: c.status,
      }));

      return NextResponse.json([...events, ...sessionEvents, ...caseRegistrationEvents, ...caseFirstSessionEvents]);
    }

    // جلب كل الأحداث
    const events = await db.select().from(calendarEvents);
    return NextResponse.json(events);
  } catch (error) {
    console.error('خطأ في جلب أحداث التقويم:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const {
      title,
      type,
      eventDate,
      endDate,
      caseId,
      description,
    } = body;

    if (!title || !type || !eventDate) {
      return NextResponse.json({ error: 'العنوان والنوع والتاريخ مطلوبون' }, { status: 400 });
    }

    const [newEvent] = await db.insert(calendarEvents)
      .values({
        title,
        type: type as 'session' | 'appointment' | 'meeting' | 'task',
        eventDate: new Date(eventDate),
        endDate: endDate ? new Date(endDate) : null,
        caseId: caseId || null,
        description,
      })
      .returning();

    return NextResponse.json(newEvent);
  } catch (error) {
    console.error('خطأ في إنشاء حدث:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const parsedId = safeParseInt(id);
    if (!parsedId) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    await db.delete(calendarEvents).where(eq(calendarEvents.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف حدث:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
