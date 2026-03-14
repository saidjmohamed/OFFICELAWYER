'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, Server, AlertTriangle, CheckCircle, XCircle, 
  RefreshCw, Bug, FileText, Settings, Loader2 
} from 'lucide-react';

interface DebugData {
  enabled: boolean;
  error?: string;
  timestamp?: string;
  connection?: {
    status: string;
    testQuery: string;
  };
  tables?: Record<string, number>;
  data?: {
    clients: any[];
    cases: any[];
    sessions: any[];
    judicialBodies: any[];
  };
  environment?: Record<string, string>;
}

interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
}

// تخزين سجلات الأخطاء
const errorLogs: ErrorLog[] = [];

export default function DebugPage() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submittedData, setSubmittedData] = useState<any>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setDebugData(data);
      
      if (data.error) {
        errorLogs.push({
          timestamp: new Date().toISOString(),
          message: data.error,
          stack: data.stack,
        });
      }
    } catch (error) {
      setDebugData({ 
        enabled: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setTestResult('testing');
    try {
      const response = await fetch('/api/debug');
      const data = await response.json();
      setTestResult(data.connection?.status === 'connected' ? 'success' : 'failed');
    } catch {
      setTestResult('failed');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmittedData(formData);
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  // التحقق من البيئة - هذه الصفحة للمطورين فقط
  if (debugData && !debugData.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-xl font-bold mb-2">Debug Page Disabled</h1>
            <p className="text-muted-foreground">
              Debug page disabled in production.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Debug Page</h1>
              <p className="text-muted-foreground">صفحة تشخيص الأخطاء للمطورين</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDebugData}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
            <Button onClick={testConnection}>
              <Database className="ml-2 h-4 w-4" />
              اختبار الاتصال
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Application Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">حالة التطبيق</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">نشط</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {debugData?.timestamp}
              </p>
            </CardContent>
          </Card>

          {/* Database Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قاعدة البيانات</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {debugData?.connection?.status === 'connected' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold">متصل</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold">غير متصل</span>
                  </>
                )}
              </div>
              {testResult && (
                <p className="text-xs text-muted-foreground mt-1">
                  نتيجة الاختبار: {testResult === 'success' ? '✅ نجاح' : testResult === 'failed' ? '❌ فشل' : '⏳ جاري...'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tables Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">عدد الجداول</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {debugData?.tables ? Object.keys(debugData.tables).length : 0}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                جدول في قاعدة البيانات
              </p>
            </CardContent>
          </Card>

          {/* Total Records */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي السجلات</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {debugData?.tables 
                  ? Object.values(debugData.tables).reduce((a, b) => a + b, 0) 
                  : 0}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                سجل في جميع الجداول
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tables" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tables">الجداول</TabsTrigger>
            <TabsTrigger value="data">البيانات</TabsTrigger>
            <TabsTrigger value="env">المتغيرات</TabsTrigger>
            <TabsTrigger value="form">اختبار النماذج</TabsTrigger>
            <TabsTrigger value="errors">سجل الأخطاء</TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>جداول قاعدة البيانات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الجدول</TableHead>
                      <TableHead>عدد السجلات</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debugData?.tables && Object.entries(debugData.tables).map(([name, count]) => (
                      <TableRow key={name}>
                        <TableCell className="font-mono">{name}</TableCell>
                        <TableCell>{count}</TableCell>
                        <TableCell>
                          <Badge variant={count > 0 ? 'default' : 'secondary'}>
                            {count > 0 ? 'يحتوي بيانات' : 'فارغ'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>الموكلين (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {debugData?.data?.clients?.map((client: any) => (
                      <div key={client.id} className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">{client.full_name || 'بدون اسم'}</span>
                        <span className="text-muted-foreground mr-2">{client.phone || ''}</span>
                      </div>
                    ))}
                    {(!debugData?.data?.clients || debugData.data.clients.length === 0) && (
                      <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cases */}
              <Card>
                <CardHeader>
                  <CardTitle>القضايا (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {debugData?.data?.cases?.map((caseItem: any) => (
                      <div key={caseItem.id} className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">{caseItem.case_number || 'بدون رقم'}</span>
                        <Badge variant="outline" className="mr-2">{caseItem.status || 'غير محدد'}</Badge>
                      </div>
                    ))}
                    {(!debugData?.data?.cases || debugData.data.cases.length === 0) && (
                      <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>الجلسات (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {debugData?.data?.sessions?.map((session: any) => (
                      <div key={session.id} className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">جلسة #{session.id}</span>
                        <span className="text-muted-foreground mr-2">
                          {session.session_date ? new Date(session.session_date).toLocaleDateString('ar') : ''}
                        </span>
                      </div>
                    ))}
                    {(!debugData?.data?.sessions || debugData.data.sessions.length === 0) && (
                      <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Judicial Bodies */}
              <Card>
                <CardHeader>
                  <CardTitle>الهيئات القضائية (آخر 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {debugData?.data?.judicialBodies?.map((body: any) => (
                      <div key={body.id} className="p-2 bg-muted rounded text-sm">
                        <span className="font-medium">{body.name}</span>
                        <Badge variant="outline" className="mr-2">{body.type}</Badge>
                      </div>
                    ))}
                    {(!debugData?.data?.judicialBodies || debugData.data.judicialBodies.length === 0) && (
                      <p className="text-muted-foreground text-sm">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="env">
            <Card>
              <CardHeader>
                <CardTitle>متغيرات البيئة</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المتغير</TableHead>
                      <TableHead>القيمة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debugData?.environment && Object.entries(debugData.environment).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono">{key}</TableCell>
                        <TableCell className="font-mono">
                          {value.includes('********') ? (
                            <span className="text-yellow-600">{value} (مخفي)</span>
                          ) : (
                            value
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">
                  ⚠️ القيم الحساسة مخفية لأغراض أمنية
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Test Tab */}
          <TabsContent value="form">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>اختبار النماذج</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <Label>الاسم</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="أدخل الاسم"
                      />
                    </div>
                    <div>
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="أدخل البريد"
                      />
                    </div>
                    <div>
                      <Label>الرسالة</Label>
                      <Input
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="أدخل الرسالة"
                      />
                    </div>
                    <Button type="submit">إرسال (console.log)</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>البيانات المرسلة</CardTitle>
                </CardHeader>
                <CardContent>
                  {submittedData ? (
                    <pre className="p-4 bg-muted rounded overflow-auto text-sm">
                      {JSON.stringify(submittedData, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      لم يتم إرسال أي بيانات بعد
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>سجل الأخطاء</CardTitle>
              </CardHeader>
              <CardContent>
                {debugData?.error ? (
                  <div className="p-4 bg-destructive/10 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">خطأ في التحميل</span>
                    </div>
                    <p className="text-sm">{debugData.error}</p>
                    {debugData.stack && (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto mt-2">
                        {debugData.stack}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">لا توجد أخطاء</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      جميع العمليات تعمل بشكل صحيح
                    </p>
                  </div>
                )}

                {errorLogs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium">الأخطاء المسجلة:</h3>
                    {errorLogs.map((log, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <span className="text-muted-foreground">{log.timestamp}</span>
                        <p>{log.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground text-center">
              🔧 Debug Page - للاستخدام في التطوير فقط | NODE_ENV: {debugData?.environment?.NODE_ENV}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
