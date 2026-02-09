-- ============================================
-- CLEANUP: Sales→Ops handoff, LiDAR comments, simplified permissions
-- Extends 019; no duplicate tables/enums. Idempotent.
-- ============================================

-- ---------------------------------------------------------------------------
-- 1) SALES → OPS HANDOFF
-- When opportunity is won or proposal accepted, ops needs the site and a clear handoff state.
-- Only runs if opportunities/sites exist (from migration 010).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunities') THEN
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS won_at TIMESTAMPTZ;
    ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS ops_handoff_status TEXT DEFAULT 'pending';
    ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_ops_handoff_status_check;
    ALTER TABLE opportunities ADD CONSTRAINT opportunities_ops_handoff_status_check
      CHECK (ops_handoff_status IN ('pending', 'acknowledged', 'scheduled'));
    COMMENT ON COLUMN opportunities.won_at IS 'Set when stage = won; used for Sales→Ops handoff';
    COMMENT ON COLUMN opportunities.ops_handoff_status IS 'pending = new from sales; acknowledged = ops saw it; scheduled = first schedule created';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunities')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE sites ADD COLUMN IF NOT EXISTS source_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;
    ALTER TABLE sites ADD COLUMN IF NOT EXISTS ops_handoff_at TIMESTAMPTZ;
    COMMENT ON COLUMN sites.source_opportunity_id IS 'When non-null, site was created/confirmed from a won opportunity (Sales→Ops handoff)';
    CREATE INDEX IF NOT EXISTS idx_sites_source_opportunity ON sites(source_opportunity_id) WHERE source_opportunity_id IS NOT NULL;
  END IF;
EXCEPTION WHEN undefined_table THEN
  NULL; -- opportunities/sites not created yet (010 not run); skip handoff columns
END $$;

-- ---------------------------------------------------------------------------
-- 2) LIDAR / WALKTHROUGH SCANS – sanity checks and documentation
-- One row per RoomPlan capture; multiple scans per walkthrough allowed. Only if table exists (019).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'walkthrough_scans') THEN
    COMMENT ON TABLE walkthrough_scans IS 'LiDAR/RoomPlan uploads from iOS: one row per capture; multiple scans per walkthrough allowed. Storage: org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/';
    COMMENT ON COLUMN walkthrough_scans.roomplan_raw_path IS 'Storage path to RoomPlan .usdz or exported mesh (e.g. scans/{id}/roomplan.usdz)';
    COMMENT ON COLUMN walkthrough_scans.preview_images IS 'JSON array of storage paths to preview images (thumbnails)';
    COMMENT ON COLUMN walkthrough_scans.extracted IS 'Derived data: e.g. { rooms: [{ name, sqft }], total_sqft, surfaces } from processing';
    COMMENT ON COLUMN walkthrough_scans.status IS 'Recommended: uploaded | processing | ready | failed';
    CREATE INDEX IF NOT EXISTS idx_walkthrough_scans_walkthrough_created ON walkthrough_scans(walkthrough_id, created_at DESC);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) SIMPLIFIED PERMISSIONS – single effective role
-- Use role_enum when set; otherwise fall back to role (legacy). One source of truth in app.
-- View works with or without 019 (role_enum/capabilities).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  has_enum boolean;
  has_caps boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_members' AND column_name = 'role_enum') INTO has_enum;
  SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_members' AND column_name = 'capabilities') INTO has_caps;
  IF has_enum AND has_caps THEN
    EXECUTE 'CREATE OR REPLACE VIEW org_members_effective WITH (security_invoker = on) AS
      SELECT id, org_id, user_id, status, COALESCE(role_enum::text, role) AS effective_role, capabilities, created_at FROM org_members';
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW org_members_effective WITH (security_invoker = on) AS
      SELECT id, org_id, user_id, status, role AS effective_role, ''{}''::jsonb AS capabilities, created_at FROM org_members';
  END IF;
  EXECUTE 'COMMENT ON VIEW org_members_effective IS ''Single effective role: role_enum::text when set, else role. Use this for permission checks.''';
  GRANT SELECT ON org_members_effective TO authenticated;
EXCEPTION WHEN undefined_table THEN
  NULL; -- org_members might not exist in minimal DB
END $$;

-- ---------------------------------------------------------------------------
-- 4) DEFAULT SUBSCRIPTION FOR EXISTING ORGS (optional cleanup)
-- So every org has a plan and org_has_module() works. Only if tables exist (019).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_subscriptions')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    INSERT INTO org_subscriptions (org_id, plan_code, status)
    SELECT o.id, 'op_tier2', 'active'
    FROM organizations o
    WHERE o.org_type IN ('franchisee', 'independent')
      AND NOT EXISTS (SELECT 1 FROM org_subscriptions s WHERE s.org_id = o.id)
    ON CONFLICT (org_id) DO NOTHING;
    INSERT INTO org_subscriptions (org_id, plan_code, status)
    SELECT o.id, 'fr_tier2', 'active'
    FROM organizations o
    WHERE o.org_type = 'franchisor'
      AND NOT EXISTS (SELECT 1 FROM org_subscriptions s WHERE s.org_id = o.id)
    ON CONFLICT (org_id) DO NOTHING;
  END IF;
END $$;
