/**
 * خدمة المصادقة المركزية
 * تتعامل مع جميع عمليات المصادقة والجلسات
 */

import { cookies } from 'next/headers';
import { db } from '@/db';
import { users, userSessions } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

// مدة صلاحية الجلسة (7 أيام)
const SESSION_DURATION_DAYS = 7;
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * تجزئة كلمة المرور باستخدام SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * التحقق من كلمة المرور
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha256').toString('hex');
  return hash === verifyHash;
}

/**
 * إنشاء معرف جلسة عشوائي
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * إنشاء جلسة جديدة للمستخدم
 */
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  
  await db.insert(userSessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });
  
  return sessionId;
}

/**
 * التحقق من صلاحية الجلسة
 */
export async function verifySession(sessionId: string): Promise<{ valid: boolean; userId?: number }> {
  const session = await db.select()
    .from(userSessions)
    .where(and(
      eq(userSessions.id, sessionId),
      gt(userSessions.expiresAt, new Date())
    ))
    .limit(1);
  
  if (session.length === 0) {
    return { valid: false };
  }
  
  return { valid: true, userId: session[0].userId };
}

/**
 * إنهاء الجلسة
 */
export async function destroySession(sessionId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

/**
 * التحقق من المصادقة من الـ cookies
 */
export async function getAuthenticatedUser(): Promise<{ authenticated: boolean; userId?: number; user?: any }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  
  if (!sessionId) {
    // التحقق من المصادقة القديمة (للتوافق مع النظام الحالي)
    const authenticated = cookieStore.get('authenticated')?.value;
    if (authenticated === 'true') {
      return { authenticated: true };
    }
    return { authenticated: false };
  }
  
  const session = await verifySession(sessionId);
  
  if (!session.valid) {
    return { authenticated: false };
  }
  
  // جلب بيانات المستخدم
  const user = await db.select()
    .from(users)
    .where(eq(users.id, session.userId!))
    .limit(1);
  
  if (user.length === 0) {
    return { authenticated: false };
  }
  
  return { authenticated: true, userId: session.userId, user: user[0] };
}

/**
 * تعيين cookie الجلسة
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * حذف cookie الجلسة
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session_id');
  cookieStore.delete('authenticated');
}
