/**
 * Hook للتحقق من الصلاحيات
 * يوفر طريقة سهلة للتحقق من صلاحيات المستخدم في المكونات
 */

'use client';

import { use, createContext, useContext, ReactNode } from 'react';

// سياق الصلاحيات
interface PermissionsContextType {
  permissions: string[];
  role: string | null;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isManagerOrAbove: () => boolean;
  isAdmin: () => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// موفر الصلاحيات
export function PermissionsProvider({ 
  children,
  permissionsPromise,
}: { 
  children: ReactNode;
  permissionsPromise: Promise<{ permissions: string[]; role: string | null }>;
}) {
  const { permissions, role } = use(permissionsPromise);
  
  const value: PermissionsContextType = {
    permissions,
    role,
    isLoading: false,
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAnyPermission: (perms: string[]) => perms.some(p => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every(p => permissions.includes(p)),
    isManagerOrAbove: () => role === 'admin' || role === 'manager',
    isAdmin: () => role === 'admin',
  };
  
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// hook للوصول للصلاحيات
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    // إرجاع قيم افتراضية إذا لم يكن السياق متوفراً
    return {
      permissions: [],
      role: null,
      isLoading: true,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      isManagerOrAbove: () => false,
      isAdmin: () => false,
    };
  }
  return context;
}

// hook للتحقق من صلاحية محددة
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// hook للتحقق من صلاحيات متعددة
export function useHasAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = usePermissions();
  return hasAllPermissions(permissions);
}

// مكون للتحقق من الصلاحيات وإظهار/إخفاء المحتوى
export function Can({ 
  permission, 
  permissions,
  requireAll = true,
  fallback = null,
  children,
}: { 
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const perms = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = perms.hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? perms.hasAllPermissions(permissions)
      : perms.hasAnyPermission(permissions);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// مكون لإظهار المحتوى للمديرين فقط
export function ManagerOnly({ 
  children,
  fallback = null,
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const perms = usePermissions();
  return perms.isManagerOrAbove() ? <>{children}</> : <>{fallback}</>;
}

// مكون لإظهار المحتوى للمسؤولين فقط
export function AdminOnly({ 
  children,
  fallback = null,
}: { 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const perms = usePermissions();
  return perms.isAdmin() ? <>{children}</> : <>{fallback}</>;
}
