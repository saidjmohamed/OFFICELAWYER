import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth(): Promise<{ authenticated: true } | NextResponse> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  const authenticated = cookieStore.get('authenticated')?.value;

  if (sessionId) {
    // New session-based auth
    return { authenticated: true };
  }

  if (authenticated === 'true') {
    // Legacy passcode-based auth (deprecated but maintained for compatibility)
    return { authenticated: true };
  }

  return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
}
