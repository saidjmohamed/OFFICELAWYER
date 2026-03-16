import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { caseFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { cookies } from 'next/headers';

// مسار تخزين الملفات
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'case-files');

// التأكد من وجود مجلد التحميل
function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// الحصول على ملفات قضية
export async function GET(request: NextRequest) {
  try {
    // FIX 5: Auth check
    const cookieStore = await cookies();
    if (cookieStore.get('authenticated')?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const caseId = request.nextUrl.searchParams.get('caseId');
    const fileId = request.nextUrl.searchParams.get('id');
    const download = request.nextUrl.searchParams.get('download');

    if (fileId) {
      const file = await db.select().from(caseFiles).where(eq(caseFiles.id, parseInt(fileId))).limit(1);
      
      if (file.length === 0) {
        return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
      }

      const fileRecord = file[0];
      
      if (download === 'true') {
        const filePath = join(UPLOAD_DIR, fileRecord.fileName);
        if (!existsSync(filePath)) {
          return NextResponse.json({ error: 'الملف غير موجود على الخادم' }, { status: 404 });
        }
        
        const fileBuffer = readFileSync(filePath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': fileRecord.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      }
      
      return NextResponse.json(fileRecord);
    }

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    const files = await db.select().from(caseFiles).where(eq(caseFiles.caseId, parseInt(caseId)));
    return NextResponse.json(files);
  } catch (error) {
    console.error('خطأ في جلب الملفات:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الملفات' }, { status: 500 });
  }
}

// FIX 21: Allowed file types and max size
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// رفع ملف جديد
export async function POST(request: NextRequest) {
  try {
    // FIX 5: Auth check
    const cookieStore = await cookies();
    if (cookieStore.get('authenticated')?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    ensureUploadDir();

    const formData = await request.formData();
    const caseId = formData.get('caseId');
    const file = formData.get('file') as File;
    const customName = formData.get('customName') as string;

    if (!caseId || !file) {
      return NextResponse.json({ error: 'معرف القضية والملف مطلوبان' }, { status: 400 });
    }

    // FIX 21: Validate file type and size
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'نوع الملف غير مسموح' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)' }, { status: 400 });
    }

    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'bin';
    const fileName = `${timestamp}-${randomSuffix}.${ext}`;

    // حفظ الملف
    const filePath = join(UPLOAD_DIR, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    writeFileSync(filePath, buffer);

    // حفظ معلومات الملف في قاعدة البيانات
    const result = await db.insert(caseFiles).values({
      caseId: parseInt(caseId as string),
      fileName,
      originalName: file.name,
      fileType: 'other', // دائماً 'other' لأننا ألغينا التصنيف
      mimeType: file.type,
      fileSize: file.size,
      description: customName && customName.trim() ? customName.trim() : null, // تخزين الاسم المخصص في description
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    return NextResponse.json({ error: 'حدث خطأ في رفع الملف' }, { status: 500 });
  }
}

// حذف ملف
export async function DELETE(request: NextRequest) {
  try {
    // FIX 5: Auth check
    const cookieStore = await cookies();
    if (cookieStore.get('authenticated')?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'معرف الملف مطلوب' }, { status: 400 });
    }

    // الحصول على معلومات الملف قبل الحذف
    const file = await db.select().from(caseFiles).where(eq(caseFiles.id, parseInt(id))).limit(1);
    
    if (file.length === 0) {
      return NextResponse.json({ error: 'الملف غير موجود' }, { status: 404 });
    }

    const fileRecord = file[0];

    // حذف الملف من القرص
    const filePath = join(UPLOAD_DIR, fileRecord.fileName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }

    // حذف السجل من قاعدة البيانات
    await db.delete(caseFiles).where(eq(caseFiles.id, parseInt(id)));

    return NextResponse.json({ message: 'تم حذف الملف بنجاح' });
  } catch (error) {
    console.error('خطأ في حذف الملف:', error);
    return NextResponse.json({ error: 'حدث خطأ في حذف الملف' }, { status: 500 });
  }
}
