# Stripe Webhook & Billing Event Hardening

Production hardening for Stripe webhooks: signature validation, idempotency, replay protection, duplicate prevention, failure logging, and recovery.

---

## 1. Signature validation

- **Raw body:** Handlers use `request.text()` so the body is not parsed before verification. Stripe’s signature is computed over this raw string. Do not use `request.json()` for webhook handlers.
- **Verification:** `stripe.webhooks.constructEvent(body, signature, webhookSecret)` validates the `Stripe-Signature` header (v1 scheme + timestamp). Invalid or missing signature returns **400** and the event is not processed.
- **Replay protection:** The Stripe SDK validates the request timestamp; requests outside the default tolerance (e.g. 300 seconds) are rejected. This limits replay of old signed payloads.
- **Secret:** Billing webhook uses `STRIPE_BILLING_WEBHOOK_SECRET` or `STRIPE_WEBHOOK_SECRET`. Generic `/api/webhook` uses `STRIPE_WEBHOOK_SECRET` or `STRIPE_BILLING_WEBHOOK_SECRET`. If unset, the route returns **503**.

---

## 2. Idempotency / replay protection

- **Table:** `processed_stripe_events` (migration 120).
  - `event_id` (unique) – Stripe event id (e.g. `evt_xxx`).
  - `event_type`, `status` (`processing` | `processed` | `failed`), `error_message`, `processed_at`.
- **Flow:**
  1. After signature verification, **claim** the event: insert a row with `event_id` and `status = 'processing'` (shared helper `claimStripeEvent`).
  2. If a row for `event_id` already exists, **skip** processing and return **200** so Stripe does not retry.
  3. Otherwise process the event, then call **markStripeEventProcessed(supabase, event.id, true)**.
  4. On exception call **markStripeEventProcessed(supabase, event.id, false, message)**, then log and return **500**.

Duplicate delivery of the same event is therefore processed only once; subsequent deliveries get 200 and no further billing writes.

**Shared helpers:** `src/lib/billing/stripe-webhook-utils.ts` exports `claimStripeEvent` and `markStripeEventProcessed`. Both `/api/stripe/webhook` (billing) and `/api/webhook` (pro gear, etc.) use them so the same event is never applied twice even if sent to both endpoints.

---

## 3. Duplicate seat / addon / subscription / billing-event processing

- **Seats:** Checkout and seat commits are driven by `checkout.session.completed`. That event is deduplicated by `event_id`, so seat logic runs at most once per event.
- **Addons:** `syncOrgAddonsFromSubscription` uses **upserts** on `org_addons` (`onConflict: 'org_id,addon_code'`). Re-running with the same data is safe.
- **Subscription / plan:** `organizations` and `org_subscriptions` are updated by event type; idempotency is at the **event** level, so we do not double-apply the same subscription/plan update.
- **Billing events:** `org_billing_events` has optional `stripe_event_id` (migration 121) and a unique index on `(org_id, type, stripe_event_id)` when `stripe_event_id` is set. Inserts use `insertBillingEvent()` which treats duplicate key (23505) as success so the same Stripe event cannot create duplicate billing event rows (e.g. on manual replay).

---

## 4. Failed events: logging and recovery

- **On processing error:** We call `markStripeEventProcessed(supabase, event.id, false, message)`, then `logError` with domain `stripe` and meta `event_id`, `event_type`, and return **500**.
- **Stripe retry:** Stripe retries on non-2xx. We return 500 only when we have **claimed** the event and then thrown. So the first failure is logged, the row is marked `failed`, and Stripe will retry. On retry we do **not** claim again (row exists), so we return **200** and do not reprocess. That avoids double application on retry after a partial failure.
- **Recovery:** Query `processed_stripe_events` for `status = 'failed'` to see which events failed:
  ```sql
  SELECT event_id, event_type, error_message, created_at, processed_at
  FROM processed_stripe_events
  WHERE status = 'failed'
  ORDER BY created_at DESC
  LIMIT 100;
  ```
  Replay is out-of-scope in-app; operators can re-send from Stripe Dashboard or use a separate replay tool that respects the same idempotency table (same `event_id` will be skipped).

---

## 5. Transactions

- Billing mutations run in the application layer. Supabase JS does not expose a multi-statement transaction API; each `supabase.from(...).update/insert/upsert` is its own round-trip.
- **Claim-then-process:** We claim the event (insert into `processed_stripe_events`) before any billing updates. If processing fails, the row is marked `failed` and we return 500. A retry will see the existing row and return 200 (no second run). So we do not get “half-applied” events applied again in full.
- For full atomicity (claim + all billing updates in one transaction), a Postgres function or Edge Function could run in a single transaction; that would require moving handler logic into the DB and is not implemented here.

---

## 6. Retry behavior (summary)

| Scenario | Response | Effect |
|----------|----------|--------|
| First delivery, success | 200 | Event processed; row status `processed`. |
| First delivery, failure | 500 | Event claimed; row status `failed`; Stripe will retry. |
| Retry after failure | 200 | Row exists; skip processing; no second apply. |
| Duplicate delivery (same event_id) | 200 | Row exists; skip processing. |
| Invalid/missing signature | 400 | Event not processed; not stored. |
| Webhook secret unset | 503 | No verification; event not processed. |

---

## 7. Schema and code reference

| Item | Description |
|------|-------------|
| `supabase/migrations/120_processed_stripe_events.sql` | Table for event idempotency and failure tracking. |
| `supabase/migrations/121_org_billing_events_stripe_event_id.sql` | Column `stripe_event_id` and unique index for dedupe of billing event inserts. |
| `src/lib/billing/stripe-webhook-utils.ts` | `claimStripeEvent`, `markStripeEventProcessed`, `insertBillingEvent`. |
| `src/app/api/stripe/webhook/route.ts` | Billing events: verify signature; claim; process (checkout, invoice.*, subscription.*); mark; log failures; use `insertBillingEvent` with `stripe_event_id`. |
| `src/app/api/webhook/route.ts` | Pro gear / generic: verify signature; claim; process; mark; log failures. |
| `e2e/billing-safety.e2e.ts` | Tests: no signature → 400; invalid signature → 400/503; duplicate event → both 200 and `received: true`. |

---

## 8. Tests for duplicate webhook delivery

- **E2E:** `e2e/billing-safety.e2e.ts` includes:
  - POST without signature → 400.
  - POST with invalid signature → 400 or 503.
  - Same signed event sent **twice** → both responses 200 and body `received: true` (idempotent; second request does not reprocess). Requires `E2E_STRIPE_WEBHOOK_SECRET`.
- **Manual:** In Stripe Dashboard, open a webhook event and “Resend”; the second delivery should return 200 and not change billing state.
