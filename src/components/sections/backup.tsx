'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  FileArchive,
  Database,
  Calendar,
  Hash,
  Building2,
  Users,
  Scale,
  Clock,
  Building,
  Trash2,
  RefreshCw,
  Shield,
  HardDrive,
  Info,
  AlertTriangle,
  FileText,
  FolderOpen,
  Copy,
  Check,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ==================== أنواع البيانات ====================

interface BackupMetadata {
  backup_date: string;
  device_name: string;
  database_size: number;
  records: {
    clients: number;
    cases: number;
    sessions: number;
    documents: number;
    judicialBodies: number;
    chambers: number;
    lawyers: number;
    organizations: number;
    calendarEvents: number;
    caseFiles: number;
    caseExpenses: number;
  };
  app_name: string;
  app_version: string;
  backup_type: 'manual' | 'auto' | 'scheduled';
  compression: string;
  encrypted: boolean;
}

interface BackupVersion {
  app_version: string;
  database_schema_version: number;
  backup_format_version: string;
  created_at: string;
}

interface BackupChecksum {
  database_sha256: string;
  metadata_sha256: string;
  files_checksum?: { [filename: string]: string };
  calculated_at: string;
}

interface BackupPreview {
  valid: boolean;
  metadata: BackupMetadata;
  version: BackupVersion;
  checksum: BackupChecksum;
  integrityCheck: string;
  compatible: boolean;
  compatibilityWarnings: string[];
  filesCount: number;
  // معلومات الترقية
  needsMigration: boolean;
  migrationSteps: string[];
  canAutoMigrate: boolean;
}

interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: string;
  type: 'manual' | 'auto' | 'pre_restore';
}

// ==================== المكون الرئيسي ====================

export function BackupSection() {
  // حالات التصدير
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // حالات الاستيراد
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<string | null>(null);

  // حالات النسخ المحلية
  const [localBackups, setLocalBackups] = useState<BackupInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [expandedBackup, setExpandedBackup] = useState<string | null>(null);

  // حالات الحوارات
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showChecksumDialog, setShowChecksumDialog] = useState(false);
  const [selectedChecksum, setSelectedChecksum] = useState<BackupChecksum | null>(null);

  // حالات إضافية
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // تحميل النسخ المحلية
  useEffect(() => {
    loadLocalBackups();
  }, []);

  // ==================== دوال مساعدة ====================

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // ==================== تحميل النسخ المحلية ====================

  const loadLocalBackups = async () => {
    setLoadingBackups(true);
    try {
      const response = await fetch('/api/backup-v2?action=list');
      const data = await response.json();
      setLocalBackups(data.backups || []);
    } catch (error) {
      console.error('خطأ في تحميل النسخ المحلية:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  // ==================== إنشاء نسخة احتياطية ====================

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(10);

    try {
      setExportProgress(30);
      const response = await fetch('/api/backup-v2?action=export');
      const data = await response.json();

      setExportProgress(70);

      if (response.ok && data.success) {
        // إنشاء رابط تحميل
        const blob = new Blob(
          [Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0))],
          { type: 'application/zip' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportProgress(100);

        const totalRecords = Object.values(data.metadata.records).reduce(
          (a: number, b) => a + (b as number),
          0
        );

        toast({
          title: 'تم إنشاء النسخة الاحتياطية',
          description: `تم تصدير ${totalRecords} سجل بنجاح (${formatSize(data.size)})`,
        });

        // تحديث القائمة
        loadLocalBackups();
      } else {
        toast({
          title: 'خطأ',
          description: data.error || 'فشل في التصدير',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في التصدير',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  // ==================== استيراد نسخة احتياطية ====================

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف ZIP',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewing(true);

    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      setSelectedFileData(base64);

      // معاينة
      const response = await fetch('/api/backup-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', data: base64, confirmed: false }),
      });

      const data = await response.json();

      if (data.needConfirmation && data.preview) {
        setPreview(data.preview);
        setShowPreviewDialog(true);
      } else if (data.error) {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive',
        });
        resetFileSelection();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في قراءة الملف',
        variant: 'destructive',
      });
      resetFileSelection();
    } finally {
      setPreviewing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const executeRestore = async () => {
    if (!selectedFileData) return;

    setImporting(true);
    setShowPreviewDialog(false);

    try {
      const response = await fetch('/api/backup-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          data: selectedFileData,
          confirmed: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'تمت الاستعادة',
          description: `${data.message}${data.filesRestored ? ` (${data.filesRestored} ملف)` : ''}`,
        });

        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({
          title: 'خطأ',
          description: data.error || 'فشل في الاستعادة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في الاستعادة',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
      resetFileSelection();
    }
  };

  const resetFileSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    setSelectedFileData(null);
  };

  // ==================== إدارة النسخ المحلية ====================

  const handleDownloadLocal = async (backup: BackupInfo) => {
    try {
      const response = await fetch(`/api/backup-v2?action=download&filepath=${encodeURIComponent(backup.path)}`);
      const data = await response.json();

      if (data.data) {
        const blob = new Blob(
          [Uint8Array.from(atob(data.data), (c) => c.charCodeAt(0))],
          { type: 'application/zip' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = backup.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل النسخة',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLocal = async (backup: BackupInfo) => {
    try {
      const response = await fetch('/api/backup-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', filepath: backup.path }),
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'تم الحذف', description: data.message });
        loadLocalBackups();
      } else {
        toast({
          title: 'خطأ',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف النسخة',
        variant: 'destructive',
      });
    }
  };

  // ==================== مكونات فرعية ====================

  const RecordStat = ({
    label,
    value,
    icon: Icon,
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
  }) => (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
      <Badge variant="secondary" className="mr-auto">
        {value}
      </Badge>
    </div>
  );

  const TypeBadge = ({ type }: { type: string }) => {
    const styles = {
      manual: 'bg-blue-100 text-blue-800 border-blue-200',
      auto: 'bg-green-100 text-green-800 border-green-200',
      pre_restore: 'bg-amber-100 text-amber-800 border-amber-200',
    };

    const labels = {
      manual: 'يدوية',
      auto: 'تلقائية',
      pre_restore: 'قبل الاستعادة',
    };

    return (
      <Badge variant="outline" className={styles[type as keyof typeof styles]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  // ==================== العرض ====================

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <HardDrive className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">النسخ الاحتياطي والاسترجاع</h1>
          <p className="text-muted-foreground">إدارة النسخ الاحتياطية لبيانات المكتب</p>
        </div>
      </div>

      {/* بطاقات الإجراءات */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* إنشاء نسخة احتياطية */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>إنشاء نسخة احتياطية</CardTitle>
                <CardDescription>تصدير جميع البيانات والملفات في ملف ZIP</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {exporting && exportProgress > 0 && (
              <div className="space-y-2">
                <Progress value={exportProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  جاري إنشاء النسخة الاحتياطية... {exportProgress}%
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>قاعدة البيانات الكاملة (SQLite)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>الملفات والوثائق المرفقة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>معلومات الإصدار والتوافق</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>بصمة SHA256 للتحقق</span>
              </div>
            </div>

            <Button onClick={handleExport} disabled={exporting} className="w-full" size="lg">
              {exporting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="ml-2 h-4 w-4" />
                  إنشاء نسخة احتياطية
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* استعادة نسخة احتياطية */}
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>استعادة نسخة احتياطية</CardTitle>
                <CardDescription>استيراد نسخة احتياطية من ملف ZIP</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <div className="text-amber-800 dark:text-amber-200">
                  <p className="font-medium">تحذير هام</p>
                  <p>سيتم استبدال جميع البيانات الحالية. سيتم إنشاء نسخة احتياطية تلقائية قبل الاستعادة.</p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing || previewing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {previewing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحقق...
                </>
              ) : importing ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الاستعادة...
                </>
              ) : (
                <>
                  <Upload className="ml-2 h-4 w-4" />
                  اختيار ملف النسخة الاحتياطية
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* النسخ الاحتياطية المحلية */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>النسخ المحفوظة محلياً</CardTitle>
                <CardDescription>النسخ الاحتياطية المحفوظة على الخادم</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={loadLocalBackups}>
              <RefreshCw
                className={cn('h-4 w-4', loadingBackups && 'animate-spin')}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBackups ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : localBackups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileArchive className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد نسخ احتياطية محلية</p>
            </div>
          ) : (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {localBackups.map((backup) => (
                  <div
                    key={backup.path}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() =>
                          setExpandedBackup(
                            expandedBackup === backup.path ? null : backup.path
                          )
                        }
                      >
                        <FileArchive className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{backup.filename}</p>
                            <TypeBadge type={backup.type} />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{formatSize(backup.size)}</span>
                            <span>•</span>
                            <span>{formatDate(backup.created)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadLocal(backup)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocal(backup)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        {expandedBackup === backup.path ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* معلومات تقنية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            المعلومات التقنية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">بنية ملف النسخة الاحتياطية</h4>
              <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-1">
                <div className="text-primary">backup_YYYY_MM_DD_HHMM.zip</div>
                <div className="text-muted-foreground">├── database.sqlite</div>
                <div className="text-muted-foreground">├── metadata.json</div>
                <div className="text-muted-foreground">├── version.json</div>
                <div className="text-muted-foreground">├── checksum.sha256</div>
                <div className="text-muted-foreground">└── documents/</div>
                <div className="text-muted-foreground mr-4">└── [الملفات المرفقة]</div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">ميزات الأمان</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>التحقق من سلامة البيانات (integrity check)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>بصمة SHA256 للتحقق من التلاعب</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>نسخة احتياطية تلقائية قبل الاستعادة</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>التحقق من توافق الإصدارات</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>تشفير AES-256 (قريباً)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حوار معاينة النسخة الاحتياطية */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {preview?.valid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              معاينة النسخة الاحتياطية
            </DialogTitle>
            <DialogDescription>{selectedFile?.name}</DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              {/* حالة النسخة */}
              <div
                className={cn(
                  'p-3 rounded-lg',
                  preview.valid
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : 'bg-red-50 dark:bg-red-900/20'
                )}
              >
                <div className="flex items-center gap-2">
                  {preview.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      preview.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    )}
                  >
                    {preview.valid ? 'النسخة صالحة للاستعادة' : 'النسخة غير صالحة'}
                  </span>
                </div>
                {preview.compatibilityWarnings.length > 0 && (
                  <div className="mt-2 text-sm">
                    {preview.compatibilityWarnings.map((warning, i) => (
                      <p key={i} className={warning.startsWith('⚠️') ? 'text-amber-600' : warning.startsWith('📋') ? 'text-blue-600' : ''}>
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* معلومات الترقية */}
              {preview.needsMigration && preview.canAutoMigrate && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      سيتم ترقية قاعدة البيانات تلقائياً
                    </span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    {preview.migrationSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Hash className="h-3 w-3" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* معلومات الإصدار */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">إصدار قاعدة البيانات</span>
                  </div>
                  <p className="font-medium">
                    {preview.version.database_schema_version || 1}
                    {preview.needsMigration && (
                      <span className="text-blue-600 text-sm mr-1">
                        → {preview.version.database_schema_version + (preview.migrationSteps.length || 0)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">تنسيق النسخة</span>
                  </div>
                  <p className="font-medium">{preview.version.backup_format_version || '1.0'}</p>
                </div>
              </div>

              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">التطبيق</p>
                  <p className="font-medium text-sm">{preview.metadata.app_name}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">الإصدار</p>
                  <p className="font-medium text-sm">{preview.metadata.app_version}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">حجم DB</p>
                  <p className="font-medium text-sm">{formatSize(preview.metadata.database_size)}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">الملفات</p>
                  <p className="font-medium text-sm">{preview.filesCount}</p>
                </div>
              </div>

              {/* تاريخ النسخة */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">تاريخ النسخة:</span>
                <span className="text-sm font-medium">{formatDate(preview.metadata.backup_date)}</span>
              </div>

              <Separator />

              {/* إحصائيات السجلات */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  إحصائيات البيانات
                </h4>
                <div className="grid gap-2">
                  <RecordStat
                    label="الموكلين"
                    value={preview.metadata.records.clients}
                    icon={Users}
                  />
                  <RecordStat
                    label="القضايا"
                    value={preview.metadata.records.cases}
                    icon={Scale}
                  />
                  <RecordStat
                    label="الجلسات"
                    value={preview.metadata.records.sessions}
                    icon={Clock}
                  />
                  <RecordStat
                    label="الهيئات القضائية"
                    value={preview.metadata.records.judicialBodies}
                    icon={Building2}
                  />
                  <RecordStat
                    label="الأقسام والغرف"
                    value={preview.metadata.records.chambers}
                    icon={Building}
                  />
                </div>
              </div>

              <Separator />

              {/* بصمة Checksum */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    بصمة SHA256
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedChecksum(preview.checksum);
                      setShowChecksumDialog(true);
                    }}
                  >
                    عرض التفاصيل
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                  {preview.checksum.database_sha256.substring(0, 32)}...
                </div>
              </div>

              {/* أزرار الإجراء */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPreviewDialog(false);
                    resetFileSelection();
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={importing || !preview.valid}
                >
                  <Upload className="ml-2 h-4 w-4" />
                  استعادة هذه النسخة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد الاستعادة */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              تأكيد الاستعادة
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>هل أنت متأكد من رغبتك في استعادة هذه النسخة الاحتياطية؟</p>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                سيتم استبدال جميع البيانات الحالية بشكل نهائي.
              </p>
              <p className="text-sm text-muted-foreground">
                سيتم إنشاء نسخة احتياطية تلقائية من البيانات الحالية قبل الاستعادة.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                executeRestore();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، استعادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار تفاصيل Checksum */}
      <Dialog open={showChecksumDialog} onOpenChange={setShowChecksumDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              تفاصيل بصمة SHA256
            </DialogTitle>
            <DialogDescription>
              البصمات المستخدمة للتحقق من سلامة البيانات
            </DialogDescription>
          </DialogHeader>

          {selectedChecksum && (
            <div className="space-y-4">
              {/* بصمة قاعدة البيانات */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium">قاعدة البيانات</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(selectedChecksum.database_sha256, 'db')
                    }
                  >
                    {copiedHash === 'db' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                  {selectedChecksum.database_sha256}
                </div>
              </div>

              {/* بصمة Metadata */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium">البيانات الوصفية</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(selectedChecksum.metadata_sha256, 'meta')
                    }
                  >
                    {copiedHash === 'meta' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                  {selectedChecksum.metadata_sha256}
                </div>
              </div>

              {/* تاريخ الحساب */}
              <div className="text-sm text-muted-foreground">
                تم الحساب: {formatDate(selectedChecksum.calculated_at)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// مكون Label
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn('text-sm font-medium leading-none', className)}>{children}</label>;
}
