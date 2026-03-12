import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/services/auth.service';
import { getUserPermissions, getUserRole } from '@/services/permissions.service';

export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated) {
      return NextResponse.json({ 
        success: false, 
        error: 'غير مصرح' 
      }, { status: 401 });
    }
    
    // إذا كان المستخدم يستخدم النظام القديم (بدون userId)
    if (!authResult.userId) {
      return NextResponse.json({
        success: true,
        data: {
          permissions: Object.values({
            CASES_VIEW: 'cases:view',
            CASES_CREATE: 'cases:create',
            CASES_UPDATE: 'cases:update',
            CASES_DELETE: 'cases:delete',
            CLIENTS_VIEW: 'clients:view',
            CLIENTS_CREATE: 'clients:create',
            CLIENTS_UPDATE: 'clients:update',
            CLIENTS_DELETE: 'clients:delete',
            SESSIONS_VIEW: 'sessions:view',
            SESSIONS_CREATE: 'sessions:create',
            SESSIONS_UPDATE: 'sessions:update',
            SESSIONS_DELETE: 'sessions:delete',
            SETTINGS_VIEW: 'settings:view',
            SETTINGS_UPDATE: 'settings:update',
            BACKUP_CREATE: 'backup:create',
            BACKUP_RESTORE: 'backup:restore',
          }),
          role: 'admin', // صلاحيات كاملة للنظام القديم
        }
      });
    }
    
    const permissions = await getUserPermissions(authResult.userId);
    const role = await getUserRole(authResult.userId);
    
    return NextResponse.json({
      success: true,
      data: {
        permissions,
        role,
      }
    });
  } catch (error) {
    console.error('خطأ في جلب الصلاحيات:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'حدث خطأ في جلب الصلاحيات' 
    }, { status: 500 });
  }
}
