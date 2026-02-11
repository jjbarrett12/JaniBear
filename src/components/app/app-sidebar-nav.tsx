'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Calendar,
  ClipboardCheck,
  AlertCircle,
  Users,
  FileUp,
  Calculator,
  Settings,
  TrendingUp,
  ListChecks,
  Repeat,
  KeyRound,
  Award,
  FileSearch,
  Package,
  GraduationCap,
  Ticket,
  MessageCircle,
} from 'lucide-react';

const salesItems = [
  { href: '/app/sales', labelKey: 'navLeads' as const, icon: TrendingUp },
  { href: '/app/walkthroughs', labelKey: 'navSalesAppointment' as const, icon: FileSearch },
  { href: '/app/bids', labelKey: 'navProposalBuilding' as const, icon: Calculator },
  { href: '/app/bids', labelKey: 'navProposalDraftReview' as const, icon: FileText },
  { href: '/app/sales/cadence', labelKey: 'navFollowUp' as const, icon: Repeat },
  { href: '/app/sales', labelKey: 'navPipelineManagement' as const, icon: TrendingUp },
];

const operationsItems = [
  { href: '/app/locations', labelKey: 'navLocations' as const, icon: MapPin },
  { href: '/app/crews', labelKey: 'navCrewManagement' as const, icon: Users },
  { href: '/app/templates', labelKey: 'navBrandStandards' as const, icon: Award },
  { href: '/app/schedules', labelKey: 'navSchedules' as const, icon: Calendar },
  { href: '/app/inspections', labelKey: 'navInspections' as const, icon: ClipboardCheck },
  { href: '/app/issues', labelKey: 'navIssues' as const, icon: AlertCircle },
  { href: '/app/tasks', labelKey: 'navMyTasks' as const, icon: ClipboardCheck },
  { href: '/app/supplies', labelKey: 'navSupplies' as const, icon: Package },
  { href: '/app/contracts', labelKey: 'navContracts' as const, icon: FileUp },
  { href: '/app/helphub', labelKey: 'navHelpHubQR' as const, icon: Ticket },
  { href: '/app/messages', labelKey: 'navMessages' as const, icon: MessageCircle },
  { href: '/app/qc-assign', labelKey: 'navQcTaskAssign' as const, icon: ListChecks },
  { href: '/app/admin', labelKey: 'navAdmin' as const, icon: Settings },
];

function navLinkClass(active: boolean) {
  return `flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
    active
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

export function AppSidebarNav({ premium }: { premium: boolean }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <nav className="min-w-0 flex-1 space-y-4 overflow-y-auto p-3">
      <Link
        href="/app/dashboard"
        className={navLinkClass(pathname === '/app/dashboard')}
      >
        <LayoutDashboard className="h-6 w-6 shrink-0" />
        <span className="truncate">{t('navDashboard')}</span>
      </Link>
      <Link
        href="/app/university"
        className={navLinkClass(pathname.startsWith('/app/university'))}
      >
        <GraduationCap className="h-6 w-6 shrink-0" />
        <span className="truncate">{t('navUniversity')}</span>
        {premium && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">Premium</Badge>
        )}
      </Link>

      <div className="space-y-1">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('navSales')}
        </p>
        {salesItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className={navLinkClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-1">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('navOperations')}
        </p>
        {operationsItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className={navLinkClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-2 border-t border-border space-y-1">
        <Link
          href="/app/settings"
          className={navLinkClass(pathname.startsWith('/app/settings'))}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('navSettings')}</span>
        </Link>
      </div>
    </nav>
  );
}
