/**
 * Ops Command Center — microcopy for premium dark-mode ops cockpit.
 * Semantic: deployments, account health, crew coverage, service risk.
 */

export const OPS_COMMAND_COPY = {
  header: {
    title: 'Ops Command Center',
    subtitle: 'Live view of deployments, account health, crew coverage, and service risk',
  },

  kpi: {
    activeAccounts: 'Active Accounts',
    crewsScheduledToday: 'Crews Scheduled Today',
    accountsAtRisk: 'Accounts At Risk',
    openDeployments: 'Open Deployments',
    slaBreaches: 'SLA Breaches',
    revenueScheduledToday: 'Revenue Scheduled Today',
  },

  actionRail: {
    title: 'Requires Action',
    empty: 'All clear — no urgent actions.',
    withCount: (n: number) => (n === 1 ? '1 item requires action' : `${n} items require action`),
    viewQueue: 'View queue',
  },

  panels: {
    territoryCoverage: {
      title: 'Territory Coverage',
      description: 'Map view of service areas and deployment status.',
      empty: 'Territory map',
      emptyHint: 'View coverage by territory on the map.',
      action: 'Open map',
    },
    liveDeployments: {
      title: 'Live Deployments',
      description: 'Shifts and coverage status for today.',
      empty: 'No shifts for this date.',
      action: 'Manage coverage',
    },
    accountHealthWatchlist: {
      title: 'Account Health Watchlist',
      description: 'Accounts at risk — prioritize follow-up.',
      empty: 'No accounts at risk.',
      action: 'View all risk',
    },
    crewCapacity: {
      title: 'Crew Capacity',
      description: 'Backup pools and reliability.',
      empty: 'No backup pools configured.',
      action: 'Crews & pools',
    },
    upcomingGoLives: {
      title: 'Upcoming Go-Lives',
      description: 'New accounts launching soon.',
      empty: 'No upcoming go-lives.',
      action: 'Activations',
    },
  },
} as const;
