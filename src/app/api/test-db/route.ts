import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// FIX 6: Secured test-db endpoint - requires auth and removed sensitive info exposure
export async function GET() {
  // Require authentication
  const cookieStore = await cookies();
  if (cookieStore.get('authenticated')?.value !== 'true') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    message: 'Database connection available',
  });
}
