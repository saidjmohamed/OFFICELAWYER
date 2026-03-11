import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { lawyers, organizations } from '@/db/schema';
import { eq, ilike, or, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';

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

    if (id) {
      const lawyer = await db.select({
        id: lawyers.id,
        firstName: lawyers.firstName,
        lastName: lawyers.lastName,
        phone: lawyers.phone,
        professionalAddress: lawyers.professionalAddress,
        organizationId: lawyers.organizationId,
        notes: lawyers.notes,
        organization: organizations.name,
        organizationType: organizations.type,
      })
        .from(lawyers)
        .leftJoin(organizations, eq(lawyers.organizationId, organizations.id))
        .where(eq(lawyers.id, parseInt(id)));

      if (lawyer.length === 0) {
        return NextResponse.json(null);
      }

      return NextResponse.json(lawyer[0]);
    }

    // جلب قائمة المحامين
    let result;
    if (search) {
      result = await db.select({
        id: lawyers.id,
        firstName: lawyers.firstName,
        lastName: lawyers.lastName,
        phone: lawyers.phone,
        professionalAddress: lawyers.professionalAddress,
        organizationId: lawyers.organizationId,
        notes: lawyers.notes,
        organization: organizations.name,
        organizationType: organizations.type,
      })
        .from(lawyers)
        .leftJoin(organizations, eq(lawyers.organizationId, organizations.id))
        .where(or(
          ilike(lawyers.firstName, `%${search}%`),
          ilike(lawyers.lastName, `%${search}%`),
          ilike(lawyers.phone, `%${search}%`)
        ))
        .orderBy(desc(lawyers.createdAt));
    } else {
      result = await db.select({
        id: lawyers.id,
        firstName: lawyers.firstName,
        lastName: lawyers.lastName,
        phone: lawyers.phone,
        professionalAddress: lawyers.professionalAddress,
        organizationId: lawyers.organizationId,
        notes: lawyers.notes,
        organization: organizations.name,
        organizationType: organizations.type,
      })
        .from(lawyers)
        .leftJoin(organizations, eq(lawyers.organizationId, organizations.id))
        .orderBy(desc(lawyers.createdAt));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('خطأ في جلب المحامين:', error);
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
      firstName,
      lastName,
      phone,
      professionalAddress,
      organizationId,
      notes,
    } = body;

    const [newLawyer] = await db.insert(lawyers)
      .values({
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        professionalAddress: professionalAddress || null,
        organizationId: organizationId ? parseInt(organizationId) : null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newLawyer);
  } catch (error) {
    console.error('خطأ في إنشاء محامي:', error);
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
      firstName,
      lastName,
      phone,
      professionalAddress,
      organizationId,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const [updatedLawyer] = await db.update(lawyers)
      .set({
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        professionalAddress: professionalAddress || null,
        organizationId: organizationId ? parseInt(organizationId) : null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(lawyers.id, id))
      .returning();

    return NextResponse.json(updatedLawyer);
  } catch (error) {
    console.error('خطأ في تحديث محامي:', error);
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

    await db.delete(lawyers).where(eq(lawyers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف محامي:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
