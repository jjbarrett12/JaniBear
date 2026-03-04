/**
 * Single source of truth for Territory War Board: layer definitions, IDs, labels, colors, data fields.
 * All layer toggles and card field specs reference this config. No duplicated label strings.
 */

export const LAYER_IDS = [
  'layer.high_margin_zone',
  'layer.high_churn_risk',
  'layer.high_close_rate_zone',
  'layer.underserved_territory',
  'layer.competitor_saturation',
  'layer.active_bids_pending',
  'layer.cold_leads',
] as const;

export type LayerId = (typeof LAYER_IDS)[number];

export interface HeatLayerDef {
  id: LayerId;
  label: string;
  description: string;
  icon: string;
  /** Tailwind border/ring color class (e.g. border-amber-500/60) */
  colorClass: string;
  /** Data source field in HeatMetricCell.metrics */
  dataSourceField: keyof HeatMetrics;
  /** Intensity 0–1 maps to opacity/radius; rule: 'higher_better' | 'lower_better' */
  intensityRule: 'higher_better' | 'lower_better';
}

export interface HeatMetrics {
  highMargin: number;
  churnRisk: number;
  closeRate: number;
  underserved: number;
  competitorSat: number;
  activeBids: number;
  coldLeads: number;
}

export const HEAT_LAYERS: HeatLayerDef[] = [
  {
    id: 'layer.high_margin_zone',
    label: 'High-margin zone',
    description: 'Areas with above-average margin potential',
    icon: '🟡',
    colorClass: 'border-amber-500/60',
    dataSourceField: 'highMargin',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.high_churn_risk',
    label: 'High churn risk',
    description: 'Accounts or zones at risk of churn',
    icon: '🔴',
    colorClass: 'border-red-500/60',
    dataSourceField: 'churnRisk',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.high_close_rate_zone',
    label: 'High close rate zone',
    description: 'Territories with strong historical close rates',
    icon: '🟢',
    colorClass: 'border-emerald-500/60',
    dataSourceField: 'closeRate',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.underserved_territory',
    label: 'Underserved territory',
    description: 'Low coverage or few active proposals',
    icon: '🔵',
    colorClass: 'border-blue-500/60',
    dataSourceField: 'underserved',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.competitor_saturation',
    label: 'Competitor saturation',
    description: 'Areas with many competing bids',
    icon: '🟠',
    colorClass: 'border-orange-500/60',
    dataSourceField: 'competitorSat',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.active_bids_pending',
    label: 'Active bids pending',
    description: 'Buildings with proposals in progress',
    icon: '⚡',
    colorClass: 'border-yellow-400/60',
    dataSourceField: 'activeBids',
    intensityRule: 'higher_better',
  },
  {
    id: 'layer.cold_leads',
    label: 'Cold leads',
    description: 'Leads with no recent activity',
    icon: '🧊',
    colorClass: 'border-cyan-400/60',
    dataSourceField: 'coldLeads',
    intensityRule: 'higher_better',
  },
];

/** Stable key -> definition map */
export const HEAT_LAYERS_BY_ID = Object.fromEntries(
  HEAT_LAYERS.map((l) => [l.id, l])
) as Record<LayerId, HeatLayerDef>;

/** Canonical field spec for Building Intel Card. No tables; render key/value rows from this array. Keys must match BuildingIntel in types. */
export const BUILDING_INTEL_FIELD_SPEC: { key: 'name' | 'sqft' | 'estValueMonthly' | 'marginPotentialPct' | 'competitorsNearby' | 'similarWinsInZip' | 'riskScore' | 'suggestedTemplate'; label: string }[] = [
  { key: 'name', label: 'Building Name' },
  { key: 'sqft', label: 'Sq Ft' },
  { key: 'estValueMonthly', label: 'Est. cleaning value / month' },
  { key: 'marginPotentialPct', label: 'Margin potential %' },
  { key: 'competitorsNearby', label: 'Competitor saturation' },
  { key: 'similarWinsInZip', label: 'Similar accounts won in ZIP' },
  { key: 'riskScore', label: 'Risk score' },
  { key: 'suggestedTemplate', label: 'Suggested proposal template' },
];
