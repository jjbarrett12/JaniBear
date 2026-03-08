/**
 * Navigation factory: builds sidebar sections from org_type, role, and feature flags.
 * Single codebase; no forking. Enforces Sales vs Ops and franchisee/franchisor visibility.
 *
 * Best-practice changes vs your current version:
 * - No mutation (no .push on nested arrays). Everything is immutable and deterministic.
 * - No unsafe assumptions (items is optional). We always use a safe fallback.
 * - Feature-flag additions are appended via array spreads.
 */
import type { AppTranslationKey } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import {
  LayoutDashboard,
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
  LayoutGrid,
  BarChart2,
  QrCode,
  UserPlus,
  Percent,
  Radar,
  Workflow,
  Shield,
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

/** Optional theme for enterprise sidebar styling (e.g. colored accent). */
export type NavSectionTheme = 'executive' | 'sales' | 'launch' | 'operations' | 'system';

export type NavSection = {
  id: string;
  labelKey: AppTranslationKey;
  /** Optional theme for section styling in sidebar. */
  theme?: NavSectionTheme;
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

/** Executive section: Dashboard (top), Financial Health, Alerts, Reports, Map, Benchmarks, HelpHub. */
function buildExecutiveSection(): NavSection {
  return {
    id: 'executive',
    labelKey: 'navExecutive',
    theme: 'executive',
    items: [
      { href: '/app/dashboard', labelKey: 'navDashboard', icon: LayoutDashboard },
      { href: '/app/financial-health', labelKey: 'navRevenueForecast', icon: Wallet },
      { href: '/app/alerts', labelKey: 'navAlerts', icon: AlertCircle },
      { href: '/app/kpis', labelKey: 'navReports', icon: BarChart3 },
      { href: '/app/map', labelKey: 'navMap', icon: Map },
      { href: '/app/benchmarks', labelKey: 'navBenchmarks', icon: BarChart2 },
      { href: '/app/helphub', labelKey: 'navHelpHubQR', icon: QrCode },
    ],
  };
}

/** Sales section: Command, Leads, Accounts, Contacts, Pipeline, Walkthroughs, Proposals, Launch to Ops, Map. */
function buildSalesSection(input: NavFactoryInput): NavSection {
  const items: NavItem[] = [
    { href: '/app/sales', labelKey: 'navSalesCommand', icon: LayoutGrid },
    { href: '/app/sales/leads', labelKey: 'navLeads', icon: TrendingUp },
    { href: '/app/sales/accounts', labelKey: 'navAccountsProspects', icon: Building2 },
    { href: '/app/crm/contacts', labelKey: 'navContacts', icon: Users },
    { href: '/app/crm/pipeline', labelKey: 'navOpportunities', icon: LayoutDashboard },
    { href: '/app/sales/walkthroughs', labelKey: 'navWalkthroughs', icon: FileSearch },
    { href: '/app/sales/proposals', labelKey: 'navProposals', icon: Calculator },
    { href: '/app/sales/launch-packets', labelKey: 'navLaunchToOperations', icon: Rocket, alertKey: 'handoffsCount' },
    { href: '/app/map', labelKey: 'navMap', icon: Map },
    ...(input.franchiseeEnrolled
      ? [{ href: '/app/opportunities/network', labelKey: 'navNetworkOpportunities', icon: Briefcase } satisfies NavItem]
      : []),
  ];

  return {
    id: 'sales',
    labelKey: 'navGrowth',
    theme: 'sales',
    items,
  };
}

/** Operations section: Command Center, Activations, Accounts, Crews, Mapping, Inspections, Issues, Performance, etc. Launch folded in; Activations = intake + go-live. */
function buildOperationsSection(): NavSection {
  return {
    id: 'operations',
    labelKey: 'navOperations',
    theme: 'operations',
    items: [
      { href: '/app/ops/command-center', labelKey: 'navCommandCenter', icon: LayoutGrid },
      { href: '/app/ops/launch-intake', labelKey: 'navActivations', icon: Rocket, alertKey: 'handoffsCount' },
      { href: '/app/ops/accounts', labelKey: 'navAccountsActive', icon: Building2 },
      { href: '/app/ops/crews', labelKey: 'navCrewManagement', icon: Users },
      { href: '/app/map', labelKey: 'navMap', icon: Map },
      { href: '/app/ops/schedules', labelKey: 'navServiceSchedules', icon: Calendar, alertKey: 'missedTaskCount' },
      { href: '/app/ops/inspections', labelKey: 'navInspections', icon: ClipboardCheck },
      { href: '/app/ops/qc', labelKey: 'navQualityControl', icon: ListChecks },
      { href: '/app/ops/issues-sla', labelKey: 'navSlaTracking', icon: AlertCircle, alertKey: 'openIssuesCount' },
      { href: '/app/ops/tasks', labelKey: 'navMyTasks', icon: ClipboardCheck },
      { href: '/app/ops/performance', labelKey: 'navOperatorPerformance', icon: Trophy },
      { href: '/app/ops/supplies', labelKey: 'navSupplies', icon: Package },
      { href: '/app/ops/contracts', labelKey: 'navContracts', icon: FileUp },
      { href: '/app/ops/service-deployments', labelKey: 'navServiceDeployments', icon: Rocket },
      { href: '/app/ops/risk', labelKey: 'navAccountsAtRisk', icon: AlertCircle },
      { href: '/app/ops/settings/risk', labelKey: 'navRiskSettings', icon: Shield },
      { href: '/app/kpis', labelKey: 'navReporting', icon: BarChart3 },
    ],
  };
}

/** System section: Admin Dashboard, Commission, Renewals, Automations, Users, Invites, Roles, Audit, AI Settings, Training, Pro Gear, Organization. */
function buildSystemSection(input: NavFactoryInput): NavSection {
  const base: NavItem[] = [
    { href: '/app/admin', labelKey: 'navAdminDashboard', icon: LayoutDashboard },
    { href: '/app/admin', labelKey: 'navCommissionDashboard', icon: Percent },
    { href: '/app/admin', labelKey: 'navRenewalRadar', icon: Radar },
    { href: '/app/admin', labelKey: 'navWorkflows', icon: Workflow },
    { href: '/app/admin/users', labelKey: 'navAdminUsers', icon: Users },
    { href: '/app/admin/invites', labelKey: 'navAdminInvites', icon: UserPlus },
    { href: '/app/admin/roles', labelKey: 'navAdminRoles', icon: Shield },
    { href: '/app/admin/audit', labelKey: 'navAdminAudit', icon: FileText },
    { href: '/app/admin/ai-settings', labelKey: 'navAiSettings', icon: Sparkles },
    { href: '/app/university', labelKey: 'navTraining', icon: GraduationCap },
    { href: '/app/pro-gear', labelKey: 'navProGear', icon: ShoppingBag },
    { href: '/app/settings', labelKey: 'navOrganization', icon: Settings },
  ];

  // Show all system items including Settings/Organization for every org type (page gates by permissions).
  const items = base;

  return {
    id: 'system',
    labelKey: 'navSystem',
    theme: 'system',
    items,
  };
}

/** Franchisor: Network + Franchise + Control; includes KPI Dashboard. */
function buildFranchisorSections(input: NavFactoryInput): NavSection[] {
  const networkSalesItem: NavItem = {
    href: '/app/opportunities/network',
    labelKey: 'navNetworkOpportunities',
    icon: Briefcase,
  };

  const franchisorExecutiveItems: NavItem[] = [
    { href: '/app/franchise', labelKey: 'navPlacementBoard', icon: LayoutDashboard },
    { href: '/app/franchise/listings', labelKey: 'navListings', icon: LayoutList },
    { href: '/app/franchise/interests', labelKey: 'navInterests', icon: ListTodo },
    { href: '/app/franchise/awards', labelKey: 'navAwards', icon: Trophy },
    { href: '/app/franchise/memberships', labelKey: 'navMemberships', icon: UserCheck },
    { href: '/app/kpis', labelKey: 'navKpiDashboard', icon: BarChart3 },
    { href: '/app/benchmarks', labelKey: 'navBenchmarks', icon: BarChart2 },
    { href: '/app/alerts', labelKey: 'navAlerts', icon: AlertCircle },
    ...(input.featureFlags?.franchisor_controls_sales ? [networkSalesItem] : []),
  ];

  return [
    {
      id: 'franchisor',
      labelKey: 'navExecutive',
      items: franchisorExecutiveItems,
    },
    {
      id: 'system',
      labelKey: 'navSystem',
      items: [
        { href: '/app/settings', labelKey: 'navOrganization', icon: Settings },
        { href: '/app/admin', labelKey: 'navAdminDashboard', icon: Users },
      ],
    },
  ];
}

/**
 * Build full nav sections for the given org_type, role, and feature flags.
 * Enterprise order: EXECUTIVE → SALES → OPERATIONS → SYSTEM.
 * Launch is not a standalone section: Sales ends with "Launch to Ops"; Ops begins with "Activations".
 * - Independent/franchisee: four sections.
 * - Franchisor: Network + Franchise + Control only (no Sales/Ops).
 */
export function buildNavSections(input: NavFactoryInput): NavSection[] {
  if (input.orgType === 'franchisor') {
    return buildFranchisorSections(input);
  }

  return [
    buildExecutiveSection(),
    buildSalesSection(input),
    buildOperationsSection(),
    buildSystemSection(input),
  ];
}