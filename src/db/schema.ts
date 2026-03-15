import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ==================== إصدار قاعدة البيانات ====================
// يجب تحديث هذا الرقم عند أي تغيير في هيكل قاعدة البيانات
export const DATABASE_SCHEMA_VERSION = 3;

// الولايات الجزائرية
export const wilayas = sqliteTable('wilayas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  number: integer('number').notNull().unique(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// تعريف أنواع الغرف والأقسام
// أنواع الغرف للمحكمة العليا
export const SUPREME_COURT_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', requireNumber: true },
  { id: 'real_estate', name: 'الغرفة العقارية', requireNumber: false },
  { id: 'family_inheritance', name: 'غرفة شؤون الأسرة و المواريث', requireNumber: false },
  { id: 'commercial_maritime', name: 'الغرفة التجارية و البحرية', requireNumber: false },
  { id: 'social', name: 'الغرفة الإجتماعية', requireNumber: false },
  { id: 'criminal', name: 'الغرفة الجنائية', requireNumber: false },
  { id: 'misdemeanors', name: 'غرفة الجنح و المخالفات', requireNumber: false },
] as const;

// أنواع الغرف للمجلس القضائي
export const JUDICIAL_COUNCIL_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', requireNumber: false },
  { id: 'penal', name: 'الغرفة الجزائية', requireNumber: false },
  { id: 'indictment', name: 'غرفة الاتهام', requireNumber: false },
  { id: 'urgent', name: 'الغرفة الاستعجالية', requireNumber: false },
  { id: 'family', name: 'غرفة شؤون الأسرة', requireNumber: false },
  { id: 'juvenile', name: 'غرفة الأحداث', requireNumber: false },
  { id: 'social', name: 'الغرفة الاجتماعية', requireNumber: false },
  { id: 'real_estate', name: 'الغرفة العقارية', requireNumber: false },
  { id: 'maritime', name: 'الغرفة البحرية', requireNumber: false },
  { id: 'commercial', name: 'الغرفة التجارية', requireNumber: false },
] as const;

// أنواع الأقسام للمحكمة
export const COURT_SECTIONS = [
  { id: 'civil', name: 'القسم المدني', requireNumber: false },
  { id: 'misdemeanors', name: 'قسم الجنح', requireNumber: false },
  { id: 'contraventions', name: 'قسم المخالفات', requireNumber: false },
  { id: 'urgent', name: 'القسم الاستعجالي', requireNumber: false },
  { id: 'family', name: 'قسم شؤون الأسرة', requireNumber: false },
  { id: 'juvenile', name: 'قسم الأحداث', requireNumber: false },
  { id: 'social', name: 'القسم الاجتماعي', requireNumber: false },
  { id: 'real_estate', name: 'القسم العقاري', requireNumber: false },
  { id: 'maritime', name: 'القسم البحري', requireNumber: false },
  { id: 'commercial', name: 'القسم التجاري', requireNumber: false },
] as const;

// الهيئات القضائية - الجدول الرئيسي
export const judicialBodies = sqliteTable('judicial_bodies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: [
    'supreme_court',         // المحكمة العليا
    'state_council',         // مجلس الدولة
    'judicial_council',      // مجلس قضائي
    'court',                 // محكمة
    'admin_appeal_court',    // محكمة إدارية استئنافية
    'admin_court',           // محكمة إدارية ابتدائية
    'commercial_court',      // محكمة تجارية متخصصة
  ] }).notNull(),
  wilayaId: integer('wilaya_id').references(() => wilayas.id), // للمحكمة العليا: null
  parentId: integer('parent_id').references(() => judicialBodies.id), // للمحاكم: المجلس القضائي الأم
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// الغرف والأقسام مع رقم الغرفة
export const chambers = sqliteTable('chambers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  chamberType: text('chamber_type').notNull(), // نوع الغرفة (civil, penal, etc.)
  roomNumber: integer('room_number'), // رقم الغرفة (1-10 أو null)
  judicialBodyId: integer('judicial_body_id').references(() => judicialBodies.id, { onDelete: 'cascade' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// الموكلين
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fullName: text('full_name'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  clientType: text('client_type', { enum: ['natural_person', 'legal_entity'] }).default('natural_person'),
  businessName: text('business_name'),
  legalRepresentative: text('legal_representative'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// المنظمات (نقابات المحامين)
export const organizations = sqliteTable('organizations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name'),
  type: text('type', { enum: [
    'bar_association',      // نقابة محامين
    'other'                 // أخرى
  ] }),
  address: text('address'),
  phone: text('phone'),
  wilayaId: integer('wilaya_id').references(() => wilayas.id),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// المحامين
export const lawyers = sqliteTable('lawyers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  professionalAddress: text('professional_address'),
  organizationId: integer('organization_id').references(() => organizations.id),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// القضايا
export const cases = sqliteTable('cases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseNumber: text('case_number'),
  caseType: text('case_type'),
  judicialBodyId: integer('judicial_body_id').references(() => judicialBodies.id),
  chamberId: integer('chamber_id').references(() => chambers.id),
  wilayaId: integer('wilaya_id').references(() => wilayas.id),
  registrationDate: integer('registration_date', { mode: 'timestamp' }),
  firstSessionDate: integer('first_session_date', { mode: 'timestamp' }),
  subject: text('subject'),
  status: text('status', { enum: ['active', 'adjourned', 'judged', 'closed', 'archived'] }).default('active'),
  fees: real('fees'),
  notes: text('notes'),
  // معارضة
  judgmentNumber: text('judgment_number'),
  judgmentDate: integer('judgment_date', { mode: 'timestamp' }),
  issuingCourt: text('issuing_court'),
  // استئناف
  originalCaseNumber: text('original_case_number'),
  originalCourt: text('original_court'),
  // طعن بالنقض
  originalJudgmentDate: integer('original_judgment_date', { mode: 'timestamp' }),
  councilDecisionDate: integer('council_decision_date', { mode: 'timestamp' }),
  councilName: text('council_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// جدول الربط بين القضايا والموكلين
export const caseClients = sqliteTable('case_clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['plaintiff', 'defendant'] }).default('plaintiff'),
  clientId: integer('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  clientDescription: text('client_description'), // بصفته للموكل
  opponentFirstName: text('opponent_first_name'),
  opponentLastName: text('opponent_last_name'),
  opponentPhone: text('opponent_phone'),
  opponentAddress: text('opponent_address'),
  description: text('description'), // صفة الخصم
  lawyerId: integer('lawyer_id').references(() => lawyers.id),
  lawyerDescription: text('lawyer_description'), // بصفته للمحامي
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// الجلسات
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }),
  sessionDate: integer('session_date', { mode: 'timestamp' }),
  adjournmentReason: text('adjournment_reason'),
  decision: text('decision'),
  rulingText: text('ruling_text'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// أحداث التقويم
export const calendarEvents = sqliteTable('calendar_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  type: text('type', { enum: ['session', 'appointment', 'meeting', 'task'] }).notNull(),
  eventDate: integer('event_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  caseId: integer('case_id').references(() => cases.id),
  sessionId: integer('session_id').references(() => sessions.id),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ملفات القضايا
export const caseFiles = sqliteTable('case_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  fileName: text('filename').notNull(), // استخدام اسم العمود الفعلي في قاعدة البيانات
  originalName: text('original_name').notNull(),
  filePath: text('filepath'), // مسار الملف على القرص
  fileType: text('file_type', { enum: ['subject', 'judgment', 'decision', 'other'] }),
  mimeType: text('mime_type'),
  fileSize: integer('size'), // استخدام اسم العمود الفعلي
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// مصاريف القضية
export const caseExpenses = sqliteTable('case_expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caseId: integer('case_id').references(() => cases.id, { onDelete: 'cascade' }).notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  expenseDate: integer('expense_date', { mode: 'timestamp' }),
  category: text('category'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// سجل النشاطات
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action', { enum: [
    'case_created', 'case_updated', 'case_deleted', 'case_status_changed', 'case_archived',
    'client_created', 'client_updated', 'client_deleted',
    'session_created', 'session_updated', 'session_deleted',
    'judicial_body_created', 'judicial_body_updated', 'judicial_body_deleted',
    'lawyer_created', 'lawyer_updated', 'lawyer_deleted',
    'organization_created', 'organization_updated', 'organization_deleted',
    'backup_created', 'backup_restored',
    'settings_updated',
    'login', 'logout'
  ] }).notNull(),
  entityType: text('entity_type', { enum: ['case', 'client', 'session', 'judicial_body', 'lawyer', 'organization', 'backup', 'settings', 'auth'] }),
  entityId: integer('entity_id'), // معرف الكيان المرتبط
  description: text('description').notNull(), // وصف النشاط
  details: text('details'), // تفاصيل إضافية كـ JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// الإعدادات العامة (كلمة المرور)
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// جدول تتبع إصدارات قاعدة البيانات
export const schemaMigrations = sqliteTable('schema_migrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version: integer('version').notNull(),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  description: text('description'),
});

// إعدادات المكتب (للتخصيص)
export const officeSettings = sqliteTable('office_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // معلومات المكتب
  officeName: text('office_name').default('مكتب المحامي'),
  lawyerName: text('lawyer_name').default('المحامي'),
  registrationNumber: text('registration_number'), // رقم التسجيل في النقابة
  specialization: text('specialization'), // التخصص
  // معلومات الاتصال
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  wilayaId: integer('wilaya_id').references(() => wilayas.id),
  // التخصيص البصري
  logo: text('logo'), // الشعار كـ base64
  primaryColor: text('primary_color').default('#1e40af'), // اللون الرئيسي
  secondaryColor: text('secondary_color').default('#3b82f6'), // اللون الثانوي
  accentColor: text('accent_color').default('#f59e0b'), // لون التمييز
  fontFamily: text('font_family').default('Tajawal'), // نوع الخط
  // التوقيع
  signature: text('signature'), // التوقيع كـ base64
  stamp: text('stamp'), // الختم كـ base64
  // إعدادات الطباعة
  printHeader: text('print_header'), // ترويسة الوثائق
  printFooter: text('print_footer'), // تذييل الوثائق
  // التواريخ
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// العلاقات
export const judicialBodiesRelations = relations(judicialBodies, ({ many, one }) => ({
  chambers: many(chambers),
  cases: many(cases),
  wilaya: one(wilayas, {
    fields: [judicialBodies.wilayaId],
    references: [wilayas.id],
  }),
  parent: one(judicialBodies, {
    fields: [judicialBodies.parentId],
    references: [judicialBodies.id],
  }),
  children: many(judicialBodies),
}));

export const chambersRelations = relations(chambers, ({ one, many }) => ({
  judicialBody: one(judicialBodies, {
    fields: [chambers.judicialBodyId],
    references: [judicialBodies.id],
  }),
  cases: many(cases),
}));

export const wilayasRelations = relations(wilayas, ({ many }) => ({
  cases: many(cases),
  judicialBodies: many(judicialBodies),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  caseClients: many(caseClients),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  lawyers: many(lawyers),
  wilaya: one(wilayas, {
    fields: [organizations.wilayaId],
    references: [wilayas.id],
  }),
}));

export const lawyersRelations = relations(lawyers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [lawyers.organizationId],
    references: [organizations.id],
  }),
  caseClients: many(caseClients),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  judicialBody: one(judicialBodies, {
    fields: [cases.judicialBodyId],
    references: [judicialBodies.id],
  }),
  chamber: one(chambers, {
    fields: [cases.chamberId],
    references: [chambers.id],
  }),
  wilaya: one(wilayas, {
    fields: [cases.wilayaId],
    references: [wilayas.id],
  }),
  caseClients: many(caseClients),
  sessions: many(sessions),
  calendarEvents: many(calendarEvents),
  caseFiles: many(caseFiles),
  caseExpenses: many(caseExpenses),
}));

export const caseClientsRelations = relations(caseClients, ({ one }) => ({
  case: one(cases, {
    fields: [caseClients.caseId],
    references: [cases.id],
  }),
  client: one(clients, {
    fields: [caseClients.clientId],
    references: [clients.id],
  }),
  lawyer: one(lawyers, {
    fields: [caseClients.lawyerId],
    references: [lawyers.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  case: one(cases, {
    fields: [sessions.caseId],
    references: [cases.id],
  }),
  calendarEvents: many(calendarEvents),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  case: one(cases, {
    fields: [calendarEvents.caseId],
    references: [cases.id],
  }),
  session: one(sessions, {
    fields: [calendarEvents.sessionId],
    references: [sessions.id],
  }),
}));

export const caseFilesRelations = relations(caseFiles, ({ one }) => ({
  case: one(cases, {
    fields: [caseFiles.caseId],
    references: [cases.id],
  }),
}));

export const caseExpensesRelations = relations(caseExpenses, ({ one }) => ({
  case: one(cases, {
    fields: [caseExpenses.caseId],
    references: [cases.id],
  }),
}));

export const officeSettingsRelations = relations(officeSettings, ({ one }) => ({
  wilaya: one(wilayas, {
    fields: [officeSettings.wilayaId],
    references: [wilayas.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ }) => ({
  // لا توجد علاقات مباشرة - العلاقة تتم عبر entityId و entityType
}));

// ==================== جداول المستخدمين والأدوار ====================

// الأدوار
export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // اسم الدور بالإنجليزية (للاستخدام في الكود)
  nameAr: text('name_ar').notNull(), // اسم الدور بالعربية
  description: text('description'),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false), // دور نظام لا يمكن حذفه
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// الصلاحيات
export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(), // اسم الصلاحية (cases.read, clients.write, etc.)
  nameAr: text('name_ar').notNull(), // اسم الصلاحية بالعربية
  scope: text('scope').notNull(), // نطاق الصلاحية (cases, clients, settings, etc.)
  type: text('type', { enum: ['read', 'write', 'delete', 'admin'] }).notNull(), // نوع الصلاحية
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// صلاحيات الأدوار (ربط many-to-many)
export const rolePermissions = sqliteTable('role_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
});

// المستخدمون
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(), // كلمة المرور مجزأة
  email: text('email').unique(),
  fullName: text('full_name'),
  roleId: integer('role_id').references(() => roles.id),
  status: text('status', { enum: ['active', 'inactive', 'suspended'] }).default('active'),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// علاقات المستخدمين والأدوار
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  permissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

// أنواع TypeScript
export type JudicialBody = typeof judicialBodies.$inferSelect;
export type NewJudicialBody = typeof judicialBodies.$inferInsert;
export type Chamber = typeof chambers.$inferSelect;
export type NewChamber = typeof chambers.$inferInsert;
export type Wilaya = typeof wilayas.$inferSelect;
export type NewWilaya = typeof wilayas.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Lawyer = typeof lawyers.$inferSelect;
export type NewLawyer = typeof lawyers.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type CaseClient = typeof caseClients.$inferSelect;
export type NewCaseClient = typeof caseClients.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type CaseFile = typeof caseFiles.$inferSelect;
export type NewCaseFile = typeof caseFiles.$inferInsert;
export type CaseExpense = typeof caseExpenses.$inferSelect;
export type NewCaseExpense = typeof caseExpenses.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type OfficeSetting = typeof officeSettings.$inferSelect;
export type NewOfficeSetting = typeof officeSettings.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type SchemaMigration = typeof schemaMigrations.$inferSelect;
export type NewSchemaMigration = typeof schemaMigrations.$inferInsert;

// أنواع جداول المستخدمين والأدوار
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ==================== جلسات المستخدمين ====================

// جلسات المستخدمين (للمصادقة)
export const userSessions = sqliteTable('user_sessions', {
  id: text('id').primaryKey(), // معرف الجلسة
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
