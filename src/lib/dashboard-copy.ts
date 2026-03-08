/**
 * JANIBEAR dashboard microcopy — single source of truth for command center / war room voice.
 * Use for KPI labels, section titles, panel descriptions, and alert rail.
 */

export const DASHBOARD_COPY = {
  /** Header subtitle (one line under greeting) */
  headerSubtitle: "Daily command. What are we cleaning today?",

  /** KPI strip — short, scannable labels */
  kpi: {
    buildingsOnRoute: "On route today",
    crewCoverage: "Crew in / required",
    inspectionsDue: "Inspections due",
    healthAtRisk: "Health at risk",
    slaAtRisk: "Open SLA",
    revenueToday: "Revenue today",
  },

  /** Main panels (left column) */
  panels: {
    route: {
      title: "What are we cleaning today?",
      description: "Sites and coverage for today's run.",
      action: "View schedule",
      emptyMap: "Operations map",
      emptyMapHint: "Territory coverage view — coming soon",
    },
    routeAndInspections: {
      title: "Route & inspections",
      description: "Today's cleaning plan and inspections due.",
      action: "Inspections",
      summary: (buildings: number, inspections: number) =>
        `${buildings} buildings on route · ${inspections} inspections`,
    },
    revenue: {
      title: "Revenue today",
      description: "Today and week-to-date.",
      action: "Financial health",
    },
  },

  /** Side rail panels */
  rail: {
    attention: {
      title: "Attention queue",
      description: "Items that need a decision or action.",
      action: "View",
    },
    healthWatchlist: {
      title: "Health watchlist",
      description: "Accounts below health threshold.",
      action: "View all",
    },
    crewStatus: {
      title: "Crew status",
      description: "Gaps and late arrivals.",
      action: "Crews",
    },
  },

  /** Alert rail (banner above or beside main content) */
  alertRail: {
    withCount: (n: number) => (n === 1 ? "1 needs attention" : `${n} need attention`),
    empty: "All caught up",
    viewQueue: "View queue",
  },
} as const;
