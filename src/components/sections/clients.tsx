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
import { Plus, Pencil, Trash2, Search, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: number;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  clientType: 'natural_person' | 'legal_entity' | null;
  businessName: string | null;
  legalRepresentative: string | null;
}

export function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    notes: '',
    clientType: 'natural_person' as 'natural_person' | 'legal_entity',
    businessName: '',
    legalRepresentative: '',
  });
  const { toast } = useToast();

  const fetchClients = async (searchQuery = '') => {
    try {
      const url = searchQuery
        ? `/api/clients?search=${encodeURIComponent(searchQuery)}`
        : '/api/clients';
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.data || data);
      }
    } catch (error) {
      console.error('خطأ في جلب الموكلين:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/clients';
      const method = selectedClient ? 'PUT' : 'POST';
      const body = selectedClient ? { ...formData, id: selectedClient.id } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: selectedClient ? 'تم التحديث' : 'تم الإضافة',
          description: selectedClient ? 'تم تحديث بيانات الموكل' : 'تم إضافة الموكل',
        });
        setDialogOpen(false);
        resetForm();
        fetchClients(search);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ في العملية', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/clients?id=${selectedClient.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الموكل' });
        setDeleteDialogOpen(false);
        setSelectedClient(null);
        fetchClients(search);
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phone: '',
      address: '',
      notes: '',
      clientType: 'natural_person',
      businessName: '',
      legalRepresentative: '',
    });
    setSelectedClient(null);
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      fullName: client.fullName || '',
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      clientType: client.clientType || 'natural_person',
      businessName: client.businessName || '',
      legalRepresentative: client.legalRepresentative || '',
    });
    setDialogOpen(true);
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
        <h1 className="text-3xl font-bold">الموكلين</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة موكل
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedClient ? 'تعديل موكل' : 'إضافة موكل'}</DialogTitle>
              <DialogDescription>أدخل بيانات الموكل (جميع الحقول اختيارية)</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* نوع الموكل */}
                <div>
                  <Label>نوع الموكل</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value) => setFormData({ ...formData, clientType: value as 'natural_person' | 'legal_entity' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="natural_person">شخص طبيعي</SelectItem>
                      <SelectItem value="legal_entity">شخص معنوي (شركة/مؤسسة)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* الاسم */}
                {formData.clientType === 'natural_person' ? (
                  <div>
                    <Label>الاسم الكامل</Label>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="الاسم الكامل للموكل"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>اسم الشركة / المؤسسة</Label>
                      <Input
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        placeholder="اسم الشركة أو المؤسسة"
                      />
                    </div>
                    <div>
                      <Label>الممثل القانوني</Label>
                      <Input
                        value={formData.legalRepresentative}
                        onChange={(e) => setFormData({ ...formData, legalRepresentative: e.target.value })}
                        placeholder="اسم الممثل القانوني (اختياري)"
                      />
                    </div>
                  </>
                )}

                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="العنوان"
                  />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">{selectedClient ? 'تحديث' : 'إضافة'}</Button>
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
            placeholder="بحث في الموكلين..."
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
                <TableHead>الاسم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>رقم الهاتف</TableHead>
                <TableHead>العنوان</TableHead>
                <TableHead>ملاحظات</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    لا يوجد موكلين
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      {client.clientType === 'legal_entity'
                        ? (client.businessName || '-')
                        : (client.fullName || '-')}
                      {client.clientType === 'legal_entity' && client.legalRepresentative && (
                        <span className="text-xs text-muted-foreground block">
                          الممثل: {client.legalRepresentative}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={client.clientType === 'legal_entity' ? 'default' : 'secondary'}>
                        {client.clientType === 'legal_entity' ? 'شخص معنوي' : 'شخص طبيعي'}
                      </Badge>
                    </TableCell>
                    <TableCell>{client.phone || '-'}</TableCell>
                    <TableCell>{client.address || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.notes || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(client)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedClient(client);
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
          {clients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              لا يوجد موكلين
            </div>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {client.clientType === 'legal_entity'
                        ? (client.businessName || '-')
                        : (client.fullName || '-')}
                    </p>
                    {client.clientType === 'legal_entity' && client.legalRepresentative && (
                      <p className="text-xs text-muted-foreground">
                        الممثل: {client.legalRepresentative}
                      </p>
                    )}
                  </div>
                  <Badge variant={client.clientType === 'legal_entity' ? 'default' : 'secondary'} className="text-xs">
                    {client.clientType === 'legal_entity' ? 'شخص معنوي' : 'شخص طبيعي'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {client.phone && <p>📞 {client.phone}</p>}
                  {client.address && <p>📍 {client.address}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(client)}
                  >
                    <Pencil className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive"
                    onClick={() => {
                      setSelectedClient(client);
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
              هل أنت متأكد من حذف الموكل "{selectedClient?.fullName}"؟
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
