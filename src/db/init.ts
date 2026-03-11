/**
 * Database Initialization - تهيئة قاعدة البيانات
 * 
 * يعمل مع libSQL (محلي وسحابي)
 */

import { db, executeSql, getCurrentMode } from './index';
import * as schema from './schema';
import { algerianWilayas } from './seed-data';
import { eq } from 'drizzle-orm';

// دالة آمنة لتنفيذ SQL
async function safeExec(sql: string, description?: string) {
  try {
    await executeSql(sql);
    if (description) {
      console.log(`✅ ${description}`);
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('already exists')) {
      return true;
    }
    console.error(`❌ خطأ في: ${description || sql.substring(0, 50)}`, error);
    return false;
  }
}

// إنشاء الجداول
export async function createTables() {
  const mode = getCurrentMode();
  console.log(`🔧 Creating tables in ${mode} mode...`);

  // الولايات (يجب أن تكون أولاً)
  await safeExec(`
    CREATE TABLE IF NOT EXISTS wilayas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الولايات');

  // الهيئات القضائية
  await safeExec(`
    CREATE TABLE IF NOT EXISTS judicial_bodies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      wilaya_id INTEGER REFERENCES wilayas(id),
      parent_id INTEGER REFERENCES judicial_bodies(id),
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الهيئات القضائية');

  // الغرف والأقسام
  await safeExec(`
    CREATE TABLE IF NOT EXISTS chambers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chamber_type TEXT,
      room_number INTEGER,
      judicial_body_id INTEGER NOT NULL REFERENCES judicial_bodies(id) ON DELETE CASCADE,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الغرف');

  // الموكلين
  await safeExec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      client_type TEXT DEFAULT 'natural_person',
      business_name TEXT,
      legal_representative TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الموكلين');

  // المنظمات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      address TEXT,
      phone TEXT,
      wilaya_id INTEGER REFERENCES wilayas(id),
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول المنظمات');

  // المحامين
  await safeExec(`
    CREATE TABLE IF NOT EXISTS lawyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      professional_address TEXT,
      organization_id INTEGER REFERENCES organizations(id),
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول المحامين');

  // القضايا
  await safeExec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT,
      case_type TEXT,
      judicial_body_id INTEGER REFERENCES judicial_bodies(id),
      chamber_id INTEGER REFERENCES chambers(id),
      wilaya_id INTEGER REFERENCES wilayas(id),
      registration_date INTEGER,
      first_session_date INTEGER,
      subject TEXT,
      status TEXT DEFAULT 'active',
      fees REAL,
      notes TEXT,
      judgment_number TEXT,
      judgment_date INTEGER,
      issuing_court TEXT,
      original_case_number TEXT,
      original_court TEXT,
      original_judgment_date INTEGER,
      council_decision_date INTEGER,
      council_name TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول القضايا');

  // جدول الربط بين القضايا والموكلين
  await safeExec(`
    CREATE TABLE IF NOT EXISTS case_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'plaintiff',
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      client_description TEXT,
      opponent_first_name TEXT,
      opponent_last_name TEXT,
      opponent_phone TEXT,
      opponent_address TEXT,
      description TEXT,
      lawyer_id INTEGER REFERENCES lawyers(id),
      lawyer_description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول أطراف القضايا');

  // الجلسات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER REFERENCES cases(id) ON DELETE CASCADE,
      session_date INTEGER,
      adjournment_reason TEXT,
      decision TEXT,
      ruling_text TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الجلسات');

  // أحداث التقويم
  await safeExec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      event_date INTEGER,
      end_date INTEGER,
      case_id INTEGER REFERENCES cases(id),
      session_id INTEGER REFERENCES sessions(id),
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول أحداث التقويم');

  // الإعدادات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الإعدادات');

  // إعدادات المكتب
  await safeExec(`
    CREATE TABLE IF NOT EXISTS office_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      office_name TEXT DEFAULT 'مكتب المحامي',
      lawyer_name TEXT DEFAULT 'المحامي',
      registration_number TEXT,
      specialization TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      wilaya_id INTEGER REFERENCES wilayas(id),
      logo TEXT,
      primary_color TEXT DEFAULT '#1e40af',
      secondary_color TEXT DEFAULT '#3b82f6',
      accent_color TEXT DEFAULT '#f59e0b',
      font_family TEXT DEFAULT 'Tajawal',
      signature TEXT,
      stamp TEXT,
      print_header TEXT,
      print_footer TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول إعدادات المكتب');

  // سجل النشاطات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول سجل النشاطات');

  // مصاريف القضايا
  await safeExec(`
    CREATE TABLE IF NOT EXISTS case_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول مصاريف القضايا');

  // ملفات القضايا
  await safeExec(`
    CREATE TABLE IF NOT EXISTS case_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_type TEXT,
      file_path TEXT,
      file_size INTEGER,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول ملفات القضايا');

  console.log('✅ تم إنشاء جميع الجداول');
}

// إدخال البيانات الأولية
export async function seedDatabase() {
  try {
    // التحقق من وجود الولايات
    const existingWilayas = await db.select().from(schema.wilayas);
    
    if (existingWilayas.length === 0) {
      await db.insert(schema.wilayas).values(
        algerianWilayas.map(w => ({
          number: w.number,
          name: w.name,
        }))
      );
      console.log('✅ تم إدخال الولايات الجزائرية الـ 58');
    }

    // التحقق من وجود الإعدادات الافتراضية
    const existingSettings = await db.select().from(schema.settings);
    
    if (existingSettings.length === 0) {
      await db.insert(schema.settings).values({
        key: 'passcode',
        value: '123456',
      });
      console.log('✅ تم إدخال الإعدادات الافتراضية');
    }
  } catch (error) {
    console.error('خطأ في إدخال البيانات الأولية:', error);
  }
}

// تهيئة قاعدة البيانات
export async function initializeDatabase() {
  try {
    await createTables();
    await seedDatabase();
    console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
    return { success: true };
  } catch (error) {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'خطأ غير معروف' 
    };
  }
}
