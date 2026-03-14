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

    // آخر الجلسات القادمة
    const upcomingSessions = await db.select()
      .from(sessions)
      .where(sql`session_date >= ${now.getTime()}`)
      .orderBy(sessions.sessionDate)
      .limit(5);

    // جلب معلومات القضايا للجلسات
    const sessionsWithCases = await Promise.all(
      upcomingSessions.map(async (session) => {
        if (session.caseId) {
          const caseData = await db.select().from(cases).where(eq(cases.id, session.caseId));
          return {
            id: session.id,
            session_date: session.sessionDate,
            case_number: caseData[0]?.caseNumber || null,
            subject: caseData[0]?.subject || null,
          };
        }
        return {
          id: session.id,
          session_date: session.sessionDate,
          case_number: null,
          subject: null,
        };
      })
    );

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

    // بيانات الجلسات الشهرية
    const monthlySessions = [
      { month: 'جانفي', count: 0 },
      { month: 'فيفري', count: 0 },
      { month: 'مارس', count: 0 },
      { month: 'أفريل', count: 0 },
      { month: 'ماي', count: 0 },
      { month: 'جوان', count: totalSessions },
    ];

    return NextResponse.json({
      activeCases,
      todaySessions: todaySessionsCount,
      tomorrowSessions: tomorrowSessionsCount,
      weekSessions: totalSessions,
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
