'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronLeft,
  MapPin, Scale, Landmark, Briefcase, Building2, Users,
  FolderOpen, Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ==================== أنواع الغرف والأقسام ====================

// غرف المحكمة العليا
const SUPREME_COURT_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', requireNumber: true },
  { id: 'real_estate', name: 'الغرفة العقارية', requireNumber: false },
  { id: 'family_inheritance', name: 'غرفة شؤون الأسرة و المواريث', requireNumber: false },
  { id: 'commercial_maritime', name: 'الغرفة التجارية و البحرية', requireNumber: false },
  { id: 'social', name: 'الغرفة الإجتماعية', requireNumber: false },
  { id: 'criminal', name: 'الغرفة الجنائية', requireNumber: false },
  { id: 'misdemeanors', name: 'غرفة الجنح و المخالفات', requireNumber: false },
];

// غرف المجلس القضائي
const JUDICIAL_COUNCIL_CHAMBERS = [
  { id: 'civil', name: 'الغرفة المدنية', requireNumber: false },
  { id: 'penal', name: 'الغرفة الجزائية', requireNumber: false },
  { id: 'indictment', name: 'غرفة الاتهام', requireNumber: false },
  { id: 'urgent', name: 'الغرفة الاستعجالية', requireNumber: false },
  { id: 'family', name: 'غرفة شؤون الأسرة', requireNumber: false },
  { id: 'juvenile', name: 'غرفة الأحداث', requireNumber: false },
  { id: 'social', name: 'الغرفة الاجتماعية', requireNumber: false },
  { id: 'real_estate', name: 'الغرفة العقارية', requireNumber: false },
  { id: 'maritime', name: 'الغرفة البحرية', requireNumber: false },
  { id: 'commercial', name: 'الغرفة التجارية', requireNumber: false },
];

// أقسام المحكمة
const COURT_SECTIONS = [
  { id: 'civil', name: 'القسم المدني', requireNumber: false },
  { id: 'misdemeanors', name: 'قسم الجنح', requireNumber: false },
  { id: 'contraventions', name: 'قسم المخالفات', requireNumber: false },
  { id: 'urgent', name: 'القسم الاستعجالي', requireNumber: false },
  { id: 'family', name: 'قسم شؤون الأسرة', requireNumber: false },
  { id: 'juvenile', name: 'قسم الأحداث', requireNumber: false },
  { id: 'social', name: 'القسم الاجتماعي', requireNumber: false },
  { id: 'real_estate', name: 'القسم العقاري', requireNumber: false },
  { id: 'maritime', name: 'القسم البحري', requireNumber: false },
  { id: 'commercial', name: 'القسم التجاري', requireNumber: false },
];

// خيارات أرقام الغرف
const ROOM_NUMBER_OPTIONS = [
  { value: '', label: 'بدون رقم' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

// ==================== أنواع TypeScript ====================

interface Chamber {
  id: number;
  name: string;
  chamberType: string;
  roomNumber: number | null;
  judicialBodyId: number;
}

interface JudicialBody {
  id: number;
  name: string;
  type: string;
  wilayaId: number | null;
  parentId: number | null;
  wilayaName?: string | null;
  wilayaNumber?: number | null;
  chambers: Chamber[];
}

interface Wilaya {
  id: number;
  number: number;
  name: string;
}

// ==================== المكون الرئيسي ====================

export function JudicialBodiesSection() {
  const [bodies, setBodies] = useState<JudicialBody[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chambersDialogOpen, setChambersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedBody, setSelectedBody] = useState<JudicialBody | null>(null);
  const [selectedBodyForChambers, setSelectedBodyForChambers] = useState<JudicialBody | null>(null);
  
  // Expanded states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedWilayas, setExpandedWilayas] = useState<Set<string>>(new Set());
  const [expandedBodies, setExpandedBodies] = useState<Set<number>>(new Set());
  
  // Form data for body
  const [formData, setFormData] = useState({
    judiciaryType: '', // supreme_court, normal_judiciary, administrative_judiciary
    bodyType: '', // judicial_council, court, admin_appeal_court, etc.
    wilayaId: '',
    parentId: '',
    name: '',
  });
  
  // Form data for chambers (checkboxes + room numbers)
  const [chambersFormData, setChambersFormData] = useState<Record<string, { enabled: boolean; roomNumber: string }>>({});
  
  const { toast } = useToast();

  // ==================== Data Fetching ====================

  const fetchData = async () => {
    try {
      const [bodiesRes, wilayasRes] = await Promise.all([
        fetch('/api/judicial-bodies'),
        fetch('/api/wilayas'),
      ]);

      if (bodiesRes.ok) {
        const data = await bodiesRes.json();
        setBodies(data.flat || data);
      }
      if (wilayasRes.ok) {
        setWilayas(await wilayasRes.json());
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==================== Form Handlers ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        name: formData.name,
        type: formData.bodyType,
      };

      if (formData.wilayaId) {
        payload.wilayaId = parseInt(formData.wilayaId);
      }
      if (formData.parentId) {
        payload.parentId = parseInt(formData.parentId);
      }

      const url = selectedBody ? '/api/judicial-bodies' : '/api/judicial-bodies';
      const method = selectedBody ? 'PUT' : 'POST';
      
      if (selectedBody) {
        payload.id = selectedBody.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: selectedBody ? 'تم التحديث' : 'تم الإضافة',
          description: selectedBody ? 'تم تحديث الهيئة القضائية' : 'تم إضافة الهيئة القضائية',
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في العملية', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedBody) return;

    try {
      const response = await fetch(`/api/judicial-bodies?id=${selectedBody.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الهيئة القضائية' });
        setDeleteDialogOpen(false);
        setSelectedBody(null);
        fetchData();
      } else {
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const handleSaveChambers = async () => {
    if (!selectedBodyForChambers) return;

    try {
      // بناء قائمة الغرف المفعلة
      const chamberDefs = selectedBodyForChambers.type === 'supreme_court' 
        ? SUPREME_COURT_CHAMBERS 
        : selectedBodyForChambers.type === 'judicial_council'
        ? JUDICIAL_COUNCIL_CHAMBERS
        : COURT_SECTIONS;

      const enabledChambers = Object.entries(chambersFormData)
        .filter(([_, data]) => data.enabled)
        .map(([chamberType, data]) => ({
          chamberType,
          roomNumber: data.roomNumber ? parseInt(data.roomNumber) : null,
        }));

      const response = await fetch('/api/chambers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judicialBodyId: selectedBodyForChambers.id,
          chambers: enabledChambers,
          bodyType: selectedBodyForChambers.type,
        }),
      });

      if (response.ok) {
        toast({ title: 'تم الحفظ', description: 'تم حفظ الغرف والأقسام' });
        setChambersDialogOpen(false);
        fetchData();
      } else {
        const data = await response.json();
        toast({ title: 'خطأ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحفظ', variant: 'destructive' });
    }
  };

  const handleDeleteChamber = async (chamberId: number) => {
    try {
      const response = await fetch(`/api/chambers?id=${chamberId}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الغرفة/القسم' });
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      judiciaryType: '',
      bodyType: '',
      wilayaId: '',
      parentId: '',
      name: '',
    });
    setSelectedBody(null);
  };

  // ==================== Helpers ====================

  const getCouncils = () => {
    return bodies.filter(b => b.type === 'judicial_council');
  };

  const getCouncilsForWilaya = (wilayaId: number) => {
    return bodies.filter(b => b.type === 'judicial_council' && b.wilayaId === wilayaId);
  };

  const getCourtsForCouncil = (councilId: number) => {
    return bodies.filter(b => b.type === 'court' && b.parentId === councilId);
  };

  const getBodiesByType = (type: string) => {
    return bodies.filter(b => b.type === type);
  };

  const getBodiesByWilayaAndType = (wilayaId: number, type: string) => {
    return bodies.filter(b => b.wilayaId === wilayaId && b.type === type);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleWilaya = (key: string) => {
    const newExpanded = new Set(expandedWilayas);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedWilayas(newExpanded);
  };

  const toggleBody = (id: number) => {
    const newExpanded = new Set(expandedBodies);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedBodies(newExpanded);
  };

  const openChambersDialog = (body: JudicialBody) => {
    setSelectedBodyForChambers(body);
    
    // تهيئة بيانات النموذج من الغرف الموجودة
    const chamberDefs = body.type === 'supreme_court' 
      ? SUPREME_COURT_CHAMBERS 
      : body.type === 'judicial_council'
      ? JUDICIAL_COUNCIL_CHAMBERS
      : COURT_SECTIONS;
    
    const initialData: Record<string, { enabled: boolean; roomNumber: string }> = {};
    chamberDefs.forEach(def => {
      const existing = body.chambers.find(c => c.chamberType === def.id);
      initialData[def.id] = {
        enabled: !!existing,
        roomNumber: existing?.roomNumber?.toString() || '',
      };
    });
    setChambersFormData(initialData);
    setChambersDialogOpen(true);
  };

  const getChamberDisplayName = (chamber: Chamber, bodyType: string) => {
    const chamberDefs = bodyType === 'supreme_court' 
      ? SUPREME_COURT_CHAMBERS 
      : bodyType === 'judicial_council'
      ? JUDICIAL_COUNCIL_CHAMBERS
      : COURT_SECTIONS;
    
    const def = chamberDefs.find(d => d.id === chamber.chamberType);
    const name = def?.name || chamber.name;
    return chamber.roomNumber ? `${name} رقم ${chamber.roomNumber}` : name;
  };

  // ==================== Render Helpers ====================

  const renderBodyItem = (body: JudicialBody, level: number = 0) => {
    const isExpanded = expandedBodies.has(body.id);
    const hasChildren = body.type === 'judicial_council' && getCourtsForCouncil(body.id).length > 0;
    
    const typeIcon: Record<string, React.ElementType> = {
      judicial_council: Building2,
      court: Building2,
      supreme_court: Scale,
      admin_appeal_court: Briefcase,
      admin_court: Briefcase,
      commercial_court: Users,
    };
    
    const Icon = typeIcon[body.type] || Building2;
    
    const typeLabels: Record<string, string> = {
      judicial_council: 'مجلس قضائي',
      court: 'محكمة',
      supreme_court: 'المحكمة العليا',
      admin_appeal_court: 'محكمة إدارية استئنافية',
      admin_court: 'محكمة إدارية ابتدائية',
      commercial_court: 'محكمة تجارية متخصصة',
    };

    return (
      <div key={body.id} className={cn("border rounded-lg mb-2", level > 0 && "mr-6")}>
        <div 
          className={cn(
            "flex items-center justify-between p-3 hover:bg-muted/30 transition-colors cursor-pointer",
            level > 0 && "bg-muted/10"
          )}
          onClick={() => hasChildren && toggleBody(body.id)}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <ChevronLeft className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-90"
              )} />
            )}
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{body.name}</span>
            <Badge variant="outline" className="text-xs">
              {typeLabels[body.type]}
            </Badge>
          </div>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openChambersDialog(body)}
              title="إدارة الغرف/الأقسام"
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedBody(body);
                setFormData({
                  judiciaryType: body.type === 'supreme_court' ? 'supreme_court' : 
                                 ['judicial_council', 'court'].includes(body.type) ? 'normal_judiciary' : 'administrative_judiciary',
                  bodyType: body.type,
                  wilayaId: body.wilayaId?.toString() || '',
                  parentId: body.parentId?.toString() || '',
                  name: body.name,
                });
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedBody(body);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        
        {/* عرض الغرف */}
        {body.chambers.length > 0 && (
          <div className="px-4 py-2 bg-muted/20 border-t">
            <div className="flex flex-wrap gap-2">
              {body.chambers.map(chamber => (
                <Badge 
                  key={chamber.id} 
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <FolderOpen className="h-3 w-3" />
                  {getChamberDisplayName(chamber, body.type)}
                  <button
                    className="mr-1 hover:text-destructive"
                    onClick={() => handleDeleteChamber(chamber.id)}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* عرض المحاكم تحت المجلس */}
        {isExpanded && hasChildren && (
          <div className="p-2 border-t">
            {getCourtsForCouncil(body.id).map(court => renderBodyItem(court, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // ==================== Main Render ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">الهيئات القضائية</h1>
        <Button onClick={() => {
          resetForm();
          setDialogOpen(true);
        }}>
          <Plus className="ml-2 h-4 w-4" />
          إضافة هيئة قضائية
        </Button>
      </div>

      {/* 1. المحكمة العليا */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('supreme_court')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-red-600" />
              <CardTitle>المحكمة العليا</CardTitle>
              <Badge variant="secondary">
                {getBodiesByType('supreme_court').length}
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('supreme_court') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('supreme_court') && (
          <CardContent className="pt-0">
            {getBodiesByType('supreme_court').length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                لم يتم إضافة المحكمة العليا بعد
              </p>
            ) : (
              getBodiesByType('supreme_court').map(body => renderBodyItem(body))
            )}
          </CardContent>
        )}
      </Card>

      {/* 2. القضاء العادي */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('normal_judiciary')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle>القضاء العادي</CardTitle>
              <Badge variant="secondary">
                {getBodiesByType('judicial_council').length} مجلس • {getBodiesByType('court').length} محكمة
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('normal_judiciary') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('normal_judiciary') && (
          <CardContent className="pt-0">
            {wilayas.map(wilaya => {
              const councils = getCouncilsForWilaya(wilaya.id);
              if (councils.length === 0) return null;
              
              const key = `normal_${wilaya.id}`;
              const isExpanded = expandedWilayas.has(key);
              
              return (
                <div key={key} className="border rounded-lg mb-2">
                  <div 
                    className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer"
                    onClick={() => toggleWilaya(key)}
                  >
                    <ChevronLeft className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{wilaya.number} - {wilaya.name}</span>
                    <Badge variant="outline">{councils.length} مجلس</Badge>
                  </div>
                  {isExpanded && (
                    <div className="p-2 space-y-2 border-t">
                      {councils.map(council => renderBodyItem(council))}
                    </div>
                  )}
                </div>
              );
            })}
            {getBodiesByType('judicial_council').length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                لم يتم إضافة مجالس قضائية بعد
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* 3. القضاء الإداري */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('administrative_judiciary')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-orange-600" />
              <CardTitle>القضاء الإداري</CardTitle>
              <Badge variant="secondary">
                {getBodiesByType('admin_appeal_court').length + getBodiesByType('admin_court').length + getBodiesByType('commercial_court').length}
              </Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('administrative_judiciary') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('administrative_judiciary') && (
          <CardContent className="pt-0">
            {wilayas.map(wilaya => {
              const adminAppealCourts = getBodiesByWilayaAndType(wilaya.id, 'admin_appeal_court');
              const adminCourts = getBodiesByWilayaAndType(wilaya.id, 'admin_court');
              const commercialCourts = getBodiesByWilayaAndType(wilaya.id, 'commercial_court');
              
              if (adminAppealCourts.length === 0 && adminCourts.length === 0 && commercialCourts.length === 0) {
                return null;
              }
              
              const key = `admin_${wilaya.id}`;
              const isExpanded = expandedWilayas.has(key);
              
              return (
                <div key={key} className="border rounded-lg mb-2">
                  <div 
                    className="flex items-center gap-3 p-3 bg-orange-50/50 dark:bg-orange-950/20 cursor-pointer"
                    onClick={() => toggleWilaya(key)}
                  >
                    <ChevronLeft className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{wilaya.number} - {wilaya.name}</span>
                  </div>
                  {isExpanded && (
                    <div className="p-2 space-y-2 border-t">
                      {adminAppealCourts.map(body => renderBodyItem(body))}
                      {adminCourts.map(body => renderBodyItem(body))}
                      {commercialCourts.map(body => renderBodyItem(body))}
                    </div>
                  )}
                </div>
              );
            })}
            {getBodiesByType('admin_appeal_court').length === 0 && 
             getBodiesByType('admin_court').length === 0 && 
             getBodiesByType('commercial_court').length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                لم يتم إضافة محاكم إدارية بعد
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedBody ? 'تعديل هيئة قضائية' : 'إضافة هيئة قضائية جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* اختيار نوع القضاء */}
            <div>
              <Label>نوع القضاء</Label>
              <Select
                value={formData.judiciaryType}
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  judiciaryType: value, 
                  bodyType: '',
                  wilayaId: '',
                  parentId: '',
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع القضاء" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supreme_court">
                    <div className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      المحكمة العليا
                    </div>
                  </SelectItem>
                  <SelectItem value="normal_judiciary">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      القضاء العادي (مجالس ومحاكم)
                    </div>
                  </SelectItem>
                  <SelectItem value="administrative_judiciary">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      القضاء الإداري
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* القضاء العادي */}
            {formData.judiciaryType === 'normal_judiciary' && (
              <>
                <div>
                  <Label>نوع الهيئة</Label>
                  <Select
                    value={formData.bodyType}
                    onValueChange={(value) => setFormData({ ...formData, bodyType: value, parentId: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="judicial_council">مجلس قضائي</SelectItem>
                      <SelectItem value="court">محكمة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>الولاية</Label>
                  <Select
                    value={formData.wilayaId}
                    onValueChange={(value) => setFormData({ ...formData, wilayaId: value, parentId: '' })}
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

                {formData.bodyType === 'court' && formData.wilayaId && (
                  <div>
                    <Label>المجلس القضائي التابع له</Label>
                    <Select
                      value={formData.parentId}
                      onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المجلس القضائي" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCouncilsForWilaya(parseInt(formData.wilayaId)).map((council) => (
                          <SelectItem key={council.id} value={council.id.toString()}>
                            {council.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {getCouncilsForWilaya(parseInt(formData.wilayaId)).length === 0 && (
                      <p className="text-sm text-destructive mt-1">
                        يجب إضافة مجلس قضائي في هذه الولاية أولاً
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* القضاء الإداري */}
            {formData.judiciaryType === 'administrative_judiciary' && (
              <>
                <div>
                  <Label>نوع المحكمة</Label>
                  <Select
                    value={formData.bodyType}
                    onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_appeal_court">محكمة إدارية استئنافية</SelectItem>
                      <SelectItem value="admin_court">محكمة إدارية ابتدائية</SelectItem>
                      <SelectItem value="commercial_court">محكمة تجارية متخصصة</SelectItem>
                    </SelectContent>
                  </Select>
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
              </>
            )}

            {/* اسم الهيئة */}
            {formData.judiciaryType && (
              <div>
                <Label>اسم الهيئة القضائية</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    formData.judiciaryType === 'supreme_court' 
                      ? 'المحكمة العليا' 
                      : formData.bodyType === 'judicial_council'
                      ? 'مجلس قضائي...'
                      : formData.bodyType === 'court'
                      ? 'محكمة...'
                      : 'اسم المحكمة...'
                  }
                  required
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={!formData.judiciaryType || !formData.name}>
                {selectedBody ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Chambers Dialog */}
      <Dialog open={chambersDialogOpen} onOpenChange={setChambersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              إدارة {selectedBodyForChambers?.type === 'court' ? 'الأقسام' : 'الغرف'}
            </DialogTitle>
            <DialogDescription>
              {selectedBodyForChambers?.name} - اختر الغرف/الأقسام وأرقامها
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {(selectedBodyForChambers?.type === 'supreme_court' 
                ? SUPREME_COURT_CHAMBERS 
                : selectedBodyForChambers?.type === 'judicial_council'
                ? JUDICIAL_COUNCIL_CHAMBERS
                : COURT_SECTIONS
              )?.map((chamberDef) => {
                const data = chambersFormData[chamberDef.id] || { enabled: false, roomNumber: '' };
                
                return (
                  <div 
                    key={chamberDef.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-colors",
                      data.enabled ? "bg-primary/5 border-primary/30" : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={data.enabled}
                        onChange={(e) => setChambersFormData(prev => ({
                          ...prev,
                          [chamberDef.id]: { ...prev[chamberDef.id] || { roomNumber: '' }, enabled: e.target.checked }
                        }))}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <Label className="cursor-pointer font-medium">
                        {chamberDef.name}
                      </Label>
                    </div>
                    
                    {data.enabled && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground">رقم الغرفة:</Label>
                        <Select
                          value={data.roomNumber}
                          onValueChange={(value) => setChambersFormData(prev => ({
                            ...prev,
                            [chamberDef.id]: { ...prev[chamberDef.id], roomNumber: value }
                          }))}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="اختر" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROOM_NUMBER_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChambersDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveChambers}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{selectedBody?.name}"؟ سيتم حذف جميع الغرف والأقسام المرتبطة به.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
