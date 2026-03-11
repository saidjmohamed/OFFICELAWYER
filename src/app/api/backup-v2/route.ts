/**
 * API النسخ الاحتياطي والاسترجاع المتقدم
 * Advanced Backup & Restore API
 * 
 * المميزات:
 * - إنشاء نسخ احتياطية
 * - معاينة قبل الاستعادة
 * - استرجاع النسخ
 * - إدارة النسخ المحلية
 * - تحقق من سلامة البيانات
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import {
  createBackup,
  previewBackup,
  restoreBackup,
  listLocalBackups,
  deleteBackup as deleteBackupFile,
  BACKUP_CONFIG,
  BackupPreview,
} from '@/lib/backup-system';

// ==================== المصادقة ====================

async function checkAuth() {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('authenticated');
  return authenticated?.value === 'true';
}

// ==================== GET - جلب/تصدير النسخة الاحتياطية ====================

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    switch (action) {
      case 'export':
        return await handleExport();

      case 'list':
        return await handleList();

      case 'info':
        return await handleInfo();

      case 'download':
        return await handleDownload(searchParams);

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('خطأ في API النسخ الاحتياطي:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ',
        details: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    );
  }
}

// ==================== POST - استيراد/استرجاع النسخة الاحتياطية ====================

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data, filepath, confirmed } = body;

    switch (action) {
      case 'preview':
        return await handlePreview(data);

      case 'restore':
        return await handleRestore(data, confirmed);

      case 'delete':
        return await handleDelete(filepath);

      default:
        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    }
  } catch (error) {
    console.error('خطأ في API النسخ الاحتياطي:', error);
    return NextResponse.json(
      {
        error: 'حدث خطأ',
        details: error instanceof Error ? error.message : 'خطأ غير معروف',
      },
      { status: 500 }
    );
  }
}

// ==================== معالجات التصدير ====================

async function handleExport() {
  console.log('📦 بدء إنشاء نسخة احتياطية...');
  const result = await createBackup('manual');

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'فشل في إنشاء النسخة الاحتياطية' },
      { status: 500 }
    );
  }

  // قراءة الملف كـ base64
  let base64Data: string | null = null;
  if (result.filepath && existsSync(result.filepath)) {
    const buffer = await readFile(result.filepath);
    base64Data = buffer.toString('base64');
  }

  console.log(`✅ تم إنشاء النسخة الاحتياطية: ${result.filename} (${result.duration_ms}ms)`);

  return NextResponse.json({
    success: true,
    data: base64Data,
    filename: result.filename,
    filepath: result.filepath,
    size: result.size,
    metadata: result.metadata,
    checksum: result.checksum,
    duration_ms: result.duration_ms,
  });
}

async function handleList() {
  const backups = await listLocalBackups();
  return NextResponse.json({ backups });
}

async function handleInfo() {
  return NextResponse.json({
    config: {
      maxAutoBackups: BACKUP_CONFIG.MAX_AUTO_BACKUPS,
      maxFileSize: BACKUP_CONFIG.MAX_FILE_SIZE,
      allowedExtensions: BACKUP_CONFIG.ALLOWED_EXTENSIONS,
    },
    paths: {
      dbDir: BACKUP_CONFIG.PATHS.DB_DIR,
      uploadsDir: BACKUP_CONFIG.PATHS.UPLOADS_DIR,
      backupsDir: BACKUP_CONFIG.PATHS.BACKUPS_DIR,
    },
  });
}

async function handleDownload(searchParams: URLSearchParams) {
  const filepath = searchParams.get('filepath');

  if (!filepath) {
    return NextResponse.json({ error: 'مسار الملف مطلوب' }, { status: 400 });
  }

  // التحقق من أن الملف في مجلد النسخ الاحتياطية
  if (!filepath.includes('backups')) {
    return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 });
  }

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
  }

  const buffer = await readFile(filepath);
  const filename = filepath.split('/').pop() || 'backup.zip';

  return NextResponse.json({
    data: buffer.toString('base64'),
    filename,
    size: buffer.length,
  });
}

// ==================== معالجات الاستيراد ====================

async function handlePreview(base64Data: string | undefined) {
  if (!base64Data) {
    return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
  }

  const buffer = Buffer.from(base64Data, 'base64');
  const preview = await previewBackup(buffer);

  return NextResponse.json(preview);
}

async function handleRestore(base64Data: string | undefined, confirmed: boolean | undefined) {
  if (!base64Data) {
    return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
  }

  const buffer = Buffer.from(base64Data, 'base64');

  // معاينة أولاً
  const preview = await previewBackup(buffer);

  if (!preview.valid) {
    return NextResponse.json(
      {
        error: 'النسخة الاحتياطية غير صالحة',
        details: preview.compatibilityWarnings,
      },
      { status: 400 }
    );
  }

  if (!confirmed) {
    return NextResponse.json({
      needConfirmation: true,
      preview,
    });
  }

  console.log('📥 بدء استعادة النسخة الاحتياطية...');
  const result = await restoreBackup(buffer);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'فشل في الاستعادة' },
      { status: 500 }
    );
  }

  console.log('✅ تم استعادة النسخة الاحتياطية بنجاح');

  return NextResponse.json(result);
}

async function handleDelete(filepath: string | undefined) {
  if (!filepath) {
    return NextResponse.json({ error: 'مسار الملف مطلوب' }, { status: 400 });
  }

  // التحقق من أن الملف في مجلد النسخ الاحتياطية
  if (!filepath.includes('backups')) {
    return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 });
  }

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
  }

  const success = await deleteBackupFile(filepath);

  if (!success) {
    return NextResponse.json({ error: 'فشل في حذف النسخة' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'تم حذف النسخة الاحتياطية' });
}
