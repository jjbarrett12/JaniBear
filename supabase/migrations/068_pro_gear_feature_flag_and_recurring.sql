-- ============================================
-- Pro Gear: feature flag, org scoping, savings columns, recurring orders
-- Additive only; no destructive changes.
-- ============================================

-- 1) Feature flag: org-level enable
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pro_gear_enabled BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN organizations.pro_gear_enabled IS 'When true, Member Pro Gear is visible and usable for this org.';

-- 2) Orders: org scoping + savings
ALTER TABLE pro_gear_orders ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE pro_gear_orders ADD COLUMN IF NOT EXISTS savings_total_cents INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_pro_gear_orders_org ON pro_gear_orders(org_id) WHERE org_id IS NOT NULL;

-- 3) Order items: retail/member/savings + assigned account
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS retail_price_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS member_price_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS savings_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pro_gear_order_items_assigned_account ON pro_gear_order_items(assigned_account_id) WHERE assigned_account_id IS NOT NULL;

-- 4) Cart items (optional separate cart; existing flow uses draft order)
CREATE TABLE IF NOT EXISTS pro_gear_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pro_gear_products(id) ON DELETE CASCADE,
  qty INT NOT NULL CHECK (qty > 0) DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'case' CHECK (uom IN ('box', 'case')),
  assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, product_id, uom)
);
CREATE INDEX IF NOT EXISTS idx_pro_gear_cart_items_org_user ON pro_gear_cart_items(org_id, user_id);
ALTER TABLE pro_gear_cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pro_gear_cart_items"
  ON pro_gear_cart_items FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND user_id = auth.uid());

-- 5) Recurring orders
CREATE TABLE IF NOT EXISTS pro_gear_recurring_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency_days INT NOT NULL CHECK (frequency_days IN (30, 60, 90)) DEFAULT 30,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON COLUMN pro_gear_recurring_orders.items IS 'Array of { product_id, qty, uom }';
CREATE INDEX IF NOT EXISTS idx_pro_gear_recurring_org ON pro_gear_recurring_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_pro_gear_recurring_next ON pro_gear_recurring_orders(next_run_at) WHERE is_active = true;

ALTER TABLE pro_gear_recurring_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members read pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members insert pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Org members update pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Org members delete pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- updated_at trigger for new tables
CREATE OR REPLACE FUNCTION pro_gear_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_pro_gear_cart_items_updated ON pro_gear_cart_items;
CREATE TRIGGER trg_pro_gear_cart_items_updated BEFORE UPDATE ON pro_gear_cart_items
  FOR EACH ROW EXECUTE PROCEDURE pro_gear_set_updated_at();
DROP TRIGGER IF EXISTS trg_pro_gear_recurring_updated ON pro_gear_recurring_orders;
CREATE TRIGGER trg_pro_gear_recurring_updated BEFORE UPDATE ON pro_gear_recurring_orders
  FOR EACH ROW EXECUTE PROCEDURE pro_gear_set_updated_at();
