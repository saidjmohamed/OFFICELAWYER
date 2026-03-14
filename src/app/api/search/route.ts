import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions, lawyers, judicialBodies } from '@/db/schema';
import { or, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authenticated = cookieStore.get('authenticated');

    if (authenticated?.value !== 'true') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: any[] = [];
    const searchLower = `%${query.toLowerCase()}%`;

    // البحث في الموكلين
    try {
      const clientResults = await db.select()
        .from(clients)
        .where(or(
          sql`LOWER(full_name) LIKE ${searchLower}`,
          sql`LOWER(phone) LIKE ${searchLower}`,
          sql`LOWER(address) LIKE ${searchLower}`,
          sql`LOWER(business_name) LIKE ${searchLower}`
        ))
        .limit(5);

      clientResults.forEach(client => {
        results.push({
          type: 'client',
          id: client.id,
          title: client.fullName || client.businessName || 'موكل بدون اسم',
          subtitle: client.phone || 'بدون رقم هاتف',
          href: `/?section=clients`,
        });
      });
    } catch (e) {
      console.error('خطأ في البحث في الموكلين:', e);
    }

    // البحث في القضايا
    try {
      const caseResults = await db.select({
        id: cases.id,
        caseNumber: cases.caseNumber,
        subject: cases.subject,
        status: cases.status,
      })
        .from(cases)
        .where(or(
          sql`LOWER(case_number) LIKE ${searchLower}`,
          sql`LOWER(subject) LIKE ${searchLower}`,
          sql`LOWER(notes) LIKE ${searchLower}`
        ))
        .limit(5);

      caseResults.forEach(caseItem => {
        results.push({
          type: 'case',
          id: caseItem.id,
          title: caseItem.caseNumber || 'قضية بدون رقم',
          subtitle: caseItem.subject || 'بدون موضوع',
          href: `/?section=cases`,
        });
      });
    } catch (e) {
      console.error('خطأ في البحث في القضايا:', e);
    }

    // البحث في الجلسات
    try {
      const sessionResults = await db.select()
        .from(sessions)
        .where(or(
          sql`LOWER(decision) LIKE ${searchLower}`,
          sql`LOWER(notes) LIKE ${searchLower}`,
          sql`LOWER(adjournment_reason) LIKE ${searchLower}`
        ))
        .limit(5);

      sessionResults.forEach(session => {
        results.push({
          type: 'session',
          id: session.id,
          title: `جلسة #${session.id}`,
          subtitle: session.decision || session.adjournmentReason || 'بدون قرار',
          href: `/?section=sessions`,
        });
      });
    } catch (e) {
      console.error('خطأ في البحث في الجلسات:', e);
    }

    // البحث في المحامين
    try {
      const lawyerResults = await db.select()
        .from(lawyers)
        .where(or(
          sql`LOWER(first_name) LIKE ${searchLower}`,
          sql`LOWER(last_name) LIKE ${searchLower}`,
          sql`LOWER(phone) LIKE ${searchLower}`
        ))
        .limit(5);

      lawyerResults.forEach(lawyer => {
        results.push({
          type: 'lawyer',
          id: lawyer.id,
          title: `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() || 'محامي بدون اسم',
          subtitle: lawyer.phone || 'بدون رقم هاتف',
          href: `/?section=lawyers`,
        });
      });
    } catch (e) {
      console.error('خطأ في البحث في المحامين:', e);
    }

    // البحث في الهيئات القضائية
    try {
      const bodyResults = await db.select()
        .from(judicialBodies)
        .where(sql`LOWER(name) LIKE ${searchLower}`)
        .limit(3);

      bodyResults.forEach(body => {
        results.push({
          type: 'judicial_body',
          id: body.id,
          title: body.name || 'هيئة قضائية',
          subtitle: body.type || '',
          href: `/?section=judicial-bodies`,
        });
      });
    } catch (e) {
      console.error('خطأ في البحث في الهيئات القضائية:', e);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return NextResponse.json({ error: 'حدث خطأ في البحث' }, { status: 500 });
  }
}
