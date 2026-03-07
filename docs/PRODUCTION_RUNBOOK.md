# JANIBEAR Production Runbook

Short operator guide for inspecting failures and key flows in production.

## Observability Stack

- **Sentry** (optional): Set `SENTRY_DSN` and optionally `NEXT_PUBLIC_SENTRY_DSN` for error tracking. App/API/server-action errors, permission denials, Stripe, cron, LiDAR, and AI failures are reported when configured. Server config uses `beforeSend` to redact sensitive keys; no PII is sent.
- **Structured logs**: JSON lines to stdout (`domain`, `message`, `meta`). Domains: `auth`, `stripe`, `cron`, `lidar`, `ai`, `api`. Sensitive fields are redacted by `sanitizeForLog`.
- **Cron tracking**: Table `public.cron_runs` stores each run: `job_name`, `started_at`, `finished_at`, `status` (running|success|failure), `error_summary`, `metadata`.

## Where to Look for Failures

| Failure type | Sentry | Logs (grep) | DB / other |
|-------------|--------|-------------|------------|
| **Cron** | Search "cron" or job name | `"domain":"cron"`, `"level":"error"` | `cron_runs` WHERE status = 'failure' |
| **Stripe / billing** | "stripe", "Webhook" | `"domain":"stripe"` | `org_billing_events`, `processed_stripe_events` |
| **LiDAR / transcribe** | Transcribe route errors | `"domain":"lidar"` | — |
| **AI** | `/api/ai/*` routes | `"domain":"ai"` | — |
| **Auth / permission** | Auth events | `[authz]`, `"domain":"auth"` | — |
| **API / server actions** | Route or action name | `"domain":"api"` or `"domain":"server-action"` | — |

## Inspecting Failures

### Failed cron jobs

```sql
SELECT id, job_name, started_at, finished_at, status, error_summary, metadata
FROM public.cron_runs
WHERE status = 'failure'
ORDER BY started_at DESC
LIMIT 50;
```

Cron job names in `cron_runs`: `payment-reminders`, `recurring-billing`, `missed-task-notifications`, `billing-daily`, `daily-operator-performance`, `sequence-processor`, `refresh-benchmark-aggregates`, `contract-renewals` (last four may not use `cron_runs` table yet; failures still go to Sentry/logs with domain `cron`).

### Recent cron runs (any status)

```sql
SELECT job_name, started_at, finished_at, status, error_summary
FROM public.cron_runs
ORDER BY started_at DESC
LIMIT 100;
```

### Billing / Stripe

- **Sentry**: Filter by tag or message containing `stripe` or `Webhook`.
- **Logs**: Grep stdout for `"domain":"stripe"` and `"level":"error"`.
- **DB**: `org_billing_events` for payment_failed, payment_recovered, subscription_canceled; `processed_stripe_events` for webhook processing status.

### LiDAR / transcribe

- **Sentry**: Errors from `/api/transcribe` (and any LiDAR ingestion routes).
- **Logs**: Grep for `"domain":"lidar"` and `"level":"error"`.

### AI jobs

- **Sentry**: Errors from `/api/ai/*` routes (staffing-suggestions, pain-points, analyze-sds, scan-schedule, compliance-suggestions, po-recommendations, invoice-notes, split-crews).
- **Logs**: Grep for `"domain":"ai"` and `"level":"error"`.

### Permission denials

- **Logs**: Grep for `[authz]` or `"domain":"auth"` and message like "Permission denied".
- **Sentry**: Auth/permission errors are captured with domain `auth` and sanitized context (no PII).

## Environment

- **Sentry**: `SENTRY_DSN` (server), `NEXT_PUBLIC_SENTRY_DSN` (client). Optional `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps and tunnel.
- **Cron**: `CRON_SECRET` (or `INTERNAL_CRON_SECRET`) must match the secret passed to cron endpoints (header `x-internal-cron-secret` or `Authorization: Bearer <secret>`).

## Adding Observability to New Code

- **Cron routes**: Use `startCronRun` / `finishCronRun` from `@/lib/observability`, or `withCronTracking(jobName, async () => { ... })` when you can throw on failure. On failure, call `logError({ message, domain: 'cron', meta: { job_name }, error })` before rethrowing so Sentry receives the event.
- **API / server actions**: Use `logError({ message, domain, meta, error })` or `reportError({ message, domain: 'api'|'ai'|'stripe'|'auth'|..., meta, error })` from `@/lib/observability`. Never log PII or secrets; the logger redacts known keys.
- **Sentry**: Errors in `app/error.tsx`, `app/global-error.tsx`, and `ErrorBoundary` are already reported when DSN is set. Route and server action errors should be logged with `logError`/`reportError` so they appear with the right domain in Sentry and logs.
