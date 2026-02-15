-- Pro Gear: payment option (one-time vs financed)
ALTER TABLE pro_gear_orders
  ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('one_time', 'financed'));

ALTER TABLE pro_gear_orders
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;

COMMENT ON COLUMN pro_gear_orders.payment_type IS 'one_time = paid via Stripe; financed = invoice/financing';
COMMENT ON COLUMN pro_gear_orders.stripe_checkout_session_id IS 'Set when payment completed via Stripe Checkout';

CREATE INDEX IF NOT EXISTS idx_pro_gear_orders_stripe_session
  ON pro_gear_orders(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
