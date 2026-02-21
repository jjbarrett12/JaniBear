'use client';

import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import type { AppTranslationKey } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  AlertCircle,
  MapPin,
  Settings
} from 'lucide-react';

const bottomNavKeys = [
  { href: '/app/dashboard', labelKey: 'navDashboard', icon: LayoutDashboard },
  { href: '/app/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
  { href: '/app/issues', labelKey: 'navIssues', icon: AlertCircle },
  { href: '/app/accounts', labelKey: 'navAccounts', icon: MapPin },
  { href: '/app/settings', labelKey: 'navSettings', icon: Settings },
] as const;

export function BottomNav({ navAlerts }: { navAlerts?: NavAlertCounts | null }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const openIssuesCount = navAlerts?.openIssuesCount ?? 0;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg safe-bottom pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {bottomNavKeys.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/app/dashboard' && pathname.startsWith(item.href));
          const showBadge = item.href === '/app/issues' && openIssuesCount > 0;

          return (
            <AppLink
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-w-0 px-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative inline-flex">
                <Icon className={`h-6 w-6 mb-1 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center px-1">
                    {openIssuesCount > 99 ? '99+' : openIssuesCount}
                  </span>
                )}
              </span>
              <span className="text-xs font-medium truncate w-full text-center">
                {t(item.labelKey as AppTranslationKey)}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 rounded-full bg-primary" aria-hidden />
              )}
            </AppLink>
          );
        })}
      </div>
    </nav>
  );
}
