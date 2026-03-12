'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search,
  X,
  User,
  Scale,
  Briefcase,
  Building,
  Building2,
  Loader2,
  Clock,
  Hash,
} from 'lucide-react';

interface SearchResult {
  type: 'client' | 'case' | 'lawyer' | 'organization' | 'judicialBody';
  id: number;
  title: string;
  subtitle: string;
  description?: string;
  href: string;
  score: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  matchedFields: string[];
  icon?: string;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
  totalFound: number;
  suggestions: string[];
  searchTime: number;
}

// أيقونات حسب النوع
const typeIcons: Record<string, React.ElementType> = {
  client: User,
  case: Scale,
  lawyer: Briefcase,
  organization: Building,
  judicialBody: Building2,
};

// ألوان حسب النوع
const typeColors: Record<string, string> = {
  client: 'bg-blue-50 text-blue-700 border-blue-200',
  case: 'bg-green-50 text-green-700 border-green-200',
  lawyer: 'bg-purple-50 text-purple-700 border-purple-200',
  organization: 'bg-amber-50 text-amber-700 border-amber-200',
  judicialBody: 'bg-rose-50 text-rose-700 border-rose-200',
};

// أسماء الأنواع
const typeLabels: Record<string, string> = {
  client: 'موكل',
  case: 'قضية',
  lawyer: 'محامي',
  organization: 'منظمة',
  judicialBody: 'هيئة قضائية',
};

// ألوان نوع التطابق
const matchTypeColors: Record<string, string> = {
  exact: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  fuzzy: 'bg-gray-100 text-gray-700',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // تحميل البحث الأخير من التخزين المحلي
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // حفظ البحث الأخير
  const saveRecentSearch = useCallback((searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // البحث
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      setResults([]);
      return;
    }

    setLoading(true);
    setSelectedIndex(0);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // فتح البحث بالاختصار
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K أو Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape للإغلاق
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // التنقل بالأسهم
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex]);

  // اختيار نتيجة
  const handleSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(result.href);
  };

  // اختيار بحث سابق
  const handleRecentClick = (searchQuery: string) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };

  // حذف بحث سابق
  const handleRemoveRecent = (searchQuery: string) => {
    const updated = recentSearches.filter(s => s !== searchQuery);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  return (
    <>
      {/* زر البحث */}
      <Button
        variant="outline"
        className="relative h-9 w-full max-w-sm justify-start text-muted-foreground sm:pr-12"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">بحث...</span>
        <span className="inline-flex lg:hidden">بحث...</span>
        <kbd className="pointer-events-none absolute left-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* نافذة البحث */}
      <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setQuery('');
          setResults([]);
        }
      }}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          {/* حقل البحث */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن موكل، قضية، محامي..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {/* النتائج */}
          <ScrollArea className="max-h-[60vh]">
            {results.length > 0 ? (
              <div className="p-2">
                {/* عدد النتائج */}
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  تم العثور على {results.length} نتيجة
                </div>
                
                {/* قائمة النتائج */}
                {results.map((result, index) => {
                  const Icon = typeIcons[result.type];
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        "w-full flex items-start gap-3 rounded-lg p-3 text-right transition-colors",
                        selectedIndex === index 
                          ? "bg-accent" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      {/* أيقونة */}
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                        typeColors[result.type]
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* المحتوى */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[result.type]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                        {result.matchedFields.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Hash className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              تطابق في: {result.matchedFields.join('، ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* نوع التطابق */}
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", matchTypeColors[result.matchType])}
                      >
                        {result.matchType === 'exact' ? 'تطابق كامل' : 
                         result.matchType === 'partial' ? 'تطابق جزئي' : 'تطابق تقريبي'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            ) : query && !loading ? (
              <div className="p-8 text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  لم يتم العثور على نتائج لـ "{query}"
                </p>
              </div>
            ) : recentSearches.length > 0 ? (
              <div className="p-2">
                <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  عمليات البحث الأخيرة
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={search}
                    className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted/50"
                  >
                    <button
                      className="flex items-center gap-2 text-sm flex-1"
                      onClick={() => handleRecentClick(search)}
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {search}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveRecent(search)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  ابدأ الكتابة للبحث...
                </p>
                <div className="mt-4 text-xs text-muted-foreground space-y-1">
                  <p>💡 نصائح البحث:</p>
                  <p>• اكتب جزء من الاسم أو رقم القضية</p>
                  <p>• ابحث برقم الهاتف</p>
                  <p>• البحث يدعم الأخطاء الإملائية البسيطة</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
