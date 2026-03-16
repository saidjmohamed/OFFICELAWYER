import { NextResponse } from 'next/server';
import { initializeDatabase, createTables, seedDatabase } from '@/db/init';
import { getCurrentMode } from '@/db';

// FIX 24: Removed module-level initialized flag — seedDatabase() already checks internally
export async function GET() {
  try {
    const mode = getCurrentMode();

    // Always run createTables to ensure migrations
    await createTables();
    await seedDatabase();

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح',
      initialized: true,
      mode: mode
    });
  } catch (error) {
    console.error('خطأ في تهيئة قاعدة البيانات:', error);
    // FIX 6: Removed details and stack from error response
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تهيئة قاعدة البيانات',
      },
      { status: 500 }
    );
  }
}
