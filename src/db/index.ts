/**
 * Database Module - وحدة قاعدة البيانات
 * 
 * تدعم:
 * - libSQL محلي (يعمل على Bun و Node.js)
 * - Turso سحابي للنشر على Vercel/Netlify
 * - التبديل التلقائي حسب البيئة
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { 
  getDatabaseConfig, 
  getTursoConfig 
} from './config';

// Force reload: 2025-03-11-libsql

// متغيرات Singleton
let _client: Client | null = null;
let _dbInstance: ReturnType<typeof drizzle> | null = null;
let _currentMode: 'local' | 'turso' | null = null;

// مسار قاعدة البيانات المحلية
const DB_DIR = join(process.cwd(), 'db');
const DB_PATH = join(DB_DIR, 'lawyer.db');

// التأكد من وجود المجلد
function ensureDir() {
  try {
    if (!existsSync(DB_DIR)) {
      mkdirSync(DB_DIR, { recursive: true });
    }
  } catch {
    // تجاهل الأخطاء في البيئات السحابية
  }
}

// تهيئة قاعدة البيانات المحلية (libSQL)
function initLocalDb() {
  if (_client && _dbInstance && _currentMode === 'local') {
    return { client: _client, db: _dbInstance };
  }

  console.log('💾 Initializing local libSQL database...');
  
  ensureDir();

  // استخدام file: prefix لـ libSQL
  _client = createClient({
    url: `file:${DB_PATH}`,
  });

  _dbInstance = drizzle(_client, { schema });
  _currentMode = 'local';

  return { client: _client, db: _dbInstance };
}

// تهيئة قاعدة البيانات السحابية (Turso)
function initTursoDb() {
  if (_client && _dbInstance && _currentMode === 'turso') {
    return { client: _client, db: _dbInstance };
  }

  console.log('🌐 Initializing Turso database...');
  
  const config = getTursoConfig();
  
  if (!config.url || !config.authToken) {
    throw new Error('Turso configuration missing: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required');
  }

  _client = createClient({
    url: config.url,
    authToken: config.authToken,
  });

  _dbInstance = drizzle(_client, { schema });
  _currentMode = 'turso';

  return { client: _client, db: _dbInstance };
}

// الحصول على قاعدة البيانات المناسبة
export function getDb() {
  const config = getDatabaseConfig();
  
  if (config.mode === 'turso') {
    return initTursoDb();
  }
  
  return initLocalDb();
}

// الحصول على وضع قاعدة البيانات الحالي
export function getCurrentMode(): 'local' | 'turso' {
  const config = getDatabaseConfig();
  return config.mode;
}

// تصدير db كـ Proxy للوصول السهل
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    const { db } = getDb();
    return Reflect.get(db, prop);
  }
});

// تصدير client للوصول المباشر
export const client = new Proxy({} as Client, {
  get(_, prop) {
    const { client } = getDb();
    return Reflect.get(client, prop);
  }
});

// تصدير sqlite للتوافق مع الكود القديم
export const sqlite = {
  exec: async (sql: string) => {
    const { client } = getDb();
    return client.execute(sql);
  },
  prepare: (sql: string) => {
    return {
      all: async (...params: any[]) => {
        const { client } = getDb();
        const result = await client.execute({ sql, args: params });
        return result.rows;
      },
      run: async (...params: any[]) => {
        const { client } = getDb();
        return client.execute({ sql, args: params });
      },
      get: async (...params: any[]) => {
        const { client } = getDb();
        const result = await client.execute({ sql, args: params });
        return result.rows[0] || null;
      },
    };
  },
  pragma: (_pragma: string) => {
    // libSQL doesn't support pragma in the same way
    console.log('Pragma not supported in libSQL mode');
  },
};

// دالة لتنفيذ SQL مباشرة
export async function executeSql(sql: string, params: any[] = []) {
  const { client } = getDb();
  return client.execute({ sql, args: params });
}

// دالة لتنفيذ استعلام وإرجاع النتائج
export async function querySql(sql: string, params: any[] = []) {
  const { client } = getDb();
  const result = await client.execute({ sql, args: params });
  return result.rows;
}
