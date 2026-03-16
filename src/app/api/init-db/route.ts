import { NextResponse } from 'next/server';
import { createTables, seedDatabase } from '@/db/init';

let initialized = false;

export async function GET() {
  try {
    // Always run createTables to ensure migrations
    await createTables();
    
    if (!initialized) {
      await seedDatabase();
      initialized = true;
    }
    return NextResponse.json({ 
      success: true, 
      message: 'تم تهيئة قاعدة البيانات بنجاح',
      initialized: true 
    });
  } catch (error) {
    console.error('خطأ في تهيئة قاعدة البيانات:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'فشل في تهيئة قاعدة البيانات',
      },
      { status: 500 }
    );
  }
}
