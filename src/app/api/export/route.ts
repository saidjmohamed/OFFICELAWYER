import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, caseClients, clients, sessions, caseFiles, caseExpenses, judicialBodies, chambers, wilayas, lawyers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { safeParseInt } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get('caseId');
    const format = searchParams.get('format') || 'json';

    const parsedCaseId = safeParseInt(caseId);
    if (!parsedCaseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب أو غير صالح' }, { status: 400 });
    }

    // جلب بيانات القضية
    const caseResult = await db.select()
      .from(cases)
      .where(eq(cases.id, parsedCaseId));

    if (caseResult.length === 0) {
      return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 });
    }

    const caseItem = caseResult[0];

    // جلب أطراف القضية
    const parties = await db.select({
      id: caseClients.id,
      role: caseClients.role,
      clientId: caseClients.clientId,
      clientName: clients.fullName,
      clientPhone: clients.phone,
      clientAddress: clients.address,
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
      .where(eq(caseClients.caseId, parsedCaseId));

    // جلب الجلسات
    const caseSessions = await db.select()
      .from(sessions)
      .where(eq(sessions.caseId, parsedCaseId));

    // جلب الملفات (معلمومات فقط بدون المحتوى)
    const files = await db.select({
      id: caseFiles.id,
      fileName: caseFiles.fileName,
      originalName: caseFiles.originalName,
      fileType: caseFiles.fileType,
      mimeType: caseFiles.mimeType,
      fileSize: caseFiles.fileSize,
      description: caseFiles.description,
      createdAt: caseFiles.createdAt,
    })
      .from(caseFiles)
      .where(eq(caseFiles.caseId, parsedCaseId));

    // جلب المصروفات
    const expenses = await db.select()
      .from(caseExpenses)
      .where(eq(caseExpenses.caseId, parsedCaseId));

    // جلب معلومات الهيئة القضائية
    let judicialBody = null;
    if (caseItem.judicialBodyId) {
      const bodyResult = await db.select()
        .from(judicialBodies)
        .where(eq(judicialBodies.id, caseItem.judicialBodyId));
      judicialBody = bodyResult[0] || null;
    }

    // جلب معلومات الغرفة
    let chamber = null;
    if (caseItem.chamberId) {
      const chamberResult = await db.select()
        .from(chambers)
        .where(eq(chambers.id, caseItem.chamberId));
      chamber = chamberResult[0] || null;
    }

    // جلب معلومات الولاية
    let wilaya = null;
    if (caseItem.wilayaId) {
      const wilayaResult = await db.select()
        .from(wilayas)
        .where(eq(wilayas.id, caseItem.wilayaId));
      wilaya = wilayaResult[0] || null;
    }

    // تجميع البيانات
    const exportData = {
      exportDate: new Date().toISOString(),
      case: {
        ...caseItem,
        judicialBody,
        chamber,
        wilaya,
      },
      parties,
      sessions: caseSessions,
      files,
      expenses,
      metadata: {
        exportedBy: 'OFFICELAWYER System',
        version: '1.0.0',
      },
    };

    if (format === 'json') {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="case_${caseItem.caseNumber || caseId}.json"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('خطأ في تصدير القضية:', error);
    return NextResponse.json({ error: 'حدث خطأ في التصدير' }, { status: 500 });
  }
}
