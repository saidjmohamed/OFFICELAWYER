import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseClients, clients, judicialBodies, chambers, wilayas, lawyers, organizations } from '@/db/schema';
import { eq, or, sql, desc, and, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { z } from 'zod';
import { safeParseInt } from '@/lib/validations';

// مخطط التحقق لإنشاء/تحديث قضية
const caseSchema = z.object({
  caseNumber: z.string().optional().nullable(),
  caseType: z.string().optional().nullable(),
  judicialBodyId: z.union([z.string(), z.number()]).optional().nullable(),
  chamberId: z.union([z.string(), z.number()]).optional().nullable(),
  wilayaId: z.union([z.string(), z.number()]).optional().nullable(),
  registrationDate: z.string().optional().nullable(),
  firstSessionDate: z.string().optional().nullable(),
  subject: z.string().optional().nullable(),
  status: z.enum(['active', 'adjourned', 'judged', 'closed', 'archived']).optional(),
  fees: z.union([z.string(), z.number()]).optional().nullable(),
  notes: z.string().optional().nullable(),
  judgmentNumber: z.string().optional().nullable(),
  judgmentDate: z.string().optional().nullable(),
  issuingCourt: z.string().optional().nullable(),
  originalCaseNumber: z.string().optional().nullable(),
  originalCourt: z.string().optional().nullable(),
  parties: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = safeParseInt(searchParams.get('page')) || 1;
    const limit = Math.min(safeParseInt(searchParams.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;

    if (id) {
      const parsedId = safeParseInt(id);
      if (!parsedId) return NextResponse.json({ error: 'معرف القضية غير صالح' }, { status: 400 });
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

    if (status) {
      conditions.push(eq(cases.status, status as 'active' | 'adjourned' | 'judged' | 'closed'));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      conditions.push(
        or(
          sql`lower(${cases.caseNumber}) LIKE ${`%${searchLower}%`}`,
          sql`lower(${cases.subject}) LIKE ${`%${searchLower}%`}`
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

    // جلب أطراف القضايا لكل قضية
    const caseIds = caseList.map(c => c.id);
    let partiesByCase: Record<number, any[]> = {};

    if (caseIds.length > 0) {
      const allParties = await db.select({
        caseId: caseClients.caseId,
        role: caseClients.role,
        clientName: clients.fullName,
        clientDescription: caseClients.clientDescription,
        opponentFirstName: caseClients.opponentFirstName,
        opponentLastName: caseClients.opponentLastName,
        description: caseClients.description,
      })
        .from(caseClients)
        .leftJoin(clients, eq(caseClients.clientId, clients.id))
        .where(inArray(caseClients.caseId, caseIds));

      for (const party of allParties) {
        if (!partiesByCase[party.caseId]) {
          partiesByCase[party.caseId] = [];
        }
        partiesByCase[party.caseId].push(party);
      }
    }

    // إضافة الأطراف لكل قضية
    const casesWithParties = caseList.map(c => ({
      ...c,
      parties: partiesByCase[c.id] || [],
      plaintiffs: (partiesByCase[c.id] || []).filter(p => p.role === 'plaintiff'),
      defendants: (partiesByCase[c.id] || []).filter(p => p.role === 'defendant'),
    }));

    const countResult = await db.select({ count: sql<number>`count(*)` }).from(cases).where(whereClause);
    const total = countResult[0]?.count || 0;

    return NextResponse.json({ data: casesWithParties, total, page, limit });
  } catch (error) {
    console.error('خطأ في جلب القضايا:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // التحقق من صحة البيانات
    const validation = caseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: validation.error.errors },
        { status: 400 }
      );
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

    const [newCase] = await db.insert(cases)
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
          caseId: newCase.id,
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
        await db.insert(caseClients).values(partyValues);
      }
    }

    return NextResponse.json(newCase);
  } catch (error) {
    console.error('خطأ في إنشاء قضية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();

    // التحقق من صحة البيانات
    const validation = caseSchema.extend({ id: z.number() }).safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'بيانات غير صالحة', details: validation.error.errors },
        { status: 400 }
      );
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

    const [updatedCase] = await db.update(cases)
      .set(updateData)
      .where(eq(cases.id, id))
      .returning();

    // تحديث أطراف القضية داخل معاملة واحدة
    if (parties !== undefined) {
      await db.transaction(async (tx) => {
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
      });
    }

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('خطأ في تحديث قضية:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const parsedId = safeParseInt(id);
    if (!parsedId) return NextResponse.json({ error: 'معرف القضية غير صالح' }, { status: 400 });
    await db.delete(caseClients).where(eq(caseClients.caseId, parsedId));
    await db.delete(cases).where(eq(cases.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('خطأ في حذف قضية:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
