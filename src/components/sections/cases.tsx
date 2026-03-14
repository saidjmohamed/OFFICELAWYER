'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  X,
  UserPlus,
  UserMinus,
  Eye,
  FolderOpen,
  Info,
  CalendarDays,
  FileText,
  Receipt,
  Upload,
  Download,
  File,
  FileCheck,
  Scale,
  FileQuestion,
  DollarSign,
  Save,
  AlertCircle,
  LayoutGrid,
  List,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Archive,
  Printer,
  Users,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// أنواع القضايا
const CASE_TYPES = [
  { value: 'opening_petition', label: 'عريضة افتتاحية' },
  { value: 'opposition', label: 'معارضة' },
  { value: 'appeal', label: 'استئناف' },
  { value: 'cassation', label: 'طعن بالنقض' },
];

// أسماء أنواع القضايا بالعربية
const CASE_TYPE_LABELS: Record<string, string> = {
  opening_petition: 'عريضة افتتاحية',
  opposition: 'معارضة',
  appeal: 'استئناف',
  cassation: 'طعن بالنقض',
  new_claim: 'دعوى جديدة',
};

// أسماء الغرف والأقسام بالعربية
const CHAMBER_LABELS: Record<string, string> = {
  civil: 'الغرفة المدنية',
  real_estate: 'الغرفة العقارية',
  family_inheritance: 'غرفة شؤون الأسرة و المواريث',
  commercial_maritime: 'الغرفة التجارية و البحرية',
  social: 'الغرفة الإجتماعية',
  criminal: 'الغرفة الجنائية',
  misdemeanors: 'غرفة الجنح و المخالفات',
  penal: 'الغرفة الجزائية',
  indictment: 'غرفة الاتهام',
  urgent: 'الغرفة الاستعجالية',
  family: 'غرفة شؤون الأسرة',
  juvenile: 'غرفة الأحداث',
  maritime: 'الغرفة البحرية',
  commercial: 'الغرفة التجارية',
  contraventions: 'قسم المخالفات',
  violation: 'قسم المخالفات',
  accusation: 'غرفة الاتهام',
  misdemeanor: 'غرفة الجنح',
};

// أرقام الغرف
const ROOM_NUMBERS = [
  { value: 'none', label: 'بدون رقم' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `رقم ${i + 1}` })),
];

// حالات القضية
const statusLabels: Record<string, string> = {
  active: 'نشطة',
  adjourned: 'مؤجلة',
  judged: 'محكوم فيها',
  closed: 'مغلقة',
  archived: 'مؤرشفة',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  adjourned: 'bg-yellow-100 text-yellow-800',
  judged: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  archived: 'bg-gray-100 text-gray-500',
};

// تحويل حجم الملف إلى صيغة مقروءة
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 بايت';
  const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// تنسيق التاريخ
function formatDate(date: Date | string | number | null): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ar-DZ');
}

interface Case {
  id: number;
  caseNumber: string | null;
  caseType: string | null;
  subject: string | null;
  status: string;
  fees: number | null;
  registrationDate: number | null;
  firstSessionDate: number | null;
  judicialBody: string | null;
  chamber: string | null;
  wilaya: string | null;
  originalCaseNumber: string | null;
  originalCourt: string | null;
  judgmentNumber: string | null;
  judgmentDate: number | null;
  issuingCourt: string | null;
  judicialBodyId?: number;
  chamberId?: number;
  wilayaId?: number;
  notes?: string | null;
}

interface JudicialBody {
  id: number;
  name: string;
  type: string;
  wilayaId: number;
  chambers: { id: number; name: string; chamberType?: string; roomNumber?: number | null }[];
}

interface Wilaya {
  id: number;
  number: number;
  name: string;
}

interface Client {
  id: number;
  fullName: string | null;
}

interface Lawyer {
  id: number;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  organization: string | null;
}

interface CaseParty {
  id?: number;
  role: 'plaintiff' | 'defendant';
  clientId?: number;
  opponentFirstName?: string;
  opponentLastName?: string;
  opponentPhone?: string;
  opponentAddress?: string;
  description?: string;
  clientDescription?: string;
  lawyerId?: number;
  lawyerDescription?: string;
}

// واجهة الجلسة
interface Session {
  id: number;
  caseId: number;
  sessionDate: number | null;
  adjournmentReason: string | null;
  decision: string | null;
  rulingText: string | null;
  notes: string | null;
}

// واجهة ملف القضية
interface CaseFile {
  id: number;
  caseId: number;
  fileName: string;
  originalName: string;
  description: string | null; // الاسم المخصص يُخزن هنا
  mimeType: string | null;
  fileSize: number | null;
}

// واجهة مصروف القضية
interface CaseExpense {
  id: number;
  caseId: number;
  description: string;
  amount: number;
  expenseDate: number | null;
  notes: string | null;
}

export function CasesSection() {
  const [cases, setCases] = useState<Case[]>([]);
  const [judicialBodies, setJudicialBodies] = useState<JudicialBody[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped'); // وضع العرض
  
  // حالة تفاصيل القضية
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCase, setDetailsCase] = useState<Case | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [expenses, setExpenses] = useState<CaseExpense[]>([]);
  const [caseParties, setCaseParties] = useState<(CaseParty & { clientName?: string; lawyerName?: string })[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  
  // حالة إضافة/تعديل جلسة
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: '',
    adjournmentReason: '',
    decision: '',
    rulingText: '',
    notes: '',
  });
  
  // حالة إضافة/تعديل مصروف
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CaseExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    expenseDate: '',
    notes: '',
  });
  
  // حالة رفع الملفات
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadForm, setFileUploadForm] = useState({
    customName: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // حالة تعديل المعلومات الأساسية
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);
  const [basicInfoForm, setBasicInfoForm] = useState({
    caseNumber: '',
    caseType: 'opening_petition',
    status: 'active',
    fees: '',
    subject: '',
    notes: '',
  });
  
  const [formData, setFormData] = useState({
    caseNumber: '',
    caseType: 'opening_petition',
    judicialBodyId: '',
    chamberId: '',
    roomNumber: 'none',
    wilayaId: '',
    registrationDate: '',
    firstSessionDate: '',
    status: 'active',
    fees: '',
    subject: '',
    notes: '',
    judgmentNumber: '',
    judgmentDate: '',
    issuingCourt: '',
    originalCaseNumber: '',
    originalCourt: '',
    originalJudgmentDate: '',
    councilDecisionDate: '',
    councilName: '',
    parties: [] as CaseParty[],
  });
  
  // حالة إضافة موكل جديد من فورم القضية
  const [newClientDialogOpen, setNewClientDialogOpen] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    clientType: 'natural_person' as 'natural_person' | 'legal_entity',
    businessName: '',
    legalRepresentative: '',
  });
  const [addingClient, setAddingClient] = useState(false);
  
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [casesRes, bodiesRes, wilayasRes, clientsRes, lawyersRes] = await Promise.all([
        fetch(`/api/cases?${statusFilter !== 'all' ? `status=${statusFilter}` : ''}${search ? `${statusFilter !== 'all' ? '&' : ''}search=${encodeURIComponent(search)}` : ''}`, { credentials: 'include' }),
        fetch('/api/judicial-bodies', { credentials: 'include' }),
        fetch('/api/wilayas', { credentials: 'include' }),
        fetch('/api/clients', { credentials: 'include' }),
        fetch('/api/lawyers', { credentials: 'include' }),
      ]);

      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.data || data);
      }
      if (bodiesRes.ok) {
        const bodiesData = await bodiesRes.json();
        setJudicialBodies(bodiesData.flat || bodiesData || []);
      }
      if (wilayasRes.ok) setWilayas(await wilayasRes.json());
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.data || data);
      }
      if (lawyersRes.ok) {
        const data = await lawyersRes.json();
        setLawyers(data.data || data);
      }
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  // جلب تفاصيل القضية
  const fetchCaseDetails = async (caseId: number) => {
    setDetailsLoading(true);
    try {
      const [sessionsRes, filesRes, expensesRes, caseDetailsRes] = await Promise.all([
        fetch(`/api/sessions?caseId=${caseId}`, { credentials: 'include' }),
        fetch(`/api/case-files?caseId=${caseId}`, { credentials: 'include' }),
        fetch(`/api/case-expenses?caseId=${caseId}`, { credentials: 'include' }),
        fetch(`/api/cases?id=${caseId}`, { credentials: 'include' }),
      ]);

      if (sessionsRes.ok) {
        setSessions(await sessionsRes.json());
      }
      if (filesRes.ok) {
        setCaseFiles(await filesRes.json());
      }
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData.data || expensesData);
        setTotalExpenses(expensesData.total || 0);
      }
      if (caseDetailsRes.ok) {
        const caseDetails = await caseDetailsRes.json();
        // جلب الأطراف مع أسماء الموكلين والمحامين
        if (caseDetails.parties && Array.isArray(caseDetails.parties)) {
          const partiesWithNames = caseDetails.parties.map((party: any) => {
            const client = clients.find(c => c.id === party.clientId);
            const lawyer = lawyers.find(l => l.id === party.lawyerId);
            return {
              ...party,
              clientName: client?.fullName || null,
              lawyerName: lawyer ? `${lawyer.firstName || ''} ${lawyer.lastName || ''}`.trim() : null,
            };
          });
          setCaseParties(partiesWithNames);
        } else {
          setCaseParties([]);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب تفاصيل القضية:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // فتح نافذة التفاصيل
  const openDetailsDialog = async (caseItem: Case) => {
    setDetailsCase(caseItem);
    setBasicInfoForm({
      caseNumber: caseItem.caseNumber || '',
      caseType: caseItem.caseType || 'opening_petition',
      status: caseItem.status || 'active',
      fees: caseItem.fees?.toString() || '',
      subject: caseItem.subject || '',
      notes: caseItem.notes || '',
    });
    setEditingBasicInfo(false);
    setDetailsOpen(true);
    await fetchCaseDetails(caseItem.id);
  };

  // تحديث المعلومات الأساسية
  const handleUpdateBasicInfo = async () => {
    if (!detailsCase) return;
    
    try {
      const response = await fetch('/api/cases', {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: detailsCase.id,
          ...basicInfoForm,
          fees: basicInfoForm.fees ? parseFloat(basicInfoForm.fees) : null,
        }),
      });

      if (response.ok) {
        toast({ title: 'تم التحديث', description: 'تم تحديث معلومات القضية' });
        setEditingBasicInfo(false);
        fetchData();
        const updatedCase = await response.json();
        setDetailsCase(updatedCase);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في التحديث', variant: 'destructive' });
    }
  };

  // إضافة/تعديل جلسة
  const handleSaveSession = async () => {
    if (!detailsCase) return;
    
    try {
      const url = '/api/sessions';
      const method = editingSession ? 'PUT' : 'POST';
      const body = editingSession
        ? { id: editingSession.id, ...sessionForm }
        : { caseId: detailsCase.id, ...sessionForm };

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: 'تم الحفظ', description: editingSession ? 'تم تحديث الجلسة' : 'تم إضافة الجلسة' });
        setSessionFormOpen(false);
        resetSessionForm();
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحفظ', variant: 'destructive' });
    }
  };

  // حذف جلسة
  const handleDeleteSession = async (sessionId: number) => {
    if (!detailsCase) return;
    
    try {
      const response = await fetch(`/api/sessions?id=${sessionId}`, {
        credentials: 'include', method: 'DELETE' });
      
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الجلسة' });
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  // فتح نافذة تعديل جلسة
  const openEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionForm({
      sessionDate: session.sessionDate ? new Date(session.sessionDate).toISOString().split('T')[0] : '',
      adjournmentReason: session.adjournmentReason || '',
      decision: session.decision || '',
      rulingText: session.rulingText || '',
      notes: session.notes || '',
    });
    setSessionFormOpen(true);
  };

  // إعادة تعيين نموذج الجلسة
  const resetSessionForm = () => {
    setSessionForm({
      sessionDate: '',
      adjournmentReason: '',
      decision: '',
      rulingText: '',
      notes: '',
    });
    setEditingSession(null);
  };

  // رفع ملف
  const handleFileUpload = async (file: File) => {
    if (!detailsCase) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', detailsCase.id.toString());
      // استخدام الاسم المخصص أو اسم الملف الأصلي
      const customName = fileUploadForm.customName.trim() || file.name;
      formData.append('customName', customName);

      const response = await fetch('/api/case-files', {
        credentials: 'include',
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({ title: 'تم الرفع', description: 'تم رفع الملف بنجاح' });
        setFileUploadForm({ customName: '' });
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في رفع الملف', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  // تحميل ملف
  const handleDownloadFile = (file: CaseFile) => {
    window.open(`/api/case-files?id=${file.id}&download=true`, '_blank');
  };

  // حذف ملف
  const handleDeleteFile = async (fileId: number) => {
    if (!detailsCase) return;
    
    try {
      const response = await fetch(`/api/case-files?id=${fileId}`, {
        credentials: 'include', method: 'DELETE' });
      
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف الملف' });
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  // معالجة السحب والإفلات
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // إضافة/تعديل مصروف
  const handleSaveExpense = async () => {
    if (!detailsCase) return;
    
    try {
      const url = '/api/case-expenses';
      const method = editingExpense ? 'PUT' : 'POST';
      const body = editingExpense
        ? { id: editingExpense.id, ...expenseForm, amount: parseFloat(expenseForm.amount) }
        : { caseId: detailsCase.id, ...expenseForm, amount: parseFloat(expenseForm.amount) };

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: 'تم الحفظ', description: editingExpense ? 'تم تحديث المصروف' : 'تم إضافة المصروف' });
        setExpenseFormOpen(false);
        resetExpenseForm();
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحفظ', variant: 'destructive' });
    }
  };

  // حذف مصروف
  const handleDeleteExpense = async (expenseId: number) => {
    if (!detailsCase) return;
    
    try {
      const response = await fetch(`/api/case-expenses?id=${expenseId}`, {
        credentials: 'include', method: 'DELETE' });
      
      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف المصروف' });
        fetchCaseDetails(detailsCase.id);
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  // فتح نافذة تعديل مصروف
  const openEditExpense = (expense: CaseExpense) => {
    setEditingExpense(expense);
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '',
      notes: expense.notes || '',
    });
    setExpenseFormOpen(true);
  };

  // إعادة تعيين نموذج المصروف
  const resetExpenseForm = () => {
    setExpenseForm({
      description: '',
      amount: '',
      expenseDate: '',
      notes: '',
    });
    setEditingExpense(null);
  };

  // تصفية الهيئات القضائية حسب الولاية
  const filteredBodies = formData.wilayaId
    ? judicialBodies.filter(b => b.wilayaId === parseInt(formData.wilayaId))
    : judicialBodies;

  const selectedBody = judicialBodies.find(b => b.id === parseInt(formData.judicialBodyId));

  // تصفية الغرف حسب رقم الغرفة المحدد
  const filteredChambers = selectedBody?.chambers?.filter(chamber => {
    if (!formData.roomNumber || formData.roomNumber === 'none') return true;
    return chamber.roomNumber === parseInt(formData.roomNumber) || !chamber.roomNumber;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/cases';
      const method = selectedCase ? 'PUT' : 'POST';
      const body = selectedCase
        ? { ...formData, id: selectedCase.id, roomNumber: formData.roomNumber === 'none' ? null : formData.roomNumber }
        : { ...formData, roomNumber: formData.roomNumber === 'none' ? null : formData.roomNumber };

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: selectedCase ? 'تم التحديث' : 'تم الإضافة',
          description: selectedCase ? 'تم تحديث القضية' : 'تم إضافة القضية',
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
    if (!selectedCase) return;

    try {
      const response = await fetch(`/api/cases?id=${selectedCase.id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'تم الحذف', description: 'تم حذف القضية' });
        setDeleteDialogOpen(false);
        setSelectedCase(null);
        fetchData();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      caseNumber: '',
      caseType: 'opening_petition',
      judicialBodyId: '',
      chamberId: '',
      roomNumber: 'none',
      wilayaId: '',
      registrationDate: '',
      firstSessionDate: '',
      status: 'active',
      fees: '',
      subject: '',
      notes: '',
      judgmentNumber: '',
      judgmentDate: '',
      issuingCourt: '',
      originalCaseNumber: '',
      originalCourt: '',
      originalJudgmentDate: '',
      councilDecisionDate: '',
      councilName: '',
      parties: [],
    });
    setSelectedCase(null);
  };

  const openEditDialog = async (caseItem: Case) => {
    const response = await fetch(`/api/cases?id=${caseItem.id}`, { credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      setSelectedCase(caseItem);
      setFormData({
        caseNumber: data.caseNumber || '',
        caseType: data.caseType || 'opening_petition',
        judicialBodyId: data.judicialBodyId?.toString() || '',
        chamberId: data.chamberId?.toString() || '',
        roomNumber: data.roomNumber?.toString() || 'none',
        wilayaId: data.wilayaId?.toString() || '',
        registrationDate: data.registrationDate
          ? new Date(data.registrationDate).toISOString().split('T')[0]
          : '',
        firstSessionDate: data.firstSessionDate
          ? new Date(data.firstSessionDate).toISOString().split('T')[0]
          : '',
        status: data.status || 'active',
        fees: data.fees?.toString() || '',
        subject: data.subject || '',
        notes: data.notes || '',
        judgmentNumber: data.judgmentNumber || '',
        judgmentDate: data.judgmentDate
          ? new Date(data.judgmentDate).toISOString().split('T')[0]
          : '',
        issuingCourt: data.issuingCourt || '',
        originalCaseNumber: data.originalCaseNumber || '',
        originalCourt: data.originalCourt || '',
        originalJudgmentDate: '',
        councilDecisionDate: '',
        councilName: '',
        parties: data.parties || [],
      });
      setDialogOpen(true);
    }
  };

  // إضافة طرف جديد
  const addParty = (role: 'plaintiff' | 'defendant') => {
    const newParty: CaseParty = { role };
    if (role === 'plaintiff' && clients.length > 0) {
      newParty.clientId = clients[0].id;
    }
    setFormData({
      ...formData,
      parties: [...formData.parties, newParty],
    });
  };

  // حذف طرف
  const removeParty = (index: number) => {
    setFormData({
      ...formData,
      parties: formData.parties.filter((_, i) => i !== index),
    });
  };

  // تحديث طرف
  const updateParty = (index: number, field: keyof CaseParty, value: any) => {
    const newParties = [...formData.parties];
    newParties[index] = { ...newParties[index], [field]: value };
    setFormData({ ...formData, parties: newParties });
  };

  // إضافة موكل جديد من فورم القضية
  const handleAddNewClient = async () => {
    if (!newClientForm.fullName.trim() && !newClientForm.businessName.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم الموكل أو اسم الشركة', variant: 'destructive' });
      return;
    }

    setAddingClient(true);
    try {
      const response = await fetch('/api/clients', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newClientForm.clientType === 'natural_person' ? newClientForm.fullName : newClientForm.businessName,
          phone: newClientForm.phone,
          address: newClientForm.address,
          clientType: newClientForm.clientType,
          businessName: newClientForm.clientType === 'legal_entity' ? newClientForm.businessName : null,
          legalRepresentative: newClientForm.clientType === 'legal_entity' ? newClientForm.legalRepresentative : null,
        }),
      });

      if (response.ok) {
        const newClient = await response.json();
        // تحديث قائمة الموكلين
        setClients([...clients, { id: newClient.id, fullName: newClient.fullName || newClient.businessName }]);
        // تحديد الموكل الجديد في الطرف الحالي
        if (formData.parties.length > 0) {
          const lastPartyIndex = formData.parties.length - 1;
          if (formData.parties[lastPartyIndex].role === 'plaintiff') {
            updateParty(lastPartyIndex, 'clientId', newClient.id);
          }
        }
        toast({ title: 'تم الإضافة', description: 'تم إضافة الموكل بنجاح' });
        setNewClientDialogOpen(false);
        // إعادة تعيين الفورم
        setNewClientForm({
          fullName: '',
          phone: '',
          address: '',
          clientType: 'natural_person',
          businessName: '',
          legalRepresentative: '',
        });
      } else {
        const error = await response.json();
        toast({ title: 'خطأ', description: error.error || 'حدث خطأ في إضافة الموكل', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    } finally {
      setAddingClient(false);
    }
  };

  // إعادة تعيين فورم الموكل الجديد
  const resetNewClientForm = () => {
    setNewClientForm({
      fullName: '',
      phone: '',
      address: '',
      clientType: 'natural_person',
      businessName: '',
      legalRepresentative: '',
    });
  };

  // دالة طباعة القضية
  const handlePrintCase = () => {
    if (!detailsCase) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const plaintiffs = caseParties.filter(p => p.role === 'plaintiff');
    const defendants = caseParties.filter(p => p.role === 'defendant');

    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>ملف القضية - ${detailsCase.caseNumber || 'بدون رقم'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', 'Segoe UI', Tahoma, sans-serif; 
            padding: 20px; 
            direction: rtl;
            line-height: 1.8;
            font-size: 14px;
          }
          .header {
            text-align: center;
            border-bottom: 3px double #333;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .section {
            margin-bottom: 25px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
          }
          .section-title {
            background: #f5f5f5;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
          }
          .section-content { padding: 15px; }
          .info-row {
            display: flex;
            border-bottom: 1px solid #eee;
            padding: 8px 0;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label {
            width: 150px;
            font-weight: bold;
            color: #555;
          }
          .info-value { flex: 1; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: right;
          }
          th { background: #f5f5f5; font-weight: bold; }
          .party-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            background: #fafafa;
          }
          .party-type {
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 12px;
          }
          .badge-active { background: #d4edda; color: #155724; }
          .badge-adjourned { background: #fff3cd; color: #856404; }
          .badge-judged { background: #cce5ff; color: #004085; }
          .badge-closed { background: #e2e3e5; color: #383d41; }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #888;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body { padding: 0; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ملف القضية</h1>
          <p>طبعت بتاريخ: ${new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- المعلومات الأساسية -->
        <div class="section">
          <div class="section-title">📋 المعلومات الأساسية</div>
          <div class="section-content">
            <div class="info-row">
              <span class="info-label">رقم القضية:</span>
              <span class="info-value">${detailsCase.caseNumber || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">نوع القضية:</span>
              <span class="info-value">${CASE_TYPE_LABELS[detailsCase.caseType || ''] || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الحالة:</span>
              <span class="info-value">
                <span class="badge badge-${detailsCase.status}">${statusLabels[detailsCase.status] || '-'}</span>
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">الهيئة القضائية:</span>
              <span class="info-value">${detailsCase.judicialBody || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الغرفة:</span>
              <span class="info-value">${detailsCase.chamber || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الولاية:</span>
              <span class="info-value">${detailsCase.wilaya || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">تاريخ التسجيل:</span>
              <span class="info-value">${formatDate(detailsCase.registrationDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">تاريخ أول جلسة:</span>
              <span class="info-value">${formatDate(detailsCase.firstSessionDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">الأتعاب:</span>
              <span class="info-value">${detailsCase.fees ? detailsCase.fees.toLocaleString('ar-DZ') + ' د.ج' : '-'}</span>
            </div>
            ${detailsCase.caseType === 'opposition' || detailsCase.caseType === 'appeal' ? `
            <div class="info-row">
              <span class="info-label">رقم الحكم الأصلي:</span>
              <span class="info-value">${detailsCase.judgmentNumber || '-'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">تاريخ الحكم:</span>
              <span class="info-value">${formatDate(detailsCase.judgmentDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">المحكمة المصدرة:</span>
              <span class="info-value">${detailsCase.issuingCourt || '-'}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">الموضوع:</span>
              <span class="info-value">${detailsCase.subject || '-'}</span>
            </div>
            ${detailsCase.notes ? `
            <div class="info-row">
              <span class="info-label">ملاحظات:</span>
              <span class="info-value">${detailsCase.notes}</span>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- أطراف القضية -->
        <div class="section">
          <div class="section-title">👥 أطراف القضية</div>
          <div class="section-content">
            ${plaintiffs.length > 0 ? `
              <div class="party-card">
                <div class="party-type">🟢 المدعين / الموكلين</div>
                ${plaintiffs.map((p, i) => `
                  <div style="margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 5px;">
                    <strong>${i + 1}. ${p.clientName || 'موكل غير محدد'}</strong>
                    ${p.clientDescription ? `<br><span style="color: #666;">الوصف: ${p.clientDescription}</span>` : ''}
                    ${p.lawyerName ? `<br><span style="color: #666;">المحامي: ${p.lawyerName}</span>` : ''}
                    ${p.lawyerDescription ? `<br><span style="color: #666;">${p.lawyerDescription}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #888;">لا يوجد مدعين</p>'}
            
            ${defendants.length > 0 ? `
              <div class="party-card">
                <div class="party-type">🔴 المدعى عليهم / الخصوم</div>
                ${defendants.map((p, i) => `
                  <div style="margin-bottom: 15px; padding: 10px; background: #fff; border-radius: 5px;">
                    <strong>${i + 1}. ${p.opponentFirstName && p.opponentLastName ? `${p.opponentFirstName} ${p.opponentLastName}` : p.description || 'خصم غير محدد'}</strong>
                    ${p.opponentPhone ? `<br><span style="color: #666;">الهاتف: ${p.opponentPhone}</span>` : ''}
                    ${p.opponentAddress ? `<br><span style="color: #666;">العنوان: ${p.opponentAddress}</span>` : ''}
                    ${p.lawyerName ? `<br><span style="color: #666;">المحامي: ${p.lawyerName}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #888;">لا يوجد مدعى عليهم</p>'}
          </div>
        </div>

        <!-- الجلسات والتأجيلات -->
        <div class="section">
          <div class="section-title">📅 الجلسات والتأجيلات (${sessions.length} جلسة)</div>
          <div class="section-content">
            ${sessions.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th style="width: 120px;">تاريخ الجلسة</th>
                    <th>سبب التأجيل</th>
                    <th>القرار</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${sessions.map((s, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${formatDate(s.sessionDate)}</td>
                      <td>${s.adjournmentReason || '-'}</td>
                      <td>${s.decision || '-'}</td>
                      <td>${s.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #888; text-align: center;">لا توجد جلسات مسجلة</p>'}
          </div>
        </div>

        <!-- المصاريف -->
        <div class="section">
          <div class="section-title">💰 المصاريف (المجموع: ${totalExpenses.toLocaleString('ar-DZ')} د.ج)</div>
          <div class="section-content">
            ${expenses.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th>الوصف</th>
                    <th style="width: 120px;">المبلغ</th>
                    <th style="width: 120px;">التاريخ</th>
                    <th>ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  ${expenses.map((e, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${e.description}</td>
                      <td>${e.amount.toLocaleString('ar-DZ')} د.ج</td>
                      <td>${formatDate(e.expenseDate)}</td>
                      <td>${e.notes || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #888; text-align: center;">لا توجد مصاريف مسجلة</p>'}
          </div>
        </div>

        <!-- الملفات -->
        <div class="section">
          <div class="section-title">📎 الملفات المرفقة (${caseFiles.length} ملف)</div>
          <div class="section-content">
            ${caseFiles.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 50px;">#</th>
                    <th>اسم الملف</th>
                    <th style="width: 100px;">الحجم</th>
                  </tr>
                </thead>
                <tbody>
                  ${caseFiles.map((f, i) => `
                    <tr>
                      <td>${i + 1}</td>
                      <td>${f.description || f.originalName}</td>
                      <td>${formatFileSize(f.fileSize)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p style="color: #888; text-align: center;">لا توجد ملفات مرفقة</p>'}
          </div>
        </div>

        <div class="footer">
          <p>نظام إدارة مكتب المحامي - تمت الطباعة تلقائياً</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
        <h1 className="text-3xl font-bold">القضايا</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة قضية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCase ? 'تعديل قضية' : 'إضافة قضية جديدة'}</DialogTitle>
              <DialogDescription>جميع الحقول اختيارية - يمكن إكمال البيانات لاحقاً</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* القسم الأول: معلومات تسجيل القضية */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">معلومات تسجيل القضية</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">رقم القضية</Label>
                    <Input
                      value={formData.caseNumber}
                      onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                      placeholder="أدخل رقم القضية"
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">نوع القضية</Label>
                    <Select
                      value={formData.caseType}
                      onValueChange={(value) => setFormData({ ...formData, caseType: value })}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="اختر نوع القضية" />
                      </SelectTrigger>
                      <SelectContent>
                        {CASE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">الولاية</Label>
                    <Select
                      value={formData.wilayaId}
                      onValueChange={(value) => setFormData({ ...formData, wilayaId: value, judicialBodyId: '', chamberId: '' })}
                    >
                      <SelectTrigger className="w-full mt-1">
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

                  <div>
                    <Label className="text-sm font-medium">المسجلة في (مجلس / محكمة)</Label>
                    <Select
                      value={formData.judicialBodyId}
                      onValueChange={(value) => setFormData({ ...formData, judicialBodyId: value, chamberId: '' })}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="اختر الهيئة القضائية" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredBodies.map((body) => (
                          <SelectItem key={body.id} value={body.id.toString()}>
                            {body.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">الغرفة أو القسم</Label>
                    <Select
                      value={formData.chamberId}
                      onValueChange={(value) => setFormData({ ...formData, chamberId: value })}
                      disabled={!formData.judicialBodyId}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="اختر الغرفة" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedBody?.chambers?.map((chamber) => {
                          let chamberName = CHAMBER_LABELS[chamber.chamberType || ''] || chamber.name || chamber.chamberType || '';
                          if (chamber.roomNumber) {
                            chamberName = `${chamberName} رقم ${chamber.roomNumber}`;
                          }
                          return (
                            <SelectItem key={chamber.id} value={chamber.id.toString()}>
                              {chamberName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">رقم الغرفة</Label>
                    <Select
                      value={formData.roomNumber}
                      onValueChange={(value) => setFormData({ ...formData, roomNumber: value })}
                      disabled={!formData.judicialBodyId}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="اختر الرقم" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_NUMBERS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">الحالة</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">نشطة</SelectItem>
                        <SelectItem value="adjourned">مؤجلة</SelectItem>
                        <SelectItem value="judged">محكوم فيها</SelectItem>
                        <SelectItem value="closed">مغلقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">تاريخ التسجيل</Label>
                    <Input
                      type="date"
                      value={formData.registrationDate}
                      onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                      className="w-full mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">تاريخ أول جلسة</Label>
                    <Input
                      type="date"
                      value={formData.firstSessionDate}
                      onChange={(e) => setFormData({ ...formData, firstSessionDate: e.target.value })}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* حقول المعارضة */}
              {formData.caseType === 'opposition' && (
                <>
                  <div className="space-y-4 bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200">
                    <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400">بيانات المعارضة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">رقم الحكم أو القرار الغيابي</Label>
                        <Input
                          value={formData.judgmentNumber}
                          onChange={(e) => setFormData({ ...formData, judgmentNumber: e.target.value })}
                          placeholder="رقم الحكم"
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">تاريخ صدور الحكم</Label>
                        <Input
                          type="date"
                          value={formData.judgmentDate}
                          onChange={(e) => setFormData({ ...formData, judgmentDate: e.target.value })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">المحكمة أو المجلس الصادر منه</Label>
                        <Input
                          value={formData.issuingCourt}
                          onChange={(e) => setFormData({ ...formData, issuingCourt: e.target.value })}
                          placeholder="اسم الجهة"
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* حقول الاستئناف */}
              {formData.caseType === 'appeal' && (
                <>
                  <div className="space-y-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">بيانات الاستئناف</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">رقم الحكم الابتدائي</Label>
                        <Input
                          value={formData.originalCaseNumber}
                          onChange={(e) => setFormData({ ...formData, originalCaseNumber: e.target.value })}
                          placeholder="رقم الحكم"
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">تاريخ صدور الحكم الابتدائي</Label>
                        <Input
                          type="date"
                          value={formData.originalJudgmentDate}
                          onChange={(e) => setFormData({ ...formData, originalJudgmentDate: e.target.value })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">المحكمة أو المجلس الصادر منه</Label>
                        <Input
                          value={formData.originalCourt}
                          onChange={(e) => setFormData({ ...formData, originalCourt: e.target.value })}
                          placeholder="اسم الجهة"
                          className="w-full mt-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* حقول الطعن بالنقض */}
              {formData.caseType === 'cassation' && (
                <>
                  <div className="space-y-4 bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">بيانات الطعن بالنقض</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">تاريخ آخر قرار من المجلس</Label>
                        <Input
                          type="date"
                          value={formData.councilDecisionDate}
                          onChange={(e) => setFormData({ ...formData, councilDecisionDate: e.target.value })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">المجلس الصادر منه القرار</Label>
                        <Select
                          value={formData.councilName}
                          onValueChange={(value) => setFormData({ ...formData, councilName: value })}
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue placeholder="اختر المجلس" />
                          </SelectTrigger>
                          <SelectContent>
                            {judicialBodies
                              .filter(b => b.type === 'judicial_council')
                              .map((body) => (
                                <SelectItem key={body.id} value={body.name}>
                                  {body.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* القسم: أطراف القضية */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">أطراف القضية</h3>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addParty('plaintiff')}
                    className="flex-1 border-green-300 hover:bg-green-50"
                  >
                    <UserPlus className="ml-2 h-4 w-4 text-green-600" />
                    إضافة موكل (في حق)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addParty('defendant')}
                    className="flex-1 border-red-300 hover:bg-red-50"
                  >
                    <UserMinus className="ml-2 h-4 w-4 text-red-600" />
                    إضافة خصم (ضد)
                  </Button>
                </div>
                
                {formData.parties.length > 0 ? (
                  <div className="space-y-4">
                    {formData.parties.map((party, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${party.role === 'plaintiff' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {party.role === 'plaintiff' ? (
                              <UserPlus className="h-5 w-5 text-green-600" />
                            ) : (
                              <UserMinus className="h-5 w-5 text-red-600" />
                            )}
                            <span className="font-semibold">
                              {party.role === 'plaintiff' ? 'في حق (موكل)' : 'ضد (خصم)'}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeParty(index)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {party.role === 'plaintiff' ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="text-xs font-medium">الموكل</Label>
                                  <Select
                                    value={party.clientId?.toString() || ''}
                                    onValueChange={(value) => updateParty(index, 'clientId', parseInt(value))}
                                  >
                                    <SelectTrigger className="w-full mt-1">
                                      <SelectValue placeholder="اختر الموكل" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                          {c.fullName || 'موكل بدون اسم'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="mt-5 shrink-0"
                                  onClick={() => {
                                    resetNewClientForm();
                                    setNewClientDialogOpen(true);
                                  }}
                                  title="إضافة موكل جديد"
                                >
                                  <UserPlus className="h-4 w-4 text-green-600" />
                                </Button>
                              </div>
                              <div>
                                <Label className="text-xs font-medium">بصفته</Label>
                                <Input
                                  value={party.clientDescription || ''}
                                  onChange={(e) => updateParty(index, 'clientDescription', e.target.value)}
                                  placeholder="مثال: بصفته مدير الشركة"
                                  className="w-full mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs font-medium">الاسم</Label>
                                <Input
                                  value={party.opponentFirstName || ''}
                                  onChange={(e) => updateParty(index, 'opponentFirstName', e.target.value)}
                                  placeholder="الاسم"
                                  className="w-full mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium">اللقب</Label>
                                <Input
                                  value={party.opponentLastName || ''}
                                  onChange={(e) => updateParty(index, 'opponentLastName', e.target.value)}
                                  placeholder="اللقب"
                                  className="w-full mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium">رقم الهاتف</Label>
                                <Input
                                  value={party.opponentPhone || ''}
                                  onChange={(e) => updateParty(index, 'opponentPhone', e.target.value)}
                                  placeholder="رقم الهاتف"
                                  className="w-full mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium">الصفة</Label>
                                <Input
                                  value={party.description || ''}
                                  onChange={(e) => updateParty(index, 'description', e.target.value)}
                                  placeholder="الصفة"
                                  className="w-full mt-1"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs font-medium">العنوان</Label>
                                <Input
                                  value={party.opponentAddress || ''}
                                  onChange={(e) => updateParty(index, 'opponentAddress', e.target.value)}
                                  placeholder="العنوان"
                                  className="w-full mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-medium">المحامي</Label>
                                <Select
                                  value={party.lawyerId?.toString() || ''}
                                  onValueChange={(value) => updateParty(index, 'lawyerId', parseInt(value))}
                                >
                                  <SelectTrigger className="w-full mt-1">
                                    <SelectValue placeholder="اختر المحامي (اختياري)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {lawyers.map((l) => (
                                      <SelectItem key={l.id} value={l.id.toString()}>
                                        {l.firstName} {l.lastName} {l.organization ? `(${l.organization})` : ''}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {party.lawyerId && (
                              <div>
                                <Label className="text-xs font-medium">المحامي بصفته</Label>
                                <Input
                                  value={party.lawyerDescription || ''}
                                  onChange={(e) => updateParty(index, 'lawyerDescription', e.target.value)}
                                  placeholder="مثال: بصفته وكيل الخصم"
                                  className="w-full mt-1"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    لم يتم إضافة أطراف بعد. اضغط على أحد الأزرار أعلاه للبدء.
                  </p>
                )}
              </div>

              <Separator />

              {/* القسم: معلومات إضافية */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">معلومات إضافية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">الأتعاب (د.ج)</Label>
                    <Input
                      type="number"
                      value={formData.fees}
                      onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                      placeholder="0"
                      className="w-full mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">الموضوع</Label>
                  <Textarea
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="وصف موضوع القضية..."
                    rows={3}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">ملاحظات</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية..."
                    rows={2}
                    className="w-full mt-1"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{selectedCase ? 'تحديث' : 'إضافة قضية'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي القضايا</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{cases.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">نشطة</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {cases.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">مؤجلة</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {cases.filter(c => c.status === 'adjourned').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400">محكوم فيها</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {cases.filter(c => c.status === 'judged').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في القضايا..."
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="adjourned">مؤجلة</SelectItem>
              <SelectItem value="judged">محكوم فيها</SelectItem>
              <SelectItem value="closed">مغلقة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grouped' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grouped')}
            title="عرض تجميعي"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            title="عرض جدول"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grouped View */}
      {viewMode === 'grouped' ? (
        <div className="space-y-6">
          {Object.entries(
            cases.reduce((acc, caseItem) => {
              const body = caseItem.judicialBody || 'غير محدد';
              if (!acc[body]) acc[body] = [];
              acc[body].push(caseItem);
              return acc;
            }, {} as Record<string, Case[]>)
          ).map(([bodyName, bodyCases]) => (
            <Card key={bodyName} className="overflow-hidden">
              <div className="bg-gradient-to-l from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{bodyName}</h3>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {bodyCases.length} قضية
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <div className="grid gap-3">
                  {bodyCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => openDetailsDialog(caseItem)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex flex-col">
                          <span className="font-medium text-primary">{caseItem.caseNumber || 'بدون رقم'}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {caseItem.subject || 'بدون موضوع'}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">النوع</span>
                          <span className="text-sm font-medium">
                            {CASE_TYPE_LABELS[caseItem.caseType] || caseItem.caseType || '-'}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex flex-col">
                          <span className="text-sm text-muted-foreground">الأتعاب</span>
                          <span className="text-sm font-medium">
                            {caseItem.fees ? `${caseItem.fees.toLocaleString('ar-DZ')} د.ج` : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[caseItem.status]}>
                          {statusLabels[caseItem.status]}
                        </Badge>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(caseItem)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setDeleteDialogOpen(true);
                            }}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          {cases.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا يوجد قضايا</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم القضية</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>الهيئة القضائية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأتعاب</TableHead>
                  <TableHead className="w-40">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      لا يوجد قضايا
                    </TableCell>
                  </TableRow>
                ) : (
                  cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">{caseItem.caseNumber || '-'}</TableCell>
                      <TableCell>
                        {CASE_TYPE_LABELS[caseItem.caseType] || CASE_TYPES.find(t => t.value === caseItem.caseType)?.label || caseItem.caseType || '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{caseItem.subject || '-'}</TableCell>
                      <TableCell>{caseItem.judicialBody || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[caseItem.status]}>
                          {statusLabels[caseItem.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {caseItem.fees ? `${caseItem.fees.toLocaleString('ar-DZ')} د.ج` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsDialog(caseItem)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(caseItem)}
                            title="تعديل"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setDeleteDialogOpen(true);
                            }}
                            title="حذف"
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
            {cases.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                لا يوجد قضايا
              </div>
            ) : (
              cases.map((caseItem) => (
                <div key={caseItem.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-primary">{caseItem.caseNumber || 'بدون رقم'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {caseItem.subject || 'بدون موضوع'}
                      </p>
                    </div>
                    <Badge className={statusColors[caseItem.status]}>
                      {statusLabels[caseItem.status]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📁 {CASE_TYPE_LABELS[caseItem.caseType] || caseItem.caseType || '-'}</p>
                    <p>🏛️ {caseItem.judicialBody || '-'}</p>
                    {caseItem.fees && <p>💰 {caseItem.fees.toLocaleString('ar-DZ')} د.ج</p>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDetailsDialog(caseItem)}
                    >
                      <Eye className="h-3 w-3 ml-1" />
                      عرض
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(caseItem)}
                    >
                      <Pencil className="h-3 w-3 ml-1" />
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive"
                      onClick={() => {
                        setSelectedCase(caseItem);
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
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف القضية "{selectedCase?.caseNumber}"؟
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

      {/* Case Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
          {/* Professional Header with Key Info Cards */}
          <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-background p-4 md:p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl md:text-2xl font-bold">
                      {detailsCase?.caseNumber || 'قضية بدون رقم'}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {detailsCase?.subject || 'لا يوجد موضوع'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsOpen(false);
                    setTimeout(() => openEditDialog(detailsCase!), 100);
                  }}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="hidden sm:inline">تعديل</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { resetSessionForm(); setSessionFormOpen(true); }}
                  className="gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden sm:inline">جلسة</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">ملف</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintCase}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">طباعة</span>
                </Button>
              </div>
            </div>
            
            {/* Key Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="bg-background/80 backdrop-blur rounded-xl p-3 border shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">نوع القضية</span>
                </div>
                <p className="font-semibold text-sm">{CASE_TYPE_LABELS[detailsCase?.caseType || ''] || '-'}</p>
              </div>
              <div className="bg-background/80 backdrop-blur rounded-xl p-3 border shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">الهيئة القضائية</span>
                </div>
                <p className="font-semibold text-sm truncate">{detailsCase?.judicialBody || '-'}</p>
              </div>
              <div className="bg-background/80 backdrop-blur rounded-xl p-3 border shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">الحالة</span>
                </div>
                <Badge className={`${statusColors[detailsCase?.status || 'active']} text-xs`}>
                  {statusLabels[detailsCase?.status || 'active']}
                </Badge>
              </div>
              <div className="bg-background/80 backdrop-blur rounded-xl p-3 border shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">تاريخ التسجيل</span>
                </div>
                <p className="font-semibold text-sm">{formatDate(detailsCase?.registrationDate)}</p>
              </div>
            </div>
          </div>
          
          {detailsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
              {/* Horizontal Scrollable Tabs */}
              <TabsList className="flex w-full overflow-x-auto flex-nowrap gap-2 whitespace-nowrap justify-start rounded-none border-b bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="info" 
                  className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm whitespace-nowrap shrink-0"
                >
                  <Info className="h-4 w-4" />
                  المعلومات
                </TabsTrigger>
                <TabsTrigger 
                  value="parties" 
                  className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm whitespace-nowrap shrink-0"
                >
                  <Users className="h-4 w-4" />
                  الأطراف
                  <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs">{caseParties.length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sessions" 
                  className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm whitespace-nowrap shrink-0"
                >
                  <CalendarDays className="h-4 w-4" />
                  الجلسات
                  <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs">{sessions.length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="files" 
                  className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm whitespace-nowrap shrink-0"
                >
                  <FileText className="h-4 w-4" />
                  الملفات
                  <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs">{caseFiles.length}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses" 
                  className="flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm whitespace-nowrap shrink-0"
                >
                  <Receipt className="h-4 w-4" />
                  المصاريف
                  <span className="bg-muted-foreground/20 px-1.5 py-0.5 rounded text-xs">{expenses.length}</span>
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto p-4">
                {/* Basic Info Tab */}
                <TabsContent value="info" className="m-0 mt-0">
                  <div className="space-y-6">
                    {/* Section Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        معلومات القضية
                      </h3>
                      <Button
                        variant={editingBasicInfo ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (editingBasicInfo) {
                            handleUpdateBasicInfo();
                          } else {
                            setEditingBasicInfo(true);
                          }
                        }}
                      >
                        {editingBasicInfo ? (
                          <>
                            <Save className="h-4 w-4 ml-2" />
                            حفظ
                          </>
                        ) : (
                          <>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">رقم القضية</Label>
                        {editingBasicInfo ? (
                          <Input
                            value={basicInfoForm.caseNumber}
                            onChange={(e) => setBasicInfoForm({ ...basicInfoForm, caseNumber: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="font-semibold text-lg">{detailsCase?.caseNumber || '-'}</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">نوع القضية</Label>
                        {editingBasicInfo ? (
                          <Select
                            value={basicInfoForm.caseType}
                            onValueChange={(value) => setBasicInfoForm({ ...basicInfoForm, caseType: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CASE_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-semibold text-lg">{CASE_TYPE_LABELS[detailsCase?.caseType || ''] || '-'}</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الحالة</Label>
                        {editingBasicInfo ? (
                          <Select
                            value={basicInfoForm.status}
                            onValueChange={(value) => setBasicInfoForm({ ...basicInfoForm, status: value })}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">نشطة</SelectItem>
                              <SelectItem value="adjourned">مؤجلة</SelectItem>
                              <SelectItem value="judged">محكوم فيها</SelectItem>
                              <SelectItem value="closed">مغلقة</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${statusColors[detailsCase?.status || 'active']} text-base px-3 py-1`}>
                            {statusLabels[detailsCase?.status || 'active']}
                          </Badge>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الأتعاب</Label>
                        {editingBasicInfo ? (
                          <Input
                            type="number"
                            value={basicInfoForm.fees}
                            onChange={(e) => setBasicInfoForm({ ...basicInfoForm, fees: e.target.value })}
                            placeholder="0"
                            className="w-full"
                          />
                        ) : (
                          <p className="font-semibold text-lg text-green-600 dark:text-green-400">
                            {detailsCase?.fees ? `${detailsCase.fees.toLocaleString('ar-DZ')} د.ج` : '-'}
                          </p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الهيئة القضائية</Label>
                        <p className="font-semibold">{detailsCase?.judicialBody || '-'}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الغرفة</Label>
                        <p className="font-semibold">{detailsCase?.chamber || '-'}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الولاية</Label>
                        <p className="font-semibold">{detailsCase?.wilaya || '-'}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">تاريخ التسجيل</Label>
                        <p className="font-semibold">{formatDate(detailsCase?.registrationDate)}</p>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">تاريخ أول جلسة</Label>
                        <p className="font-semibold">{formatDate(detailsCase?.firstSessionDate)}</p>
                      </div>
                    </div>
                    
                    {/* Full Width Fields */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">الموضوع</Label>
                        {editingBasicInfo ? (
                          <Textarea
                            value={basicInfoForm.subject}
                            onChange={(e) => setBasicInfoForm({ ...basicInfoForm, subject: e.target.value })}
                            rows={3}
                            className="w-full"
                          />
                        ) : (
                          <p className="font-medium">{detailsCase?.subject || '-'}</p>
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4 border">
                        <Label className="text-xs text-muted-foreground mb-1 block">ملاحظات</Label>
                        {editingBasicInfo ? (
                          <Textarea
                            value={basicInfoForm.notes}
                            onChange={(e) => setBasicInfoForm({ ...basicInfoForm, notes: e.target.value })}
                            rows={2}
                            className="w-full"
                          />
                        ) : (
                          <p className="font-medium text-muted-foreground">{detailsCase?.notes || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Parties Tab - Professional Cards Layout */}
                <TabsContent value="parties" className="m-0 mt-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        أطراف القضية
                      </h3>
                    </div>
                    
                    {caseParties.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">لا توجد أطراف مسجلة</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {caseParties.map((party, index) => {
                          const isPlaintiff = party.role === 'plaintiff';
                          const partyName = isPlaintiff 
                            ? party.clientName || 'موكل غير محدد'
                            : party.opponentFirstName && party.opponentLastName
                              ? `${party.opponentFirstName} ${party.opponentLastName}`
                              : party.description || 'خصم غير محدد';
                          
                          return (
                            <Card key={index} className={`overflow-hidden ${isPlaintiff ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}`}>
                              <div className={`px-4 py-2 ${isPlaintiff ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">{partyName}</span>
                                  <Badge className={`${isPlaintiff ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                                    {isPlaintiff ? 'مدعي' : 'مدعى عليه'}
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-4 space-y-2">
                                {isPlaintiff && party.clientDescription && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <span>{party.clientDescription}</span>
                                  </div>
                                )}
                                {!isPlaintiff && party.opponentPhone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span dir="ltr">{party.opponentPhone}</span>
                                  </div>
                                )}
                                {!isPlaintiff && party.opponentAddress && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <span>{party.opponentAddress}</span>
                                  </div>
                                )}
                                {party.lawyerName && (
                                  <div className="flex items-center gap-2 text-sm pt-2 border-t">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">المحامي:</span>
                                    <span className="font-medium">{party.lawyerName}</span>
                                  </div>
                                )}
                                {party.lawyerDescription && (
                                  <p className="text-xs text-muted-foreground pr-6">{party.lawyerDescription}</p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Sessions Tab */}
                <TabsContent value="sessions" className="m-0 mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        الجلسات والتأجيلات
                      </h3>
                      <Button onClick={() => { resetSessionForm(); setSessionFormOpen(true); }} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة جلسة
                      </Button>
                    </div>
                    
                    {sessions.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border">
                        <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">لا توجد جلسات مسجلة</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">تاريخ الجلسة</TableHead>
                              <TableHead className="font-semibold">سبب التأجيل</TableHead>
                              <TableHead className="font-semibold">القرار</TableHead>
                              <TableHead className="font-semibold w-24">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sessions.map((session) => (
                              <TableRow key={session.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium">{formatDate(session.sessionDate)}</TableCell>
                                <TableCell>{session.adjournmentReason || '-'}</TableCell>
                                <TableCell className="max-w-xs">
                                  <p className="truncate">{session.decision || '-'}</p>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditSession(session)}
                                      title="تعديل"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteSession(session.id)}
                                      title="حذف"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Files Tab */}
                <TabsContent value="files" className="m-0 mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        الملفات المرفقة
                      </h3>
                    </div>
                    
                    {/* File Upload Area */}
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">اسحب الملفات هنا أو</p>
                      <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Input
                          placeholder="اسم الملف (اختياري)"
                          value={fileUploadForm.customName}
                          onChange={(e) => setFileUploadForm({ ...fileUploadForm, customName: e.target.value })}
                          className="w-64"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                        >
                          {uploadingFile ? (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          ) : (
                            <Upload className="h-4 w-4 ml-2" />
                          )}
                          اختر ملف
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        />
                      </div>
                    </div>
                    
                    {caseFiles.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">لا توجد ملفات مرفقة</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {caseFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-4 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <File className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.description || file.originalName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.fileSize)}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadFile(file)}
                                title="تحميل"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteFile(file.id)}
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Expenses Tab */}
                <TabsContent value="expenses" className="m-0 mt-0">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Receipt className="h-5 w-5 text-primary" />
                          المصاريف
                        </h3>
                        {totalExpenses > 0 && (
                          <Badge variant="secondary" className="text-base px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            المجموع: {totalExpenses.toLocaleString('ar-DZ')} د.ج
                          </Badge>
                        )}
                      </div>
                      <Button onClick={() => { resetExpenseForm(); setExpenseFormOpen(true); }} size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        إضافة مصروف
                      </Button>
                    </div>
                    
                    {expenses.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-xl border">
                        <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">لا توجد مصاريف مسجلة</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">الوصف</TableHead>
                              <TableHead className="font-semibold">المبلغ</TableHead>
                              <TableHead className="font-semibold">التاريخ</TableHead>
                              <TableHead className="font-semibold w-24">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {expenses.map((expense) => (
                              <TableRow key={expense.id} className="hover:bg-muted/30">
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{expense.description}</p>
                                    {expense.notes && (
                                      <p className="text-xs text-muted-foreground">{expense.notes}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold text-green-600 dark:text-green-400">
                                  {expense.amount.toLocaleString('ar-DZ')} د.ج
                                </TableCell>
                                <TableCell>{formatDate(expense.expenseDate)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditExpense(expense)}
                                      title="تعديل"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      title="حذف"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Form Dialog */}
      <Dialog open={sessionFormOpen} onOpenChange={setSessionFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSession ? 'تعديل جلسة' : 'إضافة جلسة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>تاريخ الجلسة</Label>
              <Input
                type="date"
                value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
              />
            </div>
            <div>
              <Label>سبب التأجيل</Label>
              <Input
                value={sessionForm.adjournmentReason}
                onChange={(e) => setSessionForm({ ...sessionForm, adjournmentReason: e.target.value })}
                placeholder="سبب التأجيل"
              />
            </div>
            <div>
              <Label>القرار</Label>
              <Textarea
                value={sessionForm.decision}
                onChange={(e) => setSessionForm({ ...sessionForm, decision: e.target.value })}
                placeholder="القرار المتخذ"
                rows={2}
              />
            </div>
            <div>
              <Label>نص الحكم</Label>
              <Textarea
                value={sessionForm.rulingText}
                onChange={(e) => setSessionForm({ ...sessionForm, rulingText: e.target.value })}
                placeholder="نص الحكم (إن وجد)"
                rows={3}
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={sessionForm.notes}
                onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveSession}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Form Dialog */}
      <Dialog open={expenseFormOpen} onOpenChange={setExpenseFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الوصف *</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="وصف المصروف"
              />
            </div>
            <div>
              <Label>المبلغ (د.ج) *</Label>
              <Input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseFormOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveExpense} disabled={!expenseForm.description || !expenseForm.amount}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Client Dialog */}
      <Dialog open={newClientDialogOpen} onOpenChange={setNewClientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة موكل جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الموكل الجديد</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* نوع الموكل */}
            <div>
              <Label>نوع الموكل</Label>
              <Select
                value={newClientForm.clientType}
                onValueChange={(value) => setNewClientForm({ ...newClientForm, clientType: value as 'natural_person' | 'legal_entity' })}
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
            {newClientForm.clientType === 'natural_person' ? (
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  value={newClientForm.fullName}
                  onChange={(e) => setNewClientForm({ ...newClientForm, fullName: e.target.value })}
                  placeholder="الاسم الكامل للموكل"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label>اسم الشركة / المؤسسة *</Label>
                  <Input
                    value={newClientForm.businessName}
                    onChange={(e) => setNewClientForm({ ...newClientForm, businessName: e.target.value })}
                    placeholder="اسم الشركة أو المؤسسة"
                  />
                </div>
                <div>
                  <Label>الممثل القانوني</Label>
                  <Input
                    value={newClientForm.legalRepresentative}
                    onChange={(e) => setNewClientForm({ ...newClientForm, legalRepresentative: e.target.value })}
                    placeholder="اسم الممثل القانوني (اختياري)"
                  />
                </div>
              </>
            )}

            {/* رقم الهاتف */}
            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={newClientForm.phone}
                onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                placeholder="رقم الهاتف"
              />
            </div>

            {/* العنوان */}
            <div>
              <Label>العنوان</Label>
              <Input
                value={newClientForm.address}
                onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                placeholder="العنوان"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleAddNewClient}
              disabled={addingClient || (!newClientForm.fullName.trim() && !newClientForm.businessName.trim())}
            >
              {addingClient ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
