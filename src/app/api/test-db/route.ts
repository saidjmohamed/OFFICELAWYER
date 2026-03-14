import { NextResponse } from 'next/server';
import { getTursoConfig, getDatabaseConfig } from '@/db/config';
import { createClient } from '@libsql/client';

export async function GET() {
  try {
    const config = getDatabaseConfig();
    const tursoConfig = getTursoConfig();
    
    // عرض معلومات التكوين (بدون إظهار القيم الحساسة كاملة)
    const debugInfo = {
      mode: config.mode,
      urlLength: tursoConfig.url.length,
      urlStart: tursoConfig.url.substring(0, 40) + '...',
      urlEnd: '...' + tursoConfig.url.substring(tursoConfig.url.length - 20),
      hasNewline: tursoConfig.url.includes('\n'),
      hasSpace: tursoConfig.url.includes(' '),
      authTokenLength: tursoConfig.authToken.length,
    };
    
    // محاولة الاتصال
    let connectionTest = 'not_tested';
    try {
      const client = createClient({
        url: tursoConfig.url,
        authToken: tursoConfig.authToken,
      });
      const result = await client.execute('SELECT 1 as test');
      connectionTest = result.rows.length > 0 ? 'success' : 'failed';
    } catch (connError) {
      connectionTest = connError instanceof Error ? connError.message : 'unknown_error';
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      connectionTest,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'خطأ غير معروف',
    }, { status: 500 });
  }
}
