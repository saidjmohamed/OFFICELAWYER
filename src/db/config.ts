/**
 * Database Configuration - تكوين قاعدة البيانات
 * 
 * يدعم ثلاثة أوضاع:
 * 1. local: SQLite محلي للتطوير والاستخدام المحلي
 * 2. turso: Turso سحابي للنشر على Vercel/Netlify
 * 3. auto: اختيار تلقائي حسب البيئة
 */

export type DatabaseMode = 'local' | 'turso' | 'auto';

export interface DatabaseConfig {
  mode: DatabaseMode;
  isServerless: boolean;
  isDevelopment: boolean;
}

// تحديد بيئة التشغيل
export function getDatabaseConfig(): DatabaseConfig {
  const isServerless = 
    process.env.NETLIFY === 'true' || 
    process.env.VERCEL === '1' ||
    process.env.RENDER === 'true' ||
    !!process.env.TURSO_DATABASE_URL;

  const isDevelopment = 
    process.env.NODE_ENV === 'development' && 
    !isServerless;

  // تحديد الوضع
  let mode: DatabaseMode = 'auto';
  
  const envMode = process.env.DATABASE_MODE as DatabaseMode;
  if (envMode && ['local', 'turso', 'auto'].includes(envMode)) {
    mode = envMode;
  }

  // في الوضع التلقائي، نختار حسب البيئة
  if (mode === 'auto') {
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
      mode = 'turso';
    } else {
      mode = 'local';
    }
  }

  return {
    mode,
    isServerless,
    isDevelopment,
  };
}

// التحقق من توفر Turso
export function hasTursoConfig(): boolean {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

// مسار قاعدة البيانات المحلية
export function getLocalDatabasePath(): string {
  return process.env.DATABASE_PATH || 'file:local.db';
}

// تنظيف URL من الأحرف الزائدة وتحويل libsql:// إلى https://
function cleanUrl(url: string): string {
  let cleaned = url.trim();
  // إزالة الأحرف الزائدة مثل \n, \r, مسافات
  cleaned = cleaned.replace(/[\n\r\s]+/g, '');
  // تحويل libsql:// إلى https://
  if (cleaned.startsWith('libsql://')) {
    cleaned = cleaned.replace('libsql://', 'https://');
  }
  return cleaned;
}

// إعدادات Turso
export function getTursoConfig() {
  const rawUrl = process.env.TURSO_DATABASE_URL || '';
  const cleanedUrl = cleanUrl(rawUrl);
  
  console.log('🔍 Database URL debug:', {
    rawLength: rawUrl.length,
    cleanedLength: cleanedUrl.length,
    startsWith: cleanedUrl.substring(0, 30) + '...',
  });
  
  return {
    url: cleanedUrl,
    authToken: (process.env.TURSO_AUTH_TOKEN || '').trim(),
  };
}
