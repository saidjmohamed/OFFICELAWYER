/**
 * أنواع البيانات المشتركة للتطبيق
 */

// ===== أنواع المستخدمين والصلاحيات =====

export type UserRole = 'admin' | 'manager' | 'lawyer' | 'assistant' | 'viewer';

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  module: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
  roleId: number | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPermissions extends User {
  permissions: string[];
}

// ===== أنواع API =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== أنواع الكيانات =====

export interface Case {
  id: number;
  caseNumber: string | null;
  caseType: string | null;
  subject: string | null;
  status: string;
  fees: number | null;
  registrationDate: Date | null;
  firstSessionDate: Date | null;
  judicialBodyId: number | null;
  chamberId: number | null;
  wilayaId: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: number;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  clientType: 'natural_person' | 'legal_entity';
  businessName: string | null;
  legalRepresentative: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface Session {
  id: number;
  caseId: number;
  sessionDate: Date | null;
  adjournmentReason: string | null;
  decision: string | null;
  rulingText: string | null;
  notes: string | null;
}

export interface Lawyer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  organizationId: number | null;
}

export interface Organization {
  id: number;
  name: string;
  type: string | null;
  address: string | null;
  phone: string | null;
  wilayaId: number | null;
}

// ===== أنواع سجل النشاطات =====

export interface ActivityLog {
  id: number;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'backup';
  entityType: string;
  entityId: number | null;
  description: string;
  userId: number | null;
  createdAt: Date;
}

// ===== أنواع البحث =====

export interface SearchParams {
  query: string;
  entity?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: string;
  id: number;
  title: string;
  description: string | null;
  relevance: number;
}

// ===== أنواع الفلاتر =====

export interface CaseFilters {
  status?: string;
  caseType?: string;
  judicialBodyId?: number;
  wilayaId?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ClientFilters {
  clientType?: string;
  search?: string;
}

// ===== أنواع الإحصائيات =====

export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  adjournedCases: number;
  judgedCases: number;
  totalClients: number;
  totalLawyers: number;
  upcomingSessions: number;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
}

// ===== أنواع الإعدادات =====

export interface OfficeSettings {
  id: number;
  officeName: string | null;
  lawyerName: string | null;
  logo: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

// ===== أنواع النسخ الاحتياطي =====

export interface BackupInfo {
  version: number;
  createdAt: string;
  size: number;
  checksum: string;
  tables: string[];
}
