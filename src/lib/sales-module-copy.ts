/**
 * GRIZZLY Sales Engine — premium dark-mode revenue system for commercial janitorial sales.
 * Hunt · Book · Close · Manage. Sales war room. Revenue weapon.
 */

export const GRIZZLY = {
  name: 'GRIZZLY Sales Engine',
  tagline: 'Hunt. Book. Close. Manage.',
  modes: {
    hunt: 'Hunt',
    book: 'Book',
    close: 'Close',
    manage: 'Manage',
  },
} as const;

export const SALES_COPY = {
  command: {
    title: 'Sales Command',
    strap: 'Cockpit',
    subtitle: 'What needs action now. What’s closest to money. What’s stuck.',
    addLead: 'Add lead',
    leads: 'Leads',
  },

  kpi: {
    pipelineValue: 'Pipeline Value',
    weightedPipeline: 'Weighted Pipeline',
    revenueLikelyThisMonth: 'Revenue Likely This Month',
    proposalValueOut: 'Proposal Value Out',
    walkthroughsThisWeek: 'Walkthroughs This Week',
    stalledDeals: 'Stalled Deals',
    leadsRequiringTouchToday: 'Leads Requiring Touch Today',
    winRate: 'Win Rate',
  },

  zones: {
    huntNow: {
      title: 'Hunt Now',
      description: 'High-score leads · unworked imports · nearby · unassigned',
      empty: 'No hot leads. Add or enrich.',
      viewAll: 'View all',
    },
    bookWalkthroughs: {
      title: 'Book Walkthroughs',
      description: 'Qualified without walkthrough · follow-ups due · strong score',
      empty: 'No one ready to book.',
      viewAll: 'Walkthroughs',
    },
    moveDeals: {
      title: 'Move Deals',
      description: 'Proposal sent, no follow-up · next action due · stalled',
      empty: 'No deals needing a push.',
      viewAll: 'Pipeline',
    },
    closeRevenue: {
      title: 'Close Revenue',
      description: 'This week close targets · top value · verbal yes not pushed',
      empty: 'No deals in close window.',
      viewAll: 'Pipeline',
    },
  },

  leads: {
    title: 'Leads',
    strap: 'Target board',
    description: 'Find, enrich, qualify, convert. Pipeline starts here.',
    newLead: 'New Lead',
    overflowQueue: 'Overflow Queue',
    savedViews: {
      my_new_leads: 'My New',
      hot_leads: 'Hot',
      needs_first_touch: 'Needs First Touch',
      needs_follow_up: 'Follow-Up Due',
      ready_for_walkthrough: 'Ready for WT',
      unworked_imports: 'Unworked Imports',
      high_value_targets: 'High Value',
      referrals: 'Referrals',
      possible_duplicates: 'Possible Duplicates',
    },
    table: {
      company: 'Company',
      contact: 'Contact',
      cityState: 'City / State',
      source: 'Source',
      owner: 'Owner',
      score: 'Score',
      status: 'Status',
      nextAction: 'Next action',
      lastTouch: 'Last touch',
      noLeads: 'No leads. Create one to hunt.',
    },
    scoreTiers: { hot: 'Hot', warm: 'Warm', cold: 'Cold' },
  },

  leadDetail: {
    convert: 'Convert to opportunity',
    scheduleWalkthrough: 'Schedule walkthrough',
    logNote: 'Log note',
    nextStep: 'Next step',
    qualification: 'Qualification',
  },

  walkthroughs: {
    title: 'Walkthroughs',
    strap: 'Field schedule',
    description: 'Site assessments. Schedule, complete, then build scope and proposal.',
    newWalkthrough: 'New walkthrough',
    table: 'Table',
    calendar: 'Calendar',
    date: 'Date',
    account: 'Account',
    location: 'Location',
    rep: 'Rep',
    status: 'Status',
    noWalkthroughs: 'No walkthroughs. Schedule one.',
    createScope: 'Create scope',
  },

  proposals: {
    title: 'Proposals',
    strap: 'Revenue follow-up',
    description: 'Sent proposals. Follow up, close, or hand off to Ops.',
    newProposal: 'New proposal',
    account: 'Account',
    amount: 'Amount',
    status: 'Status',
    sentDate: 'Sent',
    daysOpen: 'Days open',
    followUp: 'Follow-up',
    noProposals: 'No proposals. Build from a walkthrough.',
    launchToOps: 'Launch to Ops',
  },

  pipeline: {
    title: 'Pipeline',
    strap: 'Kill chain',
    description: 'Opportunities by stage. Move deals toward close.',
    stage: 'Stage',
    account: 'Account',
    value: 'Value',
    expectedClose: 'Expected close',
    nextStep: 'Next step',
    stale: 'Stale',
  },

  map: {
    title: 'Territory',
    strap: 'Hunt',
    description: 'Hunt by geography. Leads, accounts, territories.',
    openMap: 'Open map',
  },

  accounts: {
    title: 'Accounts',
    strap: 'Relationships',
    description: 'Prospects and customers. Walkthroughs, scope, proposals.',
    newAccount: 'New account',
    all: 'All',
    prospects: 'Prospects',
    customers: 'Customers',
    noAccounts: 'No accounts yet.',
  },
} as const;
