-- ============================================
-- MEMBER PRO GEAR — Members-only procurement
-- Tables: pro_gear_products, pro_gear_orders, pro_gear_order_items, pro_gear_private_label_inquiries
-- Access: authenticated + is_paid_member (profiles) or org admin bypass
-- ============================================

-- Profiles: paid member flag for Pro Gear access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_paid_member BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN profiles.is_paid_member IS 'When true, user can access Member Pro Gear; admin roles can bypass';

-- Product category enum
DO $$ BEGIN
  CREATE TYPE pro_gear_category AS ENUM ('gloves', 'equipment');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Order status enum
DO $$ BEGIN
  CREATE TYPE pro_gear_order_status AS ENUM ('draft', 'submitted', 'confirmed', 'shipped', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Private label inquiry status enum
DO $$ BEGIN
  CREATE TYPE pro_gear_inquiry_status AS ENUM ('new', 'contacted', 'quoted', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- pro_gear_products (catalog; no org — global member catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE pro_gear_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category pro_gear_category NOT NULL,
  brand TEXT,
  description TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  retail_price_cents INT,
  member_price_cents INT NOT NULL,
  savings_percent INT,
  shipping_estimate_days INT,
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  glove_fields JSONB,
  equipment_fields JSONB,
  estimated_labor_hours_saved_per_week NUMERIC,
  avg_operator_hourly_rate_cents INT NOT NULL DEFAULT 2000,
  recommended_sqft_min INT,
  recommended_sqft_max INT,
  private_label_available BOOLEAN NOT NULL DEFAULT false,
  private_label_moq_units INT,
  private_label_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_gear_products_slug ON pro_gear_products(slug);
CREATE INDEX idx_pro_gear_products_category_active ON pro_gear_products(category, active);
CREATE INDEX idx_pro_gear_products_featured ON pro_gear_products(featured) WHERE featured = true;

COMMENT ON COLUMN pro_gear_products.glove_fields IS 'Optional: material, color, thickness_mil, size_range, case_count';
COMMENT ON COLUMN pro_gear_products.equipment_fields IS 'Optional: type, power, width_in, battery, warranty_years';

-- ---------------------------------------------------------------------------
-- pro_gear_orders (user-scoped; no Stripe — order request only)
-- ---------------------------------------------------------------------------
CREATE TABLE pro_gear_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status pro_gear_order_status NOT NULL DEFAULT 'draft',
  subtotal_cents INT NOT NULL DEFAULT 0,
  shipping_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_gear_orders_user ON pro_gear_orders(user_id);
CREATE INDEX idx_pro_gear_orders_status ON pro_gear_orders(status);

-- ---------------------------------------------------------------------------
-- pro_gear_order_items
-- ---------------------------------------------------------------------------
CREATE TABLE pro_gear_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES pro_gear_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pro_gear_products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL,
  line_total_cents INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_gear_order_items_order ON pro_gear_order_items(order_id);

-- ---------------------------------------------------------------------------
-- pro_gear_private_label_inquiries
-- ---------------------------------------------------------------------------
CREATE TABLE pro_gear_private_label_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES pro_gear_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  estimated_quantity INT,
  notes TEXT,
  status pro_gear_inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_gear_pl_inquiries_product ON pro_gear_private_label_inquiries(product_id);
CREATE INDEX idx_pro_gear_pl_inquiries_user ON pro_gear_private_label_inquiries(user_id);
CREATE INDEX idx_pro_gear_pl_inquiries_status ON pro_gear_private_label_inquiries(status);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE pro_gear_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_gear_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_gear_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_gear_private_label_inquiries ENABLE ROW LEVEL SECURITY;

-- Products: authenticated can read active; admins can manage (via service role or app check)
CREATE POLICY "Authenticated read active pro_gear_products"
  ON pro_gear_products FOR SELECT TO authenticated
  USING (active = true);

-- Orders: user sees own only
CREATE POLICY "Users manage own pro_gear_orders"
  ON pro_gear_orders FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own pro_gear_order_items"
  ON pro_gear_order_items FOR ALL TO authenticated
  USING (
    order_id IN (SELECT id FROM pro_gear_orders WHERE user_id = auth.uid())
  );

-- Private label: user sees own; product required
CREATE POLICY "Users manage own pro_gear_private_label_inquiries"
  ON pro_gear_private_label_inquiries FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Admin policies: allow org admins (owner, admin, manager) to read all orders/inquiries and manage products.
-- We use a helper: user is in org_members with admin-like role (any org).
CREATE OR REPLACE FUNCTION is_pro_gear_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'manager')
    LIMIT 1
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Admins can read all products (including inactive) and update (for admin UI)
CREATE POLICY "Admins read all pro_gear_products"
  ON pro_gear_products FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins update pro_gear_products"
  ON pro_gear_products FOR UPDATE TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins insert pro_gear_products"
  ON pro_gear_products FOR INSERT TO authenticated
  WITH CHECK (is_pro_gear_admin());

-- Admins can read all orders and inquiries (for admin UI)
CREATE POLICY "Admins read all pro_gear_orders"
  ON pro_gear_orders FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins read all pro_gear_order_items"
  ON pro_gear_order_items FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins read all pro_gear_private_label_inquiries"
  ON pro_gear_private_label_inquiries FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins update pro_gear_private_label_inquiries"
  ON pro_gear_private_label_inquiries FOR UPDATE TO authenticated
  USING (is_pro_gear_admin());

GRANT EXECUTE ON FUNCTION is_pro_gear_admin() TO authenticated;
