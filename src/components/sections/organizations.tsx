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
const ORGANIZATION_TYPES = [
  { value: 'bar_association', label: 'نقابة محامين' },
  { value: 'judicial_council', label: 'مجلس قضائي' },
  { value: 'court', label: 'محكمة' },
  { value: 'other', label: 'أخرى' },
];

const typeColors: Record<string, string> = {
  bar_association: 'bg-purple-100 text-purple-800',
  judicial_council: 'bg-blue-100 text-blue-800',
  court: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

interface Organization {
  id: number;
  name: string | null;
  type: string | null;
  address: string | null;
  phone: string | null;
  wilayaId: number | null;
  wilaya: string | null;
  notes: string | null;
}

interface Wilaya {
  id: number;
  number: number;
  name: string;
}

export function OrganizationsSection() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    address: '',
    phone: '',
    wilayaId: '',
    notes: '',
  });
  
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [orgsRes, wilayasRes] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/wilayas'),
      ]);

      if (orgsRes.ok) {
        const data = await orgsRes.json();
        setOrganizations(data.data || data);
      }
      if (wilayasRes.ok) setWilayas(await wilayasRes.json());
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/organizations';
      const method = selectedOrg ? 'PUT' : 'POST';
      const body = selectedOrg
        ? { ...formData, id: selectedOrg.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: selectedOrg ? 'تم التحديث' : 'تم الإضافة',
          description: selectedOrg ? 'تم تحديث المنظمة' : 'تم إضافة المنظمة',
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
    if (!selectedOrg) return;

    try {
      const response = await fetch(`/api/organizations?id=${selectedOrg.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف المنظمة' });
        setDeleteDialogOpen(false);
        setSelectedOrg(null);
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      address: '',
      phone: '',
      wilayaId: '',
      notes: '',
    });
    setSelectedOrg(null);
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name || '',
      type: org.type || '',
      address: org.address || '',
      phone: org.phone || '',
      wilayaId: org.wilayaId?.toString() || '',
      notes: org.notes || '',
    });
    setDialogOpen(true);
  };

  // تصفية المنظمات
  const filteredOrgs = organizations.filter(org => {
    const matchesType = typeFilter === 'all' || org.type === typeFilter;
    const matchesSearch = !search || 
      org.name?.toLowerCase().includes(search.toLowerCase()) ||
      org.address?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

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
        <h1 className="text-3xl font-bold">المنظمات</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة منظمة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedOrg ? 'تعديل منظمة' : 'إضافة منظمة جديدة'}</DialogTitle>
              <DialogDescription>جميع الحقول اختيارية</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم المنظمة</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="اسم المنظمة"
                  />
                </div>
                <div>
                  <Label>النوع</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORGANIZATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>العنوان</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="العنوان"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <Label>الولاية</Label>
                  <Select
                    value={formData.wilayaId}
                    onValueChange={(value) => setFormData({ ...formData, wilayaId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya.id} value={wilaya.id.toString()}>
                          {wilaya.number} - {wilaya.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                <Button type="submit">{selectedOrg ? 'تحديث' : 'إضافة'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المنظمات..."
            className="pr-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="كل الأنواع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            {ORGANIZATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>العنوان</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الولاية</TableHead>
              <TableHead className="w-24">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  لا يوجد منظمات
                </TableCell>
              </TableRow>
            ) : (
              filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name || '-'}</TableCell>
                  <TableCell>
                    {org.type && (
                      <Badge className={typeColors[org.type] || ''}>
                        {ORGANIZATION_TYPES.find(t => t.value === org.type)?.label || org.type}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{org.address || '-'}</TableCell>
                  <TableCell>{org.phone || '-'}</TableCell>
                  <TableCell>{org.wilaya || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(org)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedOrg(org);
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
              هل أنت متأكد من حذف المنظمة "{selectedOrg?.name}"؟
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
