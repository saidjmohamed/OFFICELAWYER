/**
 * API لحذف جميع البيانات (للتطوير والاختبار)
 * Clears all data from the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, sqlite } from '@/db';
import { cookies } from 'next/headers';
import {
  judicialBodies,
  chambers,
  cases,
  sessions,
  caseClients,
  caseFiles,
  caseExpenses,
  calendarEvents,
  clients,
  lawyers,
  organizations,
  activityLogs,
} from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    console.log('🗑️ بدء حذف جميع البيانات...');

    // ترتيب الحذف حسب العلاقات (من الأبناء إلى الآباء)
    const deleteOperations = [
      // حذف الجداول التابعة أولاً
      { name: 'أحداث التقويم', table: calendarEvents },
      { name: 'مصاريف القضايا', table: caseExpenses },
      { name: 'ملفات القضايا', table: caseFiles },
      { name: 'الجلسات', table: sessions },
      { name: 'روابط القضايا والموكلين', table: caseClients },
      { name: 'القضايا', table: cases },
      { name: 'الغرف والأقسام', table: chambers },
      { name: 'الهيئات القضائية', table: judicialBodies },
      { name: 'الموكلين', table: clients },
      { name: 'المحامين', table: lawyers },
      { name: 'المنظمات', table: organizations },
      { name: 'سجل النشاطات', table: activityLogs },
    ];

    const results: { name: string; deleted: number }[] = [];

    for (const op of deleteOperations) {
      try {
        const result = await db.delete(op.table);
        const count = result.changes || 0;
        results.push({ name: op.name, deleted: count });
        console.log(`✅ تم حذف ${count} سجل من ${op.name}`);
      } catch (error) {
        console.error(`❌ خطأ في حذف ${op.name}:`, error);
        results.push({ name: op.name, deleted: 0 });
      }
    }

    // إعادة تعيين التسلسل (SQLite)
    try {
      sqlite.exec(`DELETE FROM sqlite_sequence WHERE name IN (
        'judicial_bodies', 'chambers', 'cases', 'sessions', 
        'case_clients', 'case_files', 'case_expenses', 'calendar_events',
        'clients', 'lawyers', 'organizations', 'activity_logs'
      )`);
      console.log('✅ تم إعادة تعيين التسلسل');
    } catch {
      // تجاهل الأخطاء
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف جميع البيانات بنجاح',
      details: results,
    });
  } catch (error) {
    console.error('خطأ في حذف البيانات:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء الحذف', details: error instanceof Error ? error.message : 'خطأ غير معروف' },
      { status: 500 }
    );
  }
}

// GET لعرض عدد السجلات قبل الحذف
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const counts = {
      judicialBodies: (await db.select({ count: sql<number>`count(*)` }).from(judicialBodies))[0]?.count || 0,
      chambers: (await db.select({ count: sql<number>`count(*)` }).from(chambers))[0]?.count || 0,
      cases: (await db.select({ count: sql<number>`count(*)` }).from(cases))[0]?.count || 0,
      sessions: (await db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0,
      clients: (await db.select({ count: sql<number>`count(*)` }).from(clients))[0]?.count || 0,
      lawyers: (await db.select({ count: sql<number>`count(*)` }).from(lawyers))[0]?.count || 0,
      organizations: (await db.select({ count: sql<number>`count(*)` }).from(organizations))[0]?.count || 0,
      caseFiles: (await db.select({ count: sql<number>`count(*)` }).from(caseFiles))[0]?.count || 0,
      caseExpenses: (await db.select({ count: sql<number>`count(*)` }).from(caseExpenses))[0]?.count || 0,
      calendarEvents: (await db.select({ count: sql<number>`count(*)` }).from(calendarEvents))[0]?.count || 0,
    };

    return NextResponse.json({ counts });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ', details: error instanceof Error ? error.message : 'خطأ غير معروف' },
      { status: 500 }
    );
  }
}
