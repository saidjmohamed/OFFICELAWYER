import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { officeSettings, wilayas } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';

// GET - جلب إعدادات المكتب
export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    // جلب الإعدادات (يجب أن يكون هناك صف واحد فقط)
    let settings = await db.select().from(officeSettings);
    
    if (settings.length === 0) {
      // إنشاء إعدادات افتراضية إذا لم تكن موجودة
      const [newSettings] = await db.insert(officeSettings).values({}).returning();
      return NextResponse.json(newSettings);
    }
    
    // جلب اسم الولاية إذا كانت محددة
    const currentSettings = settings[0];
    if (currentSettings.wilayaId) {
      const wilaya = await db.select().from(wilayas).where(eq(wilayas.id, currentSettings.wilayaId));
      return NextResponse.json({
        ...currentSettings,
        wilayaName: wilaya[0]?.name || null
      });
    }
    
    return NextResponse.json(currentSettings);
  } catch (error) {
    console.error('خطأ في جلب إعدادات المكتب:', error);
    return NextResponse.json({ error: 'حدث خطأ في جلب الإعدادات' }, { status: 500 });
  }
}

// PUT - تحديث إعدادات المكتب
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const body = await request.json();
    
    // جلب الإعدادات الحالية
    const existingSettings = await db.select().from(officeSettings);
    
    const updateData = {
      officeName: body.officeName,
      lawyerName: body.lawyerName,
      registrationNumber: body.registrationNumber,
      specialization: body.specialization,
      address: body.address,
      phone: body.phone,
      email: body.email,
      website: body.website,
      wilayaId: body.wilayaId,
      logo: body.logo,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      accentColor: body.accentColor,
      fontFamily: body.fontFamily,
      signature: body.signature,
      stamp: body.stamp,
      printHeader: body.printHeader,
      printFooter: body.printFooter,
      updatedAt: new Date(),
    };
    
    if (existingSettings.length === 0) {
      // إنشاء إعدادات جديدة
      const [newSettings] = await db.insert(officeSettings).values(updateData).returning();
      return NextResponse.json(newSettings);
    }
    
    // تحديث الإعدادات الموجودة
    const [updatedSettings] = await db
      .update(officeSettings)
      .set(updateData)
      .where(eq(officeSettings.id, existingSettings[0].id))
      .returning();
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('خطأ في تحديث إعدادات المكتب:', error);
    return NextResponse.json({ error: 'حدث خطأ في تحديث الإعدادات' }, { status: 500 });
  }
}
