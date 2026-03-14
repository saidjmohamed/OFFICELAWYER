import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { judicialBodies, chambers, wilayas } from '@/db/schema';
import { eq, and, isNull, inArray as drizzleInArray, SQL } from 'drizzle-orm';
import { cookies } from 'next/headers';

// أنواع التنظيمات القضائية
const JUDICIAL_ORGANIZATIONS: Record<string, string[]> = {
  normal_judiciary: ['judicial_council', 'court'],
  supreme_court: ['supreme_court'],
  administrative_judiciary: ['admin_appeal_court', 'admin_court', 'commercial_court'],
  state_council: ['state_council'],
};

// جلب الهيئات القضائية
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const wilayaId = searchParams.get('wilayaId');
    const type = searchParams.get('type');
    const parentId = searchParams.get('parentId');
    const organization = searchParams.get('organization');

    // بناء شروط الاستعلام
    const conditions: SQL[] = [];
    
    if (wilayaId) {
      conditions.push(eq(judicialBodies.wilayaId, parseInt(wilayaId)));
    }
    if (type) {
      conditions.push(eq(judicialBodies.type, type));
    }
    if (parentId) {
      if (parentId === 'null') {
        conditions.push(isNull(judicialBodies.parentId));
      } else {
        conditions.push(eq(judicialBodies.parentId, parseInt(parentId)));
      }
    }
    if (organization && JUDICIAL_ORGANIZATIONS[organization]) {
      const orgTypes = JUDICIAL_ORGANIZATIONS[organization];
      conditions.push(drizzleInArray(judicialBodies.type, orgTypes));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // جلب الهيئات مع معلومات الولاية
    const bodies = await db.select({
      id: judicialBodies.id,
      name: judicialBodies.name,
      type: judicialBodies.type,
      wilayaId: judicialBodies.wilayaId,
      parentId: judicialBodies.parentId,
      wilayaName: wilayas.name,
      wilayaNumber: wilayas.number,
    })
      .from(judicialBodies)
      .leftJoin(wilayas, eq(judicialBodies.wilayaId, wilayas.id))
      .where(whereClause);

    // جلب الغرف لكل هيئة
    const bodiesWithChambers = await Promise.all(
      bodies.map(async (body) => {
        const bodyChambers = await db.select()
          .from(chambers)
          .where(eq(chambers.judicialBodyId, body.id));
        return { ...body, chambers: bodyChambers };
      })
    );

    // إذا لم يكن هناك فلترة خاصة، نرجع البيانات منظمة
    if (!wilayaId && !type && !parentId && !organization) {
      const organized = organizeBodies(bodiesWithChambers);
      return NextResponse.json({ organized, flat: bodiesWithChambers });
    }

    return NextResponse.json(bodiesWithChambers);
  } catch (error) {
    console.error('خطأ في جلب الهيئات القضائية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// تنظيم الهيئات حسب التنظيم القضائي
function organizeBodies(bodies: any[]) {
  const normalJudiciary = organizeNormalJudiciary(bodies);
  const supremeCourt = bodies.filter(b => b.type === 'supreme_court');
  const administrativeJudiciary = organizeAdministrativeJudiciary(bodies);
  const stateCouncil = bodies.filter(b => b.type === 'state_council');

  return {
    normalJudiciary,
    supremeCourt,
    administrativeJudiciary,
    stateCouncil,
  };
}

// تنظيم القضاء العادي: ولاية → مجلس قضائي → محكمة
function organizeNormalJudiciary(bodies: any[]) {
  const wilayasMap = new Map<number, any>();
  
  // جمع المجالس القضائية
  bodies.forEach(b => {
    if (b.type === 'judicial_council' && b.wilayaId) {
      if (!wilayasMap.has(b.wilayaId)) {
        wilayasMap.set(b.wilayaId, {
          id: b.wilayaId,
          name: b.wilayaName,
          number: b.wilayaNumber,
          councils: [],
        });
      }
      
      // إضافة المحاكم تحت المجلس
      const courts = bodies.filter(court => 
        court.type === 'court' && court.parentId === b.id
      );
      
      wilayasMap.get(b.wilayaId).councils.push({
        ...b,
        courts: courts,
      });
    }
  });

  return Array.from(wilayasMap.values())
    .filter(w => w.councils.length > 0)
    .sort((a, b) => (a.number || 0) - (b.number || 0));
}

// تنظيم القضاء الإداري
function organizeAdministrativeJudiciary(bodies: any[]) {
  const wilayasMap = new Map<number, any>();
  
  bodies.forEach(b => {
    if (['admin_appeal_court', 'admin_court', 'commercial_court'].includes(b.type) && b.wilayaId) {
      if (!wilayasMap.has(b.wilayaId)) {
        wilayasMap.set(b.wilayaId, {
          id: b.wilayaId,
          name: b.wilayaName,
          number: b.wilayaNumber,
          appealCourts: [],
          adminCourts: [],
          commercialCourts: [],
        });
      }
      
      if (b.type === 'admin_appeal_court') {
        wilayasMap.get(b.wilayaId).appealCourts.push(b);
      } else if (b.type === 'admin_court') {
        wilayasMap.get(b.wilayaId).adminCourts.push(b);
      } else if (b.type === 'commercial_court') {
        wilayasMap.get(b.wilayaId).commercialCourts.push(b);
      }
    }
  });

  return Array.from(wilayasMap.values())
    .filter(w => w.appealCourts.length > 0 || w.adminCourts.length > 0 || w.commercialCourts.length > 0)
    .sort((a, b) => (a.number || 0) - (b.number || 0));
}

// Chamber type names map - Arabic names for all chamber types
const CHAMBER_NAMES: Record<string, string> = {
  // المحكمة العليا
  civil: 'الغرفة المدنية',
  real_estate: 'الغرفة العقارية',
  family_inheritance: 'غرفة شؤون الأسرة و المواريث',
  commercial_maritime: 'الغرفة التجارية و البحرية',
  social: 'الغرفة الإجتماعية',
  criminal: 'الغرفة الجنائية',
  misdemeanors: 'غرفة الجنح و المخالفات',
  // مجلس الدولة
  admin_disputes: 'غرفة المنازعات الإدارية',
  tax_disputes: 'غرفة المنازعات الضريبية',
  elections: 'غرفة الانتخابات',
  legislation: 'غرفة التشريع',
  audit: 'غرفة المحاسبات',
  // المجالس القضائية
  penal: 'الغرفة الجزائية',
  indictment: 'غرفة الاتهام',
  urgent: 'الغرفة الاستعجالية',
  family: 'غرفة شؤون الأسرة',
  juvenile: 'غرفة الأحداث',
  maritime: 'الغرفة البحرية',
  commercial: 'الغرفة التجارية',
  // أقسام المحاكم
  contraventions: 'قسم المخالفات',
  violation: 'قسم المخالفات',
  // أقسام المحكمة التجارية المتخصصة
  commercial_disputes: 'قسم المنازعات التجارية',
  companies: 'قسم الشركات',
  bankruptcy: 'قسم الإفلاس والتسوية القضائية',
  banking_financial: 'قسم النزاعات البنكية والمالية',
  urgent_commercial: 'القسم الاستعجالي التجاري',
  // أنواع إضافية
  accusation: 'غرفة الاتهام',
  misdemeanor: 'غرفة الجنح',
};

// إضافة هيئة قضائية جديدة
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, wilayaId, parentId, chambers: chambersData } = body;

    console.log('إنشاء هيئة قضائية:', { name, type, wilayaId, parentId, chambersCount: chambersData?.length });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الهيئة القضائية مطلوب' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'نوع الهيئة القضائية مطلوب' }, { status: 400 });
    }

    const insertData: any = { 
      name: name.trim(), 
      type: type,
    };

    // المحكمة العليا ومجلس الدولة ليس لهما ولاية
    // البحث عن معرف الولاية باستخدام رقمها
    if (type !== 'supreme_court' && type !== 'state_council' && wilayaId && !isNaN(parseInt(wilayaId))) {
      const wilayaNumber = parseInt(wilayaId);
      const wilayaRecord = await db.select().from(wilayas).where(eq(wilayas.number, wilayaNumber)).limit(1);
      if (wilayaRecord.length > 0) {
        insertData.wilayaId = wilayaRecord[0].id;
      } else {
        return NextResponse.json({ error: 'الولاية غير موجودة' }, { status: 400 });
      }
    }

    if (parentId && !isNaN(parseInt(parentId))) {
      insertData.parentId = parseInt(parentId);
    }

    console.log('بيانات الإدراج:', insertData);

    // إنشاء الهيئة القضائية
    const inserted = await db.insert(judicialBodies)
      .values(insertData)
      .returning();
    
    const newBody = Array.isArray(inserted) ? inserted[0] : inserted;

    // إنشاء الغرف/الأقسام إن وجدت
    if (chambersData && Array.isArray(chambersData) && chambersData.length > 0) {
      const chambersToInsert = chambersData.map((chamber: any) => ({
        name: CHAMBER_NAMES[chamber.chamberType] || chamber.chamberType,
        chamberType: chamber.chamberType,
        roomNumber: chamber.roomNumber || null,
        judicialBodyId: newBody.id,
      }));

      await db.insert(chambers).values(chambersToInsert);
      console.log('تم إنشاء الغرف:', chambersToInsert.length);
    }

    // جلب الهيئة مع الغرف
    const bodyChambers = await db.select()
      .from(chambers)
      .where(eq(chambers.judicialBodyId, newBody.id));

    return NextResponse.json({ ...newBody, chambers: bodyChambers });
  } catch (error) {
    console.error('خطأ في إنشاء هيئة قضائية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// تحديث هيئة قضائية
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, type, wilayaId, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    
    // تحويل رقم الولاية إلى معرف الولاية
    if (wilayaId !== undefined) {
      if (wilayaId) {
        const wilayaNumber = parseInt(wilayaId);
        const wilayaRecord = await db.select().from(wilayas).where(eq(wilayas.number, wilayaNumber)).limit(1);
        if (wilayaRecord.length > 0) {
          updateData.wilayaId = wilayaRecord[0].id;
        }
      } else {
        updateData.wilayaId = null;
      }
    }
    
    if (parentId !== undefined) updateData.parentId = parentId ? parseInt(parentId) : null;

    const updated = await db.update(judicialBodies)
      .set(updateData)
      .where(eq(judicialBodies.id, id))
      .returning();
    
    const updatedBody = Array.isArray(updated) ? updated[0] : updated;

    return NextResponse.json(updatedBody);
  } catch (error) {
    console.error('خطأ في تحديث هيئة قضائية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// حذف هيئة قضائية
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    console.log('🗑️ طلب حذف هيئة قضائية:', id);

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const bodyId = parseInt(id);

    // التحقق من عدم وجود هيئات تابعة
    const childBodies = await db.select()
      .from(judicialBodies)
      .where(eq(judicialBodies.parentId, bodyId));

    console.log('📋 الهيئات التابعة:', childBodies.length);

    if (childBodies.length > 0) {
      return NextResponse.json({ 
        error: 'لا يمكن حذف هذه الهيئة لأنها تحتوي على هيئات تابعة',
        childCount: childBodies.length
      }, { status: 400 });
    }

    // حذف الغرف المرتبطة أولاً
    const deletedChambersResult = await db.delete(chambers)
      .where(eq(chambers.judicialBodyId, bodyId))
      .returning();
    const deletedChambers = Array.isArray(deletedChambersResult) ? deletedChambersResult : [];
    console.log('🗑️ الغرف المحذوفة:', deletedChambers.length);
    
    // حذف الهيئة
    const deletedBodiesResult = await db.delete(judicialBodies)
      .where(eq(judicialBodies.id, bodyId))
      .returning();
    
    const deletedBodies = Array.isArray(deletedBodiesResult) ? deletedBodiesResult : [];
    console.log('🗑️ الهيئة المحذوفة:', deletedBodies);

    if (deletedBodies.length === 0) {
      return NextResponse.json({ 
        error: 'لم يتم العثور على الهيئة القضائية',
        id: bodyId 
      }, { status: 404 });
    }

    console.log('✅ تم الحذف بنجاح');

    return NextResponse.json({ 
      success: true,
      deleted: deletedBodies[0]
    });
  } catch (error) {
    console.error('خطأ في حذف هيئة قضائية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
