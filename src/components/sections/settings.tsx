'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, Building2, Database, AppWindow, BarChart3, 
  Save, Upload, Download, Users, Briefcase, Calendar, Building, 
  Scale, Landmark, CalendarDays, RefreshCw, Palette, ImageIcon, 
  PenTool, FileText, Trash2, Eye, CheckCircle, AlertTriangle, XCircle, Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BackupSection } from './backup';
import { UpdateChecker } from '@/components/update-notification';

interface OfficeSettings {
  id: number;
  officeName: string;
  lawyerName: string;
  registrationNumber: string;
  specialization: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  wilayaId: number | null;
  wilayaName: string | null;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  signature: string;
  stamp: string;
  printHeader: string;
  printFooter: string;
}

interface Wilaya {
  id: number;
  number: number;
  name: string;
}

interface RecordCounts {
  clients: number;
  cases: number;
  sessions: number;
  judicialBodies: number;
  chambers: number;
  lawyers: number;
  organizations: number;
  calendarEvents: number;
}

const FONT_FAMILIES = [
  { value: 'Tajawal', label: 'Tajawal (تاجوال)' },
  { value: 'Cairo', label: 'Cairo (القاهرة)' },
  { value: 'Almarai', label: 'Almarai (المراعي)' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
];

const COLOR_PRESETS = [
  { name: 'أزرق كلاسيكي', primary: '#1e40af', secondary: '#3b82f6', accent: '#f59e0b' },
  { name: 'أخضر قانوني', primary: '#166534', secondary: '#22c55e', accent: '#eab308' },
  { name: 'عنابي فاخر', primary: '#7f1d1d', secondary: '#dc2626', accent: '#fbbf24' },
  { name: 'رمادي احترافي', primary: '#374151', secondary: '#6b7280', accent: '#3b82f6' },
  { name: 'بحري أنيق', primary: '#0c4a6e', secondary: '#0ea5e9', accent: '#f97316' },
];

export function SettingsSection() {
  const [office, setOffice] = useState<OfficeSettings>({
    id: 0,
    officeName: '',
    lawyerName: '',
    registrationNumber: '',
    specialization: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    wilayaId: null,
    wilayaName: null,
    logo: '',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    accentColor: '#f59e0b',
    fontFamily: 'Tajawal',
    signature: '',
    stamp: '',
    printHeader: '',
    printFooter: '',
  });
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [recordCounts, setRecordCounts] = useState<RecordCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // رفع الملفات
  const logoInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  
  // فحص سلامة قاعدة البيانات
  const [healthCheck, setHealthCheck] = useState<{
    status: string;
    integrityCheck: string;
    database: { sizeMB: string; pageCount: number; freePages: number };
    tables: Record<string, number>;
    checkedAt: string;
  } | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  
  const { toast } = useToast();

  // فحص سلامة قاعدة البيانات
  const checkDatabaseHealth = async () => {
    setCheckingHealth(true);
    try {
      const response = await fetch('/api/database/health', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setHealthCheck(data);
        toast({ 
          title: data.status === 'healthy' ? 'قاعدة البيانات سليمة' : 'تحذير',
          description: data.status === 'healthy' 
            ? 'تم فحص قاعدة البيانات وكل شيء سليم' 
            : 'قد تكون هناك مشاكل في قاعدة البيانات',
          variant: data.status === 'healthy' ? 'default' : 'destructive'
        });
      } else {
        toast({ title: 'خطأ', description: 'فشل في فحص قاعدة البيانات', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الفحص', variant: 'destructive' });
    } finally {
      setCheckingHealth(false);
    }
  };

  // جلب البيانات
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, wilayasRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/wilayas'),
        ]);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setOffice(data.office);
          setRecordCounts(data.recordCounts);
        }
        
        if (wilayasRes.ok) {
          const data = await wilayasRes.json();
          setWilayas(data);
        }
      } catch (error) {
        console.error('خطأ في جلب الإعدادات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // تحويل الصورة إلى base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature' | 'stamp') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // التحقق من حجم الملف (أقصى 500KB)
    if (file.size > 500 * 1024) {
      toast({ title: 'خطأ', description: 'حجم الملف يجب أن لا يتجاوز 500 كيلوبايت', variant: 'destructive' });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setOffice(prev => ({ ...prev, [field]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // حذف صورة
  const handleRemoveImage = (field: 'logo' | 'signature' | 'stamp') => {
    setOffice(prev => ({ ...prev, [field]: '' }));
  };

  // تطبيق إعداد ألوان مسبق
  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setOffice(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
  };

  // حفظ الإعدادات
  const handleSaveOffice = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ office }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحفظ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // مكون إحصائيات البيانات
  const StatCard = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <div className="p-2 bg-primary/10 rounded-lg">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-xl">
          <AppWindow className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات التطبيق وتخصيص المكتب</p>
        </div>
      </div>

      <Tabs defaultValue="office" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="office" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">معلومات المكتب</span>
          </TabsTrigger>
          <TabsTrigger value="customize" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">التخصيص</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">البيانات</span>
          </TabsTrigger>
        </TabsList>

        {/* تبويب معلومات المكتب */}
        <TabsContent value="office" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle>معلومات المكتب</CardTitle>
              </div>
              <CardDescription>المعلومات الأساسية لمكتب المحاماة (تظهر في الوثائق والتقارير)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* الشعار */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  شعار المكتب
                </Label>
                <div className="flex items-start gap-4">
                  {office.logo ? (
                    <div className="relative group">
                      <img 
                        src={office.logo} 
                        alt="شعار المكتب" 
                        className="w-32 h-32 object-contain border-2 rounded-lg bg-muted"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage('logo')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <div className="text-center p-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">رفع شعار</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                  />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• يفضل استخدام صورة مربعة</p>
                    <p>• الحجم الأقصى: 500 كيلوبايت</p>
                    <p>• الصيغ المدعومة: PNG, JPG, SVG</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* معلومات أساسية */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="officeName">اسم المكتب</Label>
                  <Input
                    id="officeName"
                    value={office.officeName}
                    onChange={(e) => setOffice({ ...office, officeName: e.target.value })}
                    placeholder="مكتب المحامي..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lawyerName">اسم المحامي</Label>
                  <Input
                    id="lawyerName"
                    value={office.lawyerName}
                    onChange={(e) => setOffice({ ...office, lawyerName: e.target.value })}
                    placeholder="الاسم الكامل..."
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">رقم التسجيل في النقابة</Label>
                  <Input
                    id="registrationNumber"
                    value={office.registrationNumber}
                    onChange={(e) => setOffice({ ...office, registrationNumber: e.target.value })}
                    placeholder="رقم التسجيل..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">التخصص</Label>
                  <Input
                    id="specialization"
                    value={office.specialization}
                    onChange={(e) => setOffice({ ...office, specialization: e.target.value })}
                    placeholder="مثال: القانون المدني، الجنائي..."
                  />
                </div>
              </div>

              <Separator />

              {/* معلومات الاتصال */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={office.phone}
                    onChange={(e) => setOffice({ ...office, phone: e.target.value })}
                    placeholder="0XXX XX XX XX"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={office.email}
                    onChange={(e) => setOffice({ ...office, email: e.target.value })}
                    placeholder="email@example.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="website">الموقع الإلكتروني</Label>
                  <Input
                    id="website"
                    value={office.website}
                    onChange={(e) => setOffice({ ...office, website: e.target.value })}
                    placeholder="www.example.com"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wilaya">الولاية</Label>
                  <Select 
                    value={office.wilayaId?.toString() || ''} 
                    onValueChange={(value) => setOffice({ ...office, wilayaId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((w) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.number} - {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان التفصيلي</Label>
                <Input
                  id="address"
                  value={office.address}
                  onChange={(e) => setOffice({ ...office, address: e.target.value })}
                  placeholder="العنوان الكامل..."
                />
              </div>

              <Button onClick={handleSaveOffice} disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ المعلومات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب التخصيص */}
        <TabsContent value="customize" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* الألوان */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <CardTitle>الألوان</CardTitle>
                </div>
                <CardDescription>تخصيص ألوان واجهة التطبيق</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* إعدادات الألوان المسبقة */}
                <div className="space-y-3">
                  <Label>إعدادات مسبقة</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((preset, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="flex items-center gap-2 h-auto py-2"
                        onClick={() => applyColorPreset(preset)}
                      >
                        <div className="flex -space-x-1 space-x-reverse">
                          <div className="w-4 h-4 rounded-full border-2 border-background" style={{ backgroundColor: preset.primary }} />
                          <div className="w-4 h-4 rounded-full border-2 border-background" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-4 h-4 rounded-full border-2 border-background" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* ألوان مخصصة */}
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="primaryColor">اللون الرئيسي</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="primaryColor"
                          value={office.primaryColor}
                          onChange={(e) => setOffice({ ...office, primaryColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={office.primaryColor}
                          onChange={(e) => setOffice({ ...office, primaryColor: e.target.value })}
                          className="w-28"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="secondaryColor">اللون الثانوي</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          id="secondaryColor"
                          value={office.secondaryColor}
                          onChange={(e) => setOffice({ ...office, secondaryColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={office.secondaryColor}
                          onChange={(e) => setOffice({ ...office, secondaryColor: e.target.value })}
                          className="w-28"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">لون التمييز</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        id="accentColor"
                        value={office.accentColor}
                        onChange={(e) => setOffice({ ...office, accentColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border-0"
                      />
                      <Input
                        value={office.accentColor}
                        onChange={(e) => setOffice({ ...office, accentColor: e.target.value })}
                        className="w-28"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* معاينة الألوان */}
                <div className="space-y-2">
                  <Label>معاينة</Label>
                  <div className="p-4 rounded-lg border" style={{ backgroundColor: office.primaryColor + '10' }}>
                    <div className="flex gap-2 mb-3">
                      <Button size="sm" style={{ backgroundColor: office.primaryColor }}>زر رئيسي</Button>
                      <Button size="sm" variant="outline" style={{ borderColor: office.secondaryColor, color: office.secondaryColor }}>زر ثانوي</Button>
                      <Badge style={{ backgroundColor: office.accentColor }}>شارة</Badge>
                    </div>
                    <p className="text-sm" style={{ color: office.primaryColor }}>نص ملون باللون الرئيسي</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* الخط والتوقيع */}
            <div className="space-y-6">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    الخطوط
                  </CardTitle>
                  <CardDescription>اختيار نوع الخط المستخدم</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fontFamily">نوع الخط</Label>
                    <Select 
                      value={office.fontFamily} 
                      onValueChange={(value) => setOffice({ ...office, fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p style={{ fontFamily: office.fontFamily }} className="text-lg">
                      معاينة الخط: {office.fontFamily}
                    </p>
                    <p style={{ fontFamily: office.fontFamily }} className="text-sm text-muted-foreground mt-1">
                      هذا نص تجريبي لعرض شكل الخط
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* التوقيع والختم */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5 text-primary" />
                    التوقيع والختم
                  </CardTitle>
                  <CardDescription>تظهر في الوثائق المطبوعة</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* التوقيع */}
                  <div className="space-y-3">
                    <Label>التوقيع</Label>
                    <div className="flex items-start gap-4">
                      {office.signature ? (
                        <div className="relative group">
                          <img 
                            src={office.signature} 
                            alt="التوقيع" 
                            className="h-16 object-contain border rounded-lg bg-white p-2"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage('signature')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="h-16 w-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => signatureInputRef.current?.click()}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'signature')}
                      />
                    </div>
                  </div>

                  {/* الختم */}
                  <div className="space-y-3">
                    <Label>الختم</Label>
                    <div className="flex items-start gap-4">
                      {office.stamp ? (
                        <div className="relative group">
                          <img 
                            src={office.stamp} 
                            alt="الختم" 
                            className="w-24 h-24 object-contain border rounded-lg bg-white p-2"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage('stamp')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => stampInputRef.current?.click()}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <input
                        ref={stampInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'stamp')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button onClick={handleSaveOffice} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ التخصيصات
              </>
            )}
          </Button>
        </TabsContent>

        {/* تبويب البيانات */}
        <TabsContent value="data" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* إحصائيات البيانات */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle>إحصائيات البيانات</CardTitle>
                </div>
                <CardDescription>عدد السجلات في كل قسم</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <StatCard label="الموكلين" value={recordCounts?.clients || 0} icon={Users} />
                  <StatCard label="القضايا" value={recordCounts?.cases || 0} icon={Briefcase} />
                  <StatCard label="الجلسات" value={recordCounts?.sessions || 0} icon={Calendar} />
                  <StatCard label="الهيئات القضائية" value={recordCounts?.judicialBodies || 0} icon={Building} />
                  <StatCard label="الأقسام والغرف" value={recordCounts?.chambers || 0} icon={Scale} />
                  <StatCard label="المحامين" value={recordCounts?.lawyers || 0} icon={Users} />
                  <StatCard label="المنظمات" value={recordCounts?.organizations || 0} icon={Landmark} />
                  <StatCard label="أحداث التقويم" value={recordCounts?.calendarEvents || 0} icon={CalendarDays} />
                </div>
              </CardContent>
            </Card>

            {/* معلومات التطبيق */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AppWindow className="h-5 w-5 text-primary" />
                  <CardTitle>التطبيق</CardTitle>
                </div>
                <CardDescription>معلومات عن التطبيق والتحديثات</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">اسم التطبيق</span>
                    <span className="font-medium">نظام مكتب المحامي</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">إصدار التطبيق</span>
                    <Badge variant="secondary">v1.0.0</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">وضع التشغيل</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      محلي (Offline)
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">قاعدة البيانات</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      SQLite
                    </Badge>
                  </div>
                  
                  {/* التحقق من التحديثات */}
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      التحقق من التحديثات
                    </Label>
                    <UpdateChecker />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* فحص سلامة قاعدة البيانات */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>فحص سلامة قاعدة البيانات</CardTitle>
              </div>
              <CardDescription>التحقق من سلامة وهيكل قاعدة البيانات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkDatabaseHealth} 
                disabled={checkingHealth}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {checkingHealth ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الفحص...
                  </>
                ) : (
                  <>
                    <Activity className="ml-2 h-4 w-4" />
                    فحص سلامة قاعدة البيانات
                  </>
                )}
              </Button>

              {healthCheck && (
                <div className="space-y-4 mt-4">
                  {/* حالة السلامة */}
                  <div className={`p-4 rounded-lg flex items-center gap-3 ${
                    healthCheck.status === 'healthy' 
                      ? 'bg-green-50 dark:bg-green-950/20 border border-green-200' 
                      : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200'
                  }`}>
                    {healthCheck.status === 'healthy' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {healthCheck.status === 'healthy' ? 'قاعدة البيانات سليمة' : 'تحذير'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {healthCheck.integrityCheck}
                      </p>
                    </div>
                  </div>

                  {/* معلومات قاعدة البيانات */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">حجم قاعدة البيانات</p>
                      <p className="text-lg font-bold">{healthCheck.database.sizeMB} MB</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">عدد الصفحات</p>
                      <p className="text-lg font-bold">{healthCheck.database.pageCount}</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">الصفحات الحرة</p>
                      <p className="text-lg font-bold">{healthCheck.database.freePages}</p>
                    </div>
                  </div>

                  {/* جداول البيانات */}
                  <div>
                    <p className="text-sm font-medium mb-2">عدد السجلات في كل جدول:</p>
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                      {Object.entries(healthCheck.tables).map(([table, count]) => (
                        <div key={table} className="flex justify-between p-2 bg-muted/30 rounded text-sm">
                          <span className="text-muted-foreground">{table}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    آخر فحص: {new Date(healthCheck.checkedAt).toLocaleString('ar-DZ')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* قسم النسخ الاحتياطي */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>النسخ الاحتياطي</CardTitle>
              </div>
              <CardDescription>إنشاء واسترجاع النسخ الاحتياطية</CardDescription>
            </CardHeader>
            <CardContent>
              <BackupSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
