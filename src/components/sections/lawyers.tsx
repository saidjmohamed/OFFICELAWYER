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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// أنواع المنظمات
const ORGANIZATION_TYPES: Record<string, string> = {
  bar_association: 'نقابة محامين',
  judicial_council: 'مجلس قضائي',
  court: 'محكمة',
  other: 'أخرى',
};

interface Lawyer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  professionalAddress: string | null;
  organizationId: number | null;
  organization: string | null;
  organizationType: string | null;
  notes: string | null;
}

interface Organization {
  id: number;
  name: string | null;
  type: string | null;
  wilaya: string | null;
}

export function LawyersSection() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    professionalAddress: '',
    organizationId: '',
    notes: '',
  });
  
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [lawyersRes, orgsRes] = await Promise.all([
        fetch(`/api/lawyers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        fetch('/api/organizations'),
      ]);

      if (lawyersRes.ok) {
        const data = await lawyersRes.json();
        setLawyers(data.data || data);
      }
      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.data || data);
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
      const url = '/api/lawyers';
      const method = selectedLawyer ? 'PUT' : 'POST';
      const body = selectedLawyer
        ? { ...formData, id: selectedLawyer.id }
        : formData;

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: selectedLawyer ? 'تم التحديث' : 'تم الإضافة',
          description: selectedLawyer ? 'تم تحديث بيانات المحامي' : 'تم إضافة المحامي',
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
    if (!selectedLawyer) return;

    try {
      const response = await fetch(`/api/lawyers?id=${selectedLawyer.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف المحامي' });
        setDeleteDialogOpen(false);
        setSelectedLawyer(null);
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      professionalAddress: '',
      organizationId: '',
      notes: '',
    });
    setSelectedLawyer(null);
  };

  const openEditDialog = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setFormData({
      firstName: lawyer.firstName || '',
      lastName: lawyer.lastName || '',
      phone: lawyer.phone || '',
      professionalAddress: lawyer.professionalAddress || '',
      organizationId: lawyer.organizationId?.toString() || '',
      notes: lawyer.notes || '',
    });
    setDialogOpen(true);
  };

  // تصفية المنظمات حسب النوع (نقابات المحامين فقط)
  const barAssociations = organizations.filter(o => o.type === 'bar_association');

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
        <h1 className="text-3xl font-bold">المحامين</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة محامي
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedLawyer ? 'تعديل محامي' : 'إضافة محامي جديد'}</DialogTitle>
              <DialogDescription>جميع الحقول اختيارية</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="الاسم"
                  />
                </div>
                <div>
                  <Label>اللقب</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="اللقب"
                  />
                </div>
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="رقم الهاتف"
                />
              </div>
              <div>
                <Label>العنوان المهني</Label>
                <Input
                  value={formData.professionalAddress}
                  onChange={(e) => setFormData({ ...formData, professionalAddress: e.target.value })}
                  placeholder="العنوان المهني"
                />
              </div>
              <div>
                <Label>المنظمة التابع لها</Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) => setFormData({ ...formData, organizationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنظمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {barAssociations.length > 0 ? (
                      barAssociations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name} {org.wilaya ? `- ${org.wilaya}` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name} {org.wilaya ? `- ${org.wilaya}` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات..."
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="submit">{selectedLawyer ? 'تحديث' : 'إضافة'}</Button>
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
            placeholder="بحث في المحامين..."
            className="pr-9"
          />
        </div>
      </div>

      {/* Table - Desktop / Cards - Mobile */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم الكامل</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>العنوان المهني</TableHead>
                <TableHead>المنظمة</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lawyers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    لا يوجد محامين
                  </TableCell>
                </TableRow>
              ) : (
                lawyers.map((lawyer) => (
                  <TableRow key={lawyer.id}>
                    <TableCell className="font-medium">
                      {lawyer.firstName} {lawyer.lastName}
                    </TableCell>
                    <TableCell>{lawyer.phone || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{lawyer.professionalAddress || '-'}</TableCell>
                    <TableCell>
                      {lawyer.organization ? (
                        <div className="flex flex-col">
                          <span>{lawyer.organization}</span>
                          {lawyer.organizationType && (
                            <Badge variant="outline" className="w-fit mt-1 text-xs">
                              {ORGANIZATION_TYPES[lawyer.organizationType] || lawyer.organizationType}
                            </Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(lawyer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedLawyer(lawyer);
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
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {lawyers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا يوجد محامين
            </div>
          ) : (
            lawyers.map((lawyer) => (
              <div key={lawyer.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{lawyer.firstName} {lawyer.lastName}</p>
                    {lawyer.organization && (
                      <p className="text-xs text-muted-foreground">{lawyer.organization}</p>
                    )}
                  </div>
                  {lawyer.organizationType && (
                    <Badge variant="outline" className="text-xs">
                      {ORGANIZATION_TYPES[lawyer.organizationType] || lawyer.organizationType}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {lawyer.phone && <p>📞 {lawyer.phone}</p>}
                  {lawyer.professionalAddress && <p>📍 {lawyer.professionalAddress}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(lawyer)}
                  >
                    <Pencil className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive"
                    onClick={() => {
                      setSelectedLawyer(lawyer);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المحامي "{selectedLawyer?.firstName} {selectedLawyer?.lastName}"؟
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
