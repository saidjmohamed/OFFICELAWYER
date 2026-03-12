/**
 * خدمة الصلاحيات
 * تتعامل مع التحقق من صلاحيات المستخدمين
 */

import { db } from '@/db';
import { users, roles, permissions, rolePermissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/constants';

/**
 * جلب صلاحيات المستخدم
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  // جلب المستخدم مع دوره
  const user = await db.select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user.length || user[0].status !== 'active') {
    return [];
  }
  
  const userRole = user[0].roleId;
  if (!userRole) {
    return [];
  }
  
  // جلب صلاحيات الدور
  const rolePerms = await db.select({
    permissionName: permissions.name,
  })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, userRole));
  
  return rolePerms.map(p => p.permissionName);
}

/**
 * التحقق من صلاحية واحدة
 */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.includes(permission);
}

/**
 * التحقق من صلاحيات متعددة (المستخدم يجب أن يملك جميعها)
 */
export async function hasAllPermissions(userId: number, perms: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return perms.every(p => userPermissions.includes(p));
}

/**
 * التحقق من صلاحيات متعددة (المستخدم يملك واحدة على الأقل)
 */
export async function hasAnyPermission(userId: number, perms: string[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return perms.some(p => userPermissions.includes(p));
}

/**
 * جلب دور المستخدم
 */
export async function getUserRole(userId: number): Promise<string | null> {
  const user = await db.select({
    roleId: users.roleId,
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user.length || !user[0].roleId) {
    return null;
  }
  
  const role = await db.select({
    name: roles.name,
  })
    .from(roles)
    .where(eq(roles.id, user[0].roleId))
    .limit(1);
  
  return role.length ? role[0].name : null;
}

/**
 * التحقق من دور المستخدم
 */
export async function hasRole(userId: number, role: string): Promise<boolean> {
  const userRole = await getUserRole(userId);
  return userRole === role;
}

/**
 * التحقق من صلاحيات المدير أو أعلى
 */
export async function isManagerOrAbove(userId: number): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin' || role === 'manager';
}

/**
 * التحقق من صلاحيات المحامي أو أعلى
 */
export async function isLawyerOrAbove(userId: number): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin' || role === 'manager' || role === 'lawyer';
}

/**
 * التحقق من صلاحيات الإدارة
 */
export async function isAdmin(userId: number): Promise<boolean> {
  const role = await getUserRole(userId);
  return role === 'admin';
}

/**
 * إنشاء صلاحيات الدور الافتراضية
 */
export async function seedDefaultPermissions(): Promise<void> {
  // إنشاء الصلاحيات
  const permissionList = Object.entries(PERMISSIONS).map(([key, name]) => ({
    name,
    nameAr: getPermissionArabicName(name),
    scope: name.split(':')[0],
    type: name.split(':')[1] as 'read' | 'write' | 'delete' | 'admin',
  }));
  
  for (const perm of permissionList) {
    try {
      await db.insert(permissions).values(perm);
    } catch {
      // الصلاحية موجودة مسبقاً
    }
  }
  
  // إنشاء الأدوار
  const rolesList = [
    { name: 'admin', nameAr: 'مدير النظام', isSystem: true },
    { name: 'manager', nameAr: 'مدير', isSystem: true },
    { name: 'lawyer', nameAr: 'محامي', isSystem: true },
    { name: 'assistant', nameAr: 'مساعد', isSystem: true },
    { name: 'viewer', nameAr: 'مشاهد', isSystem: true },
  ];
  
  for (const role of rolesList) {
    try {
      await db.insert(roles).values(role);
    } catch {
      // الدور موجود مسبقاً
    }
  }
  
  // ربط الصلاحيات بالأدوار
  const allPermissions = await db.select().from(permissions);
  const allRoles = await db.select().from(roles);
  
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) continue;
    
    for (const permName of perms) {
      const perm = allPermissions.find(p => p.name === permName);
      if (!perm) continue;
      
      try {
        await db.insert(rolePermissions).values({
          roleId: role.id,
          permissionId: perm.id,
        });
      } catch {
        // العلاقة موجودة مسبقاً
      }
    }
  }
}

/**
 * الحصول على الاسم العربي للصلاحية
 */
function getPermissionArabicName(name: string): string {
  const [scope, action] = name.split(':');
  
  const scopeNames: Record<string, string> = {
    cases: 'القضايا',
    clients: 'الموكلين',
    sessions: 'الجلسات',
    lawyers: 'المحامين',
    settings: 'الإعدادات',
    backup: 'النسخ الاحتياطي',
    users: 'المستخدمين',
  };
  
  const actionNames: Record<string, string> = {
    view: 'عرض',
    create: 'إنشاء',
    update: 'تعديل',
    delete: 'حذف',
  };
  
  return `${actionNames[action] || action} ${scopeNames[scope] || scope}`;
}
