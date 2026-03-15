import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings, users, roles, rolePermissions, permissions, userSessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { cookies, headers } from 'next/headers';
import { hashPassword, verifyPassword, generateSessionId, setSessionCookie, clearSessionCookie } from '@/services/auth.service';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, DEFAULT_VALUES } from '@/constants';

// مدة صلاحية الجلسة (7 أيام)
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

// ===== تحديد معدل المحاولات =====
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const lockoutMs = DEFAULT_VALUES.LOCKOUT_DURATION_MINUTES * 60 * 1000;
  const record = loginAttempts.get(ip);

  if (record) {
    // إعادة تعيين إذا انتهت فترة الحظر
    if (now - record.firstAttempt > lockoutMs) {
      loginAttempts.delete(ip);
      return { allowed: true };
    }
    if (record.count >= DEFAULT_VALUES.MAX_LOGIN_ATTEMPTS) {
      const retryAfter = Math.ceil((record.firstAttempt + lockoutMs - now) / 1000);
      return { allowed: false, retryAfter };
    }
    return { allowed: true };
  }
  return { allowed: true };
}

function recordLoginAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (record) {
    record.count++;
  } else {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
  }
}

function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// تنظيف تلقائي للسجلات القديمة كل دقيقة لمنع تسرب الذاكرة
if (typeof globalThis !== 'undefined') {
  const CLEANUP_INTERVAL = 60 * 1000;
  const cleanupKey = '__rateLimitCleanup';
  if (!(globalThis as any)[cleanupKey]) {
    (globalThis as any)[cleanupKey] = setInterval(() => {
      const now = Date.now();
      const lockoutMs = DEFAULT_VALUES.LOCKOUT_DURATION_MINUTES * 60 * 1000;
      for (const [ip, record] of loginAttempts.entries()) {
        if (now - record.firstAttempt > lockoutMs) {
          loginAttempts.delete(ip);
        }
      }
    }, CLEANUP_INTERVAL);
  }
}

/**
 * POST - تسجيل الدخول (باسم المستخدم أو الرمز)
 */
export async function POST(request: NextRequest) {
  try {
    // التحقق من تحديد معدل المحاولات
    const headersList = await headers();
    const clientIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown';

    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `${ERROR_MESSAGES.RATE_LIMIT_EXCEEDED}. حاول بعد ${rateCheck.retryAfter} ثانية` },
        { 
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: { 'Retry-After': String(rateCheck.retryAfter || 900) }
        }
      );
    }

    const body = await request.json();
    const { username, password, passcode, action } = body;

    // === تسجيل مستخدم جديد ===
    if (action === 'register') {
      return await handleRegister(body);
    }

    // === تسجيل الدخول باسم المستخدم وكلمة المرور ===
    if (username && password) {
      return await handleUsernameLogin(username, password, clientIp);
    }

    // === تسجيل الدخول بالرمز (للتوافق مع النظام القديم) ===
    if (passcode) {
      return await handlePasscodeLogin(passcode, clientIp);
    }

    return NextResponse.json(
      { success: false, error: 'بيانات الدخول غير مكتملة' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  } catch (error) {
    console.error('خطأ في المصادقة:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في المصادقة', details: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

/**
 * تسجيل الدخول باسم المستخدم وكلمة المرور
 */
async function handleUsernameLogin(username: string, password: string, clientIp: string) {
  // البحث عن المستخدم
  const userResult = await db.select({
    id: users.id,
    username: users.username,
    password: users.password,
    email: users.email,
    fullName: users.fullName,
    status: users.status,
    roleId: users.roleId,
  })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (userResult.length === 0) {
    recordLoginAttempt(clientIp);
    return NextResponse.json(
      { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  const user = userResult[0];

  // التحقق من حالة المستخدم
  if (user.status === 'inactive') {
    return NextResponse.json(
      { success: false, error: 'هذا الحساب غير مفعل' },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  if (user.status === 'suspended') {
    return NextResponse.json(
      { success: false, error: 'هذا الحساب معلق. تواصل مع المدير' },
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // التحقق من كلمة المرور
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    recordLoginAttempt(clientIp);
    return NextResponse.json(
      { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }

  // مسح سجل المحاولات الفاشلة بعد تسجيل دخول ناجح
  clearLoginAttempts(clientIp);

  // جلب دور المستخدم وصلاحياته
  let roleData: { name: string; nameAr: string } | null = null;
  let userPermissions: string[] = [];

  if (user.roleId) {
    // جلب الدور
    const roleResult = await db.select()
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);

    if (roleResult.length > 0) {
      roleData = {
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

  // إنشاء جلسة جديدة
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // جلب معلومات الاتصال
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  await db.insert(userSessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    ipAddress,
    userAgent,
  });

  // تحديث آخر تسجيل دخول
  await db.update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // تعيين cookie الجلسة
  await setSessionCookie(sessionId);

  return NextResponse.json({
    success: true,
    message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: roleData,
      permissions: userPermissions,
    },
  });
}

/**
 * تسجيل الدخول بالرمز (للتوافق مع النظام القديم)
 */
async function handlePasscodeLogin(passcode: string, clientIp: string) {
  if (!passcode || passcode.length !== 6) {
    return NextResponse.json(
      { success: false, error: 'الرمز يجب أن يكون 6 أرقام' },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // الحصول على الرمز المخزن
  const storedPasscode = await db.select().from(settings).where(eq(settings.key, 'passcode'));

  if (storedPasscode.length === 0) {
    return NextResponse.json(
      { success: false, error: 'لم يتم إعداد الرمز' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  if (storedPasscode[0].value === passcode) {
    clearLoginAttempts(clientIp);
    // تعيين جلسة المصادقة القديمة
    const cookieStore = await cookies();
    cookieStore.set('authenticated', 'true', {
      httpOnly: true,
      secure: false, // للتطوير المحلي
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // أسبوع
    });

    return NextResponse.json({ success: true });
  }

  recordLoginAttempt(clientIp);
  return NextResponse.json(
    { success: false, error: 'رمز غير صحيح' },
    { status: HTTP_STATUS.UNAUTHORIZED }
  );
}

/**
 * تسجيل مستخدم جديد
 */
async function handleRegister(data: {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
}) {
  const { username, password, email, fullName } = data;

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

  // التحقق من البريد الإلكتروني إذا كان موجوداً
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

  // جلب دور المشاهد كدور افتراضي للمستخدمين الجدد
  const viewerRole = await db.select()
    .from(roles)
    .where(eq(roles.name, 'viewer'))
    .limit(1);

  // تجزئة كلمة المرور
  const hashedPassword = await hashPassword(password);

  // إنشاء المستخدم
  const newUser = await db.insert(users).values({
    username,
    password: hashedPassword,
    email: email || null,
    fullName: fullName || null,
    roleId: viewerRole.length > 0 ? viewerRole[0].id : null,
    status: 'active',
  }).returning();

  return NextResponse.json({
    success: true,
    message: 'تم إنشاء الحساب بنجاح',
    user: {
      id: newUser[0].id,
      username: newUser[0].username,
      email: newUser[0].email,
      fullName: newUser[0].fullName,
    },
  }, { status: HTTP_STATUS.CREATED });
}

/**
 * GET - التحقق من حالة المصادقة
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // التحقق من جلسة المستخدم الجديدة
    const sessionId = cookieStore.get('session_id')?.value;
    
    if (sessionId) {
      // التحقق من صلاحية الجلسة
      const session = await db.select({
        user: users,
        role: roles,
      })
        .from(userSessions)
        .innerJoin(users, eq(userSessions.userId, users.id))
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(and(
          eq(userSessions.id, sessionId),
          gt(userSessions.expiresAt, new Date())
        ))
        .limit(1);

      if (session.length > 0) {
        // جلب صلاحيات المستخدم
        let userPermissions: string[] = [];
        if (session[0].user.roleId) {
          const permResult = await db.select({ permission: permissions })
            .from(rolePermissions)
            .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
            .where(eq(rolePermissions.roleId, session[0].user.roleId));

          userPermissions = permResult.map(p => p.permission.name);
        }

        return NextResponse.json({
          authenticated: true,
          user: {
            id: session[0].user.id,
            username: session[0].user.username,
            email: session[0].user.email,
            fullName: session[0].user.fullName,
            status: session[0].user.status,
            role: session[0].role ? {
              name: session[0].role.name,
              nameAr: session[0].role.nameAr,
            } : null,
            permissions: userPermissions,
          },
        });
      }
    }

    // التحقق من المصادقة القديمة (passcode)
    const authenticated = cookieStore.get('authenticated')?.value;
    if (authenticated === 'true') {
      return NextResponse.json({ 
        authenticated: true,
        authType: 'passcode',
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

/**
 * DELETE - تسجيل الخروج
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (sessionId) {
      // حذف الجلسة من قاعدة البيانات
      await db.delete(userSessions).where(eq(userSessions.id, sessionId));
    }

    // حذف cookies
    await clearSessionCookie();

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGES.LOGOUT_SUCCESS });
  } catch {
    return NextResponse.json({ success: false }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
