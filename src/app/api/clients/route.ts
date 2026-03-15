import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients } from '@/db/schema';
import { eq, or, sql, desc } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { z } from 'zod';

// مخطط التحقق لإنشاء/تحديث موكل
const clientSchema = z.object({
  fullName: z.string().min(1, 'اسم الموكل مطلوب'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  clientType: z.enum(['natural_person', 'legal_entity']).optional(),
  businessName: z.string().optional().nullable(),
  legalRepresentative: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
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
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json({ error: 'حدث خطأ', details: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // التحقق من صحة البيانات
    const validation = clientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: validation.error.errors },
        { status: 400 }
      );
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // التحقق من صحة البيانات
    const validation = clientSchema.partial().extend({ id: z.number() }).safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: validation.error.errors },
        { status: 400 }
      );
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
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

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
