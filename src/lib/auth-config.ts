/**
 * Authentication Configuration - تكوين المصادقة
 * 
 * يدعم:
 * - Database: تخزين الرمز في قاعدة البيانات
 * - LocalStorage: تخزين الرمز محلياً (للعمل offline)
 * - Auto: اختيار تلقائي حسب البيئة
 */

export type AuthMode = 'database' | 'localstorage' | 'auto';

export interface AuthConfig {
  mode: AuthMode;
  defaultPasscode: string;
}

// الرمز الافتراضي
export const DEFAULT_PASSCODE = '123456';

// الحصول على تكوين المصادقة
export function getAuthConfig(): AuthConfig {
  const mode: AuthMode = (process.env.AUTH_MODE as AuthMode) || 'auto';
  
  return {
    mode,
    defaultPasscode: process.env.DEFAULT_PASSCODE || DEFAULT_PASSCODE,
  };
}

// التحقق من صحة الرمز (للاستخدام في الخادم)
export function isValidPasscode(input: string, stored: string): boolean {
  return input === stored && input.length === 6;
}
