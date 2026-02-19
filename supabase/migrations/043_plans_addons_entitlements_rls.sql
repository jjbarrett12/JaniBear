-- ============================================
-- PLANS, ADD-ONS, FEATURES & ENTITLEMENTS (Phase 1)
-- Single codebase: Cub / Grizzly / Kodiak plans + HelpHubQR / LiDAR add-ons.
-- Effective entitlements = plan baseline + add-ons + tenant overrides.
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) FEATURES (fine-grained gates: lidar, helphub_qr, sales_crm, ops_qc, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_features_code ON features(code);

COMMENT ON TABLE features IS 'Feature flags for plan/addon/override gating (e.g. lidar, helphub_qr).';

-- ---------------------------------------------------------------------------
-- 2) PLAN FEATURES (which features each plan enables; plans.code exists)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_features (
  plan_code TEXT NOT NULL REFERENCES plans(code) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (plan_code, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_feature ON plan_features(feature_id);

COMMENT ON TABLE plan_features IS 'Plan baseline: which features are enabled by plan (Cub/Grizzly/Kodiak).';

-- ---------------------------------------------------------------------------
-- 3) ADDONS (HelpHubQR, LiDAR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addons_code ON addons(code);

COMMENT ON TABLE addons IS 'Add-on products (e.g. helphub_qr, lidar).';

-- ---------------------------------------------------------------------------
-- 4) ADDON FEATURES (which features each addon enables)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addon_features (
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (addon_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_addon_features_feature ON addon_features(feature_id);

-- ---------------------------------------------------------------------------
-- 5) TENANT FEATURE OVERRIDES (per-tenant force on/off; org_id = tenant_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_feature_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_feature_overrides_tenant ON tenant_feature_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_overrides_feature ON tenant_feature_overrides(feature_id);

COMMENT ON TABLE tenant_feature_overrides IS 'Per-tenant override: comping, pilots, custom contracts.';

-- ---------------------------------------------------------------------------
-- 6) ROLE PERMISSIONS (role -> feature -> can_read, can_write)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  can_read BOOLEAN NOT NULL DEFAULT false,
  can_write BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(role, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_feature ON role_permissions(feature_id);

COMMENT ON TABLE role_permissions IS 'Per-role permission within a feature (admin, manager, inspector, sales_rep, staff, customer).';

-- ---------------------------------------------------------------------------
-- 7) CUB / GRIZZLY / KODIAK plans (insert if not exist)
-- ---------------------------------------------------------------------------
INSERT INTO plans (code, org_type, tier, name, price_cents, modules) VALUES
  ('cub', 'independent', 1, 'Cub', 0, '{}'::jsonb),
  ('grizzly', 'independent', 2, 'Grizzly', 0, '{}'::jsonb),
  ('kodiak', 'independent', 3, 'Kodiak', 0, '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8) SEED FEATURES
-- ---------------------------------------------------------------------------
INSERT INTO features (code, name) VALUES
  ('lidar', 'LiDAR / Walkthrough Scans'),
  ('helphub_qr', 'HelpHub QR'),
  ('sales_crm', 'Sales & CRM'),
  ('ops_qc', 'Ops & QC'),
  ('university', 'University / Training'),
  ('supplies', 'Supplies'),
  ('inspections', 'Inspections'),
  ('tickets', 'Tickets'),
  ('admin_finance', 'Admin & Finance')
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9) PLAN FEATURES: Cub baseline, Grizzly adds, Kodiak full
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  f_lidar UUID; f_helphub UUID; f_sales UUID; f_ops UUID; f_uni UUID; f_sup UUID; f_ins UUID; f_tick UUID; f_fin UUID;
BEGIN
  SELECT id INTO f_lidar FROM features WHERE code = 'lidar' LIMIT 1;
  SELECT id INTO f_helphub FROM features WHERE code = 'helphub_qr' LIMIT 1;
  SELECT id INTO f_sales FROM features WHERE code = 'sales_crm' LIMIT 1;
  SELECT id INTO f_ops FROM features WHERE code = 'ops_qc' LIMIT 1;
  SELECT id INTO f_uni FROM features WHERE code = 'university' LIMIT 1;
  SELECT id INTO f_sup FROM features WHERE code = 'supplies' LIMIT 1;
  SELECT id INTO f_ins FROM features WHERE code = 'inspections' LIMIT 1;
  SELECT id INTO f_tick FROM features WHERE code = 'tickets' LIMIT 1;
  SELECT id INTO f_fin FROM features WHERE code = 'admin_finance' LIMIT 1;

  -- Cub: core only
  IF f_sales IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('cub', f_sales, true) ON CONFLICT DO NOTHING; END IF;
  IF f_ins IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('cub', f_ins, true) ON CONFLICT DO NOTHING; END IF;
  IF f_tick IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('cub', f_tick, true) ON CONFLICT DO NOTHING; END IF;

  -- Grizzly: + ops, supplies, university
  IF f_ops IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_ops, true) ON CONFLICT DO NOTHING; END IF;
  IF f_sup IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_sup, true) ON CONFLICT DO NOTHING; END IF;
  IF f_uni IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_uni, true) ON CONFLICT DO NOTHING; END IF;
  IF f_sales IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_sales, true) ON CONFLICT DO NOTHING; END IF;
  IF f_ins IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_ins, true) ON CONFLICT DO NOTHING; END IF;
  IF f_tick IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('grizzly', f_tick, true) ON CONFLICT DO NOTHING; END IF;

  -- Kodiak: full (+ admin_finance, lidar/helphub can be addon-only or kodiak-inclusive)
  IF f_fin IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_fin, true) ON CONFLICT DO NOTHING; END IF;
  IF f_ops IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_ops, true) ON CONFLICT DO NOTHING; END IF;
  IF f_sup IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_sup, true) ON CONFLICT DO NOTHING; END IF;
  IF f_uni IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_uni, true) ON CONFLICT DO NOTHING; END IF;
  IF f_sales IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_sales, true) ON CONFLICT DO NOTHING; END IF;
  IF f_ins IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_ins, true) ON CONFLICT DO NOTHING; END IF;
  IF f_tick IS NOT NULL THEN INSERT INTO plan_features (plan_code, feature_id, enabled) VALUES ('kodiak', f_tick, true) ON CONFLICT DO NOTHING; END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 10) SEED ADDONS (HelpHubQR, LiDAR)
-- ---------------------------------------------------------------------------
INSERT INTO addons (code, name) VALUES
  ('helphub_qr', 'HelpHub QR'),
  ('lidar', 'LiDAR')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  a_helphub UUID; a_lidar UUID; f_helphub UUID; f_lidar UUID;
BEGIN
  SELECT id INTO a_helphub FROM addons WHERE code = 'helphub_qr' LIMIT 1;
  SELECT id INTO a_lidar FROM addons WHERE code = 'lidar' LIMIT 1;
  SELECT id INTO f_helphub FROM features WHERE code = 'helphub_qr' LIMIT 1;
  SELECT id INTO f_lidar FROM features WHERE code = 'lidar' LIMIT 1;
  IF a_helphub IS NOT NULL AND f_helphub IS NOT NULL THEN INSERT INTO addon_features (addon_id, feature_id, enabled) VALUES (a_helphub, f_helphub, true) ON CONFLICT DO NOTHING; END IF;
  IF a_lidar IS NOT NULL AND f_lidar IS NOT NULL THEN INSERT INTO addon_features (addon_id, feature_id, enabled) VALUES (a_lidar, f_lidar, true) ON CONFLICT DO NOTHING; END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 11) ROLE PERMISSIONS (owner, admin, manager, inspector, sales_rep, staff, customer)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
  rid UUID;
BEGIN
  FOR r IN SELECT id, code FROM features
  LOOP
    rid := r.id;
    -- owner/admin: full read/write on all features
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('owner', rid, true, true) ON CONFLICT (role, feature_id) DO NOTHING;
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('admin', rid, true, true) ON CONFLICT (role, feature_id) DO NOTHING;
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('manager', rid, true, true) ON CONFLICT (role, feature_id) DO NOTHING;
    -- inspector: read/write inspections, tickets, ops_qc; read others
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('inspector', rid, true, r.code IN ('inspections', 'tickets', 'ops_qc', 'helphub_qr', 'lidar')) ON CONFLICT (role, feature_id) DO NOTHING;
    -- sales_rep: read/write sales_crm; read rest
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('sales_rep', rid, true, r.code = 'sales_crm') ON CONFLICT (role, feature_id) DO NOTHING;
    -- staff: read most, write inspections/tickets
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('staff', rid, true, r.code IN ('inspections', 'tickets', 'helphub_qr', 'lidar')) ON CONFLICT (role, feature_id) DO NOTHING;
    -- customer: read-only for tickets, limited
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('customer', rid, r.code IN ('tickets', 'inspections'), false) ON CONFLICT (role, feature_id) DO NOTHING;
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('client', rid, r.code IN ('tickets', 'inspections'), false) ON CONFLICT (role, feature_id) DO NOTHING;
    INSERT INTO role_permissions (role, feature_id, can_read, can_write) VALUES ('client_viewer', rid, r.code IN ('tickets', 'inspections'), false) ON CONFLICT (role, feature_id) DO NOTHING;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 12) EFFECTIVE ENTITLEMENTS: plan + addons + overrides
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_effective_entitlements(p_org_id UUID)
RETURNS TABLE (feature_code TEXT, enabled BOOLEAN)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_code TEXT;
  v_feat RECORD;
  v_from_plan BOOLEAN;
  v_from_addon BOOLEAN;
  v_override BOOLEAN;
  v_final BOOLEAN;
BEGIN
  -- Plan from org_subscriptions
  SELECT s.plan_code INTO v_plan_code
  FROM org_subscriptions s
  WHERE s.org_id = p_org_id AND s.status = 'active'
  LIMIT 1;

  -- For each feature: plan OR addon enables, then tenant override wins
  FOR v_feat IN SELECT f.id, f.code FROM features f
  LOOP
    v_from_plan := false;
    v_from_addon := false;
    v_override := NULL;

    IF v_plan_code IS NOT NULL THEN
      SELECT pf.enabled INTO v_from_plan
      FROM plan_features pf
      WHERE pf.plan_code = v_plan_code AND pf.feature_id = v_feat.id
      LIMIT 1;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM org_addons oa
      JOIN addons a ON a.code = oa.addon_code
      JOIN addon_features af ON af.addon_id = a.id AND af.feature_id = v_feat.id AND af.enabled
      WHERE oa.org_id = p_org_id AND (oa.status = 'active' OR oa.status IS NULL)
    ) INTO v_from_addon;

    SELECT tfo.enabled INTO v_override
    FROM tenant_feature_overrides tfo
    WHERE tfo.tenant_id = p_org_id AND tfo.feature_id = v_feat.id
    LIMIT 1;

    v_final := COALESCE(v_override, v_from_plan OR v_from_addon);
    feature_code := v_feat.code;
    enabled := v_final;
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;

COMMENT ON FUNCTION get_effective_entitlements(UUID) IS 'Effective feature flags for tenant: plan baseline + addons + tenant overrides.';

GRANT EXECUTE ON FUNCTION get_effective_entitlements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_effective_entitlements(UUID) TO service_role;

-- Legacy: if org uses plan with modules JSONB (fr_tier1 etc), merge those keys into effective view via helper
CREATE OR REPLACE FUNCTION org_has_feature(p_org_id UUID, p_feature_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
  v_plan_modules JSONB;
BEGIN
  SELECT e.enabled INTO v_enabled FROM get_effective_entitlements(p_org_id) e WHERE e.feature_code = p_feature_code LIMIT 1;
  IF v_enabled IS NOT NULL THEN
    RETURN v_enabled;
  END IF;
  -- Fallback: plans.modules (legacy)
  SELECT p.modules INTO v_plan_modules
  FROM org_subscriptions s
  JOIN plans p ON p.code = s.plan_code
  WHERE s.org_id = p_org_id AND s.status = 'active'
  LIMIT 1;
  RETURN (v_plan_modules->p_feature_code)::boolean = true;
END;
$$;

GRANT EXECUTE ON FUNCTION org_has_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION org_has_feature(UUID, TEXT) TO service_role;

-- ---------------------------------------------------------------------------
-- 13) RLS: features, plan_features, addons, addon_features, tenant_feature_overrides, role_permissions
-- ---------------------------------------------------------------------------
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read features"
  ON features FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read plan_features"
  ON plan_features FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read addons"
  ON addons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read addon_features"
  ON addon_features FOR SELECT TO authenticated USING (true);

-- Tenant overrides: org members can read; owners/admins can write (handled in app or separate policy)
CREATE POLICY "Org members can read tenant_feature_overrides"
  ON tenant_feature_overrides FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)));

CREATE POLICY "Org owners can manage tenant_feature_overrides"
  ON tenant_feature_overrides FOR ALL
  USING (tenant_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')))
  WITH CHECK (tenant_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')));

CREATE POLICY "Authenticated can read role_permissions"
  ON role_permissions FOR SELECT TO authenticated USING (true);
