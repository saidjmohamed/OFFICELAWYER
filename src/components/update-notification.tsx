'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, X, Download, AlertCircle, CheckCircle, Loader2,
  ExternalLink
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UpdateInfo {
  updateAvailable: boolean;
  localVersion: string;
  remoteVersion: string | null;
}

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);

  // التحقق من التحديثات عند تحميل المكون
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async (manual = false) => {
    if (manual) {
      setManualCheck(true);
    }
    
    try {
      const response = await fetch('/api/update-check');
      const data = await response.json();
      
      if (data.success) {
        setUpdateInfo({
          updateAvailable: data.updateAvailable,
          localVersion: data.localVersion,
          remoteVersion: data.remoteVersion,
        });
        
        // إذا كان التحقق يدوياً ولا يوجد تحديث
        if (manual && !data.updateAvailable) {
          // سيتم عرض رسالة "التطبيق محدث" مؤقتاً
          setTimeout(() => {
            setManualCheck(false);
          }, 3000);
        }
      }
    } catch {
      // تجاهل الأخطاء بصمت
    } finally {
      setLoading(false);
      if (manual) {
        setTimeout(() => setManualCheck(false), 3000);
      }
    }
  };

  // لا تعرض شيئاً أثناء التحميل أو إذا تم رفض الإشعار
  if (loading || dismissed) {
    return null;
  }

  // لا يوجد تحديث
  if (!updateInfo?.updateAvailable) {
    // إذا كان التحقق يدوياً، اعرض رسالة "التطبيق محدث"
    if (manualCheck) {
      return (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">التطبيق محدث لأحدث إصدار</span>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* أيقونة ومعلومات التحديث */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 dark:bg-amber-800 rounded-full">
              <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            </div>
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-200">
                يوجد إصدار جديد للتطبيق
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                الإصدار الحالي: {updateInfo.localVersion} ← الإصدار الجديد: {updateInfo.remoteVersion}
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2">
            {/* زر التحديث */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                  تحديث الآن
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    كيفية تحديث التطبيق
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4 text-right">
                    <p className="text-base font-medium text-foreground">
                      لتحديث التطبيق، اتبع الخطوات التالية:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm mr-4">
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">أغلق التطبيق</strong> بالكامل من المتصفح
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">افتح موجه الأوامر</strong> (CMD أو PowerShell)
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">انتقل إلى مجلد المشروع</strong>
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">نفذ الأمر:</strong>
                        <code className="block mt-1 p-2 bg-muted rounded text-xs" dir="ltr">
                          git pull origin main
                        </code>
                      </li>
                      <li className="text-muted-foreground">
                        <strong className="text-foreground">أعد تشغيل التطبيق:</strong>
                        <code className="block mt-1 p-2 bg-muted rounded text-xs" dir="ltr">
                          bun run dev
                        </code>
                      </li>
                    </ol>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        💡 يمكنك أيضاً تحميل أحدث إصدار من GitHub مباشرة
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel>إغلاق</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <a
                      href="https://github.com/saidjmohamed/OFFICELAWYER"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      فتح GitHub
                    </a>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* زر الإخفاء */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900"
            >
              <X className="h-4 w-4 mr-1" />
              إخفاء
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون للتحقق اليدوي (يستخدم في صفحة الإعدادات)
export function UpdateChecker() {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'update' | 'latest' | 'error' | null>(null);
  const [versions, setVersions] = useState<{ local: string; remote: string | null } | null>(null);

  const checkUpdates = async () => {
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch('/api/update-check');
      const data = await response.json();

      if (data.success) {
        setVersions({
          local: data.localVersion,
          remote: data.remoteVersion,
        });
        
        if (data.updateAvailable) {
          setResult('update');
        } else {
          setResult('latest');
        }
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={checkUpdates}
          disabled={checking}
          className="gap-2"
        >
          {checking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التحقق...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              التحقق من التحديثات
            </>
          )}
        </Button>
      </div>

      {/* النتيجة */}
      {result === 'update' && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">
                يوجد تحديث جديد: {versions?.local} → {versions?.remote}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {result === 'latest' && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">التطبيق محدث لأحدث إصدار ({versions?.local})</span>
            </div>
          </CardContent>
        </Card>
      )}

      {result === 'error' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">فشل في التحقق من التحديثات</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
