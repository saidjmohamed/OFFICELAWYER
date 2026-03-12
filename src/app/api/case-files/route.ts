import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { caseFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';

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

// رفع ملف جديد
export async function POST(request: NextRequest) {
  try {
    ensureUploadDir();
    
    const formData = await request.formData();
    const caseId = formData.get('caseId');
    const fileType = formData.get('fileType') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!caseId || !file) {
      return NextResponse.json({ error: 'معرف القضية والملف مطلوبان' }, { status: 400 });
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
      filePath,
      fileType: (fileType || 'other') as 'subject' | 'judgment' | 'decision' | 'other',
      mimeType: file.type,
      fileSize: file.size,
      description: description || null,
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
