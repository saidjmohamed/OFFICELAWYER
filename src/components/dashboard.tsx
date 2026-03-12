'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, Calendar, CalendarDays, DollarSign, Loader2, TrendingUp, Clock, Scale, 
  FileText, Users, Building2, Bell, Activity, Receipt, AlertCircle, CheckCircle2,
  XCircle, Archive, PauseCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Area, AreaChart
} from 'recharts';

// ==================== Interfaces ====================
interface CaseByStatus {
  status: string;
  label: string;
  count: number;
  color: string;
}

interface CaseByType {
  type: string;
  label: string;
  count: number;
  color: string;
}

interface MonthlyStat {
  month: string;
  monthIndex: number;
  year: number;
  cases: number;
  sessions: number;
}

interface UpcomingSession {
  id: number;
  sessionDate: number | null;
  caseNumber: string | null;
  subject: string | null;
  caseType: string | null;
}

interface RecentCase {
  id: number;
  caseNumber: string | null;
  subject: string | null;
  caseType: string | null;
  status: string | null;
  createdAt: string | null;
}

interface RecentActivity {
  id: number;
  action: string | null;
  entityType: string | null;
  description: string | null;
  createdAt: string | null;
}

interface Stats {
  activeCases: number;
  totalCases: number;
  todaySessions: number;
  weekSessions: number;
  totalFees: number;
  totalExpenses: number;
  totalClients: number;
  totalJudicialBodies: number;
  casesByStatus: CaseByStatus[];
  casesByType: CaseByType[];
  monthlyStats: MonthlyStat[];
  upcomingSessions: UpcomingSession[];
  recentCases: RecentCase[];
  recentActivities: RecentActivity[];
}

// ==================== Animation Variants ====================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

const cardHoverVariants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// ==================== Animated Number Component ====================
function AnimatedNumber({ value, duration = 1000, isCurrency = false }: { 
  value: number; 
  duration?: number;
  isCurrency?: boolean;
}) {
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

  return (
    <span ref={ref}>
      {displayValue.toLocaleString('ar-DZ')}
      {isCurrency && <span className="text-lg mr-1">د.ج</span>}
    </span>
  );
}

// ==================== Custom Tooltip for Charts ====================
const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ value: number; name: string; color: string }>; 
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==================== Stats Card Component ====================
function StatsCard({ 
  title, 
  description, 
  value, 
  icon: Icon, 
  gradient, 
  iconBg,
  isCurrency = false,
  delay = 0 
}: { 
  title: string;
  description: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  isCurrency?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <motion.div
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        className="h-full"
      >
        <Card className="card-hover border-none shadow-soft overflow-hidden h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <motion.div 
                className={`p-2.5 rounded-xl ${iconBg}`}
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className="h-5 w-5 text-foreground" />
              </motion.div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">
              <AnimatedNumber value={value} isCurrency={isCurrency} />
            </p>
            <CardTitle className="text-base font-semibold mt-1">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </CardContent>
          <div className={`h-1 w-full bg-gradient-to-l ${gradient}`} />
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ==================== Activity Icon ====================
function getActivityIcon(action: string | null) {
  switch (action) {
    case 'case_created':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'case_updated':
      return <Briefcase className="h-4 w-4 text-amber-500" />;
    case 'case_deleted':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'client_created':
      return <Users className="h-4 w-4 text-green-500" />;
    case 'session_created':
      return <Calendar className="h-4 w-4 text-purple-500" />;
    case 'login':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
}

// ==================== Session Alert Badge ====================
function getSessionAlertBadge(sessionDate: number | null) {
  if (!sessionDate) return null;
  
  const now = new Date();
  const session = new Date(sessionDate);
  const diffDays = Math.ceil((session.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return (
      <Badge variant="destructive" className="ml-2 animate-pulse">
        <AlertCircle className="h-3 w-3 ml-1" />
        عاجل
      </Badge>
    );
  } else if (diffDays <= 3) {
    return (
      <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
        <Bell className="h-3 w-3 ml-1" />
        قريب
      </Badge>
    );
  }
  return null;
}

// ==================== Status Icon ====================
function getStatusIcon(status: string | null) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case 'adjourned':
      return <PauseCircle className="h-4 w-4 text-amber-500" />;
    case 'judged':
      return <Scale className="h-4 w-4 text-green-500" />;
    case 'closed':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    case 'archived':
      return <Archive className="h-4 w-4 text-purple-500" />;
    default:
      return <Briefcase className="h-4 w-4 text-gray-500" />;
  }
}

// ==================== Main Dashboard Component ====================
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // تنسيق التاريخ
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'غير محدد';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-DZ', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (timestamp: number | null) => {
    if (!timestamp) return 'غير محدد';
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-DZ', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // البطاقات الرئيسية
  const mainCards = [
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
    },
    {
      title: 'جلسات الأسبوع',
      description: 'الجلسات المجدولة هذا الأسبوع',
      value: stats?.weekSessions || 0,
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
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-primary/80 p-6 md:p-8 text-primary-foreground shadow-lg"
        variants={itemVariants}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
            >
              <Scale className="h-8 w-8" />
            </motion.div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">مرحباً بك في مكتب المحامي</h1>
              <p className="mt-1 text-primary-foreground/80">
                نظام إدارة متكامل لمكاتب المحاماة في الجزائر
              </p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
      </motion.div>
      
      {/* Stats Cards */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        {mainCards.map((card, index) => (
          <StatsCard 
            key={card.title} 
            {...card} 
            delay={index * 0.1}
          />
        ))}
      </motion.div>

      {/* Additional Stats Row */}
      <motion.div 
        className="grid gap-4 md:grid-cols-3"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20">
                  <Receipt className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-xl font-bold">
                    <AnimatedNumber value={stats?.totalExpenses || 0} isCurrency />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                  <Users className="h-5 w-5 text-cyan-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">إجمالي الموكلين</p>
                  <p className="text-xl font-bold">
                    <AnimatedNumber value={stats?.totalClients || 0} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/20">
                  <Building2 className="h-5 w-5 text-teal-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">الهيئات القضائية</p>
                  <p className="text-xl font-bold">
                    <AnimatedNumber value={stats?.totalJudicialBodies || 0} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-2"
        variants={containerVariants}
      >
        {/* Pie Chart - Cases by Status */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                توزيع القضايا حسب الحالة
              </CardTitle>
              <CardDescription>نسبة القضايا في كل حالة</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.casesByStatus && stats.casesByStatus.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.casesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="label"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {stats.casesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {stats.casesByStatus.map((item, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                        <span className="font-bold mr-auto">{item.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Cases by Type */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                توزيع القضايا حسب النوع
              </CardTitle>
              <CardDescription>أنواع القضايا المتداولة</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.casesByType && stats.casesByType.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.casesByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="label"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {stats.casesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 text-sm max-h-40 overflow-y-auto">
                    {stats.casesByType.map((item, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.label}</span>
                        <span className="font-bold mr-auto">{item.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  لا توجد بيانات
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Monthly Stats Chart */}
      <motion.div variants={itemVariants}>
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              الإحصائيات الشهرية
            </CardTitle>
            <CardDescription>القضايا والجلسات في آخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.monthlyStats && stats.monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.monthlyStats}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cases"
                    name="القضايا"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCases)"
                    animationDuration={1500}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="الجلسات"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                لا توجد بيانات
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Row */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-3"
        variants={containerVariants}
      >
        {/* Upcoming Sessions with Alert */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="h-5 w-5 text-primary" />
                  {stats?.upcomingSessions && stats.upcomingSessions.length > 0 && (
                    <motion.span 
                      className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
                الجلسات القادمة
              </CardTitle>
              <CardDescription>خلال الأيام السبعة القادمة</CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {stats.upcomingSessions.map((session, index) => (
                      <motion.a
                        key={session.id || index}
                        href={`/?section=sessions`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 5 }}
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="font-medium truncate text-sm">
                              {session.caseNumber || 'بدون رقم'}
                            </p>
                            {getSessionAlertBadge(session.sessionDate)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatShortDate(session.sessionDate)}
                          </p>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Calendar className="h-10 w-10 mb-2 opacity-50" />
                    <p className="text-sm">لا توجد جلسات قادمة</p>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Cases */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                آخر القضايا
              </CardTitle>
              <CardDescription>أحدث القضايا المضافة</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentCases && stats.recentCases.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {stats.recentCases.map((caseItem, index) => (
                    <motion.a
                      key={caseItem.id || index}
                      href={`/?section=cases`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getStatusIcon(caseItem.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {caseItem.caseNumber || 'بدون رقم'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {caseItem.subject || 'بدون موضوع'}
                        </p>
                      </div>
                    </motion.a>
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
        </motion.div>

        {/* Recent Activities */}
        <motion.div variants={itemVariants}>
          <Card className="card-hover h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                آخر النشاطات
              </CardTitle>
              <CardDescription>سجل أحدث العمليات</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {stats.recentActivities.map((activity, index) => (
                    <motion.div
                      key={activity.id || index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="p-2 bg-muted rounded-lg">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {activity.description || 'نشاط غير محدد'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatShortDate(activity.createdAt ? new Date(activity.createdAt).getTime() : null)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                  <Activity className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">لا توجد نشاطات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
