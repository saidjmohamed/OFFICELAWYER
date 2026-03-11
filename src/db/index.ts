import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

// Force reload: 2024-03-08-v3

// مسارات الملفات
const DB_DIR = join(process.cwd(), 'db');
const DB_PATH = join(DB_DIR, 'lawyer.db');
const WAL_PATH = join(DB_DIR, 'lawyer.db-wal');
const SHM_PATH = join(DB_DIR, 'lawyer.db-shm');

// متغيرات Singleton - يجب استخدام let وليس const
let _sqlite: Database.Database | null = null;
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
export function getDb() {
  if (!_sqlite || !_dbInstance) {
    // تنظيف الملفات القديمة
    cleanupWalFiles();
    ensureDir();

    // إنشاء اتصال جديد
    _sqlite = new Database(DB_PATH);
    _sqlite.pragma('foreign_keys = ON');
    _sqlite.pragma('journal_mode = DELETE');
    _sqlite.pragma('synchronous = FULL');
    
    _dbInstance = drizzle(_sqlite, { schema });
  }
  
  return { sqlite: _sqlite, db: _dbInstance };
}

// تصدير getters بدلاً من القيم المباشرة
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_, prop) {
    return Reflect.get(getDb().db, prop);
  }
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_, prop) {
    return Reflect.get(getDb().sqlite, prop);
  }
});
