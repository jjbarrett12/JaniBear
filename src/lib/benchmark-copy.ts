/**
 * Copy for Benchmark UI: peer selector, privacy, upsell, chart labels.
 */

// --- Page ---
export const BENCHMARK_PAGE_TITLE = 'Benchmarks';
export const BENCHMARK_PAGE_DESCRIPTION =
  'Compare your key metrics to anonymized peer averages. Choose your peer group below.';

// --- Peer group selector ---
export const PEER_GROUP_SELECTOR_LABEL = 'Peer group';
export const PEER_GROUP_SELECTOR_DESCRIPTION =
  'Metrics are averaged across organizations in this group. Your data is never shown to others.';
export const VERTICAL_LABEL = 'Vertical';
export const VERTICAL_PLACEHOLDER = 'All verticals';
export const COMPANY_SIZE_LABEL = 'Company size';
export const COMPANY_SIZE_PLACEHOLDER = 'All sizes';
export const REGION_LABEL = 'Region';
export const REGION_PLACEHOLDER = 'All regions (optional)';
export const REGION_COMING_SOON = 'Coming soon';

// Vertical options (match backend / migration)
export const VERTICAL_OPTIONS = [
  { value: '', label: 'All verticals' },
  { value: 'medical', label: 'Medical' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
] as const;

// Company size buckets (match migration)
export const COMPANY_SIZE_OPTIONS = [
  { value: '', label: 'All sizes' },
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201+', label: '201+' },
] as const;

// --- Your company vs peers ---
export const YOUR_VS_PEERS_HEADING = 'Your company vs peers';
export const YOUR_VS_PEERS_PRIVACY =
  'Peer data is anonymized and aggregated. No individual company is ever identified. Your metrics are shown only to you.';
export const PEER_COUNT_LABEL = 'Peers in this group';
export const YOUR_COMPANY_LABEL = 'Your company';
export const PEER_AVG_LABEL = 'Peer average';

// --- Chart card labels ---
export const METRIC_CLOSE_RATE = 'Close rate (90d)';
export const METRIC_INSPECTION_SCORE = 'Inspection score (90d)';
export const METRIC_GROSS_MARGIN = 'Gross margin';
export const METRIC_COST_PER_SQFT = 'Cost per sq ft';
export const NO_DATA_YOU = 'No data yet';
export const NO_DATA_PEERS = 'No peer data for this group';

// --- Upsell (not opted in) ---
export const BENCHMARK_UPSELL_TITLE = 'See how you compare';
export const BENCHMARK_UPSELL_DESCRIPTION =
  'Opt in to benchmarking to compare your close rate, inspection scores, and more against anonymized peers. Your data is only ever used in aggregates—no one else can see your numbers.';
export const BENCHMARK_UPSELL_BULLET_1 = 'Anonymized peer averages by vertical and company size';
export const BENCHMARK_UPSELL_BULLET_2 = 'Your metrics stay private; only you see your comparison';
export const BENCHMARK_UPSELL_BULLET_3 = 'Improve with clear, role-relevant benchmarks';
export const BENCHMARK_UPSELL_CTA = 'Enable benchmarking';
export const BENCHMARK_UPSELL_CTA_SUBTEXT = 'Admins can turn this on in Organization settings.';
