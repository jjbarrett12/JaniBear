/**
 * JANIBEAR Enterprise color system.
 * Neutral dominance ~80%, accent ~10%, alerts ~10%.
 * Yellow (#F5C400) only for CTAs, key highlights, KPI emphasis — never large yellow backgrounds.
 */
export const colors = {
  /** Primary background — deep navy */
  navy: '#0B1220',
  /** Surface — charcoal */
  charcoal: '#111827',
  /** Card / elevated surface */
  card: '#1F2937',
  /** JANIBEAR Yellow — CTAs, highlights, KPIs only */
  accent: '#F5C400',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  /** Muted text */
  muted: '#9CA3AF',
  mutedLight: '#6B7280',
} as const;

export type ColorKey = keyof typeof colors;
