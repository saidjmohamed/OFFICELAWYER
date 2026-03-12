import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles, rolePermissions, permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, getAuthenticatedUser } from '@/services/auth.service';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

/**
 * GET - جلب بيانات المستخدم الحالي
 */
export async function GET() {
  try {
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // إذا كان مصادقة بالرمز فقط (passcode)
    if (!authResult.userId || !authResult.user) {
      return NextResponse.json({
        success: true,
        data: {
          authType: 'passcode',
          user: null,
        },
      });
    }

    // جلب بيانات المستخدم الكاملة
    const user = authResult.user;

    // جلب الدور
    let roleData: { id: number; name: string; nameAr: string } | null = null;
    let userPermissions: string[] = [];

    if (user.roleId) {
      // جلب الدور
      const roleResult = await db.select()
        .from(roles)
        .where(eq(roles.id, user.roleId))
        .limit(1);

      if (roleResult.length > 0) {
        roleData = {
          id: roleResult[0].id,
          name: roleResult[0].name,
          nameAr: roleResult[0].nameAr,
        };

        // جلب صلاحيات الدور
        const permResult = await db.select({ permission: permissions })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, user.roleId));

        userPermissions = permResult.map(p => p.permission.name);
      }
    }

    // جلب قائمة الأدوار المتاحة (للاختيار)
    const rolesList = await db.select({
      id: roles.id,
      name: roles.name,
      nameAr: roles.nameAr,
    }).from(roles);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          role: roleData,
          permissions: userPermissions,
        },
        roles: rolesList,
      },
    });
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PUT - تحديث البيانات الشخصية
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { email, fullName } = body;

    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    // التحقق من البريد الإلكتروني
    if (email !== undefined) {
      if (email && email !== authResult.user.email) {
        const existingEmail = await db.select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingEmail.length > 0) {
          return NextResponse.json(
            { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
            { status: HTTP_STATUS.CONFLICT }
          );
        }
      }
      updateData.email = email || null;
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName || null;
    }

    // تحديث المستخدم
    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, authResult.user.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: {
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        fullName: updatedUser[0].fullName,
      },
    });
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST - تغيير كلمة المرور
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // التحقق من البيانات
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'جميع الحقول مطلوبة' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الجديدة غير متطابقة' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // جلب المستخدم
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, authResult.user.id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // التحقق من كلمة المرور الحالية
    const isValid = await verifyPassword(currentPassword, existingUser[0].password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // تجزئة كلمة المرور الجديدة
    const hashedPassword = await hashPassword(newPassword);

    // تحديث كلمة المرور
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, authResult.user.id));

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    });
  } catch (error) {
    console.error('خطأ في تغيير كلمة المرور:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
