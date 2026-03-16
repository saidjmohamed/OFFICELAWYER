import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, or, sql, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
// FIX 19: Zod validation
import { clientSchema, clientUpdateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (id) {
      const client = await db.select().from(clients).where(eq(clients.id, parseInt(id)));
      return NextResponse.json(client[0] || null);
    }

    let query = db.select().from(clients);

    if (search) {
      const searchLower = search.toLowerCase();
      query = query.where(
        or(
          sql`lower(${clients.fullName}) LIKE ${`%${searchLower}%`}`,
          sql`lower(${clients.phone}) LIKE ${`%${searchLower}%`}`,
          sql`lower(${clients.address}) LIKE ${`%${searchLower}%`}`,
          sql`lower(${clients.businessName}) LIKE ${`%${searchLower}%`}`
        )
      ) as any;
    }

    const clientList = await query
      .orderBy(desc(clients.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(clients);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({ data: clientList, total, page, limit });
  } catch (error) {
    console.error('خطأ في جلب الموكلين:', error);
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

    // FIX 19: Validate input with Zod
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { fullName, phone, address, notes, clientType, businessName, legalRepresentative } = body;

    const [newClient] = await db.insert(clients)
      .values({
        fullName,
        phone,
        address,
        notes,
        clientType: clientType || 'natural_person',
        businessName: businessName || null,
        legalRepresentative: legalRepresentative || null,
      })
      .returning();

    return NextResponse.json(newClient);
  } catch (error) {
    console.error('خطأ في إنشاء موكل:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
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

    // FIX 19: Validate input with Zod
    const parsed = clientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id, fullName, phone, address, notes, clientType, businessName, legalRepresentative } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const [updatedClient] = await db.update(clients)
      .set({
        fullName,
        phone,
        address,
        notes,
        clientType: clientType || 'natural_person',
        businessName: businessName || null,
        legalRepresentative: legalRepresentative || null,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning();

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('خطأ في تحديث موكل:', error);
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

    await db.delete(clients).where(eq(clients.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف موكل:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
