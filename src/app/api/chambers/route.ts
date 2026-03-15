import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { chambers, SUPREME_COURT_CHAMBERS, JUDICIAL_COUNCIL_CHAMBERS, COURT_SECTIONS } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

// GET - جلب الغرف
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const judicialBodyId = searchParams.get('judicialBodyId');

    let chamberList;
    if (judicialBodyId) {
      chamberList = await db.select()
        .from(chambers)
        .where(eq(chambers.judicialBodyId, parseInt(judicialBodyId)));
    } else {
      chamberList = await db.select().from(chambers);
    }

    return NextResponse.json(chamberList);
  } catch (error) {
    console.error('خطأ في جلب الغرف:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// POST - إنشاء غرف متعددة أو غرفة واحدة
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();

    // دعم إنشاء غرف متعددة
    if (body.chambers && Array.isArray(body.chambers)) {
      const { judicialBodyId, chambers: chambersData, bodyType } = body;

      if (!judicialBodyId) {
        return NextResponse.json({ error: 'الهيئة القضائية مطلوبة' }, { status: 400 });
      }

      // حذف الغرف الموجودة أولاً
      await db.delete(chambers).where(eq(chambers.judicialBodyId, judicialBodyId));

      // تحديد تعريفات الغرف حسب نوع الهيئة
      const chamberDefs = bodyType === 'supreme_court' 
        ? SUPREME_COURT_CHAMBERS 
        : bodyType === 'judicial_council'
        ? JUDICIAL_COUNCIL_CHAMBERS
        : COURT_SECTIONS;

      // إنشاء الغرف الجديدة
      const newChambers = [];
      for (const chamberData of chambersData) {
        const def = chamberDefs.find(d => d.id === chamberData.chamberType);
        if (!def) continue;

        const chamberName = chamberData.roomNumber 
          ? `${def.name} رقم ${chamberData.roomNumber}`
          : def.name;

        const [newChamber] = await db.insert(chambers)
          .values({
            name: chamberName,
            chamberType: chamberData.chamberType,
            roomNumber: chamberData.roomNumber || null,
            judicialBodyId: judicialBodyId,
          })
          .returning();

        newChambers.push(newChamber);
      }

      return NextResponse.json({ success: true, chambers: newChambers });
    }

    // دعم إنشاء غرفة واحدة (للتوافق مع الإصدار السابق)
    const { name, chamberType, roomNumber, judicialBodyId } = body;

    if (!name || !judicialBodyId) {
      return NextResponse.json({ error: 'الاسم والهيئة القضائية مطلوبان' }, { status: 400 });
    }

    const [newChamber] = await db.insert(chambers)
      .values({
        name,
        chamberType: chamberType || 'custom',
        roomNumber: roomNumber || null,
        judicialBodyId,
      })
      .returning();

    return NextResponse.json(newChamber);
  } catch (error) {
    console.error('خطأ في إنشاء غرفة:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// DELETE - حذف غرفة
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    await db.delete(chambers).where(eq(chambers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف غرفة:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
