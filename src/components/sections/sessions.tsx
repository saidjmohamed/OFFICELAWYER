'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: number;
  sessionDate: number | null;
  adjournmentReason: string | null;
  decision: string | null;
  rulingText: string | null;
  notes: string | null;
  caseId: number | null;
  caseNumber: string | null;
  caseSubject: string | null;
}

interface Case {
  id: number;
  caseNumber: string | null;
  subject: string | null;
}

export function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    caseId: '',
    sessionDate: '',
    adjournmentReason: '',
    decision: '',
    rulingText: '',
    notes: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [sessionsRes, casesRes] = await Promise.all([
        fetch(`/api/sessions${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/cases'),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.data || data);
      }
      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.data || data);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/sessions';
      const method = selectedSession ? 'PUT' : 'POST';
      const body = selectedSession
        ? { ...formData, id: selectedSession.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: selectedSession ? 'تم التحديث' : 'تم الإضافة',
          description: selectedSession ? 'تم تحديث الجلسة' : 'تم إضافة الجلسة',
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في العملية', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/sessions?id=${selectedSession.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الجلسة' });
        setDeleteDialogOpen(false);
        setSelectedSession(null);
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      caseId: '',
      sessionDate: '',
      adjournmentReason: '',
      decision: '',
      rulingText: '',
      notes: '',
    });
    setSelectedSession(null);
  };

  const openEditDialog = (session: Session) => {
    setSelectedSession(session);
    setFormData({
      caseId: session.caseId?.toString() || '',
      sessionDate: session.sessionDate
        ? new Date(session.sessionDate).toISOString().slice(0, 16)
        : '',
      adjournmentReason: session.adjournmentReason || '',
      decision: session.decision || '',
      rulingText: session.rulingText || '',
      notes: session.notes || '',
    });
    setDialogOpen(true);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1 className="text-3xl font-bold">الجلسات</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة جلسة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedSession ? 'تعديل جلسة' : 'إضافة جلسة'}</DialogTitle>
              <DialogDescription>أدخل بيانات الجلسة (جميع الحقول اختيارية)</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label>القضية</Label>
                  <Select
                    value={formData.caseId}
                    onValueChange={(value) => setFormData({ ...formData, caseId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر القضية" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                          {caseItem.caseNumber || 'قضية بدون رقم'} - {caseItem.subject || 'بدون موضوع'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>تاريخ الجلسة</Label>
                  <Input
                    type="datetime-local"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>سبب التأجيل</Label>
                  <Textarea
                    value={formData.adjournmentReason}
                    onChange={(e) => setFormData({ ...formData, adjournmentReason: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>القرار</Label>
                  <Textarea
                    value={formData.decision}
                    onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>منطوق الحكم</Label>
                  <Textarea
                    value={formData.rulingText}
                    onChange={(e) => setFormData({ ...formData, rulingText: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">{selectedSession ? 'تحديث' : 'إضافة'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الجلسات..."
            className="pr-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>تاريخ الجلسة</TableHead>
              <TableHead>القضية</TableHead>
              <TableHead>القرار</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead className="w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  لا يوجد جلسات
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(session.sessionDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.caseNumber || '-'}
                    {session.caseSubject && (
                      <p className="text-xs text-muted-foreground">{session.caseSubject}</p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{session.decision || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{session.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedSession(session);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الجلسة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
