// ==================== الأدوار والصلاحيات ====================

// الأدوار الافتراضية للنظام
export const defaultRoles = [
  {
    name: 'admin',
    nameAr: 'مدير النظام',
    description: 'صلاحيات كاملة على النظام',
    isSystem: true,
  },
  {
    name: 'manager',
    nameAr: 'مدير',
    description: 'إدارة القضايا والموكلين والمحامين',
    isSystem: true,
  },
  {
    name: 'lawyer',
    nameAr: 'محامي',
    description: 'إدارة القضايا الخاصة والموكلين',
    isSystem: true,
  },
  {
    name: 'assistant',
    nameAr: 'مساعد',
    description: 'عرض وإضافة بعض البيانات',
    isSystem: true,
  },
  {
    name: 'viewer',
    nameAr: 'مشاهد',
    description: 'عرض البيانات فقط',
    isSystem: true,
  },
];

// الصلاحيات الافتراضية للنظام
export const defaultPermissions = [
  // صلاحيات القضايا
  { name: 'cases:view', nameAr: 'عرض القضايا', scope: 'cases', type: 'read' as const, description: 'عرض تفاصيل القضايا' },
  { name: 'cases:create', nameAr: 'إضافة قضايا', scope: 'cases', type: 'write' as const, description: 'إنشاء قضايا جديدة' },
  { name: 'cases:update', nameAr: 'تعديل القضايا', scope: 'cases', type: 'write' as const, description: 'تعديل بيانات القضايا' },
  { name: 'cases:delete', nameAr: 'حذف القضايا', scope: 'cases', type: 'delete' as const, description: 'حذف القضايا' },
  
  // صلاحيات الموكلين
  { name: 'clients:view', nameAr: 'عرض الموكلين', scope: 'clients', type: 'read' as const, description: 'عرض بيانات الموكلين' },
  { name: 'clients:create', nameAr: 'إضافة موكلين', scope: 'clients', type: 'write' as const, description: 'إضافة موكلين جدد' },
  { name: 'clients:update', nameAr: 'تعديل الموكلين', scope: 'clients', type: 'write' as const, description: 'تعديل بيانات الموكلين' },
  { name: 'clients:delete', nameAr: 'حذف الموكلين', scope: 'clients', type: 'delete' as const, description: 'حذف الموكلين' },
  
  // صلاحيات الجلسات
  { name: 'sessions:view', nameAr: 'عرض الجلسات', scope: 'sessions', type: 'read' as const, description: 'عرض الجلسات' },
  { name: 'sessions:create', nameAr: 'إضافة جلسات', scope: 'sessions', type: 'write' as const, description: 'إضافة جلسات جديدة' },
  { name: 'sessions:update', nameAr: 'تعديل الجلسات', scope: 'sessions', type: 'write' as const, description: 'تعديل الجلسات' },
  { name: 'sessions:delete', nameAr: 'حذف الجلسات', scope: 'sessions', type: 'delete' as const, description: 'حذف الجلسات' },
  
  // صلاحيات المحامين
  { name: 'lawyers:view', nameAr: 'عرض المحامين', scope: 'lawyers', type: 'read' as const, description: 'عرض بيانات المحامين' },
  { name: 'lawyers:create', nameAr: 'إضافة محامين', scope: 'lawyers', type: 'write' as const, description: 'إضافة محامين جدد' },
  { name: 'lawyers:update', nameAr: 'تعديل المحامين', scope: 'lawyers', type: 'write' as const, description: 'تعديل بيانات المحامين' },
  { name: 'lawyers:delete', nameAr: 'حذف المحامين', scope: 'lawyers', type: 'delete' as const, description: 'حذف المحامين' },
  
  // صلاحيات الإعدادات
  { name: 'settings:view', nameAr: 'عرض الإعدادات', scope: 'settings', type: 'read' as const, description: 'عرض الإعدادات' },
  { name: 'settings:update', nameAr: 'تعديل الإعدادات', scope: 'settings', type: 'write' as const, description: 'تعديل الإعدادات' },
  
  // صلاحيات النسخ الاحتياطي
  { name: 'backup:create', nameAr: 'إنشاء نسخة احتياطية', scope: 'backup', type: 'write' as const, description: 'إنشاء نسخ احتياطية' },
  { name: 'backup:restore', nameAr: 'استعادة نسخة احتياطية', scope: 'backup', type: 'admin' as const, description: 'استعادة النسخ الاحتياطية' },
  
  // صلاحيات المستخدمين
  { name: 'users:view', nameAr: 'عرض المستخدمين', scope: 'users', type: 'read' as const, description: 'عرض قائمة المستخدمين' },
  { name: 'users:create', nameAr: 'إضافة مستخدمين', scope: 'users', type: 'write' as const, description: 'إضافة مستخدمين جدد' },
  { name: 'users:update', nameAr: 'تعديل المستخدمين', scope: 'users', type: 'write' as const, description: 'تعديل بيانات المستخدمين' },
  { name: 'users:delete', nameAr: 'حذف المستخدمين', scope: 'users', type: 'delete' as const, description: 'حذف المستخدمين' },
];

// صلاحيات الأدوار
export const rolePermissionsMap: Record<string, string[]> = {
  admin: [
    'cases:view', 'cases:create', 'cases:update', 'cases:delete',
    'clients:view', 'clients:create', 'clients:update', 'clients:delete',
    'sessions:view', 'sessions:create', 'sessions:update', 'sessions:delete',
    'lawyers:view', 'lawyers:create', 'lawyers:update', 'lawyers:delete',
    'settings:view', 'settings:update',
    'backup:create', 'backup:restore',
    'users:view', 'users:create', 'users:update', 'users:delete',
  ],
  manager: [
    'cases:view', 'cases:create', 'cases:update', 'cases:delete',
    'clients:view', 'clients:create', 'clients:update', 'clients:delete',
    'sessions:view', 'sessions:create', 'sessions:update',
    'lawyers:view', 'lawyers:create',
    'settings:view',
    'users:view',
  ],
  lawyer: [
    'cases:view', 'cases:create', 'cases:update',
    'clients:view', 'clients:create', 'clients:update',
    'sessions:view', 'sessions:create', 'sessions:update',
    'lawyers:view',
  ],
  assistant: [
    'cases:view',
    'clients:view', 'clients:create',
    'sessions:view',
  ],
  viewer: [
    'cases:view',
    'clients:view',
    'sessions:view',
    'lawyers:view',
  ],
};

// المستخدم المدير الافتراضي
export const defaultAdminUser = {
  username: 'admin',
  password: 'admin123', // سيتم تجزئته عند الإنشاء
  email: 'admin@officelawyer.local',
  fullName: 'مدير النظام',
  role: 'admin',
  status: 'active' as const,
};

// الولايات الجزائرية الـ 58 مرتبة حسب الرقم
export const algerianWilayas = [
  { number: 1, name: 'أدرار' },
  { number: 2, name: 'الشلف' },
  { number: 3, name: 'الأغواط' },
  { number: 4, name: 'أم البواقي' },
  { number: 5, name: 'باتنة' },
  { number: 6, name: 'بجاية' },
  { number: 7, name: 'بسكرة' },
  { number: 8, name: 'بشار' },
  { number: 9, name: 'البليدة' },
  { number: 10, name: 'البويرة' },
  { number: 11, name: 'تمنراست' },
  { number: 12, name: 'تبسة' },
  { number: 13, name: 'تلمسان' },
  { number: 14, name: 'تيارت' },
  { number: 15, name: 'تيزي وزو' },
  { number: 16, name: 'الجزائر' },
  { number: 17, name: 'الجلفة' },
  { number: 18, name: 'جيجل' },
  { number: 19, name: 'سطيف' },
  { number: 20, name: 'سعيدة' },
  { number: 21, name: 'سكيكدة' },
  { number: 22, name: 'سيدي بلعباس' },
  { number: 23, name: 'عنابة' },
  { number: 24, name: 'قالمة' },
  { number: 25, name: 'قسنطينة' },
  { number: 26, name: 'المدية' },
  { number: 27, name: 'مستغانم' },
  { number: 28, name: 'المسيلة' },
  { number: 29, name: 'معسكر' },
  { number: 30, name: 'ورقلة' },
  { number: 31, name: 'وهران' },
  { number: 32, name: 'البيض' },
  { number: 33, name: 'إليزي' },
  { number: 34, name: 'برج بوعريريج' },
  { number: 35, name: 'بومرداس' },
  { number: 36, name: 'الطارف' },
  { number: 37, name: 'تندوف' },
  { number: 38, name: 'تيسمسيلت' },
  { number: 39, name: 'الوادي' },
  { number: 40, name: 'خنشلة' },
  { number: 41, name: 'سوق أهراس' },
  { number: 42, name: 'تيبازة' },
  { number: 43, name: 'ميلة' },
  { number: 44, name: 'عين الدفلى' },
  { number: 45, name: 'النعامة' },
  { number: 46, name: 'عين تموشنت' },
  { number: 47, name: 'غرداية' },
  { number: 48, name: 'غليزان' },
  { number: 49, name: 'تيميمون' },
  { number: 50, name: 'برج باجي مختار' },
  { number: 51, name: 'أولاد جلال' },
  { number: 52, name: 'بني عباس' },
  { number: 53, name: 'عين صالح' },
  { number: 54, name: 'عين قزام' },
  { number: 55, name: 'تقرت' },
  { number: 56, name: 'جانت' },
  { number: 57, name: 'المغير' },
  { number: 58, name: 'المنيعة' },
];

// أنواع الهيئات القضائية
export const judicialBodyTypes = [
  { value: 'judicial_council', label: 'مجلس قضائي' },
  { value: 'court', label: 'محكمة' },
  { value: 'supreme_court', label: 'المحكمة العليا' },
  { value: 'state_council', label: 'مجلس الدولة' },
  { value: 'administrative_court', label: 'محكمة إدارية' },
  { value: 'admin_appeal_court', label: 'محكمة إدارية استئنافية' },
  { value: 'commercial_court', label: 'محكمة تجارية متخصصة' },
];

// الأنواع المستقلة (لا تحتاج مجلس أم)
export const independentBodyTypes = [
  'supreme_court',
  'state_council',
  'administrative_court',
  'admin_appeal_court',
  'commercial_court',
];

// أنواع القضايا
export const caseTypes = [
  'مدني',
  'جزائي',
  'تجاري',
  'أحوال شخصية',
  'عقاري',
  'عمل',
  'إداري',
];

// حالات القضايا
export const caseStatuses = [
  { value: 'active', label: 'نشطة' },
  { value: 'adjourned', label: 'مؤجلة' },
  { value: 'judged', label: 'محكوم فيها' },
  { value: 'closed', label: 'مغلقة' },
];
