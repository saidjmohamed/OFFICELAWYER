'use client';

import { useEffect, useState, Suspense, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { Sidebar } from '@/components/layout/sidebar';
import { GlobalSearch } from '@/components/layout/global-search';
import { Dashboard } from '@/components/dashboard';
import { JudicialBodiesSection } from '@/components/sections/judicial-bodies-new';
import { ClientsSection } from '@/components/sections/clients';
import { CasesSection } from '@/components/sections/cases';
import { SessionsSection } from '@/components/sections/sessions';
import { CalendarSection } from '@/components/sections/calendar';
import { SettingsSection } from '@/components/sections/settings';
import { BackupSection } from '@/components/sections/backup';
import { LawyersSection } from '@/components/sections/lawyers';
import { OrganizationsSection } from '@/components/sections/organizations';
import { ActivityLogSection } from '@/components/sections/activity-log';
import { AboutSection } from '@/components/sections/about';
import { UpdateNotification } from '@/components/update-notification';
import { SessionNotifications } from '@/components/session-notifications';
import { ThemeProvider } from '@/contexts/theme-context';
import { Loader2 } from 'lucide-react';

function MainContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || 'dashboard';

  const renderSection = () => {
    switch (section) {
      case 'judicial-bodies':
        return <JudicialBodiesSection />;
      case 'clients':
        return <ClientsSection />;
      case 'cases':
        return <CasesSection />;
      case 'sessions':
        return <SessionsSection />;
      case 'calendar':
        return <CalendarSection />;
      case 'lawyers':
        return <LawyersSection />;
      case 'organizations':
        return <OrganizationsSection />;
      case 'settings':
        return <SettingsSection />;
      case 'activity-log':
        return <ActivityLogSection />;
      case 'backup':
        return <BackupSection />;
      case 'about':
        return <AboutSection />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-muted/30">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* إشعار التحديث */}
        <div className="mb-4">
          <UpdateNotification />
        </div>
        
        {/* Search bar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <GlobalSearch />
          </div>
          <SessionNotifications />
        </div>
        
        {/* Content with smooth transition */}
        <div key={section} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderSection()}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // التحقق من المصادقة عند تحميل الصفحة
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // تهيئة قاعدة البيانات
        await fetch('/api/init-db');
        
        // التحقق من المصادقة
        const response = await fetch('/api/auth');
        const data = await response.json();
        setAuthenticated(data.authenticated);
      } catch (error) {
        console.error('خطأ في التحقق من المصادقة:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // معالجة نجاح تسجيل الدخول
  const handleLoginSuccess = useCallback(() => {
    // تحديث الحالة فوراً بدون الحاجة لتحديث الصفحة
    setAuthenticated(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/50 to-muted">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/50 to-muted">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex animate-in fade-in duration-300">
        <Sidebar />
        <div className="flex-1 md:mr-64">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <MainContent />
          </Suspense>
        </div>
      </div>
    </ThemeProvider>
  );
}
