import { NextResponse } from 'next/server';
import { db } from '@/db';
import { cases, sessions, clients, activities, caseClients, calendarEvents, caseFiles, caseExpenses, lawyers, organizations } from '@/db/schema';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  // Simple key verification
  if (key !== 'purge-all-data-now-2025') {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  console.log('🗑️ Purging all test data...');
  
  const results: string[] = [];
  
  try { await db.delete(calendarEvents); results.push('✓ calendarEvents'); } catch (e: any) { results.push(`✗ calendarEvents: ${e.message}`); }
  try { await db.delete(caseExpenses); results.push('✓ caseExpenses'); } catch (e: any) { results.push(`✗ caseExpenses: ${e.message}`); }
  try { await db.delete(caseFiles); results.push('✓ caseFiles'); } catch (e: any) { results.push(`✗ caseFiles: ${e.message}`); }
  try { await db.delete(sessions); results.push('✓ sessions'); } catch (e: any) { results.push(`✗ sessions: ${e.message}`); }
  try { await db.delete(caseClients); results.push('✓ caseClients'); } catch (e: any) { results.push(`✗ caseClients: ${e.message}`); }
  try { await db.delete(cases); results.push('✓ cases'); } catch (e: any) { results.push(`✗ cases: ${e.message}`); }
  try { await db.delete(clients); results.push('✓ clients'); } catch (e: any) { results.push(`✗ clients: ${e.message}`); }
  try { await db.delete(lawyers); results.push('✓ lawyers'); } catch (e: any) { results.push(`✗ lawyers: ${e.message}`); }
  try { await db.delete(organizations); results.push('✓ organizations'); } catch (e: any) { results.push(`✗ organizations: ${e.message}`); }
  try { await db.delete(activities); results.push('✓ activities'); } catch (e: any) { results.push(`✗ activities: ${e.message}`); }

  return NextResponse.json({ 
    success: true,
    message: 'تم حذف جميع البيانات الاختبارية',
    results,
    timestamp: new Date().toISOString()
  });
}
