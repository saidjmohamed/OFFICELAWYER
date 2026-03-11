import { NextResponse } from 'next/server';
import { initializeDatabase, createTables, seedDatabase } from '@/db/init';
import { getCurrentMode } from '@/db';

let initialized = false;

export async function GET() {
  try {
    const mode = getCurrentMode();
    
    // Always run createTables to ensure migrations
    await createTables();
    
    if (!initialized) {
      await seedDatabase();
      initialized = true;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم تهيئة قاعدة البيانات بنجاح',
      initialized: true,
      mode: mode
    });
  } catch (error) {
    console.error('خطأ في تهيئة قاعدة البيانات:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'فشل في تهيئة قاعدة البيانات',
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
