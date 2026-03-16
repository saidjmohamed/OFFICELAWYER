import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, wilayas } from '@/db/schema';
import { eq, or, desc, sql, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

// أنواع المنظمات
const ORGANIZATION_TYPES = [
  { value: 'bar_association', label: 'نقابة محامين' },
  { value: 'judicial_council', label: 'مجلس قضائي' },
  { value: 'court', label: 'محكمة' },
  { value: 'other', label: 'أخرى' },
];

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    if (id) {
      const org = await db.select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type,
        address: organizations.address,
        phone: organizations.phone,
        wilayaId: organizations.wilayaId,
        notes: organizations.notes,
        wilaya: wilayas.name,
      })
        .from(organizations)
        .leftJoin(wilayas, eq(organizations.wilayaId, wilayas.id))
        .where(eq(organizations.id, parseInt(id)));

      if (org.length === 0) {
        return NextResponse.json(null);
      }

      return NextResponse.json(org[0]);
    }

    // بناء الاستعلام
    let conditions = [];
    
    if (type) {
      conditions.push(eq(organizations.type, type));
    }

    // FIX 9: Replace ilike with LOWER() LIKE for SQLite compatibility
    if (search) {
      const searchLower = search.toLowerCase();
      conditions.push(or(
        sql`LOWER(${organizations.name}) LIKE ${`%${searchLower}%`}`,
        sql`LOWER(${organizations.address}) LIKE ${`%${searchLower}%`}`
      )!);
    }

    // FIX 10: Actually apply filter conditions to the query
    const query = db.select({
      id: organizations.id,
      name: organizations.name,
      type: organizations.type,
      address: organizations.address,
      phone: organizations.phone,
      wilayaId: organizations.wilayaId,
      notes: organizations.notes,
      wilaya: wilayas.name,
    })
      .from(organizations)
      .leftJoin(wilayas, eq(organizations.wilayaId, wilayas.id));

    const result = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(desc(organizations.createdAt))
      : await query.orderBy(desc(organizations.createdAt));

    // إضافة التسمية العربية للنوع
    const resultWithType = result.map(org => ({
      ...org,
      typeLabel: ORGANIZATION_TYPES.find(t => t.value === org.type)?.label || org.type,
    }));

    return NextResponse.json(resultWithType);
  } catch (error) {
    console.error('خطأ في جلب المنظمات:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      address,
      phone,
      wilayaId,
      notes,
    } = body;

    const [newOrg] = await db.insert(organizations)
      .values({
        name: name || null,
        type: type || null,
        address: address || null,
        phone: phone || null,
        wilayaId: wilayaId ? parseInt(wilayaId) : null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newOrg);
  } catch (error) {
    console.error('خطأ في إنشاء منظمة:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      type,
      address,
      phone,
      wilayaId,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const [updatedOrg] = await db.update(organizations)
      .set({
        name: name || null,
        type: type || null,
        address: address || null,
        phone: phone || null,
        wilayaId: wilayaId ? parseInt(wilayaId) : null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('خطأ في تحديث منظمة:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

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

    await db.delete(organizations).where(eq(organizations.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف منظمة:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
