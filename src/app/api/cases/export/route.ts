import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, clients, caseClients, sessions, caseFiles, caseExpenses, judicialBodies, chambers, wilayas, lawyers, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const caseId = searchParams.get('id');

    if (!caseId) {
      return NextResponse.json({ error: 'معرف القضية مطلوب' }, { status: 400 });
    }

    // جلب بيانات القضية الأساسية
    const caseData = await db.select()
      .from(cases)
      .where(eq(cases.id, parseInt(caseId)))
      .limit(1);

    if (!caseData.length) {
      return NextResponse.json({ error: 'القضية غير موجودة' }, { status: 404 });
    }

    const caseItem = caseData[0];

    // جلب الهيئة القضائية
    let judicialBody = null;
    if (caseItem.judicialBodyId) {
      const bodyData = await db.select()
        .from(judicialBodies)
        .where(eq(judicialBodies.id, caseItem.judicialBodyId))
        .limit(1);
      judicialBody = bodyData[0] || null;
    }

    // جلب الغرفة
    let chamber = null;
    if (caseItem.chamberId) {
      const chamberData = await db.select()
        .from(chambers)
        .where(eq(chambers.id, caseItem.chamberId))
        .limit(1);
      chamber = chamberData[0] || null;
    }

    // جلب الولاية
    let wilaya = null;
    if (caseItem.wilayaId) {
      const wilayaData = await db.select()
        .from(wilayas)
        .where(eq(wilayas.id, caseItem.wilayaId))
        .limit(1);
      wilaya = wilayaData[0] || null;
    }

    // جلب أطراف القضية
    const parties = await db.select()
      .from(caseClients)
      .where(eq(caseClients.caseId, parseInt(caseId)));

    // جلب تفاصيل الموكلين والمحامين
    const partiesWithDetails = await Promise.all(
      parties.map(async (party) => {
        let client = null;
        let lawyer = null;
        let lawyerOrganization = null;

        if (party.clientId) {
          const clientData = await db.select()
            .from(clients)
            .where(eq(clients.id, party.clientId))
            .limit(1);
          client = clientData[0] || null;
        }

        if (party.lawyerId) {
          const lawyerData = await db.select()
            .from(lawyers)
            .where(eq(lawyers.id, party.lawyerId))
            .limit(1);
          lawyer = lawyerData[0] || null;

          if (lawyer?.organizationId) {
            const orgData = await db.select()
              .from(organizations)
              .where(eq(organizations.id, lawyer.organizationId))
              .limit(1);
            lawyerOrganization = orgData[0] || null;
          }
        }

        return {
          ...party,
          client,
          lawyer,
          lawyerOrganization,
        };
      })
    );

    // جلب الجلسات
    const sessionsList = await db.select()
      .from(sessions)
      .where(eq(sessions.caseId, parseInt(caseId)))
      .orderBy(sessions.sessionDate);

    // جلب الملفات (بدون البيانات الثنائية)
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
      .where(eq(caseFiles.caseId, parseInt(caseId)));

    // جلب المصروفات
    const expenses = await db.select()
      .from(caseExpenses)
      .where(eq(caseExpenses.caseId, parseInt(caseId)));

    // بناء كائن التصدير
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        applicationName: 'OFFICELAWYER',
        version: '1.0',
      },
      case: {
        ...caseItem,
        judicialBody,
        chamber,
        wilaya,
      },
      parties: partiesWithDetails,
      sessions: sessionsList,
      files: files.map(f => ({
        ...f,
        note: 'الملفات الفعلية يجب تصديرها بشكل منفصل'
      })),
      expenses,
      summary: {
        totalSessions: sessionsList.length,
        totalFiles: files.length,
        totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        plaintiffCount: parties.filter(p => p.role === 'plaintiff').length,
        defendantCount: parties.filter(p => p.role === 'defendant').length,
      },
    };

    // إرجاع JSON للتحميل
    const fileName = caseItem.caseNumber 
      ? `case_${caseItem.caseNumber.replace(/[^a-zA-Z0-9]/g, '_')}.json`
      : `case_${caseId}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('خطأ في تصدير القضية:', error);
    return NextResponse.json({ error: 'حدث خطأ في التصدير' }, { status: 500 });
  }
}
