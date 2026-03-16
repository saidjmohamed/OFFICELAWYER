import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, cases, judicialBodies } from '@/db/schema';
import { eq, gte, lte, asc, and } from 'drizzle-orm';
import { safeParseInt } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = safeParseInt(searchParams.get('days')) || 7;
    
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const upcomingSessions = await db
      .select({
        id: sessions.id,
        sessionDate: sessions.sessionDate,
        caseNumber: cases.caseNumber,
        subject: cases.subject,
        judicialBody: judicialBodies.name,
      })
      .from(sessions)
      .innerJoin(cases, eq(sessions.caseId, cases.id))
      .leftJoin(judicialBodies, eq(cases.judicialBodyId, judicialBodies.id))
      .where(
        and(
          gte(sessions.sessionDate, now),
          lte(sessions.sessionDate, endDate)
        )
      )
      .orderBy(asc(sessions.sessionDate))
      .limit(20);

    return NextResponse.json({ sessions: upcomingSessions });
  } catch (error) {
    console.error('خطأ في جلب الجلسات القادمة:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الجلسات القادمة' },
      { status: 500 }
    );
  }
}
