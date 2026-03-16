import { NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions, judicialBodies, wilayas, settings } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

// FIX 6: Secured debug endpoint — requires auth, removed stack traces
export async function GET() {
  // Require authentication
  const cookieStore = await cookies();
  if (cookieStore.get('authenticated')?.value !== 'true') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // Only allow in development/preview
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
    console.error('Debug endpoint error:', error);
    // FIX 6: No stack trace in response
    return NextResponse.json({
      enabled: true,
      error: 'Internal error occurred',
    }, { status: 500 });
  }
}
