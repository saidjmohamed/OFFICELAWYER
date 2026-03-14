'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Scale, Users, Calendar, FileText, Building2, MapPin, 
  User, Loader2, X, ArrowRight, ChevronDown
} from 'lucide-react';

// أنواع النتائج
interface SearchResult {
  type: 'case' | 'client' | 'party' | 'session' | 'lawyer' | 'court' | 'wilaya';
  id: number;
  title: string;
  subtitle: string;
  matchedField: string;
  matchedValue: string;
  extra?: {
    status?: string;
    caseType?: string;
    court?: string;
    date?: string;
    phone?: string;
    caseId?: number;
  };
}

interface SearchResults {
  cases: SearchResult[];
  clients: SearchResult[];
  parties: SearchResult[];
  sessions: SearchResult[];
  others: SearchResult[];
  total: number;
  query: string;
}

// أيقونات الأنواع
const typeIcons: Record<string, React.ElementType> = {
  case: Scale,
  client: Users,
  party: User,
  session: Calendar,
  lawyer: User,
  court: Building2,
  wilaya: MapPin,
};

// تسميات الأنواع بالعربية
const typeLabels: Record<string, string> = {
  case: '📁 القضايا',
  client: '👤 الموكلين',
  party: '👥 الأطراف',
  session: '📅 الجلسات',
  others: '📌 أخرى',
};

// ألوان الحالات
const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  adjourned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  judged: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  archived: 'bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-500',
};

const statusLabels: Record<string, string> = {
  active: 'نشطة',
  adjourned: 'مؤجلة',
  judged: 'محكوم فيها',
  closed: 'مغلقة',
  archived: 'مؤرشفة',
};

// دالة تمييز النص المطابق
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  
  if (index === -1) return text;
  
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  
  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded px-0.5">
        {match}
      </mark>
      {after}
    </>
  );
}

export function SmartSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // إخفاء/إظهار البحث بضغط Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  // إغلاق عند النقر خارج المنطقة
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // البحث مع التأخير (debounce)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    setSelectedIndex(0);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // تأخير البحث
  useEffect(() => {
    const timeout = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, performSearch]);

  // تجميع جميع النتائج في قائمة واحدة للتنقل
  const allResults = results ? [
    ...results.cases,
    ...results.clients,
    ...results.parties,
    ...results.sessions,
    ...results.others,
  ] : [];

  // التنقل بلوحة المفاتيح
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || allResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected) {
          handleResultClick(selected);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, allResults, selectedIndex]);

  // معالجة النقر على نتيجة
  const handleResultClick = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    
    // التنقل بناءً على نوع النتيجة
    switch (result.type) {
      case 'case':
        // فتح تفاصيل القضية - سنستخدم حدث مخصص
        window.dispatchEvent(new CustomEvent('openCaseDetails', { detail: result.id }));
        break;
      case 'client':
        window.dispatchEvent(new CustomEvent('openClientDetails', { detail: result.id }));
        break;
      case 'party':
        if (result.extra?.caseId) {
          window.dispatchEvent(new CustomEvent('openCaseDetails', { detail: result.extra.caseId }));
        }
        break;
      case 'session':
        if (result.extra?.caseId) {
          window.dispatchEvent(new CustomEvent('openCaseDetails', { detail: result.extra.caseId }));
        }
        break;
      default:
        // للأنواع الأخرى، الانتقال للصفحة الرئيسية مع القسم المناسب
        router.push('/?section=' + result.type + 's');
    }
  };

  // تقسيم النتائج حسب الفئة
  const groupedResults = results ? {
    cases: results.cases,
    clients: results.clients,
    parties: results.parties,
    sessions: results.sessions,
    others: results.others,
  } : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* شريط البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="ابحث عن قضية، موكل، محكمة..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full pr-10 pl-4 py-5 md:py-6 text-sm rounded-xl border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults(null);
                inputRef.current?.focus();
              }}
              className="p-1.5 hover:bg-muted rounded-full"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded border">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* لوحة النتائج */}
      {open && query.trim().length >= 2 && (
        <div className="fixed md:absolute inset-x-0 md:inset-x-auto md:left-0 md:right-0 top-28 md:top-full mt-0 md:mt-2 mx-3 md:mx-0 bg-background border-2 rounded-xl shadow-2xl z-[60] max-h-[60vh] md:max-h-[70vh] overflow-hidden md:max-w-lg">
          {/* Header للموبايل */}
          <div className="flex items-center justify-between p-3 border-b md:hidden">
            <span className="font-medium">نتائج البحث</span>
            <button 
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-muted rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="mr-2 text-muted-foreground">جاري البحث...</span>
            </div>
          ) : results && results.total > 0 ? (
            <ScrollArea className="max-h-[calc(60vh-60px)] md:max-h-[70vh]">
              <div className="p-2">
                {/* عدد النتائج */}
                <div className="px-3 py-2 text-xs text-muted-foreground border-b mb-2">
                  {results.total} نتيجة لـ "{results.query}"
                </div>

                {/* النتائج حسب الفئة */}
                {groupedResults && Object.entries(groupedResults).map(([category, items]) => {
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        {typeLabels[category] || category}
                        <span className="mr-2 text-muted-foreground/70">({items.length})</span>
                      </div>
                      
                      {items.map((result, index) => {
                        const Icon = typeIcons[result.type] || FileText;
                        const globalIndex = allResults.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className={`
                              w-full flex items-start gap-3 p-3 rounded-lg text-right transition-colors
                              ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                            `}
                          >
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">
                                  {highlightMatch(result.title, results.query)}
                                </span>
                                {result.type === 'case' && result.extra?.status && (
                                  <Badge className={`${statusColors[result.extra.status]} text-xs shrink-0`}>
                                    {statusLabels[result.extra.status] || result.extra.status}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="truncate">
                                  {highlightMatch(result.subtitle, results.query)}
                                </span>
                              </div>
                              
                              {result.extra && (
                                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-muted-foreground">
                                  {result.extra.caseType && (
                                    <span className="bg-muted px-1.5 py-0.5 rounded">
                                      {result.extra.caseType}
                                    </span>
                                  )}
                                  {result.extra.court && (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="h-3 w-3" />
                                      {result.extra.court}
                                    </span>
                                  )}
                                  {result.extra.date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {result.extra.date}
                                    </span>
                                  )}
                                  {result.extra.phone && (
                                    <span dir="ltr" className="flex items-center gap-1">
                                      <span dir="rtl">📞</span>
                                      {result.extra.phone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <ArrowRight className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/50'}`} />
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Search className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">لا توجد نتائج مطابقة</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                جرب البحث بكلمات مختلفة أو جزء من الكلمة
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
