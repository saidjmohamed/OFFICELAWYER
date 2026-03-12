import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, sessions, clients, judicialBodies, caseExpenses, activityLogs } from '@/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { cookies } from 'next/headers';

// الأشهر بالعربية
const arabicMonths = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// ترجمة أنواع القضايا
const caseTypeLabels: Record<string, string> = {
  'civil': 'مدني',
  'commercial': 'تجاري',
  'family': 'أسرة',
  'criminal': 'جنائي',
  'administrative': 'إداري',
  'labor': 'عمالي',
  'real_estate': 'عقاري',
  'inheritance': 'مواريث',
  'other': 'أخرى',
};

// ترجمة حالات القضايا
const statusLabels: Record<string, string> = {
  'active': 'نشطة',
  'adjourned': 'مؤجلة',
  'judged': 'محكوم',
  'closed': 'مغلقة',
  'archived': 'مؤرشفة',
};

// ألوان حالات القضايا
const statusColors: Record<string, string> = {
  'active': '#3b82f6',
  'adjourned': '#f59e0b',
  'judged': '#22c55e',
  'closed': '#6b7280',
  'archived': '#8b5cf6',
};

// ألوان أنواع القضايا
const caseTypeColors: Record<string, string> = {
  'civil': '#3b82f6',
  'commercial': '#22c55e',
  'family': '#f59e0b',
  'criminal': '#ef4444',
  'administrative': '#8b5cf6',
  'labor': '#06b6d4',
  'real_estate': '#ec4899',
  'inheritance': '#14b8a6',
  'other': '#6b7280',
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const now = new Date();

    // ==================== الإحصائيات الأساسية ====================
    
    // عدد القضايا النشطة
    const activeCasesResult = await db.select({ count: sql<number>`count(*)` })
      .from(cases)
      .where(eq(cases.status, 'active'));
    const activeCases = activeCasesResult[0]?.count || 0;

    // إجمالي القضايا
    const totalCasesResult = await db.select({ count: sql<number>`count(*)` }).from(cases);
    const totalCases = totalCasesResult[0]?.count || 0;

    // إجمالي الأتعاب
    const totalFeesResult = await db.select({ total: sql<number>`COALESCE(SUM(fees), 0)` })
      .from(cases);
    const totalFees = totalFeesResult[0]?.total || 0;

    // إجمالي المصروفات
    const totalExpensesResult = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(caseExpenses);
    const totalExpenses = totalExpensesResult[0]?.total || 0;

    // عدد الموكلين
    const totalClientsResult = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const totalClients = totalClientsResult[0]?.count || 0;

    // عدد الهيئات القضائية
    const totalJudicialBodiesResult = await db.select({ count: sql<number>`count(*)` }).from(judicialBodies);
    const totalJudicialBodies = totalJudicialBodiesResult[0]?.count || 0;

    // ==================== القضايا حسب الحالة ====================
    const casesByStatusRaw = await db.select({
      status: cases.status,
      count: sql<number>`count(*)`,
    }).from(cases).groupBy(cases.status);

    const casesByStatus = casesByStatusRaw.map((c) => ({
      status: c.status || 'active',
      label: statusLabels[c.status || 'active'] || c.status,
      count: c.count,
      color: statusColors[c.status || 'active'] || '#6b7280',
    }));

    // ==================== القضايا حسب النوع ====================
    const casesByTypeRaw = await db.select({
      caseType: cases.caseType,
      count: sql<number>`count(*)`,
    }).from(cases).groupBy(cases.caseType);

    const casesByType = casesByTypeRaw.map((c) => ({
      type: c.caseType || 'other',
      label: caseTypeLabels[c.caseType || 'other'] || c.caseType || 'غير محدد',
      count: c.count,
      color: caseTypeColors[c.caseType || 'other'] || '#6b7280',
    }));

    // ==================== جلسات اليوم ====================
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    
    const todaySessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(and(
        gte(sessions.sessionDate, todayStart),
        lte(sessions.sessionDate, todayEnd)
      ));
    const todaySessions = todaySessionsResult[0]?.count || 0;

    // ==================== الجلسات القادمة (خلال 7 أيام) ====================
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).getTime();
    
    const upcomingSessionsRaw = await db.select()
      .from(sessions)
      .where(and(
        gte(sessions.sessionDate, now.getTime()),
        lte(sessions.sessionDate, sevenDaysLater)
      ))
      .orderBy(sessions.sessionDate)
      .limit(10);

    // جلب معلومات القضايا للجلسات
    const upcomingSessions = await Promise.all(
      upcomingSessionsRaw.map(async (session) => {
        if (session.caseId) {
          const caseData = await db.select().from(cases).where(eq(cases.id, session.caseId));
          return {
            id: session.id,
            sessionDate: session.sessionDate,
            caseNumber: caseData[0]?.caseNumber || null,
            subject: caseData[0]?.subject || null,
            caseType: caseData[0]?.caseType || null,
          };
        }
        return {
          id: session.id,
          sessionDate: session.sessionDate,
          caseNumber: null,
          subject: null,
          caseType: null,
        };
      })
    );

    // ==================== الإحصائيات الشهرية (آخر 6 أشهر) ====================
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = monthDate.getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).getTime();
      
      // عدد القضايا الجديدة في الشهر
      const monthCasesResult = await db.select({ count: sql<number>`count(*)` })
        .from(cases)
        .where(and(
          gte(cases.createdAt, monthStart),
          lte(cases.createdAt, monthEnd)
        ));
      
      // عدد الجلسات في الشهر
      const monthSessionsResult = await db.select({ count: sql<number>`count(*)` })
        .from(sessions)
        .where(and(
          gte(sessions.sessionDate, monthStart),
          lte(sessions.sessionDate, monthEnd)
        ));

      monthlyStats.push({
        month: arabicMonths[monthDate.getMonth()],
        monthIndex: monthDate.getMonth(),
        year: monthDate.getFullYear(),
        cases: monthCasesResult[0]?.count || 0,
        sessions: monthSessionsResult[0]?.count || 0,
      });
    }

    // ==================== آخر القضايا المضافة ====================
    const recentCases = await db.select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      subject: cases.subject,
      caseType: cases.caseType,
      status: cases.status,
      createdAt: cases.createdAt,
    })
      .from(cases)
      .orderBy(desc(cases.createdAt))
      .limit(5);

    // ==================== آخر النشاطات ====================
    const recentActivitiesRaw = await db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(5);

    const recentActivities = recentActivitiesRaw.map((activity) => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entityType,
      description: activity.description,
      createdAt: activity.createdAt,
    }));

    // ==================== إحصائيات إضافية ====================
    
    // الجلسات هذا الأسبوع
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    
    const weekSessionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(and(
        gte(sessions.sessionDate, weekStart),
        lte(sessions.sessionDate, weekEnd)
      ));
    const weekSessions = weekSessionsResult[0]?.count || 0;

    return NextResponse.json({
      // الإحصائيات الأساسية
      activeCases,
      totalCases,
      todaySessions,
      weekSessions,
      totalFees,
      totalExpenses,
      totalClients,
      totalJudicialBodies,
      
      // الرسوم البيانية
      casesByStatus,
      casesByType,
      monthlyStats,
      
      // القوائم
      upcomingSessions,
      recentCases,
      recentActivities,
      
      // الألوان والتسميات
      statusLabels,
      caseTypeLabels,
      statusColors,
      caseTypeColors,
    });
  } catch (error) {
    console.error('خطأ في جلب الإحصائيات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
