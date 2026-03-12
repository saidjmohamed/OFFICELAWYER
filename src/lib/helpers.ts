/**
 * دوال مساعدة عامة
 */

// ===== تنسيق التواريخ =====

/**
 * تنسيق التاريخ بالعربية
 */
export function formatDate(date: Date | string | number | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * تنسيق التاريخ والوقت
 */
export function formatDateTime(date: Date | string | number | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  
  return d.toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * تنسيق التاريخ للـ input
 */
export function formatDateForInput(date: Date | string | number | null): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toISOString().split('T')[0];
}

// ===== تنسيق الأرقام والعملة =====

/**
 * تنسيق المبلغ بالدينار الجزائري
 */
export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-';
  return `${amount.toLocaleString('ar-DZ')} د.ج`;
}

/**
 * تنسيق الأرقام
 */
export function formatNumber(num: number | null): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('ar-DZ');
}

// ===== النصوص =====

/**
 * اقتطاع النص
 */
export function truncate(text: string | null, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * تحويل النص إلى slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * توليد معرف فريد
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * توليد رقم عشوائي
 */
export function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * توليد كلمة مرور عشوائية
 */
export function generateRandomPassword(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ===== التحقق =====

/**
 * التحقق من صحة البريد الإلكتروني
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف الجزائري
 */
export function isValidPhoneNumber(phone: string): boolean {
  // يدعم الأرقام الجزائرية: 05XX, 06XX, 07XX
  const phoneRegex = /^(0[567]\d{8}|\+213[567]\d{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * التحقق من قوة كلمة المرور
 */
export function checkPasswordStrength(password: string): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  if (password.length < 6) feedback.push('يجب أن تكون 6 أحرف على الأقل');
  if (!/[A-Z]/.test(password)) feedback.push('أضف حرف كبير');
  if (!/[0-9]/.test(password)) feedback.push('أضف رقم');
  
  return { score, feedback };
}

// ===== المصفوفات =====

/**
 * إزالة التكرار من مصفوفة
 */
export function uniqueArray<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * تجميع مصفوفة حسب مفتاح
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * ترتيب مصفوفة حسب مفتاح
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc' 
        ? aVal.localeCompare(bVal, 'ar')
        : bVal.localeCompare(aVal, 'ar');
    }
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });
}

// ===== الكائنات =====

/**
 * إزالة القيم الفارغة من كائن
 */
export function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * اختيار حقول من كائن
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

// ===== الملفات =====

/**
 * تحويل حجم الملف إلى صيغة مقروءة
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 بايت';
  const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * الحصول على امتداد الملف
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

// ===== التاريخ =====

/**
 * الحصول على بداية اليوم
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * الحصول على نهاية اليوم
 */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * إضافة أيام
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * الفرق بالأيام بين تاريخين
 */
export function daysDiff(date1: Date, date2: Date): number {
  const diff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
