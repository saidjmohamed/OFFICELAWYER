'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Scale,
  User,
  Code2,
  Shield,
  Database,
  HardDrive,
  Cloud,
  RefreshCw,
  Globe,
  HeadphonesIcon,
  FileText,
  ChevronLeft,
  Sparkles,
  Info,
} from 'lucide-react';

export function AboutSection() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* العنوان الرئيسي */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Scale className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold">حول البرنامج</h1>
        <p className="text-muted-foreground mt-2">معلومات تفصيلية عن نظام إدارة مكتب المحاماة</p>
      </div>

      {/* القسم الأول: تعريف البرنامج */}
      <Card className="overflow-hidden border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-l from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">تعريف البرنامج</CardTitle>
              <CardDescription>نبذة عن النظام ومميزاته</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <Badge variant="secondary" className="text-base px-4 py-1">اسم البرنامج</Badge>
            <span className="text-lg font-semibold">نظام إدارة مكتب المحاماة</span>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-primary">وصف البرنامج:</h4>
            <div className="text-muted-foreground leading-relaxed space-y-3 bg-muted/30 p-4 rounded-xl">
              <p>
                هو نظام معلوماتي مصمم لمساعدة المحامين على إدارة مكاتبهم بطريقة منظمة وآمنة. يتيح البرنامج تسجيل القضايا، إدارة بيانات الموكلين، متابعة الجلسات، حفظ الوثائق القانونية، وتنظيم مختلف المعلومات المرتبطة بالملفات القضائية.
              </p>
              <p>
                يعتمد النظام على قاعدة بيانات محلية لضمان سرية المعلومات القانونية وحماية بيانات الموكلين، كما يوفر نظام نسخ احتياطي واسترجاع للبيانات لضمان عدم ضياع المعلومات.
              </p>
              <p>
                تم تصميم هذا البرنامج ليكون أداة عملية تساعد المحامي على توفير الوقت، تنظيم الملفات، وتحسين إدارة القضايا داخل المكتب.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* القسم الثاني: عن المطور */}
      <Card className="overflow-hidden border-2 border-blue-200 dark:border-blue-900">
        <CardHeader className="bg-gradient-to-l from-blue-100 to-transparent dark:from-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">عن المطور</CardTitle>
              <CardDescription>معلومات عن مطور البرنامج</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* صورة المطور */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                  <User className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full shadow-md">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            
            {/* معلومات المطور */}
            <div className="flex-1 space-y-4">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                    الاسم
                  </Badge>
                  <span className="font-semibold text-lg">الأستاذ سايج محمد</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                  <Badge variant="outline" className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                    الصفة
                  </Badge>
                  <span className="font-medium">محامٍ لدى مجلس قضاء الجزائر</span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">نبذة:</h4>
                <div className="text-muted-foreground leading-relaxed space-y-3 bg-muted/30 p-4 rounded-xl">
                  <p>
                    الأستاذ سايج محمد محامٍ جزائري مهتم بتطوير الأدوات الرقمية التي تساعد المحامين على تنظيم عملهم اليومي وتحسين إدارة مكاتبهم.
                  </p>
                  <p>
                    جاءت فكرة هذا البرنامج نتيجة تجربة عملية في ميدان المحاماة، حيث تم تصميمه ليعالج العديد من المشاكل التي يواجهها المحامون في إدارة القضايا والوثائق القانونية.
                  </p>
                  <p>
                    يهدف هذا المشروع إلى الجمع بين الخبرة القانونية والتكنولوجيا الحديثة من أجل تطوير حلول رقمية تخدم مهنة المحاماة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* القسم الثالث: المعلومات التقنية */}
      <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-900">
        <CardHeader className="bg-gradient-to-l from-purple-100 to-transparent dark:from-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50">
              <Code2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl">معلومات تقنية عن البرنامج</CardTitle>
              <CardDescription>التفاصيل الفنية والتقنية</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* إصدار البرنامج */}
            <div className="p-4 bg-gradient-to-l from-purple-50 to-muted/30 dark:from-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-muted-foreground">إصدار البرنامج</span>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">1.0</p>
            </div>

            {/* نوع التطبيق */}
            <div className="p-4 bg-gradient-to-l from-green-50 to-muted/30 dark:from-green-950/20 rounded-xl border border-green-100 dark:border-green-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <HardDrive className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-muted-foreground">نوع التطبيق</span>
              </div>
              <p className="font-semibold">تطبيق مكتبي لإدارة مكاتب المحاماة</p>
            </div>

            {/* قاعدة البيانات */}
            <div className="p-4 bg-gradient-to-l from-orange-50 to-muted/30 dark:from-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                  <Database className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
              </div>
              <p className="font-semibold">SQLite</p>
              <p className="text-xs text-muted-foreground mt-1">قاعدة بيانات محلية آمنة</p>
            </div>

            {/* نظام النسخ الاحتياطي */}
            <div className="p-4 bg-gradient-to-l from-cyan-50 to-muted/30 dark:from-cyan-950/20 rounded-xl border border-cyan-100 dark:border-cyan-900/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                  <Cloud className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-sm text-muted-foreground">النسخ الاحتياطي</span>
              </div>
              <p className="font-semibold">نسخ احتياطي محلي</p>
              <p className="text-xs text-muted-foreground mt-1">مع إمكانية النسخ السحابي مستقبلاً</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* القسم الرابع: حقوق البرنامج */}
      <Card className="overflow-hidden border-2 border-amber-200 dark:border-amber-900">
        <CardHeader className="bg-gradient-to-l from-amber-100 to-transparent dark:from-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-xl">حقوق البرنامج</CardTitle>
              <CardDescription>المعلومات القانونية والحقوق</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-gradient-to-l from-amber-50/50 to-muted/30 p-6 rounded-xl border border-amber-100 dark:border-amber-900/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0">
                <Shield className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-3">
                <p className="font-semibold text-lg">
                  جميع حقوق هذا البرنامج محفوظة للمطور.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  تم تطوير هذا النظام بهدف مساعدة المحامين على إدارة أعمالهم القانونية بطريقة منظمة وآمنة.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* القسم الخامس: روابط مستقبلية (معطل للآن) */}
      <Card className="overflow-hidden border-2 border-muted">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl text-muted-foreground">روابط ومعلومات إضافية</CardTitle>
              <CardDescription>قريباً</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* التحقق من التحديثات */}
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">التحقق من التحديثات</span>
              </div>
              <Button variant="outline" disabled className="w-full">
                <RefreshCw className="h-4 w-4 ml-2" />
                قريباً
              </Button>
            </div>

            {/* موقع البرنامج */}
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">موقع البرنامج</span>
              </div>
              <Button variant="outline" disabled className="w-full">
                <ChevronLeft className="h-4 w-4 ml-2" />
                قريباً
              </Button>
            </div>

            {/* الدعم الفني */}
            <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-3 mb-3">
                <HeadphonesIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">الدعم الفني</span>
              </div>
              <Button variant="outline" disabled className="w-full">
                <HeadphonesIcon className="h-4 w-4 ml-2" />
                قريباً
              </Button>
            </div>
          </div>

          {/* معلومات الترخيص */}
          <div className="mt-4 p-4 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">معلومات الترخيص: قريباً</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تذييل */}
      <div className="text-center py-6 text-muted-foreground text-sm">
        <p>نظام إدارة مكتب المحاماة - الإصدار 1.0</p>
        <p className="mt-1">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}
