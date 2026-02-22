/**
 * Navigation factory: builds sidebar sections from org_type, role, and feature flags.
 * Single codebase; no forking. Enforces Sales vs Ops and franchisee/franchisor visibility.
 */
import type { AppTranslationKey } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
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
  Award,
  FileSearch,
  Package,
  Wallet,
  BarChart3,
  Rocket,
  Building2,
  Sparkles,
  GraduationCap,
  ShoppingBag,
  Map,
  LayoutList,
  ListTodo,
  Trophy,
  UserCheck,
  Briefcase,
} from 'lucide-react';

export type OrgType = 'independent' | 'franchisee' | 'franchisor';

export type NavItem = {
  href: string;
  labelKey: AppTranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  alertKey?: keyof NavAlertCounts;
};

export type NavGroup = {
  labelKey: AppTranslationKey;
  items: NavItem[];
};

export type NavSection = {
  id: string;
  labelKey: AppTranslationKey;
  /** Flat list (legacy). When absent, use groups. */
  items?: NavItem[];
  /** Grouped subsections (e.g. Sales: Prospecting / Active Deals / Conversion). */
  groups?: NavGroup[];
};

export type NavFactoryInput = {
  orgType: OrgType;
  role?: string;
  featureFlags?: {
    franchisor_controls_sales?: boolean;
    approvals_enabled?: boolean;
  };
  franchiseeEnrolled?: boolean;
};

/** Sales section: grouped as Prospecting → Active Deals → Conversion. Label "Sales" (not Growth). */
function buildSalesSection(input: NavFactoryInput): NavSection {
  const { featureFlags, franchiseeEnrolled } = input;
  const conversionItems: NavItem[] = [
    { href: '/app/sales/win-loss', labelKey: 'navWinLoss', icon: BarChart3 },
    { href: '/app/sales/launch-packets', labelKey: 'navContractLaunch', icon: Rocket },
  ];
  if (featureFlags?.approvals_enabled) {
    conversionItems.splice(1, 0, { href: '/app/sales/approvals', labelKey: 'navApprovals', icon: ListChecks });
  }
  if (franchiseeEnrolled) {
    conversionItems.push({ href: '/app/opportunities/network', labelKey: 'navNetworkOpportunities', icon: Briefcase });
  }
  return {
    id: 'sales',
    labelKey: 'navGrowth',
    groups: [
      {
        labelKey: 'navProspecting',
        items: [
          { href: '/app/sales/leads', labelKey: 'navLeads', icon: TrendingUp },
          { href: '/app/sales/pipeline', labelKey: 'navPipeline', icon: LayoutDashboard },
        ],
      },
      {
        labelKey: 'navActiveDeals',
        items: [
          { href: '/app/sales/accounts', labelKey: 'navAccountsProspects', icon: Building2 },
          { href: '/app/sales/walkthroughs', labelKey: 'navWalkthroughs', icon: FileSearch },
          { href: '/app/sales/scope', labelKey: 'navScope', icon: FileText },
          { href: '/app/sales/proposals', labelKey: 'navProposals', icon: Calculator },
        ],
      },
      {
        labelKey: 'navConversion',
        items: conversionItems,
      },
    ],
  };
}

/** Operations section: Launch Intake first, then Accounts (Active), then execution. Sites → Accounts in label. */
function buildOperationsSection(input: NavFactoryInput): NavSection {
  return {
    id: 'operations',
    labelKey: 'navOperations',
    items: [
      { href: '/app/ops/launch-intake', labelKey: 'navLaunchIntake', icon: Rocket, alertKey: 'handoffsCount' },
      { href: '/app/ops/accounts', labelKey: 'navAccountsActive', icon: Building2 },
      { href: '/app/ops/map', labelKey: 'navMap', icon: Map },
      { href: '/app/ops/crews', labelKey: 'navCrewManagement', icon: Users },
      { href: '/app/ops/schedules', labelKey: 'navServiceSchedules', icon: Calendar, alertKey: 'missedTaskCount' },
      { href: '/app/ops/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
      { href: '/app/ops/qc', labelKey: 'navQualityControl', icon: ListChecks },
      { href: '/app/ops/issues-sla', labelKey: 'navSlaTracking', icon: AlertCircle, alertKey: 'openIssuesCount' },
      { href: '/app/ops/tasks', labelKey: 'navMyTasks', icon: ClipboardCheck },
      { href: '/app/ops/supplies', labelKey: 'navSupplies', icon: Package },
      { href: '/app/ops/contracts', labelKey: 'navContracts', icon: FileUp },
    ],
  };
}

/** Executive section for independent/franchisee. */
function buildExecutiveSection(): NavSection {
  return {
    id: 'executive',
    labelKey: 'navExecutive',
    items: [
      { href: '/app/dashboard', labelKey: 'navOverview', icon: LayoutDashboard },
      { href: '/app/financial-health', labelKey: 'navFinancialHealth', icon: Wallet },
      { href: '/app/kpis', labelKey: 'navKpiDashboard', icon: BarChart3 },
      { href: '/app/benchmarks', labelKey: 'navBenchmarks', icon: BarChart3 },
      { href: '/app/alerts', labelKey: 'navAlerts', icon: AlertCircle },
      { href: '/app/admin/ai-settings', labelKey: 'navAiInsights', icon: Sparkles },
      { href: '/app/university', labelKey: 'navUniversity', icon: GraduationCap },
      { href: '/app/pro-gear', labelKey: 'navProGear', icon: ShoppingBag },
    ],
  };
}

/** System section. Franchisee: "My Unit" — no org-wide admin (no Organization panel). */
function buildSystemSection(input: NavFactoryInput): NavSection {
  const { orgType } = input;
  const base: NavItem[] = [
    { href: '/app/admin/ai-settings', labelKey: 'navAiSettings', icon: Sparkles },
    { href: '/app/settings', labelKey: 'navOrganization', icon: Settings },
    { href: '/app/admin', labelKey: 'navUsersRoles', icon: Users },
    { href: '/app/admin', labelKey: 'navIntegrations', icon: Settings },
    { href: '/app/audit', labelKey: 'navAuditLogs', icon: FileText },
  ];
  const items =
    orgType === 'franchisee'
      ? base.filter((i) => i.labelKey !== 'navOrganization')
      : [...base];
  return {
    id: 'system',
    labelKey: 'navSystem',
    items,
  };
}

/** Franchisor: Network + Franchise + Control; includes KPI Dashboard. */
function buildFranchisorSections(input: NavFactoryInput): NavSection[] {
  const sections: NavSection[] = [
    {
      id: 'franchisor',
      labelKey: 'navExecutive',
      items: [
        { href: '/app/franchise', labelKey: 'navPlacementBoard', icon: LayoutDashboard },
        { href: '/app/franchise/listings', labelKey: 'navListings', icon: LayoutList },
        { href: '/app/franchise/interests', labelKey: 'navInterests', icon: ListTodo },
        { href: '/app/franchise/awards', labelKey: 'navAwards', icon: Trophy },
        { href: '/app/franchise/memberships', labelKey: 'navMemberships', icon: UserCheck },
        { href: '/app/kpis', labelKey: 'navKpiDashboard', icon: BarChart3 },
        { href: '/app/benchmarks', labelKey: 'navBenchmarks', icon: BarChart3 },
        { href: '/app/alerts', labelKey: 'navAlerts', icon: AlertCircle },
      ],
    },
    {
      id: 'system',
      labelKey: 'navSystem',
      items: [
        { href: '/app/settings', labelKey: 'navOrganization', icon: Settings },
        { href: '/app/admin', labelKey: 'navUsersRoles', icon: Users },
      ],
    },
  ];
  if (input.featureFlags?.franchisor_controls_sales) {
    sections[0].items.push({
      href: '/app/opportunities/network',
      labelKey: 'navNetworkOpportunities',
      icon: Briefcase,
    });
  }
  return sections;
}

/**
 * Build full nav sections for the given org_type, role, and feature flags.
 * - Independent: full Sales + Ops + System.
 * - Franchisee: same + Network Opportunities when enrolled; System without Organization (My Unit).
 * - Franchisor: Network + Franchise + Control only.
 */
export function buildNavSections(input: NavFactoryInput): NavSection[] {
  const { orgType, franchiseeEnrolled } = input;

  if (orgType === 'franchisor') {
    return buildFranchisorSections(input);
  }

  const sections: NavSection[] = [
    buildExecutiveSection(),
    buildSalesSection(input),
    buildOperationsSection(input),
    buildSystemSection(input),
  ];

  return sections;
}
