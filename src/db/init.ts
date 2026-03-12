import { getClient, db } from './index';
import * as schema from './schema';
import { DATABASE_SCHEMA_VERSION } from './schema';
import { algerianWilayas, defaultRoles, defaultPermissions, rolePermissionsMap, defaultAdminUser } from './seed-data';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';

// دالة آمنة لتنفيذ SQL باستخدام libSQL
async function safeExec(sql: string, description?: string) {
  try {
    const client = getClient();
    await client.execute(sql);
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

// الحصول على إصدار قاعدة البيانات الحالي
export async function getDatabaseSchemaVersion(): Promise<number> {
  try {
    const client = getClient();
    // التحقق من وجود جدول schema_migrations
    const tableCheck = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'"
    );
    
    if (tableCheck.rows.length === 0) {
      return 0; // لا يوجد جدول، إذن الإصدار 0
    }
    
    const result = await client.execute(
      'SELECT MAX(version) as version FROM schema_migrations'
    );
    
    return Number(result.rows[0]?.[0]) || 0;
  } catch (error) {
    console.error('خطأ في الحصول على إصدار قاعدة البيانات:', error);
    return 0;
  }
}

// تسجيل إصدار جديد
async function recordMigration(version: number, description: string) {
  try {
    const client = getClient();
    await client.execute(
      `INSERT INTO schema_migrations (version, description, applied_at) VALUES (${version}, '${description.replace(/'/g, "''")}', ${Date.now()})`
    );
    console.log(`✅ تم تسجيل الترقية إلى الإصدار ${version}`);
  } catch (error) {
    console.error('خطأ في تسجيل الترقية:', error);
  }
}

// تنفيذ الترقيات المعلقة
async function runMigrations() {
  const currentVersion = await getDatabaseSchemaVersion();
  console.log(`📊 إصدار قاعدة البيانات الحالي: ${currentVersion}`);
  console.log(`📊 إصدار التطبيق المطلوب: ${DATABASE_SCHEMA_VERSION}`);
  
  if (currentVersion >= DATABASE_SCHEMA_VERSION) {
    console.log('✅ قاعدة البيانات محدثة');
    return;
  }
  
  // تنفيذ الترقيات من currentVersion + 1 إلى DATABASE_SCHEMA_VERSION
  for (let version = currentVersion + 1; version <= DATABASE_SCHEMA_VERSION; version++) {
    console.log(`🔄 تنفيذ الترقية إلى الإصدار ${version}...`);
    
    if (version === 1) {
      // الإصدار الأولي - تسجيل أن قاعدة البيانات موجودة
      await recordMigration(1, 'الإصدار الأولي من قاعدة البيانات');
    } else if (version === 2) {
      // جدول schema_migrations تم إنشاؤه في createTables
      await recordMigration(2, 'إضافة نظام تتبع الإصدارات');
    } else {
      console.log(`⚠️ لا توجد ترقية للإصدار ${version}`);
    }
  }
  
  console.log(`✅ تم تحديث قاعدة البيانات إلى الإصدار ${DATABASE_SCHEMA_VERSION}`);
}

// تنفيذ الترقيات على قاعدة البيانات المسترجعة (للاستخدام من نظام النسخ الاحتياطي)
export async function runMigrationsOnRestoredDb() {
  // إعادة تعيين الاتصال لضمان استخدام القاعدة الجديدة
  const { resetDbConnection } = await import('./index');
  resetDbConnection?.();
  
  // تشغيل الترقيات
  await runMigrations();
}

// دالة للحصول على معلومات الجدول
async function getTableInfo(tableName: string): Promise<string[]> {
  try {
    const client = getClient();
    const result = await client.execute(`PRAGMA table_info(${tableName})`);
    return result.rows.map((row) => row.name as string);
  } catch {
    return [];
  }
}

// إنشاء الجداول
export async function createTables() {
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
      type TEXT NOT NULL CHECK(type IN ('supreme_court', 'judicial_council', 'court', 'admin_appeal_court', 'admin_court', 'commercial_court')),
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
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الموكلين');

  // المنظمات
  await safeExec(`
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
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'adjourned', 'judged', 'closed', 'archived')),
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
  await safeExec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الإعدادات');

  // سجل النشاطات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      description TEXT NOT NULL,
      details TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول سجل النشاطات');

  // إعدادات المكتب (للتخصيص)
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

  // ملفات القضايا
  await safeExec(`
    CREATE TABLE IF NOT EXISTS case_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      filepath TEXT NOT NULL,
      size INTEGER,
      mime_type TEXT,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول ملفات القضايا');

  // مصاريف القضايا
  await safeExec(`
    CREATE TABLE IF NOT EXISTS case_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date INTEGER,
      category TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول مصاريف القضايا');

  // جدول تتبع الإصدارات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL,
      description TEXT,
      applied_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول تتبع الإصدارات');

  // === جداول المستخدمين والأدوار ===

  // جدول الأدوار
  await safeExec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الأدوار');

  // جدول الصلاحيات
  await safeExec(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      name_ar TEXT NOT NULL,
      scope TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('read', 'write', 'delete', 'admin')),
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول الصلاحيات');

  // جدول صلاحيات الأدوار
  await safeExec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_id)
    )
  `, 'إنشاء جدول صلاحيات الأدوار');

  // جدول المستخدمين
  await safeExec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      full_name TEXT,
      role_id INTEGER REFERENCES roles(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      last_login_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول المستخدمين');

  // جدول جلسات المستخدمين
  await safeExec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'إنشاء جدول جلسات المستخدمين');

  // === التحقق من الهيكل وإضافة الأعمدة المفقودة ===

  // التحقق من هيكل جدول judicial_bodies
  try {
    const columnNames = await getTableInfo('judicial_bodies');
    
    if (!columnNames.includes('wilaya_id')) {
      await safeExec(`ALTER TABLE judicial_bodies ADD COLUMN wilaya_id INTEGER REFERENCES wilayas(id) DEFAULT 16`, 'إضافة عمود wilaya_id');
    }
    
    if (!columnNames.includes('parent_id')) {
      await safeExec(`ALTER TABLE judicial_bodies ADD COLUMN parent_id INTEGER REFERENCES judicial_bodies(id)`, 'إضافة عمود parent_id');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول judicial_bodies');
  }

  // التحقق من هيكل جدول cases
  try {
    const caseColumnNames = await getTableInfo('cases');
    
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
        await safeExec(col.sql, `إضافة عمود ${col.name}`);
      }
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول cases');
  }

  // التحقق من هيكل جدول case_clients
  try {
    const ccColumnNames = await getTableInfo('case_clients');
    
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
        await safeExec(col.sql, `إضافة عمود ${col.name}`);
      }
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول case_clients');
  }

  // التحقق من هيكل جدول chambers
  try {
    const chamberColumnNames = await getTableInfo('chambers');
    
    if (!chamberColumnNames.includes('chamber_type')) {
      await safeExec('ALTER TABLE chambers ADD COLUMN chamber_type TEXT', 'إضافة عمود chamber_type');
    }
    
    if (!chamberColumnNames.includes('room_number')) {
      await safeExec('ALTER TABLE chambers ADD COLUMN room_number INTEGER', 'إضافة عمود room_number');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول chambers');
  }

  // التحقق من هيكل جدول clients (نوع الموكل)
  try {
    const clientColumnNames = await getTableInfo('clients');
    
    if (!clientColumnNames.includes('client_type')) {
      await safeExec("ALTER TABLE clients ADD COLUMN client_type TEXT DEFAULT 'natural_person' CHECK(client_type IN ('natural_person', 'legal_entity'))", 'إضافة عمود client_type');
    }
    
    if (!clientColumnNames.includes('business_name')) {
      await safeExec('ALTER TABLE clients ADD COLUMN business_name TEXT', 'إضافة عمود business_name');
    }
    
    if (!clientColumnNames.includes('legal_representative')) {
      await safeExec('ALTER TABLE clients ADD COLUMN legal_representative TEXT', 'إضافة عمود legal_representative');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول clients');
  }

  // التحقق من هيكل جدول case_expenses
  try {
    const expenseColumnNames = await getTableInfo('case_expenses');
    
    if (!expenseColumnNames.includes('updated_at')) {
      await safeExec('ALTER TABLE case_expenses ADD COLUMN updated_at INTEGER', 'إضافة عمود updated_at لمصروفات القضايا');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول case_expenses');
  }

  // التحقق من هيكل جدول case_files
  try {
    const caseFilesColumnNames = await getTableInfo('case_files');
    
    if (!caseFilesColumnNames.includes('file_type')) {
      await safeExec("ALTER TABLE case_files ADD COLUMN file_type TEXT CHECK(file_type IN ('subject', 'judgment', 'decision', 'other'))", 'إضافة عمود file_type لملفات القضايا');
    }
  } catch (error) {
    console.log('تحذير: لم نتمكن من تحديث هيكل جدول case_files');
  }

  // إنشاء فهارس للبحث السريع
  console.log('📊 إنشاء فهارس البحث...');
  
  // فهرس للموكلين
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_clients_fullname ON clients(full_name COLLATE NOCASE)`, 'فهرس أسماء الموكلين');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)`, 'فهرس هواتف الموكلين');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_clients_business_name ON clients(business_name COLLATE NOCASE)`, 'فهرس أسماء الشركات');
  
  // فهرس للقضايا
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_cases_number ON cases(case_number)`, 'فهرس أرقام القضايا');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)`, 'فهرس حالة القضايا');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_cases_judicial_body ON cases(judicial_body_id)`, 'فهرس الهيئات القضائية');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_cases_subject ON cases(subject COLLATE NOCASE)`, 'فهرس موضوعات القضايا');
  
  // فهرس للمحامين
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_lawyers_name ON lawyers(first_name COLLATE NOCASE, last_name COLLATE NOCASE)`, 'فهرس أسماء المحامين');
  
  // فهرس للجلسات
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date)`, 'فهرس تواريخ الجلسات');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_sessions_case ON sessions(case_id)`, 'فهرس جلسات القضايا');
  
  // فهرس لأطراف القضايا
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_case_clients_case ON case_clients(case_id)`, 'فهرس أطراف القضايا');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_case_clients_client ON case_clients(client_id)`, 'فهرس موكلي القضايا');
  
  // فهرس للهيئات القضائية
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_judicial_bodies_name ON judicial_bodies(name COLLATE NOCASE)`, 'فهرس أسماء الهيئات القضائية');
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_judicial_bodies_type ON judicial_bodies(type)`, 'فهرس أنواع الهيئات القضائية');
  
  // فهرس للمنظمات
  await safeExec(`CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name COLLATE NOCASE)`, 'فهرس أسماء المنظمات');
  
  console.log('✅ تم إنشاء فهارس البحث');

  // إنشاء جدول activity_logs إذا لم يكن موجوداً
  await safeExec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      description TEXT NOT NULL,
      details TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `, 'التحقق من جدول سجل النشاطات');

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

    // === إدخال الأدوار والصلاحيات ===
    const existingRoles = await db.select().from(schema.roles);
    
    if (existingRoles.length === 0) {
      // إدخال الأدوار
      await db.insert(schema.roles).values(
        defaultRoles.map(r => ({
          name: r.name,
          nameAr: r.nameAr,
          description: r.description,
          isSystem: r.isSystem ? 1 : 0,
        }))
      );
      console.log('✅ تم إدخال الأدوار الافتراضية');

      // إدخال الصلاحيات
      await db.insert(schema.permissions).values(
        defaultPermissions.map(p => ({
          name: p.name,
          nameAr: p.nameAr,
          scope: p.scope,
          type: p.type,
          description: p.description,
        }))
      );
      console.log('✅ تم إدخال الصلاحيات الافتراضية');

      // جلب معرفات الأدوار والصلاحيات
      const roles = await db.select().from(schema.roles);
      const permissions = await db.select().from(schema.permissions);

      // إنشاء خريطة للصلاحيات
      const permissionMap = new Map(permissions.map(p => [p.name, p.id]));
      const roleMap = new Map(roles.map(r => [r.name, r.id]));

      // إدخال صلاحيات الأدوار
      for (const [roleName, perms] of Object.entries(rolePermissionsMap)) {
        const roleId = roleMap.get(roleName);
        if (!roleId) continue;

        for (const permName of perms) {
          const permissionId = permissionMap.get(permName);
          if (!permissionId) continue;

          await db.insert(schema.rolePermissions).values({
            roleId,
            permissionId,
          });
        }
      }
      console.log('✅ تم إدخال صلاحيات الأدوار');

      // إدخال المستخدم المدير الافتراضي
      const adminRoleId = roleMap.get('admin');
      if (adminRoleId) {
        // تجزئة كلمة المرور
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(defaultAdminUser.password, salt, 10000, 64, 'sha256').toString('hex');
        const hashedPassword = `${salt}:${hash}`;

        await db.insert(schema.users).values({
          username: defaultAdminUser.username,
          password: hashedPassword,
          email: defaultAdminUser.email,
          fullName: defaultAdminUser.fullName,
          roleId: adminRoleId,
          status: defaultAdminUser.status,
        });
        console.log('✅ تم إدخال المستخدم المدير الافتراضي (admin / admin123)');
      }
    }
  } catch (error) {
    console.error('خطأ في إدخال البيانات الأولية:', error);
  }
}

// تهيئة قاعدة البيانات
export async function initializeDatabase() {
  try {
    await createTables();
    await runMigrations(); // تنفيذ الترقيات
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
