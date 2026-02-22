'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
  X,
  Menu,
  BarChart3,
  TrendingUp,
  ListChecks,
  Package,
  GraduationCap,
  Ticket,
  Repeat,
  Award,
  FileSearch,
  MessageCircle,
  Rocket,
  Wallet,
} from 'lucide-react';
import { GlobalSearch } from '@/components/search/global-search';
import { DarkModeToggle } from '@/components/app/dark-mode-toggle';
import { LanguageSwitcher } from '@/components/app/language-switcher';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import type { AppTranslationKey } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import { Badge } from '@/components/ui/badge';

interface MobileSidebarProps {
  logoUrl?: string | null;
  navAlerts?: NavAlertCounts | null;
  shell?: 'owner_operator' | 'franchisee' | 'franchisor';
  franchiseeEnrolled?: boolean;
  proGearEnabled?: boolean;
}

/** Shared by Sales and Operations */
const sharedCrmAndLocationsItemKeys: { href: string; labelKey: AppTranslationKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/app/crm', labelKey: 'navCrm', icon: Users },
  { href: '/app/crm/pipeline', labelKey: 'navPipeline', icon: LayoutDashboard },
  { href: '/app/sites', labelKey: 'navLocations', icon: MapPin },
  { href: '/app/map', labelKey: 'navMap', icon: Map },
];
/** Sales-only */
const salesItemKeys: { href: string; labelKey: AppTranslationKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/app/sales-dashboard', labelKey: 'navCommandCenter', icon: BarChart3 },
  { href: '/app/sales', labelKey: 'navLeads', icon: TrendingUp },
  { href: '/app/walkthroughs', labelKey: 'navSalesAppointment', icon: FileSearch },
  { href: '/app/proposals/build', labelKey: 'navProposalBuilding', icon: Calculator },
  { href: '/app/draft-review', labelKey: 'navProposalDraftReview', icon: FileText },
  { href: '/app/sales/cadence', labelKey: 'navFollowUp', icon: Repeat },
  { href: '/app/sales', labelKey: 'navPipelineManagement', icon: TrendingUp },
];
/** Operations-only */
const operationsItemKeys: { href: string; labelKey: AppTranslationKey; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: '/app/accounts', labelKey: 'navAccounts', icon: MapPin },
  { href: '/app/ops/launch-intake', labelKey: 'navLaunchIntake', icon: Rocket },
  { href: '/app/crews', labelKey: 'navCrewManagement', icon: Users },
  { href: '/app/templates', labelKey: 'navBrandStandards', icon: Award },
  { href: '/app/schedules', labelKey: 'navSchedules', icon: Calendar },
  { href: '/app/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
  { href: '/app/issues', labelKey: 'navIssues', icon: AlertCircle },
  { href: '/app/tasks', labelKey: 'navMyTasks', icon: ClipboardCheck },
  { href: '/app/supplies', labelKey: 'navSupplies', icon: Package },
  { href: '/app/contracts', labelKey: 'navContracts', icon: FileUp },
  { href: '/app/helphub', labelKey: 'navHelpHubQR', icon: Ticket },
  { href: '/app/messages', labelKey: 'navMessages', icon: MessageCircle },
  { href: '/app/qc-assign', labelKey: 'navQcTaskAssign', icon: ListChecks },
  { href: '/app/admin', labelKey: 'navAdmin', icon: Settings },
];

const MOBILE_ALERT_BADGE_CLASS = 'ml-auto text-[10px] min-w-[18px] h-5 px-1.5 justify-center shrink-0 bg-destructive text-destructive-foreground border-0';

export function MobileSidebar({ logoUrl, navAlerts, shell, franchiseeEnrolled }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Header - same blue as sidebar; light mode: slight blue tint so logo stays visible */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b border-border bg-[hsl(220,30%,97%)] dark:bg-card text-foreground">
        <div className="flex items-center gap-3 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 text-foreground hover:bg-muted"
          >
            <Menu className="h-6 w-6" />
          </Button>
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Company Logo"
              width={180}
              height={64}
              className="h-12 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          ) : (
            <Image
              src="/logo.png"
              alt="JANIBEAR Logo"
              width={220}
              height={72}
              className="h-12 w-auto object-contain bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
              priority
              unoptimized
            />
          )}
        </div>
        <div className="flex items-center gap-2 [&_button]:text-foreground [&_button]:hover:bg-muted [&_.rounded-lg]:border-border">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-white dark:bg-gray-900 shadow-xl lg:hidden transform transition-transform duration-300">
            <div className="flex h-full flex-col">
              <div className="flex min-h-16 items-center justify-between border-b border-border px-4 py-2 bg-[hsl(220,30%,97%)] dark:bg-card">
                <AppLink href="/app/dashboard" className="flex min-h-[3.5rem] w-full items-center bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:!relative [&>span]:w-full [&>span]:h-full">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={200}
                      height={70}
                      className="h-full w-full min-h-[3rem] object-contain object-left bg-transparent"
                      priority
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/logo.png"
                      alt="JANIBEAR Logo"
                      width={220}
                      height={80}
                      className="h-full w-full min-h-[3.5rem] object-contain object-left bg-transparent [&>img]:bg-transparent dark:[&>img]:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)] dark:[&>img]:brightness-110"
                      priority
                      unoptimized
                    />
                  )}
                </AppLink>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-12 w-12"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="p-4 border-b dark:border-gray-800 space-y-3">
                <GlobalSearch />
              </div>

              <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
                <AppLink
                  href="/app/dashboard"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname === '/app/dashboard'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <LayoutDashboard className="h-5 w-5 shrink-0" />
                  {t('navDashboard')}
                </AppLink>
                <AppLink
                  href="/app/financial-health"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname.startsWith('/app/financial-health')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Wallet className="h-5 w-5 shrink-0" />
                  {t('navFinancialHealth')}
                </AppLink>
                <AppLink
                  href="/app/kpis"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname.startsWith('/app/kpis')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <BarChart3 className="h-5 w-5 shrink-0" />
                  {t('navKpiDashboard')}
                </AppLink>
                <AppLink
                  href="/app/university"
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[48px] ${
                    pathname.startsWith('/app/university')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <GraduationCap className="h-5 w-5 shrink-0" />
                  {t('navUniversity')}
                </AppLink>

                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('navCrmAndLocations')}
                  </p>
                  {sharedCrmAndLocationsItemKeys.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) ||
                      (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) ||
                      (item.href === '/app/sites' && pathname.startsWith('/app/sites')) ||
                      (item.href === '/app/map' && pathname.startsWith('/app/map'));
                    return (
                      <AppLink
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {t(item.labelKey)}
                      </AppLink>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('navSales')}
                  </p>
                  {salesItemKeys.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/app/sales' && (pathname === '/app/sales' || pathname.startsWith('/app/sales/')));
                    return (
                      <AppLink
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {t(item.labelKey)}
                      </AppLink>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {t('navOperations')}
                  </p>
                  {operationsItemKeys.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href === '/app/ops/launch-intake' && pathname.startsWith('/app/ops/launch-intake')) ||
                      (item.href === '/app/accounts' && pathname.startsWith('/app/accounts'));
                    const alertCount =
                      item.href === '/app/ops/launch-intake' ? alerts.handoffsCount
                      : item.href === '/app/issues' ? alerts.openIssuesCount
                      : item.href === '/app/schedules' ? alerts.missedTaskCount
                      : 0;
                    return (
                      <AppLink
                        key={`${item.href}-${item.labelKey}`}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {t(item.labelKey)}
                        {alertCount > 0 && (
                          <Badge variant="destructive" className={MOBILE_ALERT_BADGE_CLASS}>
                            {alertCount > 99 ? '99+' : alertCount}
                          </Badge>
                        )}
                      </AppLink>
                    );
                  })}
                </div>

                <div className="pt-2 border-t dark:border-gray-800">
                  <AppLink
                    href="/app/settings"
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                      pathname.startsWith('/app/settings')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    {t('navSettings')}
                  </AppLink>
                </div>
              </nav>

              <div className="border-t dark:border-gray-800 p-4">
                <Button asChild variant="outline" className="w-full h-12 text-base">
                  <a href="/auth/logout">{t('signOut')}</a>
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
