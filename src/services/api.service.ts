/**
 * خدمة API المركزية
 * توفر دوال مساعدة لإنشاء استجابات API موحدة
 */

import { NextResponse } from 'next/server';

// أنواع الاستجابة
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * استجابة ناجحة
 */
export function successResponse<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

/**
 * استجابة ناجحة مع ترقيم الصفحات
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): NextResponse<ApiResponse<T[]>> {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * استجابة خطأ
 */
export function errorResponse(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * استجابة غير مصرح
 */
export function unauthorizedResponse(message: string = 'غير مصرح بالوصول'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}

/**
 * استجابة محظور
 */
export function forbiddenResponse(message: string = 'ليس لديك صلاحية للقيام بهذا الإجراء'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 403 }
  );
}

/**
 * استجابة غير موجود
 */
export function notFoundResponse(message: string = 'العنصر غير موجود'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 404 }
  );
}

/**
 * استجابة خطأ في الخادم
 */
export function serverErrorResponse(message: string = 'حدث خطأ في الخادم'): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 500 }
  );
}

/**
 * معلمات الترقيم من URL
 */
export function getPaginationParams(searchParams: URLSearchParams): { page: number; limit: number; offset: number } {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // الحد الأقصى 100
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

/**
 * التحقق من المعرف
 */
export function parseId(id: string | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id);
  return isNaN(parsed) ? null : parsed;
}

/**
 * التحقق من الحقول المطلوبة
 */
export function validateRequired(data: Record<string, any>, fields: string[]): { valid: boolean; missing?: string[] } {
  const missing = fields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  return {
    valid: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}
