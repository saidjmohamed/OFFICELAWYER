import { NextResponse } from 'next/server';
import { db } from '@/db';
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

export async function POST() {
  try {
    console.log('بدء حذف البيانات الاختبارية...');

    // حذف البيانات بالترتيب الصحيح (الجداول التابعة أولاً)
    
    // 1. حذف أحداث التقويم
    await db.delete(calendarEvents);
    console.log('تم حذف أحداث التقويم');

    // 2. حذف مصاريف القضايا
    await db.delete(caseExpenses);
    console.log('تم حذف مصاريف القضايا');

    // 3. حذف ملفات القضايا
    await db.delete(caseFiles);
    console.log('تم حذف ملفات القضايا');

    // 4. حذف الجلسات
    await db.delete(sessions);
    console.log('تم حذف الجلسات');

    // 5. حذف أطراف القضايا
    await db.delete(caseClients);
    console.log('تم حذف أطراف القضايا');

    // 6. حذف القضايا
    await db.delete(cases);
    console.log('تم حذف القضايا');

    // 7. حذف الموكلين
    await db.delete(clients);
    console.log('تم حذف الموكلين');

    // 8. حذف المحامين
    await db.delete(lawyers);
    console.log('تم حذف المحامين');

    // 9. حذف المنظمات
    await db.delete(organizations);
    console.log('تم حذف المنظمات');

    // 10. حذف سجل النشاطات
    await db.delete(activities);
    console.log('تم حذف سجل النشاطات');

    console.log('تم حذف جميع البيانات الاختبارية بنجاح');

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف جميع البيانات الاختبارية بنجاح',
      deleted: [
        'أحداث التقويم',
        'مصاريف القضايا',
        'ملفات القضايا',
        'الجلسات',
        'أطراف القضايا',
        'القضايا',
        'الموكلين',
        'المحامين',
        'المنظمات',
        'سجل النشاطات'
      ]
    });
  } catch (error) {
    console.error('خطأ في حذف البيانات:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف البيانات' },
      { status: 500 }
    );
  }
}
