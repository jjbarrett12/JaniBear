-- Pro Gear: product SKU for storefront display + contact requests for large opportunities
ALTER TABLE pro_gear_products ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE INDEX IF NOT EXISTS idx_pro_gear_products_sku ON pro_gear_products(sku) WHERE sku IS NOT NULL;

-- Contact requests: "Request to be contacted about large opportunities"
CREATE TABLE IF NOT EXISTS pro_gear_contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  estimated_quantity TEXT,
  estimated_value_cents INT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_gear_contact_requests_status ON pro_gear_contact_requests(status);
CREATE INDEX idx_pro_gear_contact_requests_created ON pro_gear_contact_requests(created_at DESC);

ALTER TABLE pro_gear_contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can read own pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins read all pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

CREATE POLICY "Admins update pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR UPDATE TO authenticated
  USING (is_pro_gear_admin());

COMMENT ON TABLE pro_gear_contact_requests IS 'Request to be contacted about large orders / bulk opportunities';
