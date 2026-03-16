import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { sql } from 'drizzle-orm';
import { requireAuth } from '@/lib/helpers';
import { safeParseInt } from '@/lib/validations';

// ==================== أنواع ====================

interface SearchResult {
  type: 'client' | 'case' | 'lawyer' | 'organization' | 'judicialBody' | 'session';
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  matchedFields: string[];
  icon?: string;
  badges?: { label: string; color: string }[];
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

// ==================== دوال مساعدة ====================

function calculateScore(searchTerm: string, fieldValue: string | null): number {
  if (!fieldValue) return 0;
  
  const term = searchTerm.toLowerCase();
  const value = fieldValue.toLowerCase();
  
  // تطابق كامل
  if (value === term) return 100;
  
  // تطابق يبدأ بـ
  if (value.startsWith(term)) return 70;
  
  // تطابق يحتوي
  if (value.includes(term)) return 50;
  
  // تطابق جزئي
  const termChars = term.split('');
  const valueChars = value.split('');
  let matchCount = 0;
  for (const char of termChars) {
    if (valueChars.includes(char)) matchCount++;
  }
  
  return Math.round((matchCount / termChars.length) * 30);
}

// ==================== دوال البحث ====================

async function searchClients(query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchPattern = `%${query}%`;
  
  try {
    const clients = await db.select()
      .from(schema.clients)
      .where(sql`(
        ${schema.clients.fullName} LIKE ${searchPattern} COLLATE NOCASE
        OR ${schema.clients.phone} LIKE ${searchPattern}
        OR ${schema.clients.address} LIKE ${searchPattern} COLLATE NOCASE
        OR ${schema.clients.businessName} LIKE ${searchPattern} COLLATE NOCASE
      )`)
      .limit(limit);
    
    for (const client of clients) {
      let score = 0;
      const matchedFields: string[] = [];
      
      const nameScore = calculateScore(query, client.fullName);
      if (nameScore > 0) {
        score += nameScore;
        matchedFields.push('الاسم');
      }
      
      const phoneScore = calculateScore(query, client.phone);
      if (phoneScore > 0) {
        score += phoneScore;
        matchedFields.push('الهاتف');
      }
      
      if (score > 0) {
        results.push({
          type: 'client',
          id: client.id,
          title: client.fullName || client.businessName || 'موكل بدون اسم',
          subtitle: client.phone || 'بدون هاتف',
          href: `/?section=clients&id=${client.id}`,
          score,
          matchType: score >= 70 ? 'exact' : score >= 50 ? 'partial' : 'fuzzy',
          matchedFields,
        });
      }
    }
  } catch (error) {
    console.error('خطأ في البحث عن الموكلين:', error);
  }
  
  return results;
}

async function searchCases(query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchPattern = `%${query}%`;
  
  try {
    const casesList = await db.select()
      .from(schema.cases)
      .where(sql`(
        ${schema.cases.caseNumber} LIKE ${searchPattern}
        OR ${schema.cases.subject} LIKE ${searchPattern} COLLATE NOCASE
        OR ${schema.cases.notes} LIKE ${searchPattern} COLLATE NOCASE
      )`)
      .limit(limit);
    
    const statusLabels: Record<string, string> = {
      active: 'نشطة',
      adjourned: 'مؤجلة',
      judged: 'محكوم',
      closed: 'مغلقة',
      archived: 'مؤرشفة',
    };
    
    for (const caseItem of casesList) {
      let score = 0;
      const matchedFields: string[] = [];
      
      const numberScore = calculateScore(query, caseItem.caseNumber);
      if (numberScore > 0) {
        score += numberScore * 1.5;
        matchedFields.push('رقم القضية');
      }
      
      const subjectScore = calculateScore(query, caseItem.subject);
      if (subjectScore > 0) {
        score += subjectScore;
        matchedFields.push('الموضوع');
      }
      
      if (score > 0) {
        results.push({
          type: 'case',
          id: caseItem.id,
          title: caseItem.caseNumber || 'قضية بدون رقم',
          subtitle: caseItem.subject?.substring(0, 50) || 'بدون موضوع',
          description: `الحالة: ${statusLabels[caseItem.status || 'active']}`,
          href: `/?section=cases&id=${caseItem.id}`,
          score,
          matchType: score >= 70 ? 'exact' : score >= 50 ? 'partial' : 'fuzzy',
          matchedFields,
        });
      }
    }
  } catch (error) {
    console.error('خطأ في البحث عن القضايا:', error);
  }
  
  return results;
}

async function searchLawyers(query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchPattern = `%${query}%`;
  
  try {
    const lawyers = await db.select()
      .from(schema.lawyers)
      .where(sql`(
        ${schema.lawyers.firstName} LIKE ${searchPattern} COLLATE NOCASE
        OR ${schema.lawyers.lastName} LIKE ${searchPattern} COLLATE NOCASE
        OR ${schema.lawyers.phone} LIKE ${searchPattern}
      )`)
      .limit(limit);
    
    for (const lawyer of lawyers) {
      const fullName = `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim();
      const score = calculateScore(query, fullName) + calculateScore(query, lawyer.phone);
      
      if (score > 0) {
        results.push({
          type: 'lawyer',
          id: lawyer.id,
          title: fullName || 'محامي بدون اسم',
          subtitle: lawyer.phone || 'بدون هاتف',
          href: `/?section=lawyers&id=${lawyer.id}`,
          score,
          matchType: score >= 70 ? 'exact' : score >= 50 ? 'partial' : 'fuzzy',
          matchedFields: score > 0 ? ['الاسم'] : [],
        });
      }
    }
  } catch (error) {
    console.error('خطأ في البحث عن المحامين:', error);
  }
  
  return results;
}

async function searchJudicialBodies(query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const searchPattern = `%${query}%`;
  
  try {
    const bodies = await db.select()
      .from(schema.judicialBodies)
      .where(sql`${schema.judicialBodies.name} LIKE ${searchPattern} COLLATE NOCASE`)
      .limit(limit);
    
    const typeLabels: Record<string, string> = {
      supreme_court: 'المحكمة العليا',
      judicial_council: 'مجلس قضائي',
      court: 'محكمة',
      admin_appeal_court: 'محكمة إدارية استئنافية',
      admin_court: 'محكمة إدارية',
    };
    
    for (const body of bodies) {
      const score = calculateScore(query, body.name);
      
      if (score > 0) {
        results.push({
          type: 'judicialBody',
          id: body.id,
          title: body.name,
          subtitle: typeLabels[body.type || 'court'] || body.type,
          href: `/?section=judicial-bodies&id=${body.id}`,
          score,
          matchType: score >= 70 ? 'exact' : score >= 50 ? 'partial' : 'fuzzy',
          matchedFields: ['الاسم'],
        });
      }
    }
  } catch (error) {
    console.error('خطأ في البحث عن الهيئات القضائية:', error);
  }
  
  return results;
}

// ==================== API Handler ====================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limit = Math.min(safeParseInt(searchParams.get('limit')) || 20, 100);

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ 
        results: [], 
        query: '',
        total: 0,
      });
    }

    const normalizedQuery = query.trim();
    const allResults: SearchResult[] = [];
    
    // تنفيذ عمليات البحث
    const limitPerType = Math.ceil(limit / 4);
    
    allResults.push(...await searchClients(normalizedQuery, limitPerType));
    allResults.push(...await searchCases(normalizedQuery, limitPerType));
    allResults.push(...await searchLawyers(normalizedQuery, limitPerType));
    allResults.push(...await searchJudicialBodies(normalizedQuery, limitPerType));
    
    // ترتيب حسب الدرجة
    allResults.sort((a, b) => b.score - a.score);
    
    // أخذ العدد المطلوب
    const finalResults = allResults.slice(0, limit);
    
    return NextResponse.json({
      results: finalResults,
      query: normalizedQuery,
      total: finalResults.length,
    });
  } catch (error) {
    console.error('خطأ في البحث:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ في البحث',
      details: error instanceof Error ? error.message : 'خطأ غير معروف'
    }, { status: 500 });
  }
}
