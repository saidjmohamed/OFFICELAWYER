'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  Settings,
} from 'lucide-react';

const navItems = [
  { name: 'الرئيسية', href: '/?section=dashboard', icon: LayoutDashboard, section: 'dashboard' },
  { name: 'القضايا', href: '/?section=cases', icon: Briefcase, section: 'cases' },
  { name: 'الموكلين', href: '/?section=clients', icon: Users, section: 'clients' },
  { name: 'الجلسات', href: '/?section=sessions', icon: Calendar, section: 'sessions' },
  { name: 'الإعدادات', href: '/?section=settings', icon: Settings, section: 'settings' },
];

export function MobileNav() {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'dashboard';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentSection === item.section;
          return (
            <Link
              key={item.section}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-1 py-1 transition-colors duration-200',
                'touch-manipulation select-none',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
              style={{ touchAction: 'manipulation' }}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-primary/15 scale-110'
                    : 'hover:bg-muted active:scale-95'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px]')} />
              </div>
              <span className={cn(
                'text-[10px] mt-0.5 font-medium transition-all',
                isActive && 'font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
