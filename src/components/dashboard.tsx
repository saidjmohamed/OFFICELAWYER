'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, CalendarDays, DollarSign, Loader2, TrendingUp, Clock, Scale, FileText, Users, Building2, ArrowLeft, Bell, Activity, Archive, AlertCircle } from 'lucide-react';

interface Stats {
  activeCases: number;
  todaySessions: number;
  tomorrowSessions: number;
  weekSessions: number;
  totalFees: number;
  totalClients: number;
  totalJudicialBodies: number;
  casesByStatus: Array<{ status: string; count: number }>;
  monthlySessions: Array<{ month: string; count: number }>;
  upcomingSessions: Array<{ id: number; session_date: number; case_number: string | null; subject: string | null }>;
  recentCases: Array<{ id: number; caseNumber: string | null; subject: string | null; status: string | null; createdAt: number | null }>;
  recentActivities: Array<{ id: number; action: string; entityType: string | null; entityId: number | null; description: string; createdAt: number | null }>;
}

// مكون العداد المتحرك
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(value * easeOut));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{displayValue.toLocaleString('ar-DZ')}</span>;
}

// رسم بياني دائري بسيط
function PieChart({ data }: { data: Array<{ status: string; count: number }> }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        لا توجد بيانات
      </div>
    );
  }

  const colors: Record<string, string> = {
    active: '#3b82f6',
    adjourned: '#f59e0b',
    judged: '#22c55e',
    closed: '#6b7280',
    archived: '#9ca3af',
  };

  const labels: Record<string, string> = {
    active: 'نشطة',
    adjourned: 'مؤجلة',
    judged: 'محكوم',
    closed: 'مغلقة',
    archived: 'مؤرشفة',
  };

  // حساب الزوايا باستخدام reduce
  const segments = data.reduce<Array<{
    status: string;
    count: number;
    percentage: number;
    startAngle: number;
    endAngle: number;
    color: string;
    label: string;
  }>>((acc, item, index) => {
    const prevEndAngle = index > 0 ? acc[index - 1].endAngle : 0;
    const percentage = (item.count / total) * 100;
    const angle = (item.count / total) * 360;
    
    acc.push({
      ...item,
      percentage,
      startAngle: prevEndAngle,
      endAngle: prevEndAngle + angle,
      color: colors[item.status] || '#6b7280',
      label: labels[item.status] || item.status,
    });
    return acc;
  }, []);

  const createArcPath = (startAngle: number, endAngle: number, radius: number = 80) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const cx = 100, cy = 100;
    
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-40 h-40">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={createArcPath(segment.startAngle, segment.endAngle)}
            fill={segment.color}
            className="transition-all duration-300 hover:opacity-80"
            style={{ transformOrigin: 'center' }}
          />
        ))}
        <circle cx="100" cy="100" r="40" fill="hsl(var(--card))" />
        <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current">
          {total}
        </text>
        <text x="100" y="120" textAnchor="middle" dominantBaseline="middle" className="text-xs fill-muted-foreground">
          قضية
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm">{segment.label}</span>
            <span className="text-sm font-bold mr-auto">{segment.count}</span>
            <span className="text-xs text-muted-foreground">({segment.percentage.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// رسم بياني شريطي بسيط
function BarChart({ data }: { data: Array<{ month: string; count: number }> }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className="w-full bg-primary/80 rounded-t transition-all duration-500"
              style={{ 
                height: `${(item.count / maxCount) * 100}%`,
                minHeight: item.count > 0 ? '4px' : '0px',
                animationDelay: `${index * 100}ms`
              }}
            />
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {data.map((item, index) => (
          <div key={index} className="text-center">
            <span className="font-medium text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// تسمية الإجراءات
const actionLabels: Record<string, string> = {
  case_created: 'إنشاء قضية',
  case_updated: 'تحديث قضية',
  case_deleted: 'حذف قضية',
  case_archived: 'أرشفة قضية',
  session_added: 'إضافة جلسة',
  session_updated: 'تحديث جلسة',
  session_deleted: 'حذف جلسة',
  client_created: 'إنشاء موكل',
  client_updated: 'تحديث موكل',
  client_deleted: 'حذف موكل',
  file_uploaded: 'رفع ملف',
  file_deleted: 'حذف ملف',
  expense_added: 'إضافة مصروف',
  expense_deleted: 'حذف مصروف',
  backup_created: 'نسخ احتياطي',
  backup_restored: 'استعادة نسخة',
  settings_updated: 'تحديث إعدادات',
};

// أيقونات الإجراءات
const actionColors: Record<string, string> = {
  case_created: 'text-blue-500',
  case_updated: 'text-green-500',
  case_deleted: 'text-red-500',
  case_archived: 'text-gray-500',
  session_added: 'text-purple-500',
  client_created: 'text-amber-500',
  file_uploaded: 'text-cyan-500',
  expense_added: 'text-emerald-500',
};

// تنسيق التاريخ
const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-DZ', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
  });
};

const formatDateTime = (timestamp: number | null) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-DZ', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تسمية حالات القضايا
const statusLabels: Record<string, string> = {
  active: 'نشطة',
  adjourned: 'مؤجلة',
  judged: 'محكوم',
  closed: 'مغلقة',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700',
  adjourned: 'bg-amber-100 text-amber-700',
  judged: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  archived: 'bg-gray-100 text-gray-500',
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('خطأ في جلب الإحصائيات:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    {
      title: 'القضايا النشطة',
      description: 'إجمالي القضايا الجارية',
      value: stats?.activeCases || 0,
      icon: Briefcase,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/20',
    },
    {
      title: 'جلسات اليوم',
      description: 'الجلسات المجدولة لليوم',
      value: stats?.todaySessions || 0,
      icon: Calendar,
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-500/20',
      highlight: (stats?.todaySessions || 0) > 0,
    },
    {
      title: 'جلسات غداً',
      description: 'الجلسات المجدولة لغداً',
      value: stats?.tomorrowSessions || 0,
      icon: CalendarDays,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/20',
    },
    {
      title: 'إجمالي الأتعاب',
      description: 'المبلغ الإجمالي للأتعاب',
      value: stats?.totalFees || 0,
      icon: DollarSign,
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-500/20',
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Scale className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">مرحباً بك في مكتب المحامي</h1>
              <p className="mt-1 text-primary-foreground/80">
                نظام إدارة متكامل لمكاتب المحاماة في الجزائر
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Session Notifications */}
      {(stats?.todaySessions || 0) > 0 || (stats?.tomorrowSessions || 0) > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(stats?.todaySessions || 0) > 0 && (
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-xl">
                  <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">جلسات اليوم</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">لديك {stats?.todaySessions} جلسة مجدولة اليوم</p>
                </div>
              </CardContent>
            </Card>
          )}
          {(stats?.tomorrowSessions || 0) > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-bold text-amber-700 dark:text-amber-300">جلسات غداً</p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">لديك {stats?.tomorrowSessions} جلسة مجدولة غداً</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card
            key={card.title}
            className={`dashboard-card border-none shadow-soft overflow-hidden ${card.highlight ? 'ring-2 ring-emerald-400' : ''}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                  <card.icon className="h-5 w-5 text-foreground" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">
                {card.isCurrency ? (
                  <>
                    <AnimatedNumber value={card.value} />
                    <span className="text-lg mr-1">د.ج</span>
                  </>
                ) : (
                  <AnimatedNumber value={card.value} />
                )}
              </p>
              <CardTitle className="text-base font-semibold mt-1">{card.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{card.description}</CardDescription>
            </CardContent>
            <div className={`h-1 w-full bg-gradient-to-l ${card.gradient}`} />
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart - Cases by Status */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              توزيع القضايا حسب الحالة
            </CardTitle>
            <CardDescription>نسبة القضايا في كل حالة</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={stats?.casesByStatus || []} />
          </CardContent>
        </Card>

        {/* Bar Chart - Monthly Sessions */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              الجلسات الشهرية
            </CardTitle>
            <CardDescription>عدد الجلسات في آخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={stats?.monthlySessions || []} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases & Sessions Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Cases */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              آخر القضايا
            </CardTitle>
            <CardDescription>أحدث القضايا المضافة</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentCases && stats.recentCases.length > 0 ? (
              <div className="space-y-3">
                {stats.recentCases.map((caseItem, index) => (
                  <a
                    key={caseItem.id || index}
                    href={`/?section=cases`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">
                        {caseItem.caseNumber || 'بدون رقم'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {caseItem.subject || 'بدون موضوع'}
                      </p>
                    </div>
                    <Badge className={statusColors[caseItem.status || 'active']}>
                      {statusLabels[caseItem.status || 'active']}
                    </Badge>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Briefcase className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">لا توجد قضايا</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              الجلسات القادمة
            </CardTitle>
            <CardDescription>أقرب الجلسات المجدولة</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingSessions.map((session, index) => (
                  <a
                    key={session.id || index}
                    href={`/?section=sessions`}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {session.case_number || 'بدون رقم'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {session.subject || 'بدون موضوع'}
                      </p>
                    </div>
                    <div className="text-left text-sm text-muted-foreground">
                      <p>{formatDateTime(session.session_date)}</p>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mb-2 opacity-50" />
                <p>لا توجد جلسات قادمة</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Log & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Log */}
        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              سجل النشاطات
            </CardTitle>
            <CardDescription>آخر العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-2">
                {stats.recentActivities.slice(0, 8).map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg bg-muted ${actionColors[activity.action] || 'text-gray-500'}`}>
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {actionLabels[activity.action] || activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(activity.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Activity className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">لا توجد نشاطات مسجلة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                الوصول السريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="/?section=cases" 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span>القضايا</span>
                </a>
                <a 
                  href="/?section=calendar" 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <CalendarDays className="h-4 w-4 text-emerald-500" />
                  <span>الرزمانة</span>
                </a>
                <a 
                  href="/?section=clients" 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <Users className="h-4 w-4 text-amber-500" />
                  <span>الموكلين</span>
                </a>
                <a 
                  href="/?section=sessions" 
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                >
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span>الجلسات</span>
                </a>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                إحصائيات إضافية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">الموكلين</span>
                </div>
                <span className="font-bold">{stats?.totalClients || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">الهيئات القضائية</span>
                </div>
                <span className="font-bold">{stats?.totalJudicialBodies || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
