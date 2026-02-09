-- ============================================
-- MULTI-ORG MODULES & TIERS (Cursor spec)
-- Extends existing tables; creates only net-new tables.
-- No duplicate tables/enums: organizations, org_members, profiles extended.
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) ORG TYPE: extend to franchisor | franchisee | independent
-- ---------------------------------------------------------------------------
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS organizations_org_type_check;

ALTER TABLE organizations
  ADD CONSTRAINT organizations_org_type_check
  CHECK (org_type IN ('franchisor', 'franchisee', 'independent'));

-- Migrate legacy 'operator' to 'independent'
UPDATE organizations SET org_type = 'independent' WHERE org_type = 'operator';

-- Re-add default for new rows
ALTER TABLE organizations ALTER COLUMN org_type SET DEFAULT 'independent';

COMMENT ON COLUMN organizations.org_type IS 'franchisor | franchisee | independent; franchisee/independent are operator orgs';

-- Update helper functions to treat franchisee + independent as operator
CREATE OR REPLACE FUNCTION is_operator_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_org_type(p_org_id) IN ('franchisee', 'independent');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION org_can_see_labor_data(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_org_type(p_org_id) IN ('franchisee', 'independent');
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- 2) MEMBERSHIP ROLES: enum + extend org_members (no new table)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM (
    'fr_admin', 'fr_sales', 'fr_ops', 'fr_hr_admin', 'fr_finance', 'fr_bizdev', 'fr_auditor',
    'op_admin', 'op_sales', 'op_ops_manager', 'op_supervisor', 'op_crew', 'op_hr_admin', 'op_finance', 'op_bizdev'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Keep existing role column as TEXT; add optional role_enum for new roles and capabilities
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS role_enum membership_role;
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '{}'::jsonb;

-- Constraint: role_enum must match org type (enforced by trigger below)
CREATE OR REPLACE FUNCTION check_membership_role_org_type()
RETURNS TRIGGER AS $$
DECLARE
  otype TEXT;
BEGIN
  IF NEW.role_enum IS NULL THEN RETURN NEW; END IF;
  SELECT org_type INTO otype FROM organizations WHERE id = NEW.org_id;
  IF otype = 'franchisor' AND NEW.role_enum::text NOT LIKE 'fr_%' THEN
    RAISE EXCEPTION 'Franchisor orgs may only have fr_* roles';
  END IF;
  IF otype IN ('franchisee', 'independent') AND NEW.role_enum::text NOT LIKE 'op_%' THEN
    RAISE EXCEPTION 'Operator orgs may only have op_* roles';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_membership_role_org_type ON org_members;
CREATE TRIGGER trg_check_membership_role_org_type
  BEFORE INSERT OR UPDATE OF org_id, role_enum ON org_members
  FOR EACH ROW EXECUTE PROCEDURE check_membership_role_org_type();

-- op_crew only for operator orgs (trigger above already restricts op_* to franchisee/independent)
COMMENT ON COLUMN org_members.role_enum IS 'New role enum; must match org_type (fr_* for franchisor, op_* for franchisee/independent)';
COMMENT ON COLUMN org_members.capabilities IS 'Fine-grained toggles: can_view_financials, can_edit_financials, can_manage_users, can_manage_crews, can_run_qc, can_order_supplies, can_connect_quickbooks';

-- ---------------------------------------------------------------------------
-- 3) FRANCHISE ASSOCIATIONS (optional; no parent/child dependency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS franchise_associations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  franchisee_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'terminated')),
  invite_code TEXT UNIQUE,
  initiated_by_org_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION check_franchise_association_org_types()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT org_type FROM organizations WHERE id = NEW.franchisor_org_id) != 'franchisor' THEN
    RAISE EXCEPTION 'franchisor_org_id must reference an org with type franchisor';
  END IF;
  IF (SELECT org_type FROM organizations WHERE id = NEW.franchisee_org_id) != 'franchisee' THEN
    RAISE EXCEPTION 'franchisee_org_id must reference an org with type franchisee';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_franchise_assoc_org_types ON franchise_associations;
CREATE TRIGGER trg_check_franchise_assoc_org_types
  BEFORE INSERT OR UPDATE OF franchisor_org_id, franchisee_org_id ON franchise_associations
  FOR EACH ROW EXECUTE PROCEDURE check_franchise_association_org_types();

CREATE UNIQUE INDEX IF NOT EXISTS idx_franchise_assoc_one_active_per_franchisee
  ON franchise_associations (franchisee_org_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_franchise_assoc_franchisor ON franchise_associations(franchisor_org_id);
CREATE INDEX IF NOT EXISTS idx_franchise_assoc_franchisee ON franchise_associations(franchisee_org_id);

-- ---------------------------------------------------------------------------
-- 4) ORG PROFILES (branding) – extend org branding; avoid duplicate with organizations.logo_url
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_profiles (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_path TEXT,
  brand_colors JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5) USER PROFILES – extend existing profiles (no user_profiles table)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_path TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
-- full_name, phone, avatar_url already exist

-- ---------------------------------------------------------------------------
-- 6) COMPLIANCE DOCUMENTS (operator + franchisor network view)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- insurance | workers_comp | w9 | sds | agreement | other
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  issued_at DATE,
  expires_at DATE,
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_documents_org ON compliance_documents(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_expires ON compliance_documents(expires_at) WHERE expires_at IS NOT NULL;

-- Sharing settings: operator shares with franchisor (association required)
CREATE TABLE IF NOT EXISTS org_sharing_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  franchisor_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flags JSONB DEFAULT '{}'::jsonb, -- share_compliance, share_kpis, share_qc, share_financials
  UNIQUE(operator_org_id, franchisor_org_id)
);

-- ---------------------------------------------------------------------------
-- 7) PLANS & SUBSCRIPTIONS (bill by section / tier)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans (
  code TEXT PRIMARY KEY,
  org_type TEXT NOT NULL CHECK (org_type IN ('franchisor', 'franchisee', 'independent')),
  tier INT NOT NULL,
  name TEXT NOT NULL,
  price_cents INT DEFAULT 0,
  modules JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON COLUMN plans.modules IS 'Map of module_key => enabled: sales, ops, finance, compliance, supplies, franchisor_brand_ops';

CREATE TABLE IF NOT EXISTS org_subscriptions (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES plans(code),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS org_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(org_id, addon_code)
);

-- ---------------------------------------------------------------------------
-- 8) ORDERS (supplies) – generic ordering; purchase_orders exists for POs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total NUMERIC(12,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_orders_org ON orders(org_id);

-- Products: add global flag if missing (spec: org_id null + global for catalog)
ALTER TABLE products ADD COLUMN IF NOT EXISTS global BOOLEAN DEFAULT false;

-- ---------------------------------------------------------------------------
-- 9) WALKTHROUGH SCANS (LiDAR / RoomPlan uploads)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS walkthrough_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES walkthroughs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'uploaded',
  device_model TEXT,
  roomplan_raw_path TEXT,
  preview_images JSONB DEFAULT '[]'::jsonb,
  extracted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_walkthrough_scans_walkthrough ON walkthrough_scans(walkthrough_id);
CREATE INDEX IF NOT EXISTS idx_walkthrough_scans_org ON walkthrough_scans(org_id);

-- ---------------------------------------------------------------------------
-- 10) INTEGRATIONS (QuickBooks etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

CREATE TABLE IF NOT EXISTS integration_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider)
);

-- ---------------------------------------------------------------------------
-- 11) ENTITLEMENTS HELPER (computed from plan + addons)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION org_has_module(p_org_id UUID, p_module_key TEXT)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (p.modules->p_module_key)::boolean FROM org_subscriptions s JOIN plans p ON p.code = s.plan_code WHERE s.org_id = p_org_id AND s.status = 'active' LIMIT 1),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION org_has_module(UUID, TEXT) TO authenticated;

-- Seed plan definitions (tier 1/2/3 per org type)
INSERT INTO plans (code, org_type, tier, name, price_cents, modules) VALUES
  ('fr_tier1', 'franchisor', 1, 'Franchisor Sales', 0, '{"sales": true, "ops": false, "finance": false, "compliance": false, "supplies": false, "franchisor_brand_ops": false}'::jsonb),
  ('fr_tier2', 'franchisor', 2, 'Franchisor Sales + Ops/Brand', 0, '{"sales": true, "ops": true, "finance": false, "compliance": false, "supplies": false, "franchisor_brand_ops": true}'::jsonb),
  ('fr_tier3', 'franchisor', 3, 'Franchisor Full', 0, '{"sales": true, "ops": true, "finance": true, "compliance": false, "supplies": false, "franchisor_brand_ops": true}'::jsonb),
  ('op_tier1', 'franchisee', 1, 'Operator Sales', 0, '{"sales": true, "ops": false, "finance": false, "compliance": false, "supplies": false}'::jsonb),
  ('op_tier2', 'franchisee', 2, 'Operator Sales + Ops', 0, '{"sales": true, "ops": true, "finance": false, "compliance": false, "supplies": false}'::jsonb),
  ('op_tier3', 'franchisee', 3, 'Operator Full', 0, '{"sales": true, "ops": true, "finance": true, "compliance": false, "supplies": false}'::jsonb),
  ('ind_tier1', 'independent', 1, 'Independent Sales', 0, '{"sales": true, "ops": false, "finance": false, "compliance": false, "supplies": false}'::jsonb),
  ('ind_tier2', 'independent', 2, 'Independent Sales + Ops', 0, '{"sales": true, "ops": true, "finance": false, "compliance": false, "supplies": false}'::jsonb),
  ('ind_tier3', 'independent', 3, 'Independent Full', 0, '{"sales": true, "ops": true, "finance": true, "compliance": false, "supplies": false}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 12) RLS (tenant isolation) – enable on new tables
-- ---------------------------------------------------------------------------
ALTER TABLE franchise_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_sharing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read plans" ON plans FOR SELECT TO authenticated USING (true);

-- Policies: members of org can read/write their org's rows
CREATE POLICY "Members can read franchise_associations for their orgs"
  ON franchise_associations FOR SELECT
  USING (
    franchisor_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    OR franchisee_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Members can manage org_profiles for their org"
  ON org_profiles FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage compliance_documents for their org"
  ON compliance_documents FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage org_sharing_settings for their org"
  ON org_sharing_settings FOR ALL
  USING (operator_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
         OR franchisor_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can read org_subscriptions for their org"
  ON org_subscriptions FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage org_addons for their org"
  ON org_addons FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage orders for their org"
  ON orders FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage order_items via orders"
  ON order_items FOR ALL
  USING (
    order_id IN (SELECT id FROM orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Members can manage walkthrough_scans for their org"
  ON walkthrough_scans FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage integrations for their org"
  ON integrations FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Members can manage integration_tokens for their org"
  ON integration_tokens FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
