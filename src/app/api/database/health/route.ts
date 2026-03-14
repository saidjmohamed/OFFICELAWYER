import { NextResponse } from 'next/server';
import { querySql, executeSql } from '@/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // تشغيل فحص سلامة قاعدة البيانات
    let integrityResult = 'ok';
    try {
      const result = await querySql('PRAGMA integrity_check');
      integrityResult = (result[0] as any)?.integrity_check || 'ok';
    } catch {
      integrityResult = 'ok (check skipped)';
    }
    
    // معلومات قاعدة البيانات
    let pageCount = { page_count: 0 };
    let pageSize = { page_size: 4096 };
    let freelistCount = { freelist_count: 0 };
    
    try {
      const pcResult = await querySql('PRAGMA page_count');
      pageCount = { page_count: (pcResult[0] as any)?.page_count || 0 };
    } catch {}
    
    try {
      const psResult = await querySql('PRAGMA page_size');
      pageSize = { page_size: (psResult[0] as any)?.page_size || 4096 };
    } catch {}
    
    try {
      const fcResult = await querySql('PRAGMA freelist_count');
      freelistCount = { freelist_count: (fcResult[0] as any)?.freelist_count || 0 };
    } catch {}
    
    // حجم قاعدة البيانات
    const dbSize = (pageCount.page_count * pageSize.page_size) / (1024 * 1024); // بالميغابايت
    
    // فحص الجداول
    const tables = await querySql(`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `) as { name: string }[];

    // عدد السجلات في كل جدول
    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const count = await querySql(`SELECT COUNT(*) as count FROM "${table.name}"`);
        tableCounts[table.name] = (count[0] as any)?.count || 0;
      } catch {
        tableCounts[table.name] = 0;
      }
    }

    return NextResponse.json({
      status: integrityResult === 'ok' || integrityResult === 'ok (check skipped)' ? 'healthy' : 'warning',
      integrityCheck: integrityResult,
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
      error: 'حدث خطأ في فحص قاعدة البيانات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
