'use client';

import { useEffect, useState } from 'react';
import { Bell, Calendar, Clock, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface UpcomingSession {
  id: number;
  sessionDate: number;
  caseNumber: string | null;
  subject: string | null;
  judicialBody: string | null;
}

export function SessionNotifications() {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
    // تحديث كل 5 دقائق
    const interval = setInterval(fetchSessions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions/upcoming?days=7');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  };

  // تصنيف الجلسات
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  const tomorrowSessions = sessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === tomorrow.getTime();
  });

  const laterSessions = sessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() > tomorrow.getTime();
  });

  const totalToday = todaySessions.length;
  const totalTomorrow = tomorrowSessions.length;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ar-DZ', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const SessionItem = ({ session }: { session: UpcomingSession }) => (
    <a
      href={`/?section=sessions`}
      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className="p-2 bg-primary/10 rounded-lg">
        <Calendar className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {session.caseNumber || 'بدون رقم'}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatTime(session.sessionDate)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {session.subject || session.judicialBody || 'بدون تفاصيل'}
        </p>
      </div>
      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
    </a>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {(totalToday > 0 || totalTomorrow > 0) && (
            <Badge 
              className={cn(
                "absolute -top-1 -left-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]",
                totalToday > 0 ? "bg-red-500" : "bg-orange-500"
              )}
            >
              {totalToday || totalTomorrow}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            إشعارات الجلسات
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2 opacity-50" />
              <p>لا توجد جلسات قادمة هذا الأسبوع</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* جلسات اليوم */}
              {todaySessions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-600">
                    <Badge className="bg-red-500 text-white">اليوم</Badge>
                    <span className="text-sm">{todaySessions.length} جلسة</span>
                  </div>
                  <div className="space-y-2">
                    {todaySessions.map(session => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}

              {/* جلسات الغد */}
              {tomorrowSessions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Badge className="bg-orange-500 text-white">الغد</Badge>
                    <span className="text-sm">{tomorrowSessions.length} جلسة</span>
                  </div>
                  <div className="space-y-2">
                    {tomorrowSessions.map(session => (
                      <SessionItem key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              )}

              {/* لاحقاً */}
              {laterSessions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">لاحقاً هذا الأسبوع</span>
                  </div>
                  <div className="space-y-2">
                    {laterSessions.map(session => (
                      <div key={session.id}>
                        <p className="text-xs text-muted-foreground mb-1">
                          {formatDate(session.sessionDate)}
                        </p>
                        <SessionItem session={session} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
