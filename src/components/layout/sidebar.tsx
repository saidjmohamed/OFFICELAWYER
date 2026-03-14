'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Briefcase,
  Calendar,
  CalendarDays,
  Settings,
  Database,
  LogOut,
  Menu,
  X,
  Scale,
  ScaleIcon,
  Landmark,
  LayoutDashboard,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

const navigation = [
  { 
    name: 'لوحة التحكم', 
    href: '/?section=dashboard', 
    icon: LayoutDashboard, 
    section: 'dashboard',
    group: 'main'
  },
  { 
    name: 'الهيئات القضائية', 
    href: '/?section=judicial-bodies', 
    icon: Building2, 
    section: 'judicial-bodies',
    group: 'main'
  },
  { 
    name: 'الموكلين', 
    href: '/?section=clients', 
    icon: Users, 
    section: 'clients',
    group: 'records'
  },
  { 
    name: 'القضايا', 
    href: '/?section=cases', 
    icon: Briefcase, 
    section: 'cases',
    group: 'records'
  },
  { 
    name: 'الجلسات', 
    href: '/?section=sessions', 
    icon: Calendar, 
    section: 'sessions',
    group: 'records'
  },
  { 
    name: 'الرزمانة', 
    href: '/?section=calendar', 
    icon: CalendarDays, 
    section: 'calendar',
    group: 'records'
  },
  { 
    name: 'المحامين', 
    href: '/?section=lawyers', 
    icon: ScaleIcon, 
    section: 'lawyers',
    group: 'other'
  },
  { 
    name: 'المنظمات', 
    href: '/?section=organizations', 
    icon: Landmark, 
    section: 'organizations',
    group: 'other'
  },
];

const settingsNav: Array<{ name: string; href: string; icon: typeof Settings; section: string }> = [
  { 
    name: 'الإعدادات', 
    href: '/?section=settings', 
    icon: Settings, 
    section: 'settings'
  },
  { 
    name: 'النسخ الاحتياطي', 
    href: '/?section=backup', 
    icon: Database, 
    section: 'backup'
  },
  { 
    name: 'حول البرنامج', 
    href: '/?section=about', 
    icon: Info, 
    section: 'about'
  },
];

interface OfficeSettings {
  officeName: string;
  lawyerName: string;
  logo: string;
  primaryColor: string;
}

interface SidebarContentProps {
  activeSection: string | null;
  onNavigate: () => void;
  onLogout: () => void;
  officeSettings: OfficeSettings | null;
}

function SidebarContent({ activeSection, onNavigate, onLogout, officeSettings }: SidebarContentProps) {
  const mainNav = navigation.filter(n => n.group === 'main');
  const recordsNav = navigation.filter(n => n.group === 'records');
  const otherNav = navigation.filter(n => n.group === 'other');

  const displayName = officeSettings?.officeName || officeSettings?.lawyerName || 'مكتب المحامي';

  type NavItemType = { name: string; href: string; icon: typeof Settings; section: string; group?: string };
  
  const NavItem = ({ item }: { item: NavItemType }) => {
    const isActive = activeSection === item.section || (!activeSection && item.section === 'dashboard');
    
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:shadow-sm',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5 bg-primary/5">
        {officeSettings?.logo ? (
          <img 
            src={officeSettings.logo} 
            alt={displayName}
            className="h-10 w-10 object-contain rounded-lg"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" />
          </div>
        )}
        <div className="overflow-hidden">
          <span className="text-lg font-bold block truncate">{displayName}</span>
          <p className="text-xs text-muted-foreground truncate">نظام إدارة متكامل</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* القائمة الرئيسية */}
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <Separator className="my-2" />

        {/* السجلات */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            السجلات
          </p>
          {recordsNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <Separator className="my-2" />

        {/* أخرى */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            أخرى
          </p>
          {otherNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <Separator className="my-2" />

        {/* الإعدادات */}
        <div className="space-y-1">
          {settingsNav.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings | null>(null);
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section');

  // جلب إعدادات المكتب
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/office-settings', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setOfficeSettings({
            officeName: data.officeName || '',
            lawyerName: data.lawyerName || '',
            logo: data.logo || '',
            primaryColor: data.primaryColor || '#1e40af',
          });
        }
      } catch (error) {
        console.error('خطأ في جلب إعدادات المكتب:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE', credentials: 'include' });
    window.location.reload();
  };

  // معالجة السحب على الشاشة - محسنة للهاتف
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    const edgeWidth = 30; // عرض منطقة الحافة

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const diff = touchStartX - touchEndX;
      const threshold = 50;
      const screenWidth = window.innerWidth;
      const startedFromRightEdge = touchStartX > screenWidth - edgeWidth;

      // في RTL:
      // - القائمة على اليمين
      // - السحب لليسار (diff > 0) من الحافة اليمنى يفتح القائمة
      // - السحب لليمين (diff < 0) يغلق القائمة
      
      if (diff > threshold && startedFromRightEdge && !mobileOpen) {
        // السحب لليسار من الحافة اليمنى -> فتح
        setMobileOpen(true);
      } else if (diff < -threshold && mobileOpen) {
        // السحب لليمين -> إغلاق
        setMobileOpen(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileOpen]);

  // إغلاق القائمة عند الضغط على Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  // منع التمرير في الخلفية عندما القائمة مفتوحة
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile menu button - Fixed position */}
      <Button
        variant="default"
        size="icon"
        className="fixed top-16 right-4 z-50 md:hidden shadow-lg h-10 w-10"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-40 w-72 transform border-l bg-card transition-transform duration-300 ease-in-out md:hidden',
          'overscroll-contain',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <SidebarContent
          activeSection={activeSection}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
          officeSettings={officeSettings}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:right-0 md:flex md:w-64 md:flex-col md:border-l md:bg-card">
        <SidebarContent
          activeSection={activeSection}
          onNavigate={() => {}}
          onLogout={handleLogout}
          officeSettings={officeSettings}
        />
      </aside>
    </>
  );
}
