import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions, lawyers, judicialBodies, caseClients, wilayas } from '@/db/schema';
import { or, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

// أنواع النتائج
interface SearchResult {
  type: 'case' | 'client' | 'party' | 'session' | 'lawyer' | 'court' | 'wilaya';
  id: number;
  title: string;
  subtitle: string;
  matchedField: string;
  matchedValue: string;
  extra?: {
    status?: string;
    caseType?: string;
    court?: string;
    date?: string;
    phone?: string;
    caseId?: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        cases: [], 
        clients: [], 
        parties: [],
        sessions: [],
        others: [],
        total: 0 
      });
    }

    const searchLower = `%${query.toLowerCase().trim()}%`;
    const searchExact = query.trim();

    const cases_results: SearchResult[] = [];
    const clients_results: SearchResult[] = [];
    const parties_results: SearchResult[] = [];
    const sessions_results: SearchResult[] = [];
    const others_results: SearchResult[] = [];

    // ===== البحث في القضايا =====
    try {
      const caseResults = await db.select()
        .from(cases)
        .where(or(
          sql`LOWER(case_number) LIKE ${searchLower}`,
          sql`LOWER(subject) LIKE ${searchLower}`,
          sql`LOWER(notes) LIKE ${searchLower}`,
          sql`LOWER(judicial_body) LIKE ${searchLower}`,
          sql`LOWER(chamber) LIKE ${searchLower}`,
          sql`LOWER(wilaya) LIKE ${searchLower}`,
          sql`LOWER(case_type) LIKE ${searchLower}`
        ))
        .limit(15);

      for (const caseItem of caseResults) {
        let matchedField = 'caseNumber';
        let matchedValue = caseItem.caseNumber || '';

        if (caseItem.subject?.toLowerCase().includes(searchExact.toLowerCase())) {
          matchedField = 'subject';
          matchedValue = caseItem.subject;
        } else if (caseItem.judicialBody?.toLowerCase().includes(searchExact.toLowerCase())) {
          matchedField = 'court';
          matchedValue = caseItem.judicialBody;
        } else if (caseItem.caseType?.toLowerCase().includes(searchExact.toLowerCase())) {
          matchedField = 'caseType';
          matchedValue = caseItem.caseType;
        }

        cases_results.push({
          type: 'case',
          id: caseItem.id,
          title: caseItem.caseNumber || 'قضية بدون رقم',
          subtitle: caseItem.subject || 'بدون موضوع',
          matchedField,
          matchedValue,
          extra: {
            status: caseItem.status || undefined,
            caseType: caseItem.caseType || undefined,
            court: caseItem.judicialBody || undefined,
            date: caseItem.firstSessionDate ? new Date(caseItem.firstSessionDate).toLocaleDateString('ar-DZ') : undefined,
          }
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في القضايا:', e);
    }

    // ===== البحث في الموكلين =====
    try {
      const clientResults = await db.select()
        .from(clients)
        .where(or(
          sql`LOWER(full_name) LIKE ${searchLower}`,
          sql`LOWER(phone) LIKE ${searchLower}`,
          sql`LOWER(address) LIKE ${searchLower}`,
          sql`LOWER(business_name) LIKE ${searchLower}`,
          sql`LOWER(legal_representative) LIKE ${searchLower}`
        ))
        .limit(10);

      for (const client of clientResults) {
        let matchedField = 'name';
        let matchedValue = client.fullName || client.businessName || '';

        if (client.phone?.includes(searchExact)) {
          matchedField = 'phone';
          matchedValue = client.phone;
        }

        clients_results.push({
          type: 'client',
          id: client.id,
          title: client.fullName || client.businessName || 'موكل بدون اسم',
          subtitle: client.clientType === 'legal_entity' ? 'شخص معنوي' : 'شخص طبيعي',
          matchedField,
          matchedValue,
          extra: {
            phone: client.phone || undefined,
          }
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في الموكلين:', e);
    }

    // ===== البحث في أطراف القضايا =====
    try {
      const partyResults = await db.select()
        .from(caseClients)
        .where(or(
          sql`LOWER(opponent_first_name) LIKE ${searchLower}`,
          sql`LOWER(opponent_last_name) LIKE ${searchLower}`,
          sql`LOWER(opponent_phone) LIKE ${searchLower}`,
          sql`LOWER(opponent_address) LIKE ${searchLower}`,
          sql`LOWER(description) LIKE ${searchLower}`,
          sql`LOWER(client_description) LIKE ${searchLower}`
        ))
        .limit(10);

      // جلب أسماء الموكلين للأطراف
      const clientIds = partyResults.filter(p => p.clientId).map(p => p.clientId!);
      let clientsMap: Record<number, string> = {};
      
      if (clientIds.length > 0) {
        const clientsData = await db.select().from(clients).where(sql`id IN (${clientIds.join(',')})`);
        clientsData.forEach(c => {
          clientsMap[c.id] = c.fullName || c.businessName || 'موكل';
        });
      }

      // جلب أرقام القضايا
      const caseIds = partyResults.map(p => p.caseId);
      let casesMap: Record<number, string> = {};
      
      if (caseIds.length > 0) {
        const casesData = await db.select().from(cases).where(sql`id IN (${caseIds.join(',')})`);
        casesData.forEach(c => {
          casesMap[c.id] = c.caseNumber || 'قضية بدون رقم';
        });
      }

      for (const party of partyResults) {
        const isPlaintiff = party.role === 'plaintiff';
        let title = '';
        let matchedField = 'name';
        let matchedValue = '';

        if (isPlaintiff && party.clientId) {
          title = clientsMap[party.clientId] || 'موكل';
          matchedValue = title;
        } else if (party.opponentFirstName || party.opponentLastName) {
          title = `${party.opponentFirstName || ''} ${party.opponentLastName || ''}`.trim();
          matchedValue = title;
          if (party.opponentPhone?.includes(searchExact)) {
            matchedField = 'phone';
            matchedValue = party.opponentPhone;
          }
        } else {
          title = party.description || 'طرف غير محدد';
          matchedValue = title;
        }

        parties_results.push({
          type: 'party',
          id: party.id,
          title,
          subtitle: `${isPlaintiff ? 'مدعي' : 'مدعى عليه'} - ${casesMap[party.caseId] || 'قضية'}`,
          matchedField,
          matchedValue,
          extra: {
            phone: party.opponentPhone || undefined,
            caseId: party.caseId,
          }
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في الأطراف:', e);
    }

    // ===== البحث في الجلسات =====
    try {
      const sessionResults = await db.select()
        .from(sessions)
        .where(or(
          sql`LOWER(decision) LIKE ${searchLower}`,
          sql`LOWER(notes) LIKE ${searchLower}`,
          sql`LOWER(adjournment_reason) LIKE ${searchLower}`,
          sql`LOWER(ruling_text) LIKE ${searchLower}`
        ))
        .limit(10);

      // جلب أرقام القضايا
      const caseIds = [...new Set(sessionResults.map(s => s.caseId))];
      let casesMap: Record<number, string> = {};
      
      if (caseIds.length > 0) {
        const casesData = await db.select().from(cases).where(sql`id IN (${caseIds.join(',')})`);
        casesData.forEach(c => {
          casesMap[c.id] = c.caseNumber || 'قضية بدون رقم';
        });
      }

      for (const session of sessionResults) {
        let matchedField = 'decision';
        let matchedValue = session.decision || '';

        if (session.adjournmentReason?.toLowerCase().includes(searchExact.toLowerCase())) {
          matchedField = 'adjournmentReason';
          matchedValue = session.adjournmentReason;
        } else if (session.notes?.toLowerCase().includes(searchExact.toLowerCase())) {
          matchedField = 'notes';
          matchedValue = session.notes;
        }

        sessions_results.push({
          type: 'session',
          id: session.id,
          title: `جلسة ${session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('ar-DZ') : 'غير محددة'}`,
          subtitle: `${casesMap[session.caseId] || 'قضية'} - ${session.decision || session.adjournmentReason || 'بدون قرار'}`,
          matchedField,
          matchedValue,
          extra: {
            date: session.sessionDate ? new Date(session.sessionDate).toLocaleDateString('ar-DZ') : undefined,
            caseId: session.caseId,
          }
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في الجلسات:', e);
    }

    // ===== البحث في المحامين =====
    try {
      const lawyerResults = await db.select()
        .from(lawyers)
        .where(or(
          sql`LOWER(first_name) LIKE ${searchLower}`,
          sql`LOWER(last_name) LIKE ${searchLower}`,
          sql`LOWER(phone) LIKE ${searchLower}`,
          sql`LOWER(organization) LIKE ${searchLower}`
        ))
        .limit(5);

      for (const lawyer of lawyerResults) {
        others_results.push({
          type: 'lawyer',
          id: lawyer.id,
          title: `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() || 'محامي بدون اسم',
          subtitle: lawyer.organization || 'محامي',
          matchedField: 'name',
          matchedValue: `${lawyer.firstName || ''} ${lawyer.lastName || ''}`,
          extra: {
            phone: lawyer.phone || undefined,
          }
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في المحامين:', e);
    }

    // ===== البحث في الهيئات القضائية =====
    try {
      const bodyResults = await db.select()
        .from(judicialBodies)
        .where(or(
          sql`LOWER(name) LIKE ${searchLower}`,
          sql`LOWER(type) LIKE ${searchLower}`
        ))
        .limit(5);

      for (const body of bodyResults) {
        others_results.push({
          type: 'court',
          id: body.id,
          title: body.name || 'هيئة قضائية',
          subtitle: body.type || '',
          matchedField: 'name',
          matchedValue: body.name || '',
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في الهيئات القضائية:', e);
    }

    // ===== البحث في الولايات =====
    try {
      const wilayaResults = await db.select()
        .from(wilayas)
        .where(or(
          sql`LOWER(name) LIKE ${searchLower}`,
          sql`CAST(number AS TEXT) LIKE ${searchLower}`
        ))
        .limit(5);

      for (const wilaya of wilayaResults) {
        others_results.push({
          type: 'wilaya',
          id: wilaya.id,
          title: wilaya.name || 'ولاية',
          subtitle: `رقم ${wilaya.number}`,
          matchedField: 'name',
          matchedValue: wilaya.name || '',
        });
      }
    } catch (e) {
      console.error('خطأ في البحث في الولايات:', e);
    }

    const total = cases_results.length + clients_results.length + parties_results.length + 
                  sessions_results.length + others_results.length;

    return NextResponse.json({ 
      cases: cases_results, 
      clients: clients_results, 
      parties: parties_results,
      sessions: sessions_results,
      others: others_results,
      total,
      query: query.trim()
    });
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return NextResponse.json({ error: 'حدث خطأ في البحث' }, { status: 500 });
  }
}
