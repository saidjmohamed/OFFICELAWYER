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
  MapPin, Scale, Landmark, Briefcase, Building2, Users, Gavel
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  SUPREME_COURT_CHAMBERS,
  JUDICIAL_COUNCIL_CHAMBERS,
  COURT_SECTIONS,
  WILAYAS_LIST,
  getChamberDisplayName,
} from '@/lib/judicial-constants';

// Types
interface Chamber {
  id: number;
  name: string;
  chamberType: string | null;
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
  parent?: JudicialBody | null;
  children?: JudicialBody[];
}

// Type labels and colors
const typeLabels: Record<string, string> = {
  supreme_court: 'المحكمة العليا',
  judicial_council: 'مجلس قضائي',
  court: 'محكمة',
  admin_appeal_court: 'محكمة إدارية استئنافية',
  admin_court: 'محكمة إدارية ابتدائية',
  commercial_court: 'محكمة تجارية متخصصة',
};

const typeColors: Record<string, string> = {
  supreme_court: 'bg-red-100 text-red-800 border-red-200',
  judicial_council: 'bg-blue-100 text-blue-800 border-blue-200',
  court: 'bg-green-100 text-green-800 border-green-200',
  admin_appeal_court: 'bg-orange-100 text-orange-800 border-orange-200',
  admin_court: 'bg-amber-100 text-amber-800 border-amber-200',
  commercial_court: 'bg-teal-100 text-teal-800 border-teal-200',
};

const typeIcons: Record<string, React.ElementType> = {
  supreme_court: Scale,
  judicial_council: Building2,
  court: Gavel,
  admin_appeal_court: Landmark,
  admin_court: Briefcase,
  commercial_court: Users,
};

// Room number options (1-10 or without number)
const ROOM_NUMBER_OPTIONS = [
  { value: 'none', label: 'بدون رقم' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

export function JudicialBodiesSection() {
  // State
  const [bodies, setBodies] = useState<JudicialBody[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chambersDialogOpen, setChambersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Selected items
  const [selectedBody, setSelectedBody] = useState<JudicialBody | null>(null);
  const [bodyForChambers, setBodyForChambers] = useState<JudicialBody | null>(null);
  
  // Expanded states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['supreme_court', 'normal_judiciary', 'admin_judiciary']));
  const [expandedWilayas, setExpandedWilayas] = useState<Set<string>>(new Set());
  const [expandedBodies, setExpandedBodies] = useState<Set<number>>(new Set());
  
  // Form data
  const [formData, setFormData] = useState({
    bodyType: '', // supreme_court, judicial_council, court, admin_appeal_court, admin_court, commercial_court
    wilayaId: '',
    parentId: '',
    name: '',
    selectedChambers: [] as { type: string; roomNumber: string }[],
  });
  
  const { toast } = useToast();

  // Fetch data
  const fetchData = async () => {
    try {
      const response = await fetch('/api/judicial-bodies');
      if (response.ok) {
        const data = await response.json();
        setBodies(data.flat || data || []);
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

  // Get available judicial councils for parent selection (for courts)
  const getJudicialCouncils = () => {
    if (!formData.wilayaId) return [];
    return bodies.filter(b => 
      b.type === 'judicial_council' && 
      b.wilayaNumber === parseInt(formData.wilayaId)
    );
  };

  // Get chambers based on body type
  const getChambersForType = (bodyType: string) => {
    switch (bodyType) {
      case 'supreme_court':
        return SUPREME_COURT_CHAMBERS;
      case 'judicial_council':
        return JUDICIAL_COUNCIL_CHAMBERS;
      case 'court':
        return COURT_SECTIONS;
      default:
        return [];
    }
  };

  // Check if wilaya already has a specific court type
  const isWilayaTaken = (bodyType: string, wilayaNumber: number) => {
    const typesToCheck: Record<string, string[]> = {
      admin_appeal_court: ['admin_appeal_court'],
      admin_court: ['admin_court'],
      commercial_court: ['commercial_court'],
    };
    
    const types = typesToCheck[bodyType];
    if (!types) return false;
    
    return bodies.some(b => 
      types.includes(b.type) && b.wilayaNumber === wilayaNumber
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: any = {
        name: formData.name,
        type: formData.bodyType,
      };
      
      // Add wilayaId for non-supreme court
      if (formData.bodyType !== 'supreme_court' && formData.wilayaId) {
        payload.wilayaId = parseInt(formData.wilayaId);
      }
      
      // Add parentId for courts
      if (formData.bodyType === 'court' && formData.parentId) {
        payload.parentId = parseInt(formData.parentId);
      }
      
      // Add chambers
      if (formData.selectedChambers.length > 0) {
        payload.chambers = formData.selectedChambers.map(c => ({
          chamberType: c.type,
          roomNumber: c.roomNumber && c.roomNumber !== 'none' ? parseInt(c.roomNumber) : null,
        }));
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

  // Handle delete
  const handleDelete = async () => {
    if (!selectedBody) return;

    try {
      const response = await fetch(`/api/judicial-bodies?id=${selectedBody.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الهيئة القضائية' });
        setDeleteDialogOpen(false);
        setSelectedBody(null);
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  // Handle chamber toggle
  const toggleChamber = (chamberType: string) => {
    const exists = formData.selectedChambers.find(c => c.type === chamberType);
    if (exists) {
      setFormData({
        ...formData,
        selectedChambers: formData.selectedChambers.filter(c => c.type !== chamberType),
      });
    } else {
      setFormData({
        ...formData,
        selectedChambers: [...formData.selectedChambers, { type: chamberType, roomNumber: 'none' }],
      });
    }
  };

  // Update chamber room number
  const updateChamberRoomNumber = (chamberType: string, roomNumber: string) => {
    setFormData({
      ...formData,
      selectedChambers: formData.selectedChambers.map(c =>
        c.type === chamberType ? { ...c, roomNumber } : c
      ),
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      bodyType: '',
      wilayaId: '',
      parentId: '',
      name: '',
      selectedChambers: [],
    });
    setSelectedBody(null);
  };

  // Toggle sections
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleWilaya = (wilayaKey: string) => {
    const newExpanded = new Set(expandedWilayas);
    if (newExpanded.has(wilayaKey)) {
      newExpanded.delete(wilayaKey);
    } else {
      newExpanded.add(wilayaKey);
    }
    setExpandedWilayas(newExpanded);
  };

  const toggleBody = (bodyId: number) => {
    const newExpanded = new Set(expandedBodies);
    if (newExpanded.has(bodyId)) {
      newExpanded.delete(bodyId);
    } else {
      newExpanded.add(bodyId);
    }
    setExpandedBodies(newExpanded);
  };

  // Organize bodies for display
  const getOrganizedBodies = () => {
    const supremeCourts = bodies.filter(b => b.type === 'supreme_court');
    const judicialCouncils = bodies.filter(b => b.type === 'judicial_council');
    const courts = bodies.filter(b => b.type === 'court');
    const adminAppealCourts = bodies.filter(b => b.type === 'admin_appeal_court');
    const adminCourts = bodies.filter(b => b.type === 'admin_court');
    const commercialCourts = bodies.filter(b => b.type === 'commercial_court');
    
    // Group by wilaya
    const wilayasMap = new Map<number, any>();
    
    // Add councils
    judicialCouncils.forEach(council => {
      if (council.wilayaId) {
        if (!wilayasMap.has(council.wilayaId)) {
          wilayasMap.set(council.wilayaId, {
            wilayaId: council.wilayaId,
            wilayaNumber: council.wilayaNumber,
            wilayaName: council.wilayaName,
            councils: [],
          });
        }
        wilayasMap.get(council.wilayaId).councils.push({
          ...council,
          courts: courts.filter(c => c.parentId === council.id),
        });
      }
    });
    
    // Group administrative courts by wilaya
    const adminWilayasMap = new Map<number, any>();
    [...adminAppealCourts, ...adminCourts, ...commercialCourts].forEach(court => {
      if (court.wilayaId && !adminWilayasMap.has(court.wilayaId)) {
        adminWilayasMap.set(court.wilayaId, {
          wilayaId: court.wilayaId,
          wilayaNumber: court.wilayaNumber,
          wilayaName: court.wilayaName,
          courts: [],
        });
      }
      if (court.wilayaId) {
        adminWilayasMap.get(court.wilayaId).courts.push(court);
      }
    });
    
    return {
      supremeCourts,
      normalJudiciary: Array.from(wilayasMap.values()),
      adminJudiciary: Array.from(adminWilayasMap.values()),
    };
  };

  // Render chamber item
  const renderChamber = (chamber: Chamber) => {
    const chamberName = getChamberDisplayName(chamber.name, chamber.roomNumber);
    return (
      <div
        key={chamber.id}
        className="flex items-center justify-between bg-muted/30 px-3 py-2 rounded text-sm"
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">├─</span>
          <span>{chamberName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={async () => {
            try {
              const response = await fetch(`/api/chambers?id=${chamber.id}`, { method: 'DELETE' });
              if (response.ok) {
                toast({ title: 'تم الحذف', description: 'تم حذف الغرفة/القسم' });
                fetchData();
              }
            } catch {
              toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
            }
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  // Render body item
  const renderBody = (body: JudicialBody, level: number = 0) => {
    const Icon = typeIcons[body.type] || Building2;
    const isExpanded = expandedBodies.has(body.id);
    const hasChildren = (body.children && body.children.length > 0) || 
                        (body.chambers && body.chambers.length > 0);
    
    return (
      <div key={body.id} className={cn(level > 0 && "mr-6")}>
        <div className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => toggleBody(body.id)}
              >
                <ChevronLeft className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </Button>
            )}
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{body.name}</span>
            <Badge variant="outline" className={typeColors[body.type]}>
              {typeLabels[body.type]}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setBodyForChambers(body);
                setChambersDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setSelectedBody(body);
                setFormData({
                  bodyType: body.type,
                  wilayaId: body.wilayaNumber?.toString() || '',
                  parentId: body.parentId?.toString() || '',
                  name: body.name,
                  selectedChambers: [],
                });
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setSelectedBody(body);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mr-8 py-2 space-y-1">
            {body.chambers?.map(renderChamber)}
          </div>
        )}
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

  const organized = getOrganizedBodies();

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

      {/* Supreme Court Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('supreme_court')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-red-600" />
              <CardTitle>المحكمة العليا</CardTitle>
              <Badge variant="secondary">{organized.supremeCourts.length}</Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('supreme_court') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('supreme_court') && (
          <CardContent className="pt-0">
            {organized.supremeCourts.length > 0 ? (
              organized.supremeCourts.map(body => renderBody(body))
            ) : (
              <p className="text-muted-foreground text-center py-4">لم يتم إضافة المحكمة العليا بعد</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Normal Judiciary Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('normal_judiciary')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <CardTitle>القضاء العادي</CardTitle>
              <Badge variant="secondary">{organized.normalJudiciary.length} ولاية</Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('normal_judiciary') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('normal_judiciary') && (
          <CardContent className="pt-0">
            {organized.normalJudiciary.length > 0 ? (
              <div className="space-y-2">
                {organized.normalJudiciary.map((wilaya: any) => {
                  const wilayaKey = `normal_${wilaya.wilayaId}`;
                  const isWilayaExpanded = expandedWilayas.has(wilayaKey);
                  
                  return (
                    <div key={wilayaKey} className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-950/20 cursor-pointer"
                        onClick={() => toggleWilaya(wilayaKey)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronLeft className={cn(
                            "h-4 w-4 transition-transform",
                            isWilayaExpanded && "rotate-90"
                          )} />
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{wilaya.wilayaNumber} - {wilaya.wilayaName}</span>
                          <Badge variant="outline">{wilaya.councils.length} مجلس</Badge>
                        </div>
                      </div>
                      
                      {isWilayaExpanded && (
                        <div className="p-2 space-y-2">
                          {wilaya.councils.map((council: any) => {
                            const isCouncilExpanded = expandedBodies.has(council.id);
                            
                            return (
                              <div key={council.id} className="border rounded-lg">
                                <div 
                                  className="flex items-center justify-between p-3 bg-blue-50/30 cursor-pointer"
                                  onClick={() => toggleBody(council.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronLeft className={cn(
                                      "h-4 w-4 transition-transform",
                                      isCouncilExpanded && "rotate-90"
                                    )} />
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    <span>{council.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {council.courts?.length || 0} محكمة
                                    </Badge>
                                  </div>
                                </div>
                                
                                {isCouncilExpanded && (
                                  <div className="pr-6 py-2">
                                    {council.courts?.map((court: any) => renderBody(court, 1))}
                                    {council.chambers?.map(renderChamber)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لم يتم إضافة مجالس قضائية بعد</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Administrative Judiciary Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => toggleSection('admin_judiciary')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-orange-600" />
              <CardTitle>القضاء الإداري</CardTitle>
              <Badge variant="secondary">{organized.adminJudiciary.length} ولاية</Badge>
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              expandedSections.has('admin_judiciary') && "rotate-180"
            )} />
          </div>
        </CardHeader>
        {expandedSections.has('admin_judiciary') && (
          <CardContent className="pt-0">
            {organized.adminJudiciary.length > 0 ? (
              <div className="space-y-2">
                {organized.adminJudiciary.map((wilaya: any) => {
                  const wilayaKey = `admin_${wilaya.wilayaId}`;
                  const isWilayaExpanded = expandedWilayas.has(wilayaKey);
                  
                  return (
                    <div key={wilayaKey} className="border rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 bg-orange-50/50 dark:bg-orange-950/20 cursor-pointer"
                        onClick={() => toggleWilaya(wilayaKey)}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronLeft className={cn(
                            "h-4 w-4 transition-transform",
                            isWilayaExpanded && "rotate-90"
                          )} />
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{wilaya.wilayaNumber} - {wilaya.wilayaName}</span>
                        </div>
                      </div>
                      
                      {isWilayaExpanded && (
                        <div className="p-2 space-y-2">
                          {wilaya.courts.map((court: any) => renderBody(court))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">لم يتم إضافة محاكم إدارية بعد</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBody ? 'تعديل هيئة قضائية' : 'إضافة هيئة قضائية جديدة'}</DialogTitle>
            <DialogDescription>اختر نوع الهيئة القضائية ثم املأ البيانات المطلوبة</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Body Type */}
            <div className="space-y-4">
              <h3 className="font-semibold text-primary">الخطوة 1: اختر نوع الهيئة القضائية</h3>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Supreme Court */}
                <Button
                  type="button"
                  variant={formData.bodyType === 'supreme_court' ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => setFormData({ ...formData, bodyType: 'supreme_court', wilayaId: '', parentId: '' })}
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-red-600" />
                    <div className="text-right">
                      <div className="font-medium">المحكمة العليا</div>
                      <div className="text-xs text-muted-foreground">لا تتبع أي ولاية</div>
                    </div>
                  </div>
                </Button>
                
                {/* Judicial Council */}
                <Button
                  type="button"
                  variant={formData.bodyType === 'judicial_council' ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => setFormData({ ...formData, bodyType: 'judicial_council', parentId: '' })}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <div className="text-right">
                      <div className="font-medium">مجلس قضائي</div>
                      <div className="text-xs text-muted-foreground">القضاء العادي</div>
                    </div>
                  </div>
                </Button>
                
                {/* Court */}
                <Button
                  type="button"
                  variant={formData.bodyType === 'court' ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start"
                  onClick={() => setFormData({ ...formData, bodyType: 'court' })}
                >
                  <div className="flex items-center gap-3">
                    <Gavel className="h-5 w-5 text-green-600" />
                    <div className="text-right">
                      <div className="font-medium">محكمة</div>
                      <div className="text-xs text-muted-foreground">القضاء العادي - تتبع مجلس قضائي</div>
                    </div>
                  </div>
                </Button>
                
                {/* Administrative Courts */}
                <Button
                  type="button"
                  variant={['admin_appeal_court', 'admin_court', 'commercial_court'].includes(formData.bodyType) ? 'default' : 'outline'}
                  className="h-auto p-4 justify-start col-span-2"
                  onClick={() => setFormData({ ...formData, bodyType: 'admin_appeal_court' })}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-orange-600" />
                    <div className="text-right">
                      <div className="font-medium">القضاء الإداري</div>
                      <div className="text-xs text-muted-foreground">محكمة إدارية استئنافية / ابتدائية / تجارية متخصصة</div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Step 2: Wilaya Selection (for non-supreme court) */}
            {formData.bodyType && formData.bodyType !== 'supreme_court' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">الخطوة 2: اختر الولاية</h3>
                
                <Select
                  value={formData.wilayaId}
                  onValueChange={(value) => setFormData({ ...formData, wilayaId: value, parentId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الولاية (1-58)" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-64">
                      {WILAYAS_LIST.map((wilaya) => (
                        <SelectItem 
                          key={wilaya.number} 
                          value={wilaya.number.toString()}
                          disabled={['admin_appeal_court', 'admin_court', 'commercial_court'].includes(formData.bodyType) && 
                                    isWilayaTaken(formData.bodyType, wilaya.number)}
                        >
                          {wilaya.number} - {wilaya.name}
                          {['admin_appeal_court', 'admin_court', 'commercial_court'].includes(formData.bodyType) && 
                           isWilayaTaken(formData.bodyType, wilaya.number) && ' (موجودة)'}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Administrative Court Type Selection */}
            {['admin_appeal_court', 'admin_court', 'commercial_court'].includes(formData.bodyType) && formData.wilayaId && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">الخطوة 3: اختر نوع المحكمة الإدارية</h3>
                
                <Select
                  value={formData.bodyType}
                  onValueChange={(value) => setFormData({ ...formData, bodyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المحكمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="admin_appeal_court"
                      disabled={isWilayaTaken('admin_appeal_court', parseInt(formData.wilayaId))}
                    >
                      المحكمة الإدارية الاستئنافية
                    </SelectItem>
                    <SelectItem 
                      value="admin_court"
                      disabled={isWilayaTaken('admin_court', parseInt(formData.wilayaId))}
                    >
                      المحكمة الإدارية الابتدائية
                    </SelectItem>
                    <SelectItem 
                      value="commercial_court"
                      disabled={isWilayaTaken('commercial_court', parseInt(formData.wilayaId))}
                    >
                      المحكمة التجارية المتخصصة
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Parent Council Selection (for courts) */}
            {formData.bodyType === 'court' && formData.wilayaId && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">الخطوة 3: اختر المجلس القضائي التابع له</h3>
                
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المجلس القضائي" />
                  </SelectTrigger>
                  <SelectContent>
                    {getJudicialCouncils().map((council) => (
                      <SelectItem key={council.id} value={council.id.toString()}>
                        {council.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {getJudicialCouncils().length === 0 && (
                  <p className="text-sm text-destructive">
                    لا يوجد مجالس قضائية في هذه الولاية. يجب إضافة مجلس قضائي أولاً.
                  </p>
                )}
              </div>
            )}
            
            <Separator />
            
            {/* Step 4: Name */}
            {formData.bodyType && (formData.bodyType === 'supreme_court' || formData.wilayaId) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">
                  {['supreme_court', 'judicial_council'].includes(formData.bodyType) 
                    ? 'الخطوة ' + (formData.bodyType === 'supreme_court' ? '2' : '3') + ': اسم الهيئة'
                    : 'الخطوة 4: اسم المحكمة'}
                </h3>
                
                <div>
                  <Label>اسم الهيئة القضائية</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      formData.bodyType === 'supreme_court' 
                        ? 'المحكمة العليا' 
                        : formData.bodyType === 'judicial_council'
                        ? 'المجلس القضائي لولاية...'
                        : formData.bodyType === 'admin_appeal_court'
                        ? 'المحكمة الإدارية الاستئنافية لولاية...'
                        : formData.bodyType === 'admin_court'
                        ? 'المحكمة الإدارية لولاية...'
                        : formData.bodyType === 'commercial_court'
                        ? 'المحكمة التجارية المتخصصة لولاية...'
                        : 'محكمة...'
                    }
                  />
                </div>
              </div>
            )}
            
            {/* Step 5: Chambers Selection */}
            {['supreme_court', 'judicial_council', 'court'].includes(formData.bodyType) && 
             formData.name && (
              <div className="space-y-4">
                <h3 className="font-semibold text-primary">
                  {['supreme_court', 'judicial_council'].includes(formData.bodyType) 
                    ? 'الخطوة ' + (formData.bodyType === 'supreme_court' ? '3' : '4') 
                    : 'الخطوة 5'}: اختر الغرف/الأقسام
                </h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {getChambersForType(formData.bodyType).map((chamber) => {
                    const isSelected = formData.selectedChambers.some(c => c.type === chamber.id);
                    const selectedChamber = formData.selectedChambers.find(c => c.type === chamber.id);
                    
                    return (
                      <div 
                        key={chamber.id}
                        className={cn(
                          "p-3 border rounded-lg transition-all cursor-pointer",
                          isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"
                        )}
                        onClick={() => toggleChamber(chamber.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center",
                              isSelected && "bg-primary border-primary"
                            )}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 12 12">
                                  <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none"/>
                                </svg>
                              )}
                            </div>
                            <span className="font-medium">{chamber.name}</span>
                          </div>
                          
                          {isSelected && (
                            <Select
                              value={selectedChamber?.roomNumber || ''}
                              onValueChange={(value) => updateChamberRoomNumber(chamber.id, value)}
                            >
                              <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="الرقم" />
                              </SelectTrigger>
                              <SelectContent>
                                {ROOM_NUMBER_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={
                  !formData.bodyType || 
                  !formData.name ||
                  (formData.bodyType !== 'supreme_court' && !formData.wilayaId) ||
                  (formData.bodyType === 'court' && !formData.parentId)
                }
              >
                {selectedBody ? 'تحديث' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Chamber Dialog */}
      <Dialog open={chambersDialogOpen} onOpenChange={setChambersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة غرفة / قسم</DialogTitle>
            <DialogDescription>إضافة غرفة أو قسم إلى: {bodyForChambers?.name}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {getChambersForType(bodyForChambers?.type || '').map((chamber) => {
              const existingChamber = bodyForChambers?.chambers.find(c => c.chamberType === chamber.id);
              
              return (
                <div key={chamber.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{chamber.name}</span>
                  {existingChamber ? (
                    <Badge variant="secondary">مضاف {existingChamber.roomNumber ? `رقم ${existingChamber.roomNumber}` : ''}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/chambers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: chamber.name,
                              chamberType: chamber.id,
                              roomNumber: null,
                              judicialBodyId: bodyForChambers?.id,
                            }),
                          });
                          
                          if (response.ok) {
                            toast({ title: 'تم الإضافة', description: 'تم إضافة الغرفة/القسم' });
                            fetchData();
                          }
                        } catch {
                          toast({ title: 'خطأ', description: 'حدث خطأ في الإضافة', variant: 'destructive' });
                        }
                      }}
                    >
                      إضافة
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
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
