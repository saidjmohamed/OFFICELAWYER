import { sqlite, db } from './index';
import * as schema from './schema';
import { algerianWilayas } from './seed-data';
import { eq } from 'drizzle-orm';

// دالة آمنة لتنفيذ SQL
function safeExec(sql: string, description?: string) {
  try {
    sqlite.exec(sql);
    if (description) {
      console.log(`✅ ${description}`);
    }
    return true;
  } catch (error) {
    // إذا كان الخطأ هو أن الجدول موجود بالفعل، تجاهله
    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('already exists')) {
      return true;
    }
    console.error(`❌ خطأ في: ${description || sql.substring(0, 50)}`, error);
    return false;
  }
}

// إنشاء الجداول
export function createTables() {
  // الولايات (يجب أن تكون أولاً)
  safeExec(`
    CREATE TABLE IF NOT EXISTS wilayas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الولايات');

  // الهيئات القضائية
  safeExec(`
    CREATE TABLE IF NOT EXISTS judicial_bodies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('supreme_court', 'judicial_council', 'court', 'admin_appeal_court', 'admin_court', 'commercial_court')),
      wilaya_id INTEGER REFERENCES wilayas(id),
      parent_id INTEGER REFERENCES judicial_bodies(id),
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الهيئات القضائية');

  // الغرف والأقسام
  safeExec(`
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
  safeExec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الموكلين');

  // المنظمات
  safeExec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT CHECK(type IN ('bar_association', 'judicial_council', 'court', 'other')),
      address TEXT,
      phone TEXT,
      wilaya_id INTEGER REFERENCES wilayas(id),
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول المنظمات');

  // المحامين
  safeExec(`
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
  safeExec(`
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
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'adjourned', 'judged', 'closed')),
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
  safeExec(`
    CREATE TABLE IF NOT EXISTS case_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'plaintiff' CHECK(role IN ('plaintiff', 'defendant')),
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
  safeExec(`
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
  safeExec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('session', 'appointment', 'meeting', 'task')),
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
  safeExec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الإعدادات');

  // إعدادات المكتب (للتخصيص)
  safeExec(`
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
  safeExec(`
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

  // === التحقق من الهيكل وإضافة الأعمدة المفقودة ===

  // التحقق من هيكل جدول judicial_bodies
  try {
    const columns = sqlite.prepare("PRAGMA table_info(judicial_bodies)").all() as any[];
    const columnNames = columns.map((col: any) => col.name);
    
    if (!columnNames.includes('wilaya_id')) {
      safeExec(`ALTER TABLE judicial_bodies ADD COLUMN wilaya_id INTEGER REFERENCES wilayas(id) DEFAULT 16`, 'إضافة عمود wilaya_id');
    }
    
    if (!columnNames.includes('parent_id')) {
      safeExec(`ALTER TABLE judicial_bodies ADD COLUMN parent_id INTEGER REFERENCES judicial_bodies(id)`, 'إضافة عمود parent_id');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول judicial_bodies');
  }

  // التحقق من هيكل جدول cases
  try {
    const caseColumns = sqlite.prepare("PRAGMA table_info(cases)").all() as any[];
    const caseColumnNames = caseColumns.map((col: any) => col.name);
    
    const newCaseColumns = [
      { name: 'wilaya_id', sql: 'ALTER TABLE cases ADD COLUMN wilaya_id INTEGER REFERENCES wilayas(id)' },
      { name: 'first_session_date', sql: 'ALTER TABLE cases ADD COLUMN first_session_date INTEGER' },
      { name: 'original_case_number', sql: 'ALTER TABLE cases ADD COLUMN original_case_number TEXT' },
      { name: 'original_court', sql: 'ALTER TABLE cases ADD COLUMN original_court TEXT' },
      { name: 'judgment_number', sql: 'ALTER TABLE cases ADD COLUMN judgment_number TEXT' },
      { name: 'judgment_date', sql: 'ALTER TABLE cases ADD COLUMN judgment_date INTEGER' },
      { name: 'issuing_court', sql: 'ALTER TABLE cases ADD COLUMN issuing_court TEXT' },
      { name: 'original_judgment_date', sql: 'ALTER TABLE cases ADD COLUMN original_judgment_date INTEGER' },
      { name: 'council_decision_date', sql: 'ALTER TABLE cases ADD COLUMN council_decision_date INTEGER' },
      { name: 'council_name', sql: 'ALTER TABLE cases ADD COLUMN council_name TEXT' },
    ];

    for (const col of newCaseColumns) {
      if (!caseColumnNames.includes(col.name)) {
        safeExec(col.sql, `إضافة عمود ${col.name}`);
      }
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول cases');
  }

  // التحقق من هيكل جدول case_clients
  try {
    const ccColumns = sqlite.prepare("PRAGMA table_info(case_clients)").all() as any[];
    const ccColumnNames = ccColumns.map((col: any) => col.name);
    
    const newCcColumns = [
      { name: 'role', sql: `ALTER TABLE case_clients ADD COLUMN role TEXT DEFAULT 'plaintiff' CHECK(role IN ('plaintiff', 'defendant'))` },
      { name: 'description', sql: 'ALTER TABLE case_clients ADD COLUMN description TEXT' },
      { name: 'opponent_first_name', sql: 'ALTER TABLE case_clients ADD COLUMN opponent_first_name TEXT' },
      { name: 'opponent_last_name', sql: 'ALTER TABLE case_clients ADD COLUMN opponent_last_name TEXT' },
      { name: 'opponent_phone', sql: 'ALTER TABLE case_clients ADD COLUMN opponent_phone TEXT' },
      { name: 'opponent_address', sql: 'ALTER TABLE case_clients ADD COLUMN opponent_address TEXT' },
      { name: 'lawyer_id', sql: 'ALTER TABLE case_clients ADD COLUMN lawyer_id INTEGER REFERENCES lawyers(id)' },
      { name: 'client_description', sql: 'ALTER TABLE case_clients ADD COLUMN client_description TEXT' },
      { name: 'lawyer_description', sql: 'ALTER TABLE case_clients ADD COLUMN lawyer_description TEXT' },
    ];

    for (const col of newCcColumns) {
      if (!ccColumnNames.includes(col.name)) {
        safeExec(col.sql, `إضافة عمود ${col.name}`);
      }
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول case_clients');
  }

  // التحقق من هيكل جدول chambers
  try {
    const chamberColumns = sqlite.prepare("PRAGMA table_info(chambers)").all() as any[];
    const chamberColumnNames = chamberColumns.map((col: any) => col.name);
    
    if (!chamberColumnNames.includes('chamber_type')) {
      safeExec('ALTER TABLE chambers ADD COLUMN chamber_type TEXT', 'إضافة عمود chamber_type');
    }
    
    if (!chamberColumnNames.includes('room_number')) {
      safeExec('ALTER TABLE chambers ADD COLUMN room_number INTEGER', 'إضافة عمود room_number');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول chambers');
  }

  // التحقق من هيكل جدول clients (نوع الموكل)
  try {
    const clientColumns = sqlite.prepare("PRAGMA table_info(clients)").all() as any[];
    const clientColumnNames = clientColumns.map((col: any) => col.name);
    
    if (!clientColumnNames.includes('client_type')) {
      safeExec("ALTER TABLE clients ADD COLUMN client_type TEXT DEFAULT 'natural_person' CHECK(client_type IN ('natural_person', 'legal_entity'))", 'إضافة عمود client_type');
    }
    
    if (!clientColumnNames.includes('business_name')) {
      safeExec('ALTER TABLE clients ADD COLUMN business_name TEXT', 'إضافة عمود business_name');
    }
    
    if (!clientColumnNames.includes('legal_representative')) {
      safeExec('ALTER TABLE clients ADD COLUMN legal_representative TEXT', 'إضافة عمود legal_representative');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول clients');
  }

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
    createTables();
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
