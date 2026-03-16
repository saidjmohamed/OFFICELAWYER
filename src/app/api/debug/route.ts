import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions, judicialBodies } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';

// هذه الصفحة تعمل في وضع التطوير والمعاينة فقط
export async function GET() {
  // التحقق من المصادقة
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

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

    return NextResponse.json({
      enabled: true,
      timestamp: new Date().toISOString(),
      connection: {
        status: connectionTest ? 'connected' : 'failed',
      },
      tables: tableCounts,
    });
  } catch (error) {
    console.error('خطأ في صفحة التصحيح:', error);
    return NextResponse.json({
      enabled: true,
      error: 'حدث خطأ في التصحيح',
    }, { status: 500 });
  }
}
