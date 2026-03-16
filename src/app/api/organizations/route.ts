import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { organizations, wilayas } from '@/db/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { safeParseInt } from '@/lib/validations';

// أنواع المنظمات
const ORGANIZATION_TYPES = [
  { value: 'bar_association', label: 'نقابة محامين' },
  { value: 'judicial_council', label: 'مجلس قضائي' },
  { value: 'court', label: 'محكمة' },
  { value: 'other', label: 'أخرى' },
];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    if (id) {
      const parsed = parseInt(id);
      if (isNaN(parsed)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
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
        .where(eq(organizations.id, parsed));

      if (org.length === 0) {
        return NextResponse.json(null);
      }

      return NextResponse.json(org[0]);
    }

    // بناء الاستعلام
    const conditions = [];

    if (type) {
      conditions.push(eq(organizations.type, type));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      conditions.push(or(
        sql`LOWER(${organizations.name}) LIKE ${`%${searchLower}%`}`,
        sql`LOWER(${organizations.address}) LIKE ${`%${searchLower}%`}`
      )!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.select({
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
      .where(whereClause)
      .orderBy(desc(organizations.createdAt));

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
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

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
        wilayaId: safeParseInt(wilayaId),
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newOrg);
  } catch (error) {
    console.error('خطأ في إنشاء منظمة:', error);
    return NextResponse.json({ error: 'حدث خطأ في إنشاء المنظمة' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

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
        wilayaId: safeParseInt(wilayaId),
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
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const parsed = parseInt(id);
    if (isNaN(parsed)) return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });

    await db.delete(organizations).where(eq(organizations.id, parsed));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف منظمة:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
