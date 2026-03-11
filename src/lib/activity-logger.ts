// دالة مساعدة لتسجيل النشاطات
// يمكن استدعاؤها من أي مكان في التطبيق

export type ActivityAction =
  | 'case_created' | 'case_updated' | 'case_deleted' | 'case_status_changed' | 'case_archived'
  | 'client_created' | 'client_updated' | 'client_deleted'
  | 'session_created' | 'session_updated' | 'session_deleted'
  | 'judicial_body_created' | 'judicial_body_updated' | 'judicial_body_deleted'
  | 'lawyer_created' | 'lawyer_updated' | 'lawyer_deleted'
  | 'organization_created' | 'organization_updated' | 'organization_deleted'
  | 'backup_created' | 'backup_restored'
  | 'settings_updated'
  | 'login' | 'logout';

export type EntityType = 'case' | 'client' | 'session' | 'judicial_body' | 'lawyer' | 'organization' | 'backup' | 'settings' | 'auth';

interface LogActivityParams {
  action: ActivityAction;
  entityType?: EntityType;
  entityId?: number;
  description: string;
  details?: Record<string, unknown>;
}

// وصف الإجراءات بالعربية
const actionDescriptions: Partial<Record<ActivityAction, string>> = {
  case_created: 'تم إنشاء قضية جديدة',
  case_updated: 'تم تحديث القضية',
  case_deleted: 'تم حذف القضية',
  case_status_changed: 'تم تغيير حالة القضية',
  case_archived: 'تم أرشفة القضية',
  client_created: 'تم إضافة موكل جديد',
  client_updated: 'تم تحديث بيانات الموكل',
  client_deleted: 'تم حذف الموكل',
  session_created: 'تم إضافة جلسة جديدة',
  session_updated: 'تم تحديث الجلسة',
  session_deleted: 'تم حذف الجلسة',
  judicial_body_created: 'تم إضافة هيئة قضائية',
  judicial_body_updated: 'تم تحديث الهيئة القضائية',
  judicial_body_deleted: 'تم حذف الهيئة القضائية',
  lawyer_created: 'تم إضافة محامي جديد',
  lawyer_updated: 'تم تحديث بيانات المحامي',
  lawyer_deleted: 'تم حذف المحامي',
  organization_created: 'تم إضافة منظمة جديدة',
  organization_updated: 'تم تحديث المنظمة',
  organization_deleted: 'تم حذف المنظمة',
  backup_created: 'تم إنشاء نسخة احتياطية',
  backup_restored: 'تم استعادة نسخة احتياطية',
  settings_updated: 'تم تحديث الإعدادات',
  login: 'تم تسجيل الدخول',
  logout: 'تم تسجيل الخروج',
};

// أيقونات الإجراءات
export const actionIcons: Partial<Record<ActivityAction, string>> = {
  case_created: '📝',
  case_updated: '✏️',
  case_deleted: '🗑️',
  case_status_changed: '🔄',
  case_archived: '📦',
  client_created: '👤',
  client_updated: '✏️',
  client_deleted: '🗑️',
  session_created: '📅',
  session_updated: '✏️',
  session_deleted: '🗑️',
  judicial_body_created: '🏛️',
  judicial_body_updated: '✏️',
  judicial_body_deleted: '🗑️',
  lawyer_created: '⚖️',
  lawyer_updated: '✏️',
  lawyer_deleted: '🗑️',
  organization_created: '🏢',
  organization_updated: '✏️',
  organization_deleted: '🗑️',
  backup_created: '💾',
  backup_restored: '📥',
  settings_updated: '⚙️',
  login: '🔐',
  logout: '🚪',
};

// ألوان الإجراءات
export const actionColors: Partial<Record<ActivityAction, string>> = {
  case_created: 'text-green-600 bg-green-50',
  case_updated: 'text-blue-600 bg-blue-50',
  case_deleted: 'text-red-600 bg-red-50',
  case_status_changed: 'text-yellow-600 bg-yellow-50',
  case_archived: 'text-gray-600 bg-gray-50',
  client_created: 'text-green-600 bg-green-50',
  client_updated: 'text-blue-600 bg-blue-50',
  client_deleted: 'text-red-600 bg-red-50',
  session_created: 'text-green-600 bg-green-50',
  session_updated: 'text-blue-600 bg-blue-50',
  session_deleted: 'text-red-600 bg-red-50',
  judicial_body_created: 'text-green-600 bg-green-50',
  judicial_body_updated: 'text-blue-600 bg-blue-50',
  judicial_body_deleted: 'text-red-600 bg-red-50',
  lawyer_created: 'text-green-600 bg-green-50',
  lawyer_updated: 'text-blue-600 bg-blue-50',
  lawyer_deleted: 'text-red-600 bg-red-50',
  organization_created: 'text-green-600 bg-green-50',
  organization_updated: 'text-blue-600 bg-blue-50',
  organization_deleted: 'text-red-600 bg-red-50',
  backup_created: 'text-purple-600 bg-purple-50',
  backup_restored: 'text-indigo-600 bg-indigo-50',
  settings_updated: 'text-gray-600 bg-gray-50',
  login: 'text-green-600 bg-green-50',
  logout: 'text-gray-600 bg-gray-50',
};

/**
 * تسجيل نشاط جديد
 * هذه الدالة ترسل طلب POST إلى API لتسجيل النشاط
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  } catch (error) {
    // لا نريد أن تفشل العمليات الرئيسية بسبب فشل التسجيل
    console.error('خطأ في تسجيل النشاط:', error);
  }
}

/**
 * الحصول على وصف الإجراء بالعربية
 */
export function getActionDescription(action: ActivityAction): string {
  return actionDescriptions[action] || action;
}

/**
 * الحصول على أيقونة الإجراء
 */
export function getActionIcon(action: ActivityAction): string {
  return actionIcons[action] || '📌';
}

/**
 * الحصول على لون الإجراء
 */
export function getActionColor(action: ActivityAction): string {
  return actionColors[action] || 'text-gray-600 bg-gray-50';
}
