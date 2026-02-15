-- Pro Gear: financing term and Stripe subscription (for 6/12 month plans)
ALTER TABLE pro_gear_orders
  ADD COLUMN IF NOT EXISTS financing_months INT CHECK (financing_months IN (6, 12));

ALTER TABLE pro_gear_orders
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

COMMENT ON COLUMN pro_gear_orders.financing_months IS 'For financed orders: 6 or 12 month term at 12% APR';
COMMENT ON COLUMN pro_gear_orders.stripe_subscription_id IS 'Stripe subscription ID when payment_type=financed and paid via Stripe';

CREATE INDEX IF NOT EXISTS idx_pro_gear_orders_stripe_subscription
  ON pro_gear_orders(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
