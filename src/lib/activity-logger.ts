import { db } from '@/db';
import { activities } from '@/db/schema';

type ActionType = typeof activities.$inferInsert['action'];
type EntityType = typeof activities.$inferInsert['entityType'];

interface ActivityLog {
  action: ActionType;
  entityType?: EntityType;
  entityId?: number;
  description: string;
  metadata?: Record<string, any>;
}

export async function logActivity(data: ActivityLog): Promise<void> {
  try {
    await db.insert(activities).values({
      action: data.action,
      entityType: data.entityType || null,
      entityId: data.entityId || null,
      description: data.description,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
  } catch (error) {
    console.error('خطأ في تسجيل النشاط:', error);
  }
}

// ترجمة الإجراءات
export const actionLabels: Record<string, string> = {
  case_created: 'إنشاء قضية جديدة',
  case_updated: 'تحديث قضية',
  case_deleted: 'حذف قضية',
  case_archived: 'أرشفة قضية',
  session_added: 'إضافة جلسة',
  session_updated: 'تحديث جلسة',
  session_deleted: 'حذف جلسة',
  client_created: 'إنشاء موكل جديد',
  client_updated: 'تحديث بيانات موكل',
  client_deleted: 'حذف موكل',
  file_uploaded: 'رفع ملف',
  file_deleted: 'حذف ملف',
  expense_added: 'إضافة مصروف',
  expense_deleted: 'حذف مصروف',
  backup_created: 'إنشاء نسخة احتياطية',
  backup_restored: 'استعادة نسخة احتياطية',
  settings_updated: 'تحديث الإعدادات',
};

// أيقونات الإجراءات
export const actionIcons: Record<string, string> = {
  case_created: '📝',
  case_updated: '✏️',
  case_deleted: '🗑️',
  case_archived: '📦',
  session_added: '📅',
  session_updated: '✏️',
  session_deleted: '🗑️',
  client_created: '👤',
  client_updated: '✏️',
  client_deleted: '🗑️',
  file_uploaded: '📎',
  file_deleted: '🗑️',
  expense_added: '💰',
  expense_deleted: '🗑️',
  backup_created: '💾',
  backup_restored: '📥',
  settings_updated: '⚙️',
};
