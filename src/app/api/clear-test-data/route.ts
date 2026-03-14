import { NextResponse } from 'next/server';
import { db, executeSql } from '@/db';
import { 
  cases, 
  caseClients, 
  sessions, 
  calendarEvents, 
  caseFiles, 
  caseExpenses, 
  clients, 
  lawyers, 
  organizations, 
  activities 
} from '@/db/schema';

// هذا API لحذف البيانات الاختبارية مباشرة بدون مصادقة
// يجب استخدامه فقط في وضع التطوير أو عن طريق المالك

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const confirm = searchParams.get('confirm');
    
    // يتطلب تأكيد صريح
    if (confirm !== 'yes-delete-all') {
      return NextResponse.json({ 
        error: 'يتطلب تأكيد',
        message: 'أضف ?confirm=yes-delete-all للتأكيد',
        warning: 'هذا سيحذف جميع البيانات!'
      }, { status: 400 });
    }

    console.log('🗑️ بدء حذف البيانات الاختبارية...');

    let deletedCounts = {
      calendarEvents: 0,
      caseExpenses: 0,
      caseFiles: 0,
      sessions: 0,
      caseClients: 0,
      cases: 0,
      clients: 0,
      lawyers: 0,
      organizations: 0,
      activities: 0,
    };

    try {
      // 1. حذف أحداث التقويم
      const ceResult = await db.delete(calendarEvents);
      deletedCounts.calendarEvents = 1;
      console.log('✓ تم حذف أحداث التقويم');
    } catch (e) { console.log('⚠️ تعذر حذف أحداث التقويم:', e); }

    try {
      // 2. حذف مصاريف القضايا
      await db.delete(caseExpenses);
      deletedCounts.caseExpenses = 1;
      console.log('✓ تم حذف مصاريف القضايا');
    } catch (e) { console.log('⚠️ تعذر حذف مصاريف القضايا:', e); }

    try {
      // 3. حذف ملفات القضايا
      await db.delete(caseFiles);
      deletedCounts.caseFiles = 1;
      console.log('✓ تم حذف ملفات القضايا');
    } catch (e) { console.log('⚠️ تعذر حذف ملفات القضايا:', e); }

    try {
      // 4. حذف الجلسات
      await db.delete(sessions);
      deletedCounts.sessions = 1;
      console.log('✓ تم حذف الجلسات');
    } catch (e) { console.log('⚠️ تعذر حذف الجلسات:', e); }

    try {
      // 5. حذف أطراف القضايا
      await db.delete(caseClients);
      deletedCounts.caseClients = 1;
      console.log('✓ تم حذف أطراف القضايا');
    } catch (e) { console.log('⚠️ تعذر حذف أطراف القضايا:', e); }

    try {
      // 6. حذف القضايا
      await db.delete(cases);
      deletedCounts.cases = 1;
      console.log('✓ تم حذف القضايا');
    } catch (e) { console.log('⚠️ تعذر حذف القضايا:', e); }

    try {
      // 7. حذف الموكلين
      await db.delete(clients);
      deletedCounts.clients = 1;
      console.log('✓ تم حذف الموكلين');
    } catch (e) { console.log('⚠️ تعذر حذف الموكلين:', e); }

    try {
      // 8. حذف المحامين
      await db.delete(lawyers);
      deletedCounts.lawyers = 1;
      console.log('✓ تم حذف المحامين');
    } catch (e) { console.log('⚠️ تعذر حذف المحامين:', e); }

    try {
      // 9. حذف المنظمات
      await db.delete(organizations);
      deletedCounts.organizations = 1;
      console.log('✓ تم حذف المنظمات');
    } catch (e) { console.log('⚠️ تعذر حذف المنظمات:', e); }

    try {
      // 10. حذف سجل النشاطات
      await db.delete(activities);
      deletedCounts.activities = 1;
      console.log('✓ تم حذف سجل النشاطات');
    } catch (e) { console.log('⚠️ تعذر حذف سجل النشاطات:', e); }

    console.log('✅ تم حذف جميع البيانات الاختبارية بنجاح');

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف جميع البيانات الاختبارية بنجاح',
      deleted: deletedCounts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ خطأ في حذف البيانات:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ أثناء حذف البيانات', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
