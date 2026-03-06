/**
 * JANIBEAR schedule normalization for importer rows.
 * Converts messy janitorial schedule text into:
 * - service_schedule_raw (preserved)
 * - service_frequency_per_week (1xweek..7xweek)
 * - service_days (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
 * - days_serviced_count
 * - needs_review, review_reason
 * Does not silently guess when ambiguous.
 */

export const SERVICE_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type ServiceDay = (typeof SERVICE_DAYS)[number];

export const FREQUENCY_PER_WEEK = ['1xweek', '2xweek', '3xweek', '4xweek', '5xweek', '6xweek', '7xweek'] as const;
export type ServiceFrequencyPerWeek = (typeof FREQUENCY_PER_WEEK)[number];

export interface ParsedServiceSchedule {
  service_schedule_raw: string;
  service_frequency_per_week: ServiceFrequencyPerWeek | null;
  service_days: ServiceDay[];
  days_serviced_count: number | null;
  needs_review: boolean;
  review_reason: string | null;
}

/** Canonical day order for ranges (Mon=0 .. Sun=6). */
const DAY_INDEX: Record<ServiceDay, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};
const INDEX_TO_DAY: ServiceDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DAY_ABBREV: Record<string, ServiceDay> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  m: 'Mon', t: 'Tue', w: 'Wed', r: 'Thu', f: 'Fri', s: 'Sat', u: 'Sun',
};

const MWF: ServiceDay[] = ['Mon', 'Wed', 'Fri'];
const TTH: ServiceDay[] = ['Tue', 'Thu'];
const WEEKDAYS: ServiceDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKENDS: ServiceDay[] = ['Sat', 'Sun'];
/** Mon–Sat (6 days). */
const MON_SAT: ServiceDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Sun–Thu (5 days). */
const SUN_THU: ServiceDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

/** v1: patterns that require review (non-weekly or not fully supported). */
const REVIEW_REQUIRED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bbiweekly\b|bi-weekly|every\s*other\s*week\b/i, reason: 'Biweekly schedule; clarify which days' },
  { pattern: /\bmonthly\b|every\s*month\b|1x\s*month|once\s*a\s*month/i, reason: 'Monthly schedule not fully supported in v1' },
  { pattern: /\b2x\s*month|2xmonth|twice\s*month|2\s*times\s*per\s*month/i, reason: 'Twice monthly not fully supported in v1' },
  { pattern: /\bquarterly\b|every\s*quarter\b/i, reason: 'Quarterly schedule not fully supported in v1' },
  { pattern: /\bas\s*needed\b|on\s*call\b|as\s*required\b/i, reason: 'As needed / on call requires manual setup' },
];

function addReview(result: ParsedServiceSchedule, reason: string): void {
  result.needs_review = true;
  result.review_reason = result.review_reason ? `${result.review_reason}; ${reason}` : reason;
}

/**
 * Parse explicit day patterns:
 * MWF, Mon Wed Fri, Tue/Thu, Mon-Fri, M-F, Weekdays, Weekends,
 * Mon-Sat, Sun-Thu, Daily except Sunday.
 * Returns sorted canonical days (Mon, Tue, Wed, Thu, Fri, Sat, Sun) and whether a pattern was matched.
 */
function parseDaysFromText(raw: string): { days: ServiceDay[]; matched: boolean } {
  const lower = raw.toLowerCase().trim();
  const out: ServiceDay[] = [];
  const seen = new Set<string>();

  // Weekdays / M-F / Mon-Fri (including "Mon - Fri", "M - F")
  if (/\bweekdays?\b|\bm-f\b|m\s*[-–]\s*f\b|mon\s*[-–]\s*fri|monday\s*[-–]\s*friday/i.test(lower)) {
    WEEKDAYS.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }
  // Weekends
  if (/\bweekends?\b|sat\s*&\s*sun|saturday\s*&\s*sunday/i.test(lower)) {
    WEEKENDS.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out, matched: true };
  }
  // MWF, Mon Wed Fri, M W F, M, W, F
  if (/\bmwf\b|mon\s*wed\s*fri|m,\s*w,\s*f\b|\bm\s+w\s+f\b/i.test(lower)) {
    MWF.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out, matched: true };
  }
  // Tue/Thu, TTH, T Th, Tues Thurs
  if (/\btth\b|tue\s*thu|tue\/thu|t,\s*th\b|tues\/thurs|\bt\s+th\b/i.test(lower)) {
    TTH.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out, matched: true };
  }
  // Mon-Sat (6 days)
  if (/\bmon\s*[-–]\s*sat|monday\s*[-–]\s*saturday|mon\s*to\s*sat/i.test(lower)) {
    MON_SAT.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }
  // Sun-Thu (5 days)
  if (/\bsun\s*[-–]\s*thu|sunday\s*[-–]\s*thursday|sun\s*to\s*thu/i.test(lower)) {
    SUN_THU.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }
  // Daily except Sunday → Mon–Sat (6 days)
  if (/daily\s+except\s+sunday|every\s*day\s+except\s+sun\b/i.test(lower)) {
    MON_SAT.forEach((d) => { if (!seen.has(d)) { seen.add(d); out.push(d); } });
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }

  // Explicit day names (e.g. "Mon Wed Fri" already caught above as MWF; catch other combos)
  const dayNameRe = /\b(mon|tue|wed|thu|fri|sat|sun)(?:day)?\b/gi;
  let match: RegExpExecArray | null;
  while ((match = dayNameRe.exec(raw)) !== null) {
    const key = match[1].toLowerCase().slice(0, 3);
    const day = DAY_ABBREV[key];
    if (day && !seen.has(day)) {
      seen.add(day);
      out.push(day);
    }
  }
  if (out.length > 0) {
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }

  // Single-letter abbrevs only if no full names (e.g. "M W F" without "Mon")
  const singleRe = /\b([mtwrfsu])\b/gi;
  const singleMap: Record<string, ServiceDay> = { m: 'Mon', t: 'Tue', w: 'Wed', r: 'Thu', f: 'Fri', s: 'Sat', u: 'Sun' };
  while ((match = singleRe.exec(raw)) !== null) {
    const d = singleMap[match[1].toLowerCase()];
    if (d && !seen.has(d)) { seen.add(d); out.push(d); }
  }
  if (out.length > 0) {
    return { days: out.sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b]), matched: true };
  }

  return { days: [], matched: false };
}

/**
 * Parse weekly count:
 * - 1xweek..7xweek, 1x week, 2x week
 * - once a week, once per week, twice weekly, three times per week
 * - 5 nights
 * Returns frequency or null; dailyOrNightly when Daily/Nightly (review required); nonWeeklyReason for biweekly/monthly/etc.
 */
function parseFrequencyFromText(raw: string): {
  freq: ServiceFrequencyPerWeek | null;
  dailyOrNightly: boolean;
  nonWeeklyReason: string | null;
} {
  const lower = raw.toLowerCase().trim();
  let dailyOrNightly = false;
  let nonWeeklyReason: string | null = null;

  // Non-weekly patterns -> review in v1, no freq
  for (const { pattern, reason } of REVIEW_REQUIRED_PATTERNS) {
    if (pattern.test(lower)) {
      return { freq: null, dailyOrNightly: false, nonWeeklyReason: reason };
    }
  }

  // Nx week: 1xweek, 2xweek, 1x week, 2x week, 3x per week
  const nx = lower.match(/(\d)\s*x\s*(?:per\s*)?week|(\d)\s*times\s*(?:per\s*)?week|(\d)\s*x\s*week|(\d)x\s*week/i);
  if (nx) {
    const n = parseInt(nx[1] ?? nx[2] ?? nx[3] ?? nx[4] ?? '0', 10);
    if (n >= 1 && n <= 7) return { freq: `${n}xweek` as ServiceFrequencyPerWeek, dailyOrNightly: false, nonWeeklyReason: null };
  }

  // once a week, once per week
  if (/\bonce\s+(?:a|per)\s+week\b/i.test(lower)) return { freq: '1xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\btwice\s+weekly\b|\btwice\s+per\s+week\b|\btwo\s+times\s+per\s+week\b/i.test(lower)) return { freq: '2xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\bthree\s+times\s+per\s+week\b|\bthrice\s+weekly\b/i.test(lower)) return { freq: '3xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\b(?:four|4)\s+times\s+per\s+week\b/i.test(lower)) return { freq: '4xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\b(?:five|5)\s+times\s+per\s+week\b/i.test(lower)) return { freq: '5xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\b(?:six|6)\s+times\s+per\s+week\b/i.test(lower)) return { freq: '6xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\b(?:seven|7)\s+times\s+per\s+week\b/i.test(lower)) return { freq: '7xweek', dailyOrNightly: false, nonWeeklyReason: null };

  // N nights -> Nxweek (e.g. 5 nights)
  const nights = lower.match(/(\d)\s*nights?\b/i);
  if (nights) {
    const n = parseInt(nights[1], 10);
    if (n >= 1 && n <= 7) return { freq: `${n}xweek` as ServiceFrequencyPerWeek, dailyOrNightly: false, nonWeeklyReason: null };
  }

  // Daily except Sunday -> 6xweek, not generic daily (handled in parseDaysFromText for days)
  if (/daily\s+except\s+sunday|every\s*day\s+except\s+sun\b/i.test(lower)) {
    return { freq: '6xweek', dailyOrNightly: false, nonWeeklyReason: null };
  }
  // Daily / Nightly -> 7xweek but mark for review (unless org default exists; v1 always flag)
  if (/\bnightly\b|\bevery\s*night\b/i.test(lower)) {
    return { freq: '7xweek', dailyOrNightly: true, nonWeeklyReason: null };
  }
  if (/\bdaily\b|every\s*day\b|7\s*days?\s*(?:a\s*week)?/i.test(lower)) {
    return { freq: '7xweek', dailyOrNightly: true, nonWeeklyReason: null };
  }

  // Weekdays / Weekends (infer freq from days)
  if (/\bweekdays?\b|\bm-f\b|m\s*[-–]\s*f\b|mon\s*[-–]\s*fri/i.test(lower)) return { freq: '5xweek', dailyOrNightly: false, nonWeeklyReason: null };
  if (/\bweekends?\b/i.test(lower)) return { freq: '2xweek', dailyOrNightly: false, nonWeeklyReason: null };

  return { freq: null, dailyOrNightly: false, nonWeeklyReason: null };
}

/**
 * Parse raw schedule text into canonical fields. Original is always preserved in service_schedule_raw.
 *
 * Supports:
 * - Day patterns: MWF, Mon Wed Fri, Tue/Thu, Mon-Fri, M-F, Weekdays, Weekends, Mon-Sat, Sun-Thu, Daily except Sunday
 * - Frequency: 1xweek..7xweek, 1x week, once a week, twice weekly, three times per week, 5 nights
 * - Mixed: e.g. "3xweek Mon Wed Fri", "5x week M-F" (conflicts detected)
 *
 * Sets needs_review + review_reason when: Daily/Nightly, biweekly/monthly/quarterly/as needed/on call,
 * frequency/days conflict, or frequency given but days unclear. Does not silently guess.
 */
export function parseServiceSchedule(raw: string | null | undefined): ParsedServiceSchedule {
  const service_schedule_raw = (raw ?? '').trim().slice(0, 500);
  const result: ParsedServiceSchedule = {
    service_schedule_raw,
    service_frequency_per_week: null,
    service_days: [],
    days_serviced_count: null,
    needs_review: false,
    review_reason: null,
  };
  if (!service_schedule_raw) return result;

  // Non-weekly patterns (biweekly, monthly, etc.) -> review, no normalized freq/days
  for (const { pattern, reason } of REVIEW_REQUIRED_PATTERNS) {
    if (pattern.test(service_schedule_raw)) {
      addReview(result, reason);
      return result;
    }
  }

  const { freq, dailyOrNightly, nonWeeklyReason } = parseFrequencyFromText(service_schedule_raw);
  const { days, matched: daysMatched } = parseDaysFromText(service_schedule_raw);

  if (nonWeeklyReason) {
    addReview(result, nonWeeklyReason);
    return result;
  }

  // Daily/Nightly -> require review unless org default exists (v1: always flag)
  if (dailyOrNightly) {
    addReview(result, 'Daily or nightly schedule; confirm days or use org default');
  }

  let resolvedFreq: ServiceFrequencyPerWeek | null = freq;
  if (!resolvedFreq && days.length > 0 && days.length <= 7) {
    resolvedFreq = `${days.length}xweek` as ServiceFrequencyPerWeek;
  }

  result.service_frequency_per_week = resolvedFreq;
  result.service_days = days;
  result.days_serviced_count = days.length > 0 ? days.length : null;

  // Conflict: explicit frequency vs day count (e.g. "3xweek" but "Mon Tue Wed Thu Fri" or "5x week" but "MWF")
  if (freq != null && days.length > 0) {
    const expectedCount: Record<ServiceFrequencyPerWeek, number> = {
      '1xweek': 1, '2xweek': 2, '3xweek': 3, '4xweek': 4, '5xweek': 5, '6xweek': 6, '7xweek': 7,
    };
    const expected = expectedCount[freq];
    if (expected !== days.length) {
      addReview(result, `Schedule says ${freq} but ${days.length} day(s) specified; please confirm`);
    }
  }

  // Ambiguous: we have frequency but no days (e.g. "3xweek" only) — don't guess which days
  if (resolvedFreq && !daysMatched && !dailyOrNightly) {
    addReview(result, 'Frequency specified but days unclear; please specify days');
  }

  return result;
}
