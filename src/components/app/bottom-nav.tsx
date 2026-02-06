'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertCircle,
  MapPin,
  Settings
} from 'lucide-react';

const bottomNavKeys = [
  { href: '/app/dashboard', labelKey: 'navDashboard' as const, icon: LayoutDashboard },
  { href: '/app/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
  { href: '/app/issues', labelKey: 'navIssues', icon: AlertCircle },
  { href: '/app/locations', labelKey: 'navLocations', icon: MapPin },
  { href: '/app/settings', labelKey: 'navSettings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shadow-lg">
      <div className="flex items-center justify-around h-16">
        {bottomNavKeys.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 px-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} />
              <span className="text-xs font-medium truncate w-full text-center">
                {t(item.labelKey)}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
