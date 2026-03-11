'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

interface UpcomingSession {
  id: number;
  sessionDate: number;
  caseNumber: string | null;
  subject: string | null;
  judicialBody: string | null;
}

interface NotificationContextType {
  upcomingSessions: UpcomingSession[];
  todaySessions: UpcomingSession[];
  tomorrowSessions: UpcomingSession[];
  weekSessions: UpcomingSession[];
  unreadCount: number;
  markAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  upcomingSessions: [],
  todaySessions: [],
  tomorrowSessions: [],
  weekSessions: [],
  unreadCount: 0,
  markAsRead: () => {},
  refreshNotifications: async () => {},
  loading: true,
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notifications-last-read');
      return saved ? parseInt(saved) : 0;
    }
    return 0;
  });

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions/upcoming?days=7');
      if (response.ok) {
        const data = await response.json();
        setUpcomingSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('خطأ في جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    // تحديث كل 5 دقائق
    const interval = setInterval(refreshNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // تصنيف الجلسات
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todaySessions = upcomingSessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === today.getTime();
  });

  const tomorrowSessions = upcomingSessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() === tomorrow.getTime();
  });

  const weekSessions = upcomingSessions.filter(s => {
    const sessionDate = new Date(s.sessionDate);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate.getTime() > tomorrow.getTime() && sessionDate.getTime() <= weekEnd.getTime();
  });

  // حساب الجلسات غير المقروءة
  const unreadCount = upcomingSessions.filter(s => s.sessionDate > lastReadTime).length;

  const markAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadTime(now);
    localStorage.setItem('notifications-last-read', now.toString());
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        upcomingSessions,
        todaySessions,
        tomorrowSessions,
        weekSessions,
        unreadCount,
        markAsRead,
        refreshNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
