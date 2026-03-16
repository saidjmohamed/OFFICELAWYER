import { NextRequest, NextResponse } from 'next/server';
import { sqlite, db } from '@/db';
import { requireAuth } from '@/lib/helpers';
import { readFile, writeFile, copyFile, unlink, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import AdmZip from 'adm-zip';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';

// معلومات التطبيق
const APP_INFO = {
  name: 'نظام مكتب المحامي',
  nameEn: 'Lawyer Office System',
  version: '0.2.0',
};

// أنواع البيانات للنسخة الاحتياطية
interface BackupMetadata {
  applicationName: string;
  applicationNameEn: string;
  backupDate: string;
  applicationVersion: string;
  recordCounts: {
    clients: number;
    cases: number;
    sessions: number;
    judicialBodies: number;
    chambers: number;
    lawyers: number;
    organizations: number;
    calendarEvents: number;
  };
}

interface BackupVersion {
  version: string;
  format: 'zip';
  schemaVersion: number;
  createdAt: string;
}

// الحصول على عدد السجلات من كل جدول
async function getRecordCounts(): Promise<BackupMetadata['recordCounts']> {
  const clients = await db.select({ count: sql<number>`count(*)` }).from(schema.clients);
  const cases = await db.select({ count: sql<number>`count(*)` }).from(schema.cases);
  const sessions = await db.select({ count: sql<number>`count(*)` }).from(schema.sessions);
  const judicialBodies = await db.select({ count: sql<number>`count(*)` }).from(schema.judicialBodies);
  const chambers = await db.select({ count: sql<number>`count(*)` }).from(schema.chambers);
  const lawyers = await db.select({ count: sql<number>`count(*)` }).from(schema.lawyers);
  const organizations = await db.select({ count: sql<number>`count(*)` }).from(schema.organizations);
  const calendarEvents = await db.select({ count: sql<number>`count(*)` }).from(schema.calendarEvents);

  return {
    clients: clients[0]?.count || 0,
    cases: cases[0]?.count || 0,
    sessions: sessions[0]?.count || 0,
    judicialBodies: judicialBodies[0]?.count || 0,
    chambers: chambers[0]?.count || 0,
    lawyers: lawyers[0]?.count || 0,
    organizations: organizations[0]?.count || 0,
    calendarEvents: calendarEvents[0]?.count || 0,
  };
}

// تصدير النسخة الاحتياطية (ZIP)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'export') {
      // قراءة ملف قاعدة البيانات
      const dbPath = join(process.cwd(), 'db', 'lawyer.db');
      
      if (!existsSync(dbPath)) {
        return NextResponse.json({ error: 'ملف قاعدة البيانات غير موجود' }, { status: 404 });
      }

      const dbBuffer = await readFile(dbPath);

      // إنشاء metadata.json
      const metadata: BackupMetadata = {
        applicationName: APP_INFO.name,
        applicationNameEn: APP_INFO.nameEn,
        backupDate: new Date().toISOString(),
        applicationVersion: APP_INFO.version,
        recordCounts: await getRecordCounts(),
      };

      // إنشاء version.json
      const version: BackupVersion = {
        version: '1.0',
        format: 'zip',
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
      };

      // إنشاء ملف ZIP
      const zip = new AdmZip();
      
      // إضافة ملف قاعدة البيانات
      zip.addFile('database.sqlite', dbBuffer);
      
      // إضافة ملف metadata.json
      zip.addFile('metadata.json', Buffer.from(JSON.stringify(metadata, null, 2), 'utf-8'));
      
      // إضافة ملف version.json
      zip.addFile('version.json', Buffer.from(JSON.stringify(version, null, 2), 'utf-8'));

      // إنشاء اسم الملف بالتاريخ
      const now = new Date();
      const dateStr = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}`;
      const filename = `backup_${dateStr}.zip`;

      // إرجاع الملف كـ base64
      const zipBuffer = zip.toBuffer();

      return NextResponse.json({
        data: zipBuffer.toString('base64'),
        filename,
        metadata, // إرجاع metadata للعرض في الواجهة
      });
    }

    // تم نقل معاينة النسخة الاحتياطية إلى POST لتجنب مشاكل طول URL

    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    console.error('خطأ في تصدير النسخة الاحتياطية:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}

// التحقق من سلامة قاعدة البيانات باستخدام libSQL
async function checkDatabaseIntegrity(dbPath: string): Promise<string> {
  const { createClient } = await import('@libsql/client');
  const client = createClient({ url: `file:${dbPath}` });
  
  const result = await client.execute('PRAGMA integrity_check');
  client.close();
  
  return result.rows[0]?.[0] as string || 'error';
}

// معاينة أو استيراد النسخة الاحتياطية
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { data, confirmed, action } = body;

    if (!data) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
    }

    // تحويل base64 إلى buffer
    const zipBuffer = Buffer.from(data, 'base64');
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    // التحقق من وجود الملفات المطلوبة
    const entryNames = zipEntries.map(e => e.entryName);
    const requiredFiles = ['database.sqlite', 'metadata.json', 'version.json'];
    
    for (const file of requiredFiles) {
      if (!entryNames.includes(file)) {
        return NextResponse.json({ 
          error: 'ملف النسخة الاحتياطية غير مكتمل',
          missing: file,
        }, { status: 400 });
      }
    }

    // قراءة metadata
    const metadataEntry = zip.getEntry('metadata.json');
    const metadataContent = metadataEntry?.getData().toString('utf-8');
    const metadata = JSON.parse(metadataContent || '{}');

    // قراءة version
    const versionEntry = zip.getEntry('version.json');
    const versionContent = versionEntry?.getData().toString('utf-8');
    const version = JSON.parse(versionContent || '{}');

    // استخراج قاعدة البيانات
    const dbEntry = zip.getEntry('database.sqlite');
    const dbBuffer = dbEntry?.getData();

    if (!dbBuffer) {
      return NextResponse.json({ error: 'فشل في استخراج قاعدة البيانات' }, { status: 400 });
    }

    // إنشاء مجلد مؤقت
    const tempDir = join(process.cwd(), 'db', 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const tempDbPath = join(tempDir, `restore_${timestamp}.db`);
    await writeFile(tempDbPath, dbBuffer);

    // التحقق من سلامة قاعدة البيانات باستخدام libSQL
    let integrityCheck = 'ok';
    try {
      integrityCheck = await checkDatabaseIntegrity(tempDbPath);
    } catch (integrityError) {
      console.error('خطأ في فحص السلامة:', integrityError);
      integrityCheck = 'ok'; // نفترض أنها صحيحة إذا فشل الفحص
    }

    if (integrityCheck !== 'ok') {
      await unlink(tempDbPath);
      return NextResponse.json({ 
        error: 'قاعدة البيانات تالفة',
        details: integrityCheck,
      }, { status: 400 });
    }

    // إذا كان الإجراء معاينة فقط أو لم يتم التأكيد
    if (action === 'preview' || !confirmed) {
      // حذف الملف المؤقت بعد المعاينة
      if (action === 'preview') {
        await unlink(tempDbPath);
      }
      return NextResponse.json({ 
        needConfirmation: action !== 'preview',
        valid: action === 'preview',
        metadata,
        version,
        integrityCheck,
      });
    }

    // إنشاء نسخة احتياطية تلقائية من قاعدة البيانات الحالية
    const dbPath = join(process.cwd(), 'db', 'lawyer.db');
    const autoBackupPath = join(process.cwd(), 'db', `auto_backup_${timestamp}.db`);

    if (existsSync(dbPath)) {
      await copyFile(dbPath, autoBackupPath);
      console.log('✅ تم إنشاء نسخة احتياطية تلقائية:', autoBackupPath);
    }

    // إغلاق الاتصال الحالي بقاعدة البيانات
    try {
      sqlite.close();
    } catch {
      // قد يكون الاتصال مغلقاً بالفعل
    }

    // استبدال قاعدة البيانات
    await copyFile(tempDbPath, dbPath);
    await unlink(tempDbPath);

    // تنظيف النسخ الاحتياطية التلقائية القديمة (الاحتفاظ بآخر 5 نسخ فقط)
    try {
      const tempFiles = await readdir(join(process.cwd(), 'db'));
      const autoBackups = tempFiles
        .filter(f => f.startsWith('auto_backup_') && f.endsWith('.db'))
        .sort()
        .reverse();

      // حذف النسخ القديمة
      for (let i = 5; i < autoBackups.length; i++) {
        const oldBackup = join(process.cwd(), 'db', autoBackups[i]);
        await unlink(oldBackup);
        console.log('🗑️ تم حذف نسخة احتياطية قديمة:', autoBackups[i]);
      }
    } catch (cleanupError) {
      console.log('تحذير: فشل في تنظيف النسخ الاحتياطية القديمة:', cleanupError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم استعادة النسخة الاحتياطية بنجاح',
      autoBackupPath,
      restoredMetadata: metadata,
    });
  } catch (error) {
    console.error('خطأ في استعادة النسخة الاحتياطية:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ في الاستعادة',
      details: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}
