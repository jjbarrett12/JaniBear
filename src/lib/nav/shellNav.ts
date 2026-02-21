/**
 * Three distinct nav trees by shell. Single source for nav; do not infer from org_type elsewhere.
 */
import type { AppTranslationKey } from '@/lib/app-translations';
import type { NavAlertCounts } from '@/actions/nav-alerts';
import type { ShellKey } from '@/lib/shell';
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

export type NavItem = {
  href: string;
  labelKey: AppTranslationKey;
  icon: React.ComponentType<{ className?: string }>;
  alertKey?: keyof NavAlertCounts;
};

export type NavSection = {
  id: string;
  labelKey: AppTranslationKey;
  items: NavItem[];
};

/** Owner/Operator: standard JANIBEAR (dashboard, sales, ops, finance, admin). */
const OWNER_OPERATOR_SECTIONS: NavSection[] = [
  {
    id: 'executive',
    labelKey: 'navExecutive',
    items: [
      { href: '/app/dashboard', labelKey: 'navOverview', icon: LayoutDashboard },
      { href: '/app/financial-health', labelKey: 'navFinancialHealth', icon: Wallet },
      { href: '/app/kpis', labelKey: 'navKpiDashboard', icon: BarChart3 },
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

/** Franchisee: same as owner_operator PLUS Network Opportunities (only when enrolled). */
function getFranchiseeSections(franchiseeEnrolled: boolean): NavSection[] {
  const sections = OWNER_OPERATOR_SECTIONS.map((s) => ({ ...s, items: [...s.items] }));
  const growth = sections.find((s) => s.id === 'growth');
  if (growth && franchiseeEnrolled) {
    growth.items.push({
      href: '/app/opportunities/network',
      labelKey: 'navNetworkOpportunities',
      icon: Briefcase,
    });
  }
  return sections;
}

/** Franchisor: ONLY Placement Board, Listings, Interests, Awards, Memberships. No sales/ops. */
const FRANCHISOR_SECTIONS: NavSection[] = [
  {
    id: 'franchisor',
    labelKey: 'navExecutive',
    items: [
      { href: '/app/franchise', labelKey: 'navPlacementBoard', icon: LayoutDashboard },
      { href: '/app/franchise/listings', labelKey: 'navListings', icon: LayoutList },
      { href: '/app/franchise/interests', labelKey: 'navInterests', icon: ListTodo },
      { href: '/app/franchise/awards', labelKey: 'navAwards', icon: Trophy },
      { href: '/app/franchise/memberships', labelKey: 'navMemberships', icon: UserCheck },
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

/**
 * Return nav sections for the given shell. Franchisee gets owner_operator nav + Network Opportunities when enrolled.
 */
export function getNavSectionsForShell(
  shell: ShellKey,
  franchiseeEnrolled: boolean
): NavSection[] {
  switch (shell) {
    case 'owner_operator':
      return OWNER_OPERATOR_SECTIONS;
    case 'franchisee':
      return getFranchiseeSections(franchiseeEnrolled);
    case 'franchisor':
      return FRANCHISOR_SECTIONS;
    default:
      return OWNER_OPERATOR_SECTIONS;
  }
}
