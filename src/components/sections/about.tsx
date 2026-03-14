'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Info,
  User,
  Code,
  Shield,
  Scale,
  Database,
  Cloud,
  RefreshCw,
  Globe,
  HeadphonesIcon,
  FileText,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export function AboutSection() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <Scale className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
        </div>
        <h1 className="text-3xl font-bold">حول البرنامج</h1>
        <p className="text-muted-foreground">تعرف على نظام إدارة مكتب المحاماة</p>
      </div>

      {/* Program Info Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-primary"></div>
        <CardHeader className="bg-gradient-to-l from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">القسم الأول: تعريف البرنامج</CardTitle>
              <p className="text-sm text-muted-foreground">نظرة عامة على النظام</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
            <Badge variant="outline" className="px-3 py-1 text-sm">اسم البرنامج</Badge>
            <span className="font-semibold text-lg">نظام إدارة مكتب المحاماة</span>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">وصف البرنامج</h4>
            <div className="p-4 bg-muted/30 rounded-xl border-r-4 border-primary space-y-3">
              <p className="text-sm leading-relaxed">
                هو نظام معلوماتي مصمم لمساعدة المحامين على إدارة مكاتبهم بطريقة منظمة وآمنة. يتيح البرنامج تسجيل القضايا، إدارة بيانات الموكلين، متابعة الجلسات، حفظ الوثائق القانونية، وتنظيم مختلف المعلومات المرتبطة بالملفات القضائية.
              </p>
              <p className="text-sm leading-relaxed">
                يعتمد النظام على قاعدة بيانات محلية لضمان سرية المعلومات القانونية وحماية بيانات الموكلين، كما يوفر نظام نسخ احتياطي واسترجاع للبيانات لضمان عدم ضياع المعلومات.
              </p>
              <p className="text-sm leading-relaxed">
                تم تصميم هذا البرنامج ليكون أداة عملية تساعد المحامي على توفير الوقت، تنظيم الملفات، وتحسين إدارة القضايا داخل المكتب.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { icon: FileText, label: 'تسجيل القضايا' },
              { icon: User, label: 'إدارة الموكلين' },
              { icon: Database, label: 'حفظ الوثائق' },
              { icon: Shield, label: 'حماية البيانات' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Developer Info Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"></div>
        <CardHeader className="bg-gradient-to-l from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-xl">
              <User className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl">القسم الثاني: عن المطور</CardTitle>
              <p className="text-sm text-muted-foreground">معلومات المطور</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">الاسم</Badge>
                <span className="font-semibold text-lg">الأستاذ سايج محمد</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">الصفة</Badge>
                <span className="text-muted-foreground">محامٍ لدى مجلس قضاء الجزائر</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">نبذة</h4>
            <div className="p-4 bg-muted/30 rounded-xl border-r-4 border-emerald-500 space-y-3">
              <p className="text-sm leading-relaxed">
                الأستاذ سايج محمد محامٍ جزائري مهتم بتطوير الأدوات الرقمية التي تساعد المحامين على تنظيم عملهم اليومي وتحسين إدارة مكاتبهم.
              </p>
              <p className="text-sm leading-relaxed">
                جاءت فكرة هذا البرنامج نتيجة تجربة عملية في ميدان المحاماة، حيث تم تصميمه ليعالج العديد من المشاكل التي يواجهها المحامون في إدارة القضايا والوثائق القانونية.
              </p>
              <p className="text-sm leading-relaxed">
                يهدف هذا المشروع إلى الجمع بين الخبرة القانونية والتكنولوجيا الحديثة من أجل تطوير حلول رقمية تخدم مهنة المحاماة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Info Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500"></div>
        <CardHeader className="bg-gradient-to-l from-blue-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-xl">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">القسم الثالث: معلومات تقنية</CardTitle>
              <p className="text-sm text-muted-foreground">المواصفات التقنية للبرنامج</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* Version */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إصدار البرنامج</p>
                  <p className="font-semibold">الإصدار الحالي</p>
                </div>
              </div>
              <Badge variant="default" className="text-base px-4 py-1">1.0</Badge>
            </div>

            {/* App Type */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نوع التطبيق</p>
                  <p className="font-semibold">تطبيق مكتبي</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">لإدارة مكاتب المحاماة</span>
            </div>

            {/* Database */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قاعدة البيانات</p>
                  <p className="font-semibold">SQLite</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">قاعدة بيانات محلية</Badge>
            </div>

            {/* Backup */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-lg">
                  <Cloud className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">نظام النسخ الاحتياطي</p>
                  <p className="font-semibold">نسخ احتياطي محلي</p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">مع إمكانية النسخ السحابي مستقبلاً</span>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">التقنيات المستخدمة</h4>
            <div className="flex flex-wrap gap-2">
              {['Next.js', 'TypeScript', 'SQLite', 'Drizzle ORM', 'Tailwind CSS', 'shadcn/ui'].map((tech) => (
                <Badge key={tech} variant="secondary" className="px-3 py-1">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Copyright Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500"></div>
        <CardHeader className="bg-gradient-to-l from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-amber-500/10 rounded-xl">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-xl">القسم الرابع: حقوق البرنامج</CardTitle>
              <p className="text-sm text-muted-foreground">المعلومات القانونية</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="p-6 bg-muted/30 rounded-xl border-r-4 border-amber-500 text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-full">
                <Shield className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <p className="text-base font-semibold">
              جميع حقوق هذا البرنامج محفوظة للمطور
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تم تطوير هذا النظام بهدف مساعدة المحامين على إدارة أعمالهم القانونية بطريقة منظمة وآمنة.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                © {new Date().getFullYear()} جميع الحقوق محفوظة
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Features Card */}
      <Card className="overflow-hidden border-primary/20">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500"></div>
        <CardHeader className="bg-gradient-to-l from-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-xl">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-xl">ميزات قادمة</CardTitle>
              <p className="text-sm text-muted-foreground">تحسينات مستقبلية مخططة</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-3">
            {[
              { icon: RefreshCw, label: 'زر التحقق من التحديثات', desc: 'التحقق التلقائي من وجود تحديثات جديدة' },
              { icon: Globe, label: 'رابط موقع البرنامج', desc: 'صفحة رسمية للبرنامج على الإنترنت' },
              { icon: FileText, label: 'معلومات الترخيص', desc: 'تفاصيل الترخيص وشروط الاستخدام' },
              { icon: HeadphonesIcon, label: 'الدعم الفني', desc: 'قنوات التواصل للدعم والمساعدة' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-dashed border-purple-500/30">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-500/10 rounded-lg">
                  <feature.icon className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{feature.label}</p>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
                <Badge variant="outline" className="text-purple-600 border-purple-300">قريباً</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
          <Scale className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            نظام إدارة مكتب المحاماة - الإصدار 1.0
          </span>
        </div>
      </div>
    </div>
  );
}
