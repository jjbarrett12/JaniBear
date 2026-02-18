/**
 * Mock data for Financial Health dashboard (MVP).
 * Replace with real Supabase queries when invoices, labor, AR, etc. are available.
 */

export const DATE_RANGES = ['Last 30 days', 'Last 90 days', 'Last 12 months', 'Custom'] as const;

export interface KpiTileData {
  label: string;
  value: string | number;
  delta?: number; // % vs prior period
  sparkline: number[];
  health: 'green' | 'amber' | 'red' | 'neutral';
}

export interface RevenueMonth {
  month: string;
  revenue: number;
  momPct?: number;
  recurring: number;
  oneTime: number;
}

export interface ClientRevenue {
  name: string;
  revenue: number;
}

export interface RevenueByVertical {
  name: string;
  value: number;
}

export interface MarginMonth {
  month: string;
  marginPct: number;
}

export interface WaterfallItem {
  name: string;
  value: number;
  cumulative?: number;
}

export interface ContractProfitRow {
  client: string;
  revenue: number;
  labor: number;
  supplies: number;
  marginDollars: number;
  marginPct: number;
  health: 'green' | 'amber' | 'red';
}

export interface LaborMonth {
  month: string;
  laborPct: number;
}

export interface OvertimeWeek {
  week: string;
  hours: number;
  pct: number;
}

export interface AccountBubble {
  name: string;
  revenue: number;
  marginPct: number;
  hours: number;
  health: 'green' | 'amber' | 'red';
}

export interface ArAgingBucket {
  bucket: string;
  amount: number;
  count: number;
}

export interface CashPoint {
  date: string;
  cash: number;
  forecast?: boolean;
}

export interface FinancialInsight {
  id: string;
  severity: 'red' | 'amber' | 'green';
  title: string;
  description: string;
  link?: string;
}

export interface FranchiseeScore {
  id: string;
  name: string;
  score: number;
  health: 'green' | 'amber' | 'red';
  marginPct: number;
  cashRunwayMonths: number;
  laborPct: number;
  arDays: number;
}

function last12Months(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(m.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }
  return out;
}

export function getMockKpiStrip(overrideLaborPct?: number): KpiTileData[] {
  const months = last12Months();
  const laborPct = overrideLaborPct ?? 58;
  const laborHealth: KpiTileData['health'] = laborPct > 65 ? 'red' : laborPct > 55 ? 'amber' : 'green';
  return [
    {
      label: 'Revenue (MTD)',
      value: '$42,800',
      delta: 4.2,
      sparkline: [38, 40, 39, 42, 41, 43, 42, 44, 43, 45, 44, 42.8],
      health: 'green',
    },
    {
      label: 'Gross Margin %',
      value: '52%',
      delta: -1,
      sparkline: [48, 50, 51, 52, 51, 53, 52, 52, 51, 52, 52, 52],
      health: 'amber',
    },
    {
      label: 'Labor % of Revenue',
      value: overrideLaborPct != null ? `${Math.round(overrideLaborPct)}%` : '58%',
      delta: 2,
      sparkline: [62, 60, 59, 58, 59, 57, 58, 58, 59, 58, 58, 58].map(() => laborPct),
      health: laborHealth,
    },
    {
      label: 'Net Profit %',
      value: '14%',
      delta: 0.5,
      sparkline: [10, 11, 12, 13, 13, 14, 14, 14, 13, 14, 14, 14],
      health: 'amber',
    },
    {
      label: 'Cash Runway (mo)',
      value: '3.2',
      delta: -0.3,
      sparkline: [2.5, 2.8, 3, 3.2, 3.1, 3.3, 3.2, 3.2, 3.1, 3.2, 3.2, 3.2],
      health: 'amber',
    },
    {
      label: 'AR Avg Days',
      value: '38',
      delta: 3,
      sparkline: [35, 34, 36, 37, 38, 36, 37, 38, 39, 38, 38, 38],
      health: 'amber',
    },
    {
      label: 'Revenue per Cleaner',
      value: '$5,340',
      delta: 2.1,
      sparkline: [4.8, 4.9, 5, 5.1, 5.2, 5.2, 5.3, 5.3, 5.3, 5.3, 5.34, 5.34],
      health: 'green',
    },
    {
      label: 'Bid Accuracy',
      value: '1.02',
      delta: -0.01,
      sparkline: [0.98, 0.99, 1, 1.01, 1.02, 1.01, 1.02, 1.02, 1.02, 1.02, 1.02, 1.02],
      health: 'amber',
    },
  ];
}

export function getMockRevenue12Months(): RevenueMonth[] {
  const months = last12Months();
  const rev = [38, 40, 39, 42, 41, 43, 44, 45, 44, 46, 45, 42.8];
  const recurringPct = 0.72;
  return months.map((month, i) => ({
    month,
    revenue: rev[i] ?? 0,
    momPct: i > 0 ? ((rev[i]! - rev[i - 1]!) / (rev[i - 1] ?? 1)) * 100 : undefined,
    recurring: (rev[i] ?? 0) * recurringPct,
    oneTime: (rev[i] ?? 0) * (1 - recurringPct),
  }));
}

export function getMockTop10Clients(): ClientRevenue[] {
  return [
    { name: 'Riverside Office Park', revenue: 8.2 },
    { name: 'Tech Campus West', revenue: 5.1 },
    { name: 'Medical Plaza Suite', revenue: 4.8 },
    { name: 'Downtown Financial', revenue: 4.2 },
    { name: 'Industrial Complex', revenue: 3.9 },
    { name: 'Retail Strip Mall', revenue: 3.2 },
    { name: 'School District #7', revenue: 2.8 },
    { name: 'Municipal Building', revenue: 2.5 },
    { name: 'Hotel North', revenue: 2.1 },
    { name: 'Warehouse Logistics', revenue: 1.9 },
  ];
}

export function getMockRevenueByVertical(): RevenueByVertical[] {
  return [
    { name: 'Office', value: 42 },
    { name: 'Medical', value: 18 },
    { name: 'Industrial', value: 15 },
    { name: 'Retail', value: 12 },
    { name: 'Education', value: 8 },
    { name: 'Other', value: 5 },
  ];
}

export function getMockMarginTrend(): MarginMonth[] {
  const months = last12Months();
  const pct = [48, 50, 51, 52, 51, 53, 52, 52, 51, 52, 52, 52];
  return months.map((month, i) => ({ month, marginPct: pct[i] ?? 50 }));
}

const MOCK_REVENUE = 42800;
const MOCK_LABOR_DEFAULT = 24824;
const MOCK_SUPPLIES = 3852;
const MOCK_OVERHEAD = 6420;

export function getMockWaterfall(overrideLabor?: number): WaterfallItem[] {
  const revenue = MOCK_REVENUE;
  const labor = overrideLabor ?? MOCK_LABOR_DEFAULT;
  const supplies = MOCK_SUPPLIES;
  const overhead = MOCK_OVERHEAD;
  const net = revenue - labor - supplies - overhead;
  return [
    { name: 'Revenue', value: revenue, cumulative: revenue },
    { name: 'Labor', value: -labor, cumulative: revenue - labor },
    { name: 'Supplies', value: -supplies, cumulative: revenue - labor - supplies },
    { name: 'Overhead', value: -overhead, cumulative: revenue - labor - supplies - overhead },
    { name: 'Net Profit', value: net, cumulative: revenue - labor - supplies - overhead },
  ];
}

export function getMockContractProfitability(): ContractProfitRow[] {
  return [
    { client: 'Riverside Office Park', revenue: 8200, labor: 4100, supplies: 410, marginDollars: 3690, marginPct: 45, health: 'amber' },
    { client: 'Tech Campus West', revenue: 5100, labor: 3060, supplies: 255, marginDollars: 1785, marginPct: 35, health: 'red' },
    { client: 'Medical Plaza Suite', revenue: 4800, labor: 2400, supplies: 288, marginDollars: 2112, marginPct: 44, health: 'amber' },
    { client: 'Downtown Financial', revenue: 4200, labor: 2100, supplies: 210, marginDollars: 1890, marginPct: 45, health: 'amber' },
    { client: 'Industrial Complex', revenue: 3900, labor: 1755, supplies: 195, marginDollars: 1950, marginPct: 50, health: 'green' },
    { client: 'Retail Strip Mall', revenue: 3200, labor: 1760, supplies: 160, marginDollars: 1280, marginPct: 40, health: 'red' },
    { client: 'School District #7', revenue: 2800, labor: 1400, supplies: 140, marginDollars: 1260, marginPct: 45, health: 'amber' },
    { client: 'Municipal Building', revenue: 2500, labor: 1125, supplies: 125, marginDollars: 1250, marginPct: 50, health: 'green' },
  ];
}

export function getMockLaborTrend(overrideLaborPct?: number): LaborMonth[] {
  const months = last12Months();
  const pct = overrideLaborPct ?? 58;
  const series = [62, 60, 59, 58, 59, 57, 58, 58, 59, 58, 58, 58].map(() => pct);
  return months.map((month, i) => ({ month, laborPct: series[i] ?? pct }));
}

export function getMockOvertimeWeekly(): OvertimeWeek[] {
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  return weeks.map((w, i) => ({ week: w, hours: 12 + i * 2, pct: 4 + i * 0.5 }));
}

export function getMockAccountBubbles(): AccountBubble[] {
  return [
    { name: 'Riverside', revenue: 8.2, marginPct: 45, hours: 320, health: 'amber' },
    { name: 'Tech Campus', revenue: 5.1, marginPct: 35, hours: 280, health: 'red' },
    { name: 'Medical Plaza', revenue: 4.8, marginPct: 44, hours: 240, health: 'amber' },
    { name: 'Downtown', revenue: 4.2, marginPct: 45, hours: 200, health: 'amber' },
    { name: 'Industrial', revenue: 3.9, marginPct: 50, hours: 180, health: 'green' },
    { name: 'Retail', revenue: 3.2, marginPct: 40, hours: 160, health: 'red' },
    { name: 'School', revenue: 2.8, marginPct: 45, hours: 140, health: 'amber' },
    { name: 'Municipal', revenue: 2.5, marginPct: 50, hours: 120, health: 'green' },
  ];
}

export function getMockArAging(): ArAgingBucket[] {
  return [
    { bucket: 'Current', amount: 18, count: 12 },
    { bucket: '1-30', amount: 8, count: 5 },
    { bucket: '31-60', amount: 6, count: 3 },
    { bucket: '61-90', amount: 3, count: 2 },
    { bucket: '90+', amount: 2, count: 1 },
  ];
}

export function getMockCashForecast(): CashPoint[] {
  const points: CashPoint[] = [];
  const today = new Date();
  let cash = 85000;
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i * 7);
    if (i >= 8) {
      cash = Math.max(0, cash - 12000 + (i % 2 === 0 ? 18000 : 0));
    } else {
      cash = cash + (i % 2 === 0 ? 5000 : -3000);
    }
    points.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cash,
      forecast: i >= 4,
    });
  }
  return points;
}

export function getMockInsights(): FinancialInsight[] {
  return [
    {
      id: '1',
      severity: 'red',
      title: 'Labor cost outpacing revenue',
      description: 'Labor cost outpacing revenue by 6% over last 60 days.',
      link: '#labor',
    },
    {
      id: '2',
      severity: 'amber',
      title: 'Low-margin clients',
      description: '3 clients are <15% margin—review pricing or scope creep.',
      link: '#profitability',
    },
    {
      id: '3',
      severity: 'red',
      title: 'AR aging risk',
      description: 'AR > 45 days; collections risk increasing.',
      link: '#cash',
    },
    {
      id: '4',
      severity: 'amber',
      title: 'Cash runway',
      description: 'Runway at 3.2 months—consider tightening AR or reducing variable cost.',
      link: '#cash',
    },
  ];
}

export function getMockBearScore(): number {
  return 68;
}

export function getMockTopDrivers(): { label: string; impact: string; action: string }[] {
  return [
    { label: 'Labor % of Revenue', impact: 'High labor cost vs revenue', action: 'Review staffing and pricing' },
    { label: 'AR Avg Days', impact: 'Collections slowing', action: 'Follow up on 31-60 day invoices' },
    { label: 'Gross Margin %', impact: 'Margin below target band', action: 'Check supply and labor allocation' },
  ];
}

export function getMockFranchiseeLeaderboard(): FranchiseeScore[] {
  return [
    { id: 'f1', name: 'Metro Clean Co', score: 82, health: 'green', marginPct: 56, cashRunwayMonths: 5, laborPct: 52, arDays: 28 },
    { id: 'f2', name: 'Valley Janitorial', score: 71, health: 'amber', marginPct: 48, cashRunwayMonths: 3.5, laborPct: 58, arDays: 35 },
    { id: 'f3', name: 'Coast Cleaning', score: 65, health: 'amber', marginPct: 45, cashRunwayMonths: 3, laborPct: 60, arDays: 40 },
    { id: 'f4', name: 'Inland Services', score: 54, health: 'red', marginPct: 38, cashRunwayMonths: 1.8, laborPct: 68, arDays: 48 },
    { id: 'f5', name: 'Northern Star', score: 78, health: 'green', marginPct: 52, cashRunwayMonths: 4.2, laborPct: 55, arDays: 32 },
  ];
}
