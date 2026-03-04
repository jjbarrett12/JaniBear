/**
 * Why JaniBear — comparison table data.
 * Rows are features/criteria; columns are JANIBEAR vs competitors.
 * Values: 'yes' | 'partial' | 'no' | string (for custom label)
 */

export type ComparisonValue = 'yes' | 'partial' | 'no' | string;

export interface ComparisonColumn {
  id: string;
  name: string;
  isJaniBear?: boolean;
  description?: string;
}

export interface ComparisonRow {
  category: string;
  feature: string;
  values: Record<string, ComparisonValue>;
}

export const COMPARISON_COLUMNS: ComparisonColumn[] = [
  { id: 'janibear', name: 'JANIBEAR', isJaniBear: true, description: 'Built for commercial cleaning' },
  { id: 'orangeqc', name: 'OrangeQC', description: 'Inspections & quality control' },
  { id: 'salesforce', name: 'Salesforce', description: 'General CRM' },
  { id: 'hubspot', name: 'HubSpot', description: 'Marketing & sales CRM' },
  { id: 'servicetitan', name: 'ServiceTitan', description: 'Field service (HVAC, plumbing, etc.)' },
  { id: 'spreadsheets', name: 'Spreadsheets', description: 'Manual tracking' },
];

export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    category: 'Built for janitorial',
    feature: 'Purpose-built for commercial cleaning & janitorial',
    values: {
      janibear: 'yes',
      orangeqc: 'partial',
      salesforce: 'no',
      hubspot: 'no',
      servicetitan: 'no',
      spreadsheets: 'partial',
    },
  },
  {
    category: 'Walkthrough & scope',
    feature: 'Site walkthrough → scope (LiDAR / room capture)',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'no',
      hubspot: 'no',
      servicetitan: 'partial',
      spreadsheets: 'no',
    },
  },
  {
    category: 'Walkthrough & scope',
    feature: 'Structured cleaning zones & task lists from walkthrough',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'no',
      hubspot: 'no',
      servicetitan: 'partial',
      spreadsheets: 'no',
    },
  },
  {
    category: 'Proposals & sales',
    feature: 'Proposals & contracts from scope (same day)',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'partial',
      hubspot: 'partial',
      servicetitan: 'partial',
      spreadsheets: 'no',
    },
  },
  {
    category: 'Proposals & sales',
    feature: 'Labor & margin pricing built for cleaning',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'no',
      hubspot: 'no',
      servicetitan: 'partial',
      spreadsheets: 'partial',
    },
  },
  {
    category: 'Inspections & QC',
    feature: 'Inspections & quality control (photo, scorecards)',
    values: {
      janibear: 'yes',
      orangeqc: 'yes',
      salesforce: 'partial',
      hubspot: 'no',
      servicetitan: 'yes',
      spreadsheets: 'partial',
    },
  },
  {
    category: 'Inspections & QC',
    feature: 'Mobile-first for field crews',
    values: {
      janibear: 'yes',
      orangeqc: 'yes',
      salesforce: 'partial',
      hubspot: 'partial',
      servicetitan: 'yes',
      spreadsheets: 'no',
    },
  },
  {
    category: 'Operations',
    feature: 'Crew scheduling & task management',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'partial',
      hubspot: 'no',
      servicetitan: 'yes',
      spreadsheets: 'partial',
    },
  },
  {
    category: 'Operations',
    feature: 'Pipeline & CRM for cleaning sales',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'yes',
      hubspot: 'yes',
      servicetitan: 'yes',
      spreadsheets: 'partial',
    },
  },
  {
    category: 'Pricing & fit',
    feature: 'Pricing that scales with cleaning teams (not enterprise-only)',
    values: {
      janibear: 'yes',
      orangeqc: 'yes',
      salesforce: 'no',
      hubspot: 'partial',
      servicetitan: 'no',
      spreadsheets: 'yes',
    },
  },
  {
    category: 'Pricing & fit',
    feature: 'All-in-one: sales, scope, proposals, inspections, ops',
    values: {
      janibear: 'yes',
      orangeqc: 'no',
      salesforce: 'no',
      hubspot: 'no',
      servicetitan: 'partial',
      spreadsheets: 'partial',
    },
  },
];
