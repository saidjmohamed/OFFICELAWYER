import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, roles, rolePermissions, permissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, getAuthenticatedUser } from '@/services/auth.service';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

/**
 * GET - جلب قائمة المستخدمين (للمدير فقط)
 */
export async function GET(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // التحقق من صلاحية عرض المستخدمين
    let hasPermission = false;
    
    if (authResult.user) {
      // جلب صلاحيات المستخدم
      if (authResult.user.roleId) {
        const permResult = await db.select({ permission: permissions })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, authResult.user.roleId));

        hasPermission = permResult.some(p => p.permission.name === 'users:view');
      }
    }

    // إذا لم يكن لديه صلاحية، تحقق من المصادقة القديمة (passcode)
    // في هذه الحالة نسمح بالعرض كنظام تراجعي
    if (!hasPermission && !authResult.userId) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // جلب المستخدمين مع أدوارهم
    const usersList = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      fullName: users.fullName,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      role: {
        id: roles.id,
        name: roles.name,
        nameAr: roles.nameAr,
      },
    })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(users.createdAt);

    return NextResponse.json({
      success: true,
      data: usersList,
    });
  } catch (error) {
    console.error('خطأ في جلب المستخدمين:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * POST - إضافة مستخدم جديد
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // التحقق من صلاحية إضافة المستخدمين
    if (authResult.user.roleId) {
      const permResult = await db.select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, authResult.user.roleId));

      const hasPermission = permResult.some(p => p.permission.name === 'users:create');
      
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.FORBIDDEN },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const body = await request.json();
    const { username, password, email, fullName, roleId, status } = body;

    // التحقق من البيانات المطلوبة
    if (!username || username.length < 3) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // التحقق من عدم وجود المستخدم
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم موجود مسبقاً' },
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // التحقق من البريد الإلكتروني
    if (email) {
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

    // التحقق من الدور
    if (roleId) {
      const role = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);
      if (role.length === 0) {
        return NextResponse.json(
          { success: false, error: 'الدور المحدد غير موجود' },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // تجزئة كلمة المرور
    const hashedPassword = await hashPassword(password);

    // إنشاء المستخدم
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
      email: email || null,
      fullName: fullName || null,
      roleId: roleId || null,
      status: status || 'active',
    }).returning();

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.CREATED,
      data: {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        fullName: newUser[0].fullName,
        status: newUser[0].status,
        roleId: newUser[0].roleId,
      },
    }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('خطأ في إنشاء المستخدم:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PUT - تحديث مستخدم
 */
export async function PUT(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { id, username, email, fullName, roleId, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // التحقق من صلاحية تعديل المستخدمين
    let hasPermission = false;
    
    if (authResult.user.roleId) {
      const permResult = await db.select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, authResult.user.roleId));

      hasPermission = permResult.some(p => p.permission.name === 'users:update');
    }

    // السماح للمستخدم بتعديل بياناته الخاصة
    const isSelf = authResult.user.id === id;

    if (!hasPermission && !isSelf) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // جلب المستخدم الحالي
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // التحقق من اسم المستخدم
    if (username && username !== existingUser[0].username) {
      const duplicateUsername = await db.select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (duplicateUsername.length > 0) {
        return NextResponse.json(
          { success: false, error: 'اسم المستخدم موجود مسبقاً' },
          { status: HTTP_STATUS.CONFLICT }
        );
      }
    }

    // التحقق من البريد الإلكتروني
    if (email && email !== existingUser[0].email) {
      const duplicateEmail = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (duplicateEmail.length > 0) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مستخدم مسبقاً' },
          { status: HTTP_STATUS.CONFLICT }
        );
      }
    }

    // بناء بيانات التحديث
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email || null;
    if (fullName !== undefined) updateData.fullName = fullName || null;
    
    // لا يمكن للمستخدم تغيير دوره أو حالته إلا إذا كان لديه صلاحية
    if (hasPermission) {
      if (roleId !== undefined) updateData.roleId = roleId || null;
      if (status) updateData.status = status;
    }

    // تحديث المستخدم
    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.UPDATED,
      data: {
        id: updatedUser[0].id,
        username: updatedUser[0].username,
        email: updatedUser[0].email,
        fullName: updatedUser[0].fullName,
        status: updatedUser[0].status,
        roleId: updatedUser[0].roleId,
      },
    });
  } catch (error) {
    console.error('خطأ في تحديث المستخدم:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * DELETE - حذف مستخدم
 */
export async function DELETE(request: NextRequest) {
  try {
    // التحقق من المصادقة والصلاحيات
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // التحقق من صلاحية حذف المستخدمين
    if (authResult.user.roleId) {
      const permResult = await db.select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, authResult.user.roleId));

      const hasPermission = permResult.some(p => p.permission.name === 'users:delete');
      
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.FORBIDDEN },
          { status: HTTP_STATUS.FORBIDDEN }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // لا يمكن حذف النفس
    if (id === authResult.user.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // التحقق من وجود المستخدم
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // حذف المستخدم
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: SUCCESS_MESSAGES.DELETED,
    });
  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error);
    return NextResponse.json(
      { success: false, error: ERROR_MESSAGES.DATABASE_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * PATCH - تغيير كلمة المرور
 */
export async function PATCH(request: NextRequest) {
  try {
    // التحقق من المصادقة
    const authResult = await getAuthenticatedUser();
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    const body = await request.json();
    const { id, currentPassword, newPassword } = body;

    if (!id || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير مكتملة' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // التحقق من الصلاحية
    let hasPermission = false;
    
    if (authResult.user.roleId) {
      const permResult = await db.select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, authResult.user.roleId));

      hasPermission = permResult.some(p => p.permission.name === 'users:update');
    }

    // السماح للمستخدم بتغيير كلمة مروره
    const isSelf = authResult.user.id === id;

    if (!hasPermission && !isSelf) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.FORBIDDEN },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    // جلب المستخدم
    const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // إذا كان المستخدم يغير كلمة مروره الخاصة، يجب التحقق من كلمة المرور الحالية
    if (isSelf && currentPassword) {
      const isValid = await verifyPassword(currentPassword, existingUser[0].password);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'كلمة المرور الحالية غير صحيحة' },
          { status: HTTP_STATUS.UNAUTHORIZED }
        );
      }
    }

    // تجزئة كلمة المرور الجديدة
    const hashedPassword = await hashPassword(newPassword);

    // تحديث كلمة المرور
    await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));

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
