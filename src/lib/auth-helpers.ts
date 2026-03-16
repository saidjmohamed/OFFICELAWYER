// FIX 5: Auth helper for API routes
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const authenticated = cookieStore.get('authenticated');

  if (authenticated?.value !== 'true') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  return null; // authenticated
}
