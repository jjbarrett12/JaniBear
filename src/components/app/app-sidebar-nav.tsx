'use client';

import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  MapPin,
  Map,
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
  Wallet,
  BarChart3,
  ShoppingBag,
  CreditCard,
  Wrench,
  Mail,
  Star,
  Route,
  Zap,
  RefreshCw,
} from 'lucide-react';

const salesItems = [
  { href: '/app/sales-dashboard', labelKey: 'navCommandCenter' as const, icon: BarChart3 },
  { href: '/app/sales', labelKey: 'navLeads' as const, icon: TrendingUp },
  { href: '/app/walkthroughs', labelKey: 'navSalesAppointment' as const, icon: FileSearch },
  { href: '/app/proposals/build', labelKey: 'navProposalBuilding' as const, icon: Calculator },
  { href: '/app/draft-review', labelKey: 'navProposalDraftReview' as const, icon: FileText },
  { href: '/app/sales/cadence', labelKey: 'navFollowUp' as const, icon: Repeat },
  { href: '/app/sales', labelKey: 'navPipelineManagement' as const, icon: TrendingUp },
  { href: '/app/marketing', labelKey: 'navMarketing' as const, icon: Mail },
  { href: '/app/contract-renewals', labelKey: 'navContractRenewals' as const, icon: RefreshCw },
];

const operationsItems = [
  { href: '/app/map', labelKey: 'navMap' as const, icon: Map },
  { href: '/app/territory-map', labelKey: 'navTerritoryMap' as const, icon: MapPin },
  { href: '/app/accounts', labelKey: 'navAccounts' as const, icon: MapPin },
  { href: '/app/crews', labelKey: 'navCrewManagement' as const, icon: Users },
  { href: '/app/templates', labelKey: 'navBrandStandards' as const, icon: Award },
  { href: '/app/schedules', labelKey: 'navSchedules' as const, icon: Calendar },
  { href: '/app/work-orders', labelKey: 'navWorkOrders' as const, icon: Wrench },
  { href: '/app/routes', labelKey: 'navRoutes' as const, icon: Route },
  { href: '/app/inspections', labelKey: 'navInspections' as const, icon: ClipboardCheck },
  { href: '/app/surveys', labelKey: 'navSurveys' as const, icon: Star },
  { href: '/app/issues', labelKey: 'navIssues' as const, icon: AlertCircle },
  { href: '/app/tasks', labelKey: 'navMyTasks' as const, icon: ClipboardCheck },
  { href: '/app/supplies', labelKey: 'navSupplies' as const, icon: Package },
  { href: '/app/contracts', labelKey: 'navContracts' as const, icon: FileUp },
  { href: '/app/helphub', labelKey: 'navHelpHubQR' as const, icon: Ticket },
  { href: '/app/messages', labelKey: 'navMessages' as const, icon: MessageCircle },
  { href: '/app/qc-assign', labelKey: 'navQcTaskAssign' as const, icon: ListChecks },
  { href: '/app/workflows', labelKey: 'navWorkflows' as const, icon: Zap },
  { href: '/app/billing', labelKey: 'navBilling' as const, icon: CreditCard },
  { href: '/app/admin', labelKey: 'navAdmin' as const, icon: Settings },
];

function navLinkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[36px] ${
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
    <nav className="min-w-0 flex-1 space-y-2 overflow-y-auto p-2">
      <AppLink
        href="/app/dashboard"
        className={navLinkClass(pathname === '/app/dashboard')}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0" />
        <span className="truncate">{t('navDashboard')}</span>
      </AppLink>
      <AppLink
        href="/app/financial-health"
        className={navLinkClass(pathname === '/app/financial-health')}
      >
        <Wallet className="h-5 w-5 shrink-0" />
        <span className="truncate">{t('navFinancialHealth')}</span>
      </AppLink>
      <AppLink
        href="/app/kpis"
        className={navLinkClass(pathname === '/app/kpis')}
      >
        <BarChart3 className="h-5 w-5 shrink-0" />
        <span className="truncate">{t('navKpiDashboard')}</span>
      </AppLink>
      <AppLink
        href="/app/university"
        className={navLinkClass(pathname.startsWith('/app/university'))}
      >
        <GraduationCap className="h-5 w-5 shrink-0" />
        <span className="truncate">{t('navUniversity')}</span>
        {premium && (
          <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 shrink-0">Premium</Badge>
        )}
      </AppLink>
      <AppLink
        href="/app/pro-gear"
        className={navLinkClass(pathname.startsWith('/app/pro-gear'))}
      >
        <ShoppingBag className="h-5 w-5 shrink-0" />
        <span className="truncate">{t('navProGear')}</span>
      </AppLink>

      <div className="space-y-0.5 pt-1">
        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('navSales')}
        </p>
        {salesItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <AppLink
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className={navLinkClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </AppLink>
          );
        })}
      </div>

      <div className="space-y-0.5 pt-1">
        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t('navOperations')}
        </p>
        {operationsItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <AppLink
              key={`${item.href}-${item.labelKey}`}
              href={item.href}
              className={navLinkClass(isActive)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </AppLink>
          );
        })}
      </div>

      <div className="pt-1.5 mt-1 border-t border-border space-y-0.5">
        <AppLink
          href="/app/settings"
          className={navLinkClass(pathname.startsWith('/app/settings'))}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('navSettings')}</span>
        </AppLink>
      </div>
    </nav>
  );
}
