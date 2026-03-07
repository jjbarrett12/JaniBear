/**
 * Structured production logging with sanitization. Use for app/API/server-action errors,
 * auth failures, Stripe, cron, LiDAR, AI. Never log PII or secrets.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
  'stripe',
  'credential',
  'session',
  'key',
] as const;

const REDACT = '[REDACTED]';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Redact known sensitive keys (case-insensitive) from objects. */
export function sanitizeForLog<T>(payload: T): T {
  if (payload === null || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizeForLog) as T;
  if (!isPlainObject(payload)) return payload;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = REDACT;
    } else {
      out[k] = sanitizeForLog(v);
    }
  }
  return out as T;
}

/** Log level for structured console output. */
export type LogLevel = 'info' | 'warn' | 'error';

export interface LogContext {
  message: string;
  level?: LogLevel;
  /** Domain for filtering (e.g. auth, stripe, cron, lidar, ai, permission). */
  domain?: string;
  /** Safe metadata (will be sanitized). */
  meta?: Record<string, unknown>;
  /** Error to attach (message/name only; stack only in non-prod or if allowed). */
  error?: unknown;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Structured log: console + optional Sentry. No PII. */
export function logStructured(ctx: LogContext): void {
  const { message, level = 'info', domain, meta, error } = ctx;
  const payload: Record<string, unknown> = {
    message,
    level,
    ...(domain && { domain }),
    ...(meta && { meta: sanitizeForLog(meta) }),
    ...(error !== undefined && { error: getErrorMessage(error) }),
  };
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  if (typeof window !== 'undefined') {
    try {
      const Sentry = require('@sentry/nextjs');
      if (level === 'error' && Sentry?.captureException) {
        const err = error instanceof Error ? error : new Error(message);
        Sentry.captureException(err, { extra: sanitizeForLog({ domain, ...meta }) });
      }
    } catch {
      // Sentry not available or not loaded
    }
  }
}

/** Capture an exception to Sentry when available (server or client). Safe to call without Sentry. */
export function captureException(err: unknown, context?: { domain?: string; meta?: Record<string, unknown> }): void {
  const safe = context ? { extra: sanitizeForLog(context) } : undefined;
  try {
    const Sentry = require('@sentry/nextjs');
    if (Sentry?.captureException) Sentry.captureException(err, safe);
  } catch {
    // no Sentry
  }
  console.error('[observability]', getErrorMessage(err), context ? JSON.stringify(sanitizeForLog(context)) : '');
}

/** Log and capture an error (e.g. API, server action, auth denial). */
export function logError(params: {
  message: string;
  domain?: string;
  meta?: Record<string, unknown>;
  error?: unknown;
}): void {
  logStructured({ ...params, level: 'error' });
  if (params.error !== undefined) captureException(params.error, { domain: params.domain, meta: params.meta });
}

/**
 * Report an error for production observability: structured log + Sentry.
 * Use in API routes, server actions, cron, Stripe, LiDAR, AI. Domain helps filter in Sentry and logs.
 */
export function reportError(params: {
  message: string;
  domain: 'app' | 'api' | 'auth' | 'stripe' | 'cron' | 'lidar' | 'ai' | 'server-action';
  meta?: Record<string, unknown>;
  error?: unknown;
}): void {
  logError(params);
}
