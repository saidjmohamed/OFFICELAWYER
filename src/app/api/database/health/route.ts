import { NextResponse } from 'next/server';
import { sqlite } from '@/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // تشغيل فحص سلامة قاعدة البيانات
    const integrityResult = sqlite.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    
    // معلومات قاعدة البيانات
    const pageCount = sqlite.prepare('PRAGMA page_count').get() as { page_count: number };
    const pageSize = sqlite.prepare('PRAGMA page_size').get() as { page_size: number };
    const freelistCount = sqlite.prepare('PRAGMA freelist_count').get() as { freelist_count: number };
    
    // حجم قاعدة البيانات
    const dbSize = (pageCount.page_count * pageSize.page_size) / (1024 * 1024); // بالميغابايت
    
    // فحص الجداول
    const tables = sqlite.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `).all() as { name: string }[];

    // عدد السجلات في كل جدول
    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const count = sqlite.prepare(`SELECT COUNT(*) as count FROM "${table.name}"`).get() as { count: number };
        tableCounts[table.name] = count.count;
      } catch {
        tableCounts[table.name] = 0;
      }
    }

    return NextResponse.json({
      status: integrityResult.integrity_check === 'ok' ? 'healthy' : 'warning',
      integrityCheck: integrityResult.integrity_check,
      database: {
        sizeMB: dbSize.toFixed(2),
        pageCount: pageCount.page_count,
        pageSize: pageSize.page_size,
        freePages: freelistCount.freelist_count,
      },
      tables: tableCounts,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('خطأ في فحص قاعدة البيانات:', error);
    return NextResponse.json({ 
      status: 'error',
      error: 'حدث خطأ في فحص قاعدة البيانات' 
    }, { status: 500 });
  }
}
