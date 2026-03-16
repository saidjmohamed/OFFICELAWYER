import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseClients, clients, judicialBodies, chambers, wilayas, lawyers, organizations } from '@/db/schema';
import { eq, or, sql, desc, and } from 'drizzle-orm';
import { cookies } from 'next/headers';
// FIX 19: Zod validation
import { caseSchema, caseUpdateSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (id) {
      // FIX 23: Validate parseInt
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
      }

      // جلب تفاصيل قضية واحدة
      const caseResult = await db.select()
        .from(cases)
        .where(eq(cases.id, parsedId));

      if (caseResult.length === 0) {
        return NextResponse.json(null);
      }

      const caseItem = caseResult[0];

      // جلب أطراف القضية مع بيانات المحامين
      const caseParties = await db.select({
        id: caseClients.id,
        role: caseClients.role,
        clientId: caseClients.clientId,
        clientName: clients.fullName,
        clientDescription: caseClients.clientDescription,
        opponentFirstName: caseClients.opponentFirstName,
        opponentLastName: caseClients.opponentLastName,
        opponentPhone: caseClients.opponentPhone,
        opponentAddress: caseClients.opponentAddress,
        description: caseClients.description,
        lawyerId: caseClients.lawyerId,
        lawyerFirstName: lawyers.firstName,
        lawyerLastName: lawyers.lastName,
        lawyerPhone: lawyers.phone,
        lawyerOrganization: organizations.name,
        lawyerDescription: caseClients.lawyerDescription,
      })
        .from(caseClients)
        .leftJoin(clients, eq(caseClients.clientId, clients.id))
        .leftJoin(lawyers, eq(caseClients.lawyerId, lawyers.id))
        .leftJoin(organizations, eq(lawyers.organizationId, organizations.id))
        .where(eq(caseClients.caseId, parsedId));

      return NextResponse.json({
        ...caseItem,
        parties: caseParties,
      });
    }

    // جلب قائمة القضايا
    let conditions = [];
    
    // استبعاد القضايا المؤرشفة افتراضياً ما لم يتم طلبها
    if (status) {
      conditions.push(eq(cases.status, status as 'active' | 'adjourned' | 'judged' | 'closed' | 'archived'));
    } else {
      // استبعاد القضايا المؤرشفة من القائمة الافتراضية
      conditions.push(sql`${cases.status} != 'archived'`);
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${cases.caseNumber}) LIKE ${searchLower}`,
          sql`LOWER(${cases.subject}) LIKE ${searchLower}`,
          sql`LOWER(${cases.notes}) LIKE ${searchLower}`,
          sql`LOWER(${judicialBodies.name}) LIKE ${searchLower}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const caseList = await db.select({
      id: cases.id,
      caseNumber: cases.caseNumber,
      caseType: cases.caseType,
      subject: cases.subject,
      status: cases.status,
      fees: cases.fees,
      registrationDate: cases.registrationDate,
      firstSessionDate: cases.firstSessionDate,
      judicialBody: judicialBodies.name,
      chamber: chambers.name,
      wilaya: wilayas.name,
    })
      .from(cases)
      .leftJoin(judicialBodies, eq(cases.judicialBodyId, judicialBodies.id))
      .leftJoin(chambers, eq(cases.chamberId, chambers.id))
      .leftJoin(wilayas, eq(cases.wilayaId, wilayas.id))
      .where(whereClause)
      .orderBy(desc(cases.createdAt))
      .limit(limit)
      .offset(offset);

    // FIX 11: Apply whereClause to count query so it matches the filtered list
    const countQuery = db.select({ count: sql<number>`count(*)` })
      .from(cases)
      .leftJoin(judicialBodies, eq(cases.judicialBodyId, judicialBodies.id));
    const countResult = whereClause
      ? await countQuery.where(whereClause)
      : await countQuery;
    const total = countResult[0]?.count || 0;

    return NextResponse.json({ data: caseList, total, page, limit });
  } catch (error) {
    console.error('خطأ في جلب القضايا:', error);
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
    const parsed = caseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      caseNumber,
      caseType,
      judicialBodyId,
      chamberId,
      wilayaId,
      registrationDate,
      firstSessionDate,
      subject,
      status,
      fees,
      notes,
      judgmentNumber,
      judgmentDate,
      issuingCourt,
      originalCaseNumber,
      originalCourt,
      parties,
    } = body;

    const parseOptionalInt = (val: any) => {
      if (val === '' || val === undefined || val === null) return null;
      const parsed = parseInt(val);
      return isNaN(parsed) ? null : parsed;
    };

    const parseOptionalFloat = (val: any) => {
      if (val === '' || val === undefined || val === null) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    const parseOptionalDate = (val: any): Date | null => {
      if (val === '' || val === undefined || val === null) return null;
      try {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    // FIX 22: Wrap case + parties insert in transaction
    const newCase = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(cases)
        .values({
          caseNumber: caseNumber || null,
          caseType: caseType || null,
          judicialBodyId: parseOptionalInt(judicialBodyId),
          chamberId: parseOptionalInt(chamberId),
          wilayaId: parseOptionalInt(wilayaId),
          registrationDate: parseOptionalDate(registrationDate),
          firstSessionDate: parseOptionalDate(firstSessionDate),
          subject: subject || null,
          status: status || 'active',
          fees: parseOptionalFloat(fees),
          notes: notes || null,
          judgmentNumber: judgmentNumber || null,
          judgmentDate: parseOptionalDate(judgmentDate),
          issuingCourt: issuingCourt || null,
          originalCaseNumber: originalCaseNumber || null,
          originalCourt: originalCourt || null,
        })
        .returning();

      // إضافة أطراف القضية
      if (parties && Array.isArray(parties) && parties.length > 0) {
        const partyValues = parties
          .filter((party: any) => {
            if (party.role === 'plaintiff') {
              return party.clientId && !isNaN(parseInt(party.clientId));
            } else {
              return party.opponentFirstName || party.opponentLastName;
            }
          })
          .map((party: any) => ({
            caseId: inserted.id,
            role: party.role || 'plaintiff',
            clientId: party.role === 'plaintiff' && party.clientId ? parseInt(party.clientId) : null,
            clientDescription: party.role === 'plaintiff' ? (party.clientDescription || null) : null,
            opponentFirstName: party.role === 'defendant' ? (party.opponentFirstName || null) : null,
            opponentLastName: party.role === 'defendant' ? (party.opponentLastName || null) : null,
            opponentPhone: party.role === 'defendant' ? (party.opponentPhone || null) : null,
            opponentAddress: party.role === 'defendant' ? (party.opponentAddress || null) : null,
            description: party.role === 'defendant' ? (party.description || null) : null,
            lawyerId: party.role === 'defendant' && party.lawyerId ? parseInt(party.lawyerId) : null,
            lawyerDescription: party.role === 'defendant' ? (party.lawyerDescription || null) : null,
          }));

        if (partyValues.length > 0) {
          await tx.insert(caseClients).values(partyValues);
        }
      }

      return inserted;
    });

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('خطأ في إنشاء قضية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
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

    // FIX 19: Validate input with Zod
    const parsed = caseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صالحة', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      id,
      caseNumber,
      caseType,
      judicialBodyId,
      chamberId,
      wilayaId,
      registrationDate,
      firstSessionDate,
      subject,
      status,
      fees,
      notes,
      judgmentNumber,
      judgmentDate,
      issuingCourt,
      originalCaseNumber,
      originalCourt,
      parties,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 });
    }

    const parseOptionalDate = (val: any): Date | null => {
      if (val === '' || val === undefined || val === null) return null;
      try {
        const date = new Date(val);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    // بناء كائن التحديث بالحقول المرسلة فقط
    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (caseNumber !== undefined) updateData.caseNumber = caseNumber || null;
    if (caseType !== undefined) updateData.caseType = caseType || null;
    if (judicialBodyId !== undefined) updateData.judicialBodyId = judicialBodyId ? parseInt(judicialBodyId) : null;
    if (chamberId !== undefined) updateData.chamberId = chamberId ? parseInt(chamberId) : null;
    if (wilayaId !== undefined) updateData.wilayaId = wilayaId ? parseInt(wilayaId) : null;
    if (registrationDate !== undefined) updateData.registrationDate = parseOptionalDate(registrationDate);
    if (firstSessionDate !== undefined) updateData.firstSessionDate = parseOptionalDate(firstSessionDate);
    if (subject !== undefined) updateData.subject = subject || null;
    if (status !== undefined) updateData.status = status || 'active';
    if (fees !== undefined) updateData.fees = fees ? parseFloat(fees) : null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (judgmentNumber !== undefined) updateData.judgmentNumber = judgmentNumber || null;
    if (judgmentDate !== undefined) updateData.judgmentDate = parseOptionalDate(judgmentDate);
    if (issuingCourt !== undefined) updateData.issuingCourt = issuingCourt || null;
    if (originalCaseNumber !== undefined) updateData.originalCaseNumber = originalCaseNumber || null;
    if (originalCourt !== undefined) updateData.originalCourt = originalCourt || null;

    // FIX 22: Wrap update + parties in transaction
    const updatedCase = await db.transaction(async (tx) => {
      const [updated] = await tx.update(cases)
        .set(updateData)
        .where(eq(cases.id, id))
        .returning();

      // تحديث أطراف القضية
      if (parties !== undefined) {
        await tx.delete(caseClients).where(eq(caseClients.caseId, id));

        if (Array.isArray(parties) && parties.length > 0) {
          const partyValues = parties
            .filter((party: any) => {
              if (party.role === 'plaintiff') {
                return party.clientId && !isNaN(parseInt(party.clientId));
              } else {
                return party.opponentFirstName || party.opponentLastName;
              }
            })
            .map((party: any) => ({
              caseId: id,
              role: party.role || 'plaintiff',
              clientId: party.role === 'plaintiff' && party.clientId ? parseInt(party.clientId) : null,
              clientDescription: party.role === 'plaintiff' ? (party.clientDescription || null) : null,
              opponentFirstName: party.role === 'defendant' ? (party.opponentFirstName || null) : null,
              opponentLastName: party.role === 'defendant' ? (party.opponentLastName || null) : null,
              opponentPhone: party.role === 'defendant' ? (party.opponentPhone || null) : null,
              opponentAddress: party.role === 'defendant' ? (party.opponentAddress || null) : null,
              description: party.role === 'defendant' ? (party.description || null) : null,
              lawyerId: party.role === 'defendant' && party.lawyerId ? parseInt(party.lawyerId) : null,
              lawyerDescription: party.role === 'defendant' ? (party.lawyerDescription || null) : null,
            }));

          if (partyValues.length > 0) {
            await tx.insert(caseClients).values(partyValues);
          }
        }
      }

      return updated;
    });

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('خطأ في تحديث قضية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    // FIX 23: Validate parseInt
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: 'معرف غير صالح' }, { status: 400 });
    }

    await db.delete(caseClients).where(eq(caseClients.caseId, parsedId));
    await db.delete(cases).where(eq(cases.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف قضية:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
