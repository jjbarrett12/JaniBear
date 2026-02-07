'use client';

import Link from 'next/link';
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
  { href: '/app/locations', labelKey: 'navSiteHandover' as const, icon: KeyRound },
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

export function AppSidebarNav({ premium }: { premium: boolean }) {
  const { locale } = useLanguage();
  const t = getAppT(locale);

  return (
    <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
      <Link
        href="/app/dashboard"
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
      >
        <LayoutDashboard className="h-6 w-6 shrink-0" />
        <span className="truncate">{t('navDashboard')}</span>
      </Link>
      <Link
        href="/app/university"
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[48px]"
      >
        <GraduationCap className="h-6 w-6 shrink-0" />
        <span className="truncate">{t('navUniversity')}</span>
        {premium && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">Premium</Badge>
        )}
      </Link>

      <div className="space-y-1">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('navSales')}
        </p>
        {salesItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-1">
        <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('navOperations')}
        </p>
        {operationsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>

      <div className="pt-2 border-t dark:border-gray-800 space-y-1">
        <Link
          href="/app/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('navSettings')}</span>
        </Link>
      </div>
    </nav>
  );
}
