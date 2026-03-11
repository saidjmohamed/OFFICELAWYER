'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Users, Briefcase, Calendar, Search } from 'lucide-react';

interface SearchResult {
  type: 'client' | 'case' | 'session';
  id: number;
  title: string;
  subtitle: string;
  href: string;
}

const typeIcons = {
  client: Users,
  case: Briefcase,
  session: Calendar,
};

const typeLabels = {
  client: 'الموكلين',
  case: 'القضايا',
  session: 'الجلسات',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const searchItems = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchItems(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, searchItems]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      {/* Search button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 rounded-lg hover:bg-muted transition-colors w-full max-w-md"
      >
        <Search className="h-4 w-4" />
        <span>بحث...</span>
        <kbd className="mr-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="ابحث في الموكلين، القضايا، الجلسات..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">جاري البحث...</div>
          ) : (
            <>
              <CommandEmpty>لا توجد نتائج</CommandEmpty>
              {Object.entries(groupedResults).map(([type, items], index) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                return (
                  <div key={type}>
                    {index > 0 && <CommandSeparator />}
                    <CommandGroup heading={typeLabels[type as keyof typeof typeLabels]}>
                      {items.map((item) => (
                        <CommandItem
                          key={`${item.type}-${item.id}`}
                          onSelect={() => handleSelect(item.href)}
                        >
                          <Icon className="ml-2 h-4 w-4" />
                          <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </div>
                );
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
