/**
 * In-memory rate limit for workspace slug resolution (per IP).
 * Use in middleware: same redirect + status + headers for blocked vs unknown vs known (no leak).
 * For multi-instance deployment, replace with Upstash Redis or similar.
 */

const WINDOW_MS = 60_000;
const BASELINE_PER_MIN = 60;
const UNKNOWN_SLUG_LIMIT_PER_MIN = 10;

type Entry = {
  count: number;
  windowStart: number;
  unknownCount: number;
  unknownWindowStart: number;
};

const store = new Map<string, Entry>();

function getOrCreate(ip: string, now: number): Entry {
  let e = store.get(ip);
  if (!e) {
    e = { count: 0, windowStart: now, unknownCount: 0, unknownWindowStart: now };
    store.set(ip, e);
    return e;
  }
  if (now - e.windowStart >= WINDOW_MS) {
    e.count = 0;
    e.windowStart = now;
  }
  if (now - e.unknownWindowStart >= WINDOW_MS) {
    e.unknownCount = 0;
    e.unknownWindowStart = now;
  }
  return e;
}

/**
 * Returns true if this IP is allowed to attempt slug resolution.
 * When false, middleware should redirect to marketing root with same response as "unknown slug".
 */
export function allowSlugResolution(ip: string): boolean {
  const now = Date.now();
  const e = getOrCreate(ip, now);
  if (e.unknownCount >= UNKNOWN_SLUG_LIMIT_PER_MIN) return false;
  if (e.count >= BASELINE_PER_MIN) return false;
  e.count += 1;
  return true;
}

/**
 * Call when slug resolution returned unknown (org not found).
 * Repeated unknown slugs from same IP get tighter limit (blocked after UNKNOWN_SLUG_LIMIT_PER_MIN per minute).
 */
export function recordUnknownSlug(ip: string): void {
  const now = Date.now();
  const e = getOrCreate(ip, now);
  e.unknownCount += 1;
}

/**
 * Get client IP from request (Edge-safe: no Node-specific APIs).
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return '0.0.0.0';
}
