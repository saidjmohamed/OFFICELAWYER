'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Plus, ChevronRight, ChevronLeft, Loader2, CalendarDays, Users, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';

interface CalendarEvent {
  id: number | string;
  title: string;
  type: 'session' | 'appointment' | 'meeting' | 'task' | 'case';
  eventDate: number | null;
  endDate?: number | null;
  caseId?: number | null;
  sessionId?: number | null;
  description?: string | null;
  caseStatus?: string | null;
}

const typeLabels = {
  session: 'جلسة',
  case: 'قضية',
  appointment: 'موعد',
  meeting: 'اجتماع',
  task: 'مهمة',
};

const typeColors = {
  session: 'bg-blue-500',
  case: 'bg-red-500',
  appointment: 'bg-green-500',
  meeting: 'bg-purple-500',
  task: 'bg-orange-500',
};

type ViewType = 'month' | 'week' | 'day';

export function CalendarSection() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'appointment' as 'session' | 'appointment' | 'meeting' | 'task',
    eventDate: '',
    endDate: '',
    description: '',
  });
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      let start: Date;
      let end: Date;

      if (view === 'month') {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (view === 'week') {
        start = startOfWeek(currentDate, { weekStartsOn: 6 }); // السبت
        end = endOfWeek(currentDate, { weekStartsOn: 6 });
      } else {
        start = currentDate;
        end = addDays(currentDate, 1);
      }

      const response = await fetch(
        `/api/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('خطأ في جلب الأحداث:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ title: 'تم الإضافة', description: 'تم إضافة الحدث' });
        setDialogOpen(false);
        resetForm();
        fetchEvents();
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في العملية', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('session-')) {
      toast({ title: 'تنبيه', description: 'لا يمكن حذف جلسة من هنا، احذفها من قسم الجلسات' });
      return;
    }

    try {
      const response = await fetch(`/api/calendar?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الحدث' });
        fetchEvents();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'appointment',
      eventDate: '',
      endDate: '',
      description: '',
    });
    setSelectedDate(null);
  };

  const openAddDialog = (date: Date) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      eventDate: date.toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      if (!event.eventDate) return false;
      const eventDate = new Date(event.eventDate);
      return isSameDay(eventDate, date);
    });
  };

  const navigatePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 6 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 });

    const weeks: Date[][] = [];
    let days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        days.push(day);
        day = addDays(day, 1);
      }
      weeks.push(days);
      days = [];
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-7 bg-muted">
          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-t">
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDate(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={dayIndex}
                  className={`min-h-24 p-1 border-l last:border-l-0 ${
                    !isCurrentMonth ? 'bg-muted/50' : ''
                  } ${isTodayDate ? 'bg-primary/5' : ''}`}
                  onClick={() => openAddDialog(date)}
                >
                  <div className={`text-sm p-1 ${isTodayDate ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1 mt-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded text-white truncate ${typeColors[event.type]}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} المزيد
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 6 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-muted">
          {days.map((date) => (
            <div
              key={date.toISOString()}
              className={`p-2 text-center border-l last:border-l-0 ${
                isToday(date) ? 'bg-primary/10' : ''
              }`}
              onClick={() => openAddDialog(date)}
            >
              <div className="text-xs text-muted-foreground">
                {format(date, 'EEEE', { locale: ar })}
              </div>
              <div className={`text-lg font-medium ${isToday(date) ? 'bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                {format(date, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-96">
          {days.map((date) => {
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={date.toISOString()}
                className="border-l last:border-l-0 p-2 space-y-1"
                onClick={() => openAddDialog(date)}
              >
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-2 rounded text-white ${typeColors[event.type]}`}
                  >
                    <div className="font-medium">{event.title}</div>
                    {event.eventDate && (
                      <div className="opacity-80">
                        {format(new Date(event.eventDate), 'HH:mm')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted p-4 text-center">
          <div className="text-sm text-muted-foreground">
            {format(currentDate, 'EEEE', { locale: ar })}
          </div>
          <div className="text-2xl font-bold">
            {format(currentDate, 'd MMMM yyyy', { locale: ar })}
          </div>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {hours.map((hour) => {
            const hourEvents = dayEvents.filter((e) => {
              if (!e.eventDate) return false;
              const eventHour = new Date(e.eventDate).getHours();
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex min-h-16">
                <div className="w-16 p-2 text-sm text-muted-foreground border-l">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-2 space-y-1" onClick={() => openAddDialog(currentDate)}>
                  {hourEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-sm p-2 rounded text-white ${typeColors[event.type]}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">الرزمانة</h1>
        <Button onClick={() => {
          setSelectedDate(new Date());
          setFormData({ ...formData, eventDate: new Date().toISOString().slice(0, 16) });
          setDialogOpen(true);
        }}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة حدث
        </Button>
      </div>

      {/* Navigation and View */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium min-w-48 text-center">
            {view === 'month' && format(currentDate, 'MMMM yyyy', { locale: ar })}
            {view === 'week' && `${format(startOfWeek(currentDate, { weekStartsOn: 6 }), 'd MMM', { locale: ar })} - ${format(endOfWeek(currentDate, { weekStartsOn: 6 }), 'd MMM yyyy', { locale: ar })}`}
            {view === 'day' && format(currentDate, 'd MMMM yyyy', { locale: ar })}
          </div>
          <Button variant="outline" size="icon" onClick={navigateNext}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            شهر
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            أسبوع
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('day')}
          >
            يوم
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        {Object.entries(typeLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${typeColors[key as keyof typeof typeColors]}`} />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة حدث</DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, 'd MMMM yyyy', { locale: ar })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان الحدث"
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: typeof formData.type) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointment">موعد</SelectItem>
                    <SelectItem value="meeting">اجتماع</SelectItem>
                    <SelectItem value="task">مهمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>التاريخ والوقت</Label>
                <Input
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
