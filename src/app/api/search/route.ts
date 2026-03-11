import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { clients, cases, sessions } from '@/db/schema';
import { like, or, ilike } from 'drizzle-orm';
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

    // البحث في الموكلين
    const clientResults = await db.select()
      .from(clients)
      .where(or(
        ilike(clients.fullName, `%${query}%`),
        ilike(clients.phone, `%${query}%`),
        ilike(clients.address, `%${query}%`)
      ))
      .limit(5);

    clientResults.forEach(client => {
      results.push({
        type: 'client',
        id: client.id,
        title: client.fullName || 'موكل بدون اسم',
        subtitle: client.phone || 'بدون رقم هاتف',
        href: `/?section=clients&id=${client.id}`,
      });
    });

    // البحث في القضايا
    const caseResults = await db.select()
      .from(cases)
      .where(or(
        ilike(cases.caseNumber, `%${query}%`),
        ilike(cases.subject, `%${query}%`),
        ilike(cases.notes, `%${query}%`)
      ))
      .limit(5);

    caseResults.forEach(caseItem => {
      results.push({
        type: 'case',
        id: caseItem.id,
        title: caseItem.caseNumber || 'قضية بدون رقم',
        subtitle: caseItem.subject || 'بدون موضوع',
        href: `/?section=cases&id=${caseItem.id}`,
      });
    });

    // البحث في الجلسات
    const sessionResults = await db.select()
      .from(sessions)
      .where(or(
        ilike(sessions.decision, `%${query}%`),
        ilike(sessions.notes, `%${query}%`)
      ))
      .limit(5);

    sessionResults.forEach(session => {
      results.push({
        type: 'session',
        id: session.id,
        title: `جلسة ${session.id}`,
        subtitle: session.decision || 'بدون قرار',
        href: `/?section=sessions&id=${session.id}`,
      });
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return NextResponse.json({ error: 'حدث خطأ في البحث' }, { status: 500 });
  }
}
