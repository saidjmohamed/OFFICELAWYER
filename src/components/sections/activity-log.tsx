'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Loader2, 
  Filter, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { 
  getActionDescription, 
  getActionIcon, 
  getActionColor,
  type ActivityAction 
} from '@/lib/activity-logger';

interface ActivityLogItem {
  id: number;
  action: ActivityAction;
  entityType: string | null;
  entityId: number | null;
  description: string;
  details: string | null;
  createdAt: string;
}

interface ActivityLogResponse {
  logs: ActivityLogItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const entityFilters = [
  { value: 'all', label: 'الكل' },
  { value: 'case', label: 'القضايا' },
  { value: 'client', label: 'الموكلين' },
  { value: 'session', label: 'الجلسات' },
  { value: 'judicial_body', label: 'الهيئات القضائية' },
  { value: 'lawyer', label: 'المحامين' },
  { value: 'organization', label: 'المنظمات' },
  { value: 'backup', label: 'النسخ الاحتياطي' },
  { value: 'settings', label: 'الإعدادات' },
];

export function ActivityLogSection() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  const fetchLogs = async (offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString(),
      });
      
      if (filter !== 'all') {
        params.set('entityType', filter);
      }

      const response = await fetch(`/api/activity-logs?${params}`);
      if (response.ok) {
        const data: ActivityLogResponse = await response.json();
        setLogs(data.logs);
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          offset,
        }));
      }
    } catch (error) {
      console.error('خطأ في جلب سجل النشاطات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, [filter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearOldLogs = async () => {
    if (!confirm('هل تريد حذف النشاطات الأقدم من 90 يوم؟')) return;
    
    try {
      const response = await fetch('/api/activity-logs?olderThanDays=90', {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchLogs(0);
      }
    } catch (error) {
      console.error('خطأ في حذف النشاطات:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">سجل النشاطات</h2>
          <p className="text-muted-foreground">تتبع جميع الإجراءات والعمليات في النظام</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                آخر النشاطات
              </CardTitle>
              <CardDescription>
                إجمالي {pagination.total} نشاط
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {entityFilters.map(f => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={clearOldLogs}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Activity className="h-12 w-12 mb-2 opacity-50" />
              <p>لا توجد نشاطات مسجلة</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${getActionColor(log.action)}`}>
                        <span className="text-lg">{getActionIcon(log.action)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {getActionDescription(log.action)}
                          </Badge>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {(() => {
                              try {
                                const details = JSON.parse(log.details);
                                return Object.entries(details)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(' • ');
                              } catch {
                                return log.details;
                              }
                            })()}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  عرض {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} من {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.offset === 0}
                    onClick={() => fetchLogs(pagination.offset - pagination.limit)}
                  >
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasMore}
                    onClick={() => fetchLogs(pagination.offset + pagination.limit)}
                  >
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
