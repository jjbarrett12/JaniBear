'use client';

import { useState, useEffect } from 'react';
import { AppLink } from '@/components/app/app-link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import { getAppT } from '@/lib/app-translations';
import { Badge } from '@/components/ui/badge';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import type { AppTranslationKey } from '@/lib/app-translations';
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
  Award,
  FileSearch,
  Package,
  Wallet,
  BarChart3,
  Rocket,
  Building2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  GraduationCap,
  ShoppingBag,
  Map,
} from 'lucide-react';

type NavItem = {
  href: string;
  labelKey: AppTranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  alertKey?: keyof NavAlertCounts;
};

type NavSection = {
  id: string;
  labelKey: AppTranslationKey;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    id: 'executive',
    labelKey: 'navExecutive',
    items: [
      { href: '/app/dashboard', labelKey: 'navOverview', icon: LayoutDashboard },
      { href: '/app/financial-health', labelKey: 'navFinancialHealth', icon: Wallet },
      { href: '/app/kpis', labelKey: 'navAccountHealth', icon: BarChart3 },
      { href: '/app/kpis', labelKey: 'navRiskLeakage', icon: ShieldAlert },
      { href: '/app/admin/ai-settings', labelKey: 'navAiInsights', icon: Sparkles },
      { href: '/app/university', labelKey: 'navUniversity', icon: GraduationCap },
      { href: '/app/pro-gear', labelKey: 'navProGear', icon: ShoppingBag },
    ],
  },
  {
    id: 'growth',
    labelKey: 'navGrowth',
    items: [
      { href: '/app/sales', labelKey: 'navLeads', icon: TrendingUp },
      { href: '/app/crm/pipeline', labelKey: 'navPipeline', icon: LayoutDashboard },
      { href: '/app/walkthroughs', labelKey: 'navWalkthroughs', icon: FileSearch },
      { href: '/app/proposals/build', labelKey: 'navProposals', icon: Calculator },
      { href: '/app/territory-map', labelKey: 'navTerritories', icon: MapPin },
      { href: '/app/sales-dashboard', labelKey: 'navPipelineAnalytics', icon: BarChart3 },
      { href: '/app/crm', labelKey: 'navCrm', icon: Users },
    ],
  },
  {
    id: 'operations',
    labelKey: 'navOperations',
    items: [
      { href: '/app/accounts', labelKey: 'navAccounts', icon: Building2 },
      { href: '/app/sites', labelKey: 'navLocations', icon: MapPin },
      { href: '/app/map', labelKey: 'navMap', icon: Map },
      { href: '/app/crews', labelKey: 'navCrewManagement', icon: Users },
      { href: '/app/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
      { href: '/app/schedules', labelKey: 'navServiceSchedules', icon: Calendar, alertKey: 'missedTaskCount' },
      { href: '/app/qc-assign', labelKey: 'navQualityControl', icon: ListChecks },
      { href: '/app/issues', labelKey: 'navSlaTracking', icon: AlertCircle, alertKey: 'openIssuesCount' },
      { href: '/app/ops/launches', labelKey: 'navLaunches', icon: Rocket, alertKey: 'handoffsCount' },
      { href: '/app/tasks', labelKey: 'navMyTasks', icon: ClipboardCheck },
      { href: '/app/templates', labelKey: 'navBrandStandards', icon: Award },
      { href: '/app/supplies', labelKey: 'navSupplies', icon: Package },
      { href: '/app/contracts', labelKey: 'navContracts', icon: FileUp },
    ],
  },
  {
    id: 'system',
    labelKey: 'navSystem',
    items: [
      { href: '/app/admin/ai-settings', labelKey: 'navAiSettings', icon: Sparkles },
      { href: '/app/settings', labelKey: 'navOrganization', icon: Settings },
      { href: '/app/admin', labelKey: 'navUsersRoles', icon: Users },
      { href: '/app/admin', labelKey: 'navIntegrations', icon: Settings },
      { href: '/app/admin', labelKey: 'navAuditLogs', icon: FileText },
    ],
  },
];

const STORAGE_KEY = 'janibear-nav-collapsed';

function getSectionIdForPath(pathname: string): string {
  for (const section of SECTIONS) {
    for (const item of section.items) {
      if (pathname === item.href) return section.id;
      if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return section.id;
      if (item.href === '/app/crm' && (pathname === '/app/crm' || pathname.startsWith('/app/crm/'))) return section.id;
      if (item.href === '/app/sales' && (pathname === '/app/sales' || pathname.startsWith('/app/sales/'))) return section.id;
    }
  }
  return 'executive';
}

function navLinkClass(active: boolean) {
  return `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors min-h-[36px] ${
    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;
}

const ALERT_BADGE_CLASS = 'ml-auto text-[10px] min-w-[18px] h-5 px-1.5 justify-center shrink-0 bg-destructive text-destructive-foreground border-0';

export function AppSidebarNav({ premium, navAlerts }: { premium: boolean; navAlerts?: NavAlertCounts | null }) {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const t = getAppT(locale);
  const alerts = navAlerts ?? { handoffsCount: 0, openIssuesCount: 0, missedTaskCount: 0 };

  const activeSectionId = getSectionIdForPath(pathname);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      SECTIONS.forEach((s) => {
        if (s.id === activeSectionId && next[s.id] !== false) next[s.id] = false;
      });
      return next;
    });
  }, [activeSectionId]);

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.href === '/app/crm/pipeline' && pathname.startsWith('/app/crm/pipeline')) return true;
    if (item.href === '/app/crm' && (pathname === '/app/crm' || (pathname.startsWith('/app/crm/') && !pathname.startsWith('/app/crm/pipeline')))) return true;
    if (item.href === '/app/sites' && pathname.startsWith('/app/sites')) return true;
    if (item.href === '/app/map' && pathname.startsWith('/app/map')) return true;
    if (item.href === '/app/accounts' && pathname.startsWith('/app/accounts')) return true;
    if (item.href === '/app/sales' && (pathname === '/app/sales' || pathname.startsWith('/app/sales/'))) return true;
    if (item.href === '/app/ops/launches' && pathname.startsWith('/app/ops/launches')) return true;
    if (item.href !== '/app/dashboard' && pathname.startsWith(item.href + '/')) return true;
    return false;
  };

  const getAlertCount = (alertKey?: keyof NavAlertCounts) => {
    if (!alertKey) return 0;
    const n = alerts[alertKey];
    return typeof n === 'number' ? n : 0;
  };

  return (
    <nav className="min-w-0 flex-1 space-y-0.5 overflow-y-auto p-2">
      {SECTIONS.map((section) => {
        const isOpen = collapsed[section.id] !== true;
        const isActiveSection = section.id === activeSectionId;

        return (
          <div key={section.id} className="space-y-0.5">
            <button
              type="button"
              onClick={() => toggle(section.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors min-h-[36px] ${
                isActiveSection ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              <span className="truncate">{t(section.labelKey)}</span>
            </button>

            {isOpen && (
              <div className="space-y-0.5 pl-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item);
                  const alertCount = getAlertCount(item.alertKey);
                  return (
                    <AppLink
                      key={`${item.href}-${item.labelKey}`}
                      href={item.href}
                      className={navLinkClass(active)}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{t(item.labelKey)}</span>
                      {alertCount > 0 && (
                        <Badge variant="destructive" className={ALERT_BADGE_CLASS} title="Requires attention">
                          {alertCount > 99 ? '99+' : alertCount}
                        </Badge>
                      )}
                    </AppLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-1.5 mt-1 border-t border-border space-y-0.5">
        <AppLink href="/app/settings" className={navLinkClass(pathname.startsWith('/app/settings'))}>
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">{t('navSettings')}</span>
        </AppLink>
      </div>
    </nav>
  );
}
