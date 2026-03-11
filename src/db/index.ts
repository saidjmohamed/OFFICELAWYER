import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

// Force reload: 2024-03-08-v5 - Using libSQL for Bun compatibility

// مسارات الملفات
const DB_DIR = join(process.cwd(), 'db');
const DB_PATH = join(DB_DIR, 'lawyer.db');
const WAL_PATH = join(DB_DIR, 'lawyer.db-wal');
const SHM_PATH = join(DB_DIR, 'lawyer.db-shm');

// متغيرات Singleton
let _client: Client | null = null;
let _dbInstance: ReturnType<typeof drizzle> | null = null;

// تنظيف ملفات WAL
function cleanupWalFiles() {
  try {
    if (existsSync(WAL_PATH)) {
      unlinkSync(WAL_PATH);
    }
    if (existsSync(SHM_PATH)) {
      unlinkSync(SHM_PATH);
    }
  } catch {
    // تجاهل الأخطاء
  }
}

// التأكد من وجود المجلد
function ensureDir() {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true });
  }
}

// تهيئة قاعدة البيانات (كسولة)
function initDb() {
  if (!_client || !_dbInstance) {
    // تنظيف الملفات القديمة
    cleanupWalFiles();
    ensureDir();

    // إنشاء اتصال جديد باستخدام libSQL
    _client = createClient({
      url: `file:${DB_PATH}`
    });
    
    // تنفيذ إعدادات pragma
    _client.execute('PRAGMA foreign_keys = ON');
    _client.execute('PRAGMA journal_mode = DELETE');
    _client.execute('PRAGMA synchronous = FULL');
    
    _dbInstance = drizzle(_client, { schema });
  }
  
  return { client: _client, db: _dbInstance };
}

// الحصول على قاعدة البيانات
export function getDb() {
  return initDb().db;
}

// الحصول على العميل
export function getClient() {
  return initDb().client;
}

// تصدير db مباشرة
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return Reflect.get(initDb().db, prop);
  }
});

// تصدير client مباشرة
export const client = new Proxy({} as Client, {
  get(_, prop) {
    return Reflect.get(initDb().client, prop);
  }
});

// تصدير sqlite للتوافق مع الكود القديم
export const sqlite = {
  exec: async (sql: string) => {
    return initDb().client.execute(sql);
  },
  prepare: (sql: string) => {
    const c = initDb().client;
    return {
      all: async () => {
        const result = await c.execute(sql);
        return result.rows;
      },
      get: async () => {
        const result = await c.execute(sql);
        return result.rows[0];
      },
      run: async () => {
        return c.execute(sql);
      }
    };
  },
  close: () => {
    try {
      initDb().client.close();
    } catch {
      // تجاهل أخطاء الإغلاق
    }
  },
  pragma: async (pragma: string) => {
    return initDb().client.execute(`PRAGMA ${pragma}`);
  }
};
