import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, sessions, clients, judicialBodies, activities } from '@/db/schema';
import { eq, sql, desc, gte } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    const tomorrowEnd = todayEnd + 24 * 60 * 60 * 1000;

    // عدد القضايا حسب الحالة
    const casesByStatus = await db.select({
      status: cases.status,
      count: sql<number>`count(*)`,
    }).from(cases).groupBy(cases.status);

    // عدد القضايا النشطة (غير المؤرشفة)
    const activeCasesResult = await db.select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(sql`status != 'archived'`);
    const activeCases = activeCasesResult[0]?.count || 0;

    // إجمالي الأتعاب
    const totalFeesResult = await db.select({ total: sql<number>`COALESCE(SUM(fees), 0)` })
      .from(cases);
    const totalFees = totalFeesResult[0]?.total || 0;

    // عدد الموكلين
    const totalClientsResult = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const totalClients = totalClientsResult[0]?.count || 0;

    // عدد الهيئات القضائية
    const totalJudicialBodiesResult = await db.select({ count: sql<number>`count(*)` }).from(judicialBodies);
    const totalJudicialBodies = totalJudicialBodiesResult[0]?.count || 0;

    // إجمالي الجلسات
    const totalSessionsResult = await db.select({ count: sql<number>`count(*)` }).from(sessions);
    const totalSessions = totalSessionsResult[0]?.count || 0;

    // جلسات اليوم
    const todaySessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(sql`session_date >= ${todayStart} AND session_date < ${todayEnd}`);
    const todaySessionsCount = todaySessionsResult[0]?.count || 0;

    // جلسات غداً
    const tomorrowSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(sql`session_date >= ${todayEnd} AND session_date < ${tomorrowEnd}`);
    const tomorrowSessionsCount = tomorrowSessionsResult[0]?.count || 0;

    // FIX 15: Replace N+1 with a single JOIN query
    const upcomingSessionsWithCases = await db.select({
      id: sessions.id,
      session_date: sessions.sessionDate,
      case_number: cases.caseNumber,
      subject: cases.subject,
    })
      .from(sessions)
      .leftJoin(cases, eq(sessions.caseId, cases.id))
      .where(sql`${sessions.sessionDate} >= ${now.getTime()}`)
      .orderBy(sessions.sessionDate)
      .limit(5);

    const sessionsWithCases = upcomingSessionsWithCases;

    // آخر القضايا (غير المؤرشفة)
    const recentCases = await db.select()
      .from(cases)
      .where(sql`status != 'archived'`)
      .orderBy(desc(cases.createdAt))
      .limit(5);

    // آخر النشاطات
    let recentActivities: any[] = [];
    try {
      recentActivities = await db.select()
        .from(activities)
        .orderBy(desc(activities.createdAt))
        .limit(10);
    } catch (e) {
      // الجدول قد لا يكون موجوداً بعد
    }

    // FIX 16: Dynamic monthly sessions from DB for current year
    const monthNames = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1).getTime();
    const yearEnd = new Date(currentYear + 1, 0, 1).getTime();

    const monthlySessionsRaw = await db.select({
      month: sql<number>`CAST(strftime('%m', datetime(${sessions.sessionDate} / 1000, 'unixepoch')) AS INTEGER)`,
      count: sql<number>`count(*)`,
    })
      .from(sessions)
      .where(sql`${sessions.sessionDate} >= ${yearStart} AND ${sessions.sessionDate} < ${yearEnd}`)
      .groupBy(sql`strftime('%m', datetime(${sessions.sessionDate} / 1000, 'unixepoch'))`);

    const monthlyCountMap: Record<number, number> = {};
    for (const row of monthlySessionsRaw) {
      monthlyCountMap[row.month] = row.count;
    }

    const monthlySessions = monthNames.map((name, i) => ({
      month: name,
      count: monthlyCountMap[i + 1] || 0,
    }));

    // FIX 17: Calculate actual weekly sessions count
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday start
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(sql`${sessions.sessionDate} >= ${weekStart.getTime()} AND ${sessions.sessionDate} < ${weekEnd.getTime()}`);
    const weekSessionsCount = weekSessionsResult[0]?.count || 0;

    return NextResponse.json({
      activeCases,
      todaySessions: todaySessionsCount,
      tomorrowSessions: tomorrowSessionsCount,
      weekSessions: weekSessionsCount,
      totalFees,
      totalClients,
      totalJudicialBodies,
      casesByStatus: casesByStatus.map((c) => ({
        status: c.status || 'active',
        count: c.count,
      })),
      monthlySessions,
      upcomingSessions: sessionsWithCases,
      recentCases: recentCases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        subject: c.subject,
        status: c.status,
        createdAt: c.createdAt,
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        description: a.description,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
