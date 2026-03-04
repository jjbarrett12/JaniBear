/**
 * 8px grid system. Section padding 32–48px, card padding 24px.
 */
export const spacing = {
  grid: 8,
  /** 8px */
  xs: 8,
  /** 16px */
  sm: 16,
  /** 24px — card padding */
  md: 24,
  /** 32px — section padding min */
  lg: 32,
  /** 48px — section padding max */
  xl: 48,
  /** 64px */
  '2xl': 64,
} as const;

/** Tailwind-compatible spacing scale (use in className as p-4 = 16px, p-6 = 24px, p-8 = 32px) */
export const spacingRem = {
  0: '0',
  1: '0.25rem',   // 4
  2: '0.5rem',    // 8
  3: '0.75rem',   // 12
  4: '1rem',      // 16
  5: '1.25rem',   // 20
  6: '1.5rem',    // 24
  8: '2rem',      // 32
  10: '2.5rem',   // 40
  12: '3rem',    // 48
  16: '4rem',    // 64
} as const;
