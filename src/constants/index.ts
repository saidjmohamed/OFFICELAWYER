/**
 * الثوابت المشتركة للتطبيق
 */

// ===== رموز HTTP =====
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ===== رسائل الخطأ =====
export const ERROR_MESSAGES = {
  // مصادقة
  UNAUTHORIZED: 'غير مصرح بالوصول',
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  SESSION_EXPIRED: 'انتهت صلاحية الجلسة',
  PASSWORD_MISMATCH: 'كلمة المرور غير متطابقة',
  
  // صلاحيات
  FORBIDDEN: 'لا تملك الصلاحية لتنفيذ هذا الإجراء',
  INSUFFICIENT_PERMISSIONS: 'صلاحيات غير كافية',
  
  // قاعدة بيانات
  NOT_FOUND: 'العنصر غير موجود',
  ALREADY_EXISTS: 'العنصر موجود مسبقاً',
  DATABASE_ERROR: 'حدث خطأ في قاعدة البيانات',
  
  // مدخلات
  INVALID_INPUT: 'بيانات الإدخال غير صالحة',
  MISSING_REQUIRED_FIELDS: 'حقول مطلوبة ناقصة',
  INVALID_ID: 'المعرف غير صالح',
  
  // عام
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع',
  OPERATION_FAILED: 'فشلت العملية',
  RATE_LIMIT_EXCEEDED: 'تم تجاوز عدد المحاولات المسموحة',
} as const;

// ===== رسائل النجاح =====
export const SUCCESS_MESSAGES = {
  // عمليات CRUD
  CREATED: 'تم الإضافة بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  
  // مصادقة
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
  PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
  
  // نسخ احتياطي
  BACKUP_CREATED: 'تم إنشاء النسخة الاحتياطية',
  BACKUP_RESTORED: 'تم استرجاع النسخة الاحتياطية',
  
  // عام
  OPERATION_SUCCESS: 'تمت العملية بنجاح',
  SAVED: 'تم الحفظ',
} as const;

// ===== القيم الافتراضية =====
export const DEFAULT_VALUES = {
  // Pagination
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // الأمان
  MIN_PASSWORD_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  SESSION_DURATION_DAYS: 7,
  
  // الملفات
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  
  // التواريخ
  DATE_FORMAT: 'ar-DZ',
  CURRENCY_LOCALE: 'ar-DZ',
} as const;

// ===== حالات القضايا =====
export const CASE_STATUS = {
  ACTIVE: 'active',
  ADJOURNED: 'adjourned',
  JUDGED: 'judged',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const;

export const CASE_STATUS_LABELS: Record<string, string> = {
  active: 'نشطة',
  adjourned: 'مؤجلة',
  judged: 'محكوم فيها',
  closed: 'مغلقة',
  archived: 'مؤرشفة',
} as const;

// ===== أنواع القضايا =====
export const CASE_TYPES = {
  OPENING_PETITION: 'opening_petition',
  OPPOSITION: 'opposition',
  APPEAL: 'appeal',
  CASSATION: 'cassation',
  NEW_CLAIM: 'new_claim',
} as const;

export const CASE_TYPE_LABELS: Record<string, string> = {
  opening_petition: 'عريضة افتتاحية',
  opposition: 'معارضة',
  appeal: 'استئناف',
  cassation: 'طعن بالنقض',
  new_claim: 'دعوى جديدة',
} as const;

// ===== أنواع الهيئات القضائية =====
export const JUDICIAL_BODY_TYPES = {
  SUPREME_COURT: 'supreme_court',
  COUNCIL: 'council',
  COURT: 'court',
  ADMINISTRATIVE_COURT: 'administrative_court',
} as const;

export const JUDICIAL_BODY_TYPE_LABELS: Record<string, string> = {
  supreme_court: 'المحكمة العليا',
  council: 'مجلس قضائي',
  court: 'محكمة',
  administrative_court: 'محكمة إدارية',
} as const;

// ===== أنواع المستخدمين =====
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  LAWYER: 'lawyer',
  ASSISTANT: 'assistant',
  VIEWER: 'viewer',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'مدير النظام',
  manager: 'مدير',
  lawyer: 'محامي',
  assistant: 'مساعد',
  viewer: 'مشاهد',
} as const;

// ===== الصلاحيات =====
export const PERMISSIONS = {
  // القضايا
  CASES_VIEW: 'cases:view',
  CASES_CREATE: 'cases:create',
  CASES_UPDATE: 'cases:update',
  CASES_DELETE: 'cases:delete',
  
  // الموكلين
  CLIENTS_VIEW: 'clients:view',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',
  
  // الجلسات
  SESSIONS_VIEW: 'sessions:view',
  SESSIONS_CREATE: 'sessions:create',
  SESSIONS_UPDATE: 'sessions:update',
  SESSIONS_DELETE: 'sessions:delete',
  
  // المحامين
  LAWYERS_VIEW: 'lawyers:view',
  LAWYERS_CREATE: 'lawyers:create',
  LAWYERS_UPDATE: 'lawyers:update',
  LAWYERS_DELETE: 'lawyers:delete',
  
  // الإعدادات
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // النسخ الاحتياطي
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  
  // المستخدمين
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
} as const;

// ===== صلاحيات الأدوار الافتراضية =====
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.CASES_VIEW, PERMISSIONS.CASES_CREATE, PERMISSIONS.CASES_UPDATE, PERMISSIONS.CASES_DELETE,
    PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_CREATE, PERMISSIONS.CLIENTS_UPDATE, PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.SESSIONS_VIEW, PERMISSIONS.SESSIONS_CREATE, PERMISSIONS.SESSIONS_UPDATE,
    PERMISSIONS.LAWYERS_VIEW, PERMISSIONS.LAWYERS_CREATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  lawyer: [
    PERMISSIONS.CASES_VIEW, PERMISSIONS.CASES_CREATE, PERMISSIONS.CASES_UPDATE,
    PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_CREATE, PERMISSIONS.CLIENTS_UPDATE,
    PERMISSIONS.SESSIONS_VIEW, PERMISSIONS.SESSIONS_CREATE, PERMISSIONS.SESSIONS_UPDATE,
    PERMISSIONS.LAWYERS_VIEW,
  ],
  assistant: [
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CLIENTS_VIEW, PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.SESSIONS_VIEW,
  ],
  viewer: [
    PERMISSIONS.CASES_VIEW,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.SESSIONS_VIEW,
    PERMISSIONS.LAWYERS_VIEW,
  ],
};
