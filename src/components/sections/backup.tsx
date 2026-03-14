'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, Upload, Loader2, CheckCircle, AlertCircle, FileArchive, 
  Database, Calendar, Hash, Building2, Users, Scale, Clock, Building,
  AlertTriangle, Info
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

// أنواع البيانات
interface BackupMetadata {
  applicationName: string;
  applicationNameEn: string;
  backupDate: string;
  applicationVersion: string;
  recordCounts: {
    clients: number;
    cases: number;
    sessions: number;
    judicialBodies: number;
    chambers: number;
    lawyers: number;
    organizations: number;
    calendarEvents: number;
  };
}

interface BackupVersion {
  version: string;
  format: string;
  schemaVersion: number;
  createdAt: string;
}

interface BackupPreview {
  valid: boolean;
  metadata: BackupMetadata;
  version: BackupVersion;
  integrityCheck: string;
}

export function BackupSection() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileData, setSelectedFileData] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // تنسيق التاريخ
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

  // إنشاء نسخة احتياطية
  const handleExport = async () => {
    setExporting(true);

    try {
      const response = await fetch('/api/backup?action=export', { credentials: 'include' });
      const data = await response.json();

      if (response.ok) {
        // إنشاء رابط تحميل
        const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], {
          type: 'application/zip',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // عرض معلومات النسخة الاحتياطية
        const metadata = data.metadata as BackupMetadata;
        const totalRecords = Object.values(metadata.recordCounts).reduce((a, b) => a + b, 0);

        toast({ 
          title: 'تم إنشاء النسخة الاحتياطية', 
          description: `تم تصدير ${totalRecords} سجل بنجاح` 
        });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ 
        title: 'خطأ', 
        description: 'حدث خطأ في التصدير', 
        variant: 'destructive' 
      });
    } finally {
      setExporting(false);
    }
  };

  // معاينة النسخة الاحتياطية
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من امتداد الملف
    if (!file.name.endsWith('.zip')) {
      toast({ 
        title: 'خطأ', 
        description: 'يرجى اختيار ملف ZIP', 
        variant: 'destructive' 
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

      // إرسال للمعاينة
      const response = await fetch(`/api/backup?action=preview&data=${encodeURIComponent(base64)}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setPreview(data);
      } else {
        toast({ 
          title: 'خطأ', 
          description: data.error || 'النسخة الاحتياطية غير صالحة', 
          variant: 'destructive' 
        });
        setPreview(null);
        setSelectedFile(null);
        setSelectedFileData(null);
      }
    } catch (error) {
      toast({ 
        title: 'خطأ', 
        description: 'فشل في قراءة الملف', 
        variant: 'destructive' 
      });
      setPreview(null);
      setSelectedFile(null);
      setSelectedFileData(null);
    } finally {
      setPreviewing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // تنفيذ الاستعادة
  const executeRestore = async () => {
    if (!selectedFileData) return;

    setImporting(true);
    setShowConfirmDialog(false);

    try {
      const response = await fetch('/api/backup', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: selectedFileData,
          confirmed: true 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ 
          title: 'تمت الاستعادة', 
          description: data.message 
        });
        
        // إعادة تحميل الصفحة لتحديث البيانات
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ 
          title: 'خطأ', 
          description: data.error || 'فشل في الاستعادة', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      toast({ 
        title: 'خطأ', 
        description: 'حدث خطأ في الاستعادة', 
        variant: 'destructive' 
      });
    } finally {
      setImporting(false);
      setPreview(null);
      setSelectedFile(null);
      setSelectedFileData(null);
    }
  };

  // إحصائيات السجلات
  const RecordStat = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
      <Badge variant="secondary" className="mr-auto">{value}</Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileArchive className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">النسخ الاحتياطي</h1>
          <p className="text-muted-foreground">إدارة النسخ الاحتياطية لبيانات المكتب</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* إنشاء نسخة احتياطية */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>إنشاء نسخة احتياطية</CardTitle>
                <CardDescription>
                  تصدير جميع البيانات في ملف ZIP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>قاعدة البيانات الكاملة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>ملف معلومات النسخة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>ملف إصدار النظام</span>
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
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>استعادة نسخة احتياطية</CardTitle>
                <CardDescription>
                  استيراد نسخة احتياطية سابقة
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
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

      {/* معاينة النسخة الاحتياطية */}
      {preview && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>معاينة النسخة الاحتياطية</CardTitle>
                <CardDescription>
                  {selectedFile?.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* معلومات أساسية */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">التطبيق</p>
                <p className="font-medium text-sm">{preview.metadata.applicationName}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">الإصدار</p>
                <p className="font-medium text-sm">{preview.metadata.applicationVersion}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">تنسيق النسخة</p>
                <p className="font-medium text-sm">{preview.version.format.toUpperCase()}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                <p className="font-medium text-sm text-green-600 dark:text-green-400">
                  {preview.integrityCheck === 'ok' ? '✓ صالحة' : preview.integrityCheck}
                </p>
              </div>
            </div>

            {/* تاريخ النسخة */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">تاريخ النسخة:</span>
              <span className="text-sm font-medium">{formatDate(preview.metadata.backupDate)}</span>
            </div>

            <Separator />

            {/* إحصائيات السجلات */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                إحصائيات البيانات
              </h4>
              <ScrollArea className="h-48">
                <div className="grid gap-2">
                  <RecordStat 
                    label="الموكلين" 
                    value={preview.metadata.recordCounts.clients} 
                    icon={Users} 
                  />
                  <RecordStat 
                    label="القضايا" 
                    value={preview.metadata.recordCounts.cases} 
                    icon={Scale} 
                  />
                  <RecordStat 
                    label="الجلسات" 
                    value={preview.metadata.recordCounts.sessions} 
                    icon={Clock} 
                  />
                  <RecordStat 
                    label="الهيئات القضائية" 
                    value={preview.metadata.recordCounts.judicialBodies} 
                    icon={Building2} 
                  />
                  <RecordStat 
                    label="الأقسام والغرف" 
                    value={preview.metadata.recordCounts.chambers} 
                    icon={Building} 
                  />
                  <RecordStat 
                    label="المحامين" 
                    value={preview.metadata.recordCounts.lawyers} 
                    icon={Users} 
                  />
                  <RecordStat 
                    label="المنظمات" 
                    value={preview.metadata.recordCounts.organizations} 
                    icon={Building} 
                  />
                  <RecordStat 
                    label="أحداث التقويم" 
                    value={preview.metadata.recordCounts.calendarEvents} 
                    icon={Calendar} 
                  />
                </div>
              </ScrollArea>
            </div>

            {/* إجمالي السجلات */}
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">إجمالي السجلات</span>
              </div>
              <Badge variant="default" className="text-lg">
                {Object.values(preview.metadata.recordCounts).reduce((a, b) => a + b, 0)}
              </Badge>
            </div>

            {/* أزرار الإجراء */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                  setSelectedFileData(null);
                }}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowConfirmDialog(true)}
                disabled={importing}
              >
                <Upload className="ml-2 h-4 w-4" />
                استعادة هذه النسخة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              onClick={executeRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، استعادة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">معلومات هامة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">تنسيق النسخة الاحتياطية</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileArchive className="h-4 w-4" />
                  <span>ملف ZIP يحتوي على:</span>
                </div>
                <ul className="list-disc list-inside mr-6 space-y-1">
                  <li>database.sqlite - قاعدة البيانات</li>
                  <li>metadata.json - معلومات النسخة</li>
                  <li>version.json - إصدار النظام</li>
                </ul>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">السلامة والأمان</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>التحقق من سلامة البيانات قبل الاستعادة</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>نسخة احتياطية تلقائية قبل الاستعادة</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>الاحتفاظ بآخر 5 نسخ احتياطية تلقائية</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
