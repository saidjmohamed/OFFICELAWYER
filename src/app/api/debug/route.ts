import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions, judicialBodies, wilayas, settings } from '@/db/schema';
import { sql } from 'drizzle-orm';

// هذه الصفحة تعمل في وضع التطوير والمعاينة فقط
export async function GET() {
  // التحقق من البيئة - السماح في development و preview
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      error: 'Debug page disabled in production.',
      enabled: false 
    }, { status: 403 });
  }

  try {
    // اختبار الاتصال بقاعدة البيانات
    const connectionTest = await db.execute(sql`SELECT 1 as test`);

    // جلب عدد السجلات في كل جدول
    const tables = [
      { name: 'clients', query: sql<number>`SELECT COUNT(*) as count FROM clients` },
      { name: 'cases', query: sql<number>`SELECT COUNT(*) as count FROM cases` },
      { name: 'sessions', query: sql<number>`SELECT COUNT(*) as count FROM sessions` },
      { name: 'judicial_bodies', query: sql<number>`SELECT COUNT(*) as count FROM judicial_bodies` },
      { name: 'wilayas', query: sql<number>`SELECT COUNT(*) as count FROM wilayas` },
      { name: 'settings', query: sql<number>`SELECT COUNT(*) as count FROM settings` },
      { name: 'chambers', query: sql<number>`SELECT COUNT(*) as count FROM chambers` },
      { name: 'calendar_events', query: sql<number>`SELECT COUNT(*) as count FROM calendar_events` },
    ];

    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      const result = await db.execute(table.query);
      tableCounts[table.name] = result[0]?.count || 0;
    }

    // جلب آخر 10 سجلات من الجداول الرئيسية
    const recentClients = await db.select().from(clients).limit(10);
    const recentCases = await db.select().from(cases).limit(10);
    const recentSessions = await db.select().from(sessions).limit(10);
    const recentBodies = await db.select().from(judicialBodies).limit(10);

    // إخفاء المتغيرات الحساسة
    const envStatus = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_PATH: process.env.DATABASE_PATH || 'default',
      // إخفاء القيم الحساسة
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? '********' : 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? '********' : 'not set',
    };

    return NextResponse.json({
      enabled: true,
      timestamp: new Date().toISOString(),
      connection: {
        status: connectionTest ? 'connected' : 'failed',
        testQuery: 'SELECT 1',
      },
      tables: tableCounts,
      data: {
        clients: recentClients,
        cases: recentCases,
        sessions: recentSessions,
        judicialBodies: recentBodies,
      },
      environment: envStatus,
    });
  } catch (error) {
    return NextResponse.json({
      enabled: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
