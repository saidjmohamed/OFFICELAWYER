import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings, clients, cases, sessions, judicialBodies, chambers, lawyers, organizations, calendarEvents, officeSettings, wilayas } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

// جلب الإعدادات
export async function GET() {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // جلب إعدادات المكتب الجديدة
    let officeData = await db.select().from(officeSettings);
    
    if (officeData.length === 0) {
      // إنشاء إعدادات افتراضية
      const [newSettings] = await db.insert(officeSettings).values({}).returning();
      officeData = [newSettings];
    }
    
    const office = officeData[0];
    
    // جلب اسم الولاية
    let wilayaName = null;
    if (office.wilayaId) {
      const wilayaData = await db.select().from(wilayas).where(eq(wilayas.id, office.wilayaId));
      wilayaName = wilayaData[0]?.name || null;
    }

    // جلب إحصائيات البيانات
    const recordCounts = {
      clients: (await db.select({ count: sql<number>`count(*)` }).from(clients))[0]?.count || 0,
      cases: (await db.select({ count: sql<number>`count(*)` }).from(cases))[0]?.count || 0,
      sessions: (await db.select({ count: sql<number>`count(*)` }).from(sessions))[0]?.count || 0,
      judicialBodies: (await db.select({ count: sql<number>`count(*)` }).from(judicialBodies))[0]?.count || 0,
      chambers: (await db.select({ count: sql<number>`count(*)` }).from(chambers))[0]?.count || 0,
      lawyers: (await db.select({ count: sql<number>`count(*)` }).from(lawyers))[0]?.count || 0,
      organizations: (await db.select({ count: sql<number>`count(*)` }).from(organizations))[0]?.count || 0,
      calendarEvents: (await db.select({ count: sql<number>`count(*)` }).from(calendarEvents))[0]?.count || 0,
    };

    return NextResponse.json({
      office: {
        id: office.id,
        officeName: office.officeName || '',
        lawyerName: office.lawyerName || '',
        registrationNumber: office.registrationNumber || '',
        specialization: office.specialization || '',
        phone: office.phone || '',
        email: office.email || '',
        website: office.website || '',
        address: office.address || '',
        wilayaId: office.wilayaId,
        wilayaName: wilayaName,
        logo: office.logo || '',
        primaryColor: office.primaryColor || '#1e40af',
        secondaryColor: office.secondaryColor || '#3b82f6',
        accentColor: office.accentColor || '#f59e0b',
        fontFamily: office.fontFamily || 'Tajawal',
        signature: office.signature || '',
        stamp: office.stamp || '',
        printHeader: office.printHeader || '',
        printFooter: office.printFooter || '',
      },
      recordCounts,
    });
  } catch (error) {
    console.error('خطأ في جلب الإعدادات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// حفظ الإعدادات
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { office } = body;

    if (!office) {
      return NextResponse.json({ error: 'البيانات مطلوبة' }, { status: 400 });
    }

    // جلب الإعدادات الحالية
    const existingSettings = await db.select().from(officeSettings);
    
    const updateData = {
      officeName: office.officeName,
      lawyerName: office.lawyerName,
      registrationNumber: office.registrationNumber,
      specialization: office.specialization,
      phone: office.phone,
      email: office.email,
      website: office.website,
      address: office.address,
      wilayaId: office.wilayaId,
      logo: office.logo,
      primaryColor: office.primaryColor,
      secondaryColor: office.secondaryColor,
      accentColor: office.accentColor,
      fontFamily: office.fontFamily,
      signature: office.signature,
      stamp: office.stamp,
      printHeader: office.printHeader,
      printFooter: office.printFooter,
      updatedAt: new Date(),
    };

    if (existingSettings.length === 0) {
      // إنشاء إعدادات جديدة
      await db.insert(officeSettings).values(updateData);
    } else {
      // تحديث الإعدادات الموجودة
      await db.update(officeSettings)
        .set(updateData)
        .where(eq(officeSettings.id, existingSettings[0].id));
    }

    return NextResponse.json({ success: true, message: 'تم حفظ الإعدادات' });
  } catch (error) {
    console.error('خطأ في حفظ الإعدادات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
