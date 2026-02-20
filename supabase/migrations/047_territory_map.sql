-- Territory Map: quadrants, prospects, site_health, and facilities lat/lng
-- Safe migration: only adds new tables/columns/indexes if they don't exist.

-- =============================================================================
-- 1. Add lat/lng to facilities (needed for map pins)
-- =============================================================================
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_facilities_lat_lng
  ON facilities(org_id) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================================================
-- 2. Quadrants table (ops & sales map zones)
-- =============================================================================
CREATE TABLE IF NOT EXISTS quadrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('ops', 'sales')),
  name TEXT NOT NULL,
  assigned_user_id UUID NULL,
  color TEXT NULL,
  geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quadrants_org_mode ON quadrants(org_id, mode);
CREATE INDEX IF NOT EXISTS idx_quadrants_org_user ON quadrants(org_id, assigned_user_id);

-- =============================================================================
-- 3. Prospects table (sales mode pins)
-- =============================================================================
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quadrant_id UUID NULL REFERENCES quadrants(id) ON DELETE SET NULL,
  assigned_user_id UUID NULL,
  name TEXT NULL,
  industry TEXT NULL,
  address1 TEXT NULL,
  city TEXT NULL,
  state TEXT NULL,
  postal TEXT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  status TEXT NOT NULL DEFAULT 'uncontacted'
    CHECK (status IN ('uncontacted', 'contacted', 'proposal_sent', 'closed_won', 'closed_lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_org_status ON prospects(org_id, status);
CREATE INDEX IF NOT EXISTS idx_prospects_org_quadrant ON prospects(org_id, quadrant_id);
CREATE INDEX IF NOT EXISTS idx_prospects_org_user ON prospects(org_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_lat_lng ON prospects(lat, lng);

-- =============================================================================
-- 4. Site health table (ops mode health badges)
-- =============================================================================
CREATE TABLE IF NOT EXISTS site_health (
  site_id UUID PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL DEFAULT 'green'
    CHECK (health_status IN ('green', 'yellow', 'red')),
  last_inspection_at TIMESTAMPTZ NULL,
  last_inspection_score NUMERIC(5,2) NULL,
  checklist_completion_7d NUMERIC(5,2) NULL,
  open_ticket_count INT NOT NULL DEFAULT 0,
  overdue_ticket_count INT NOT NULL DEFAULT 0,
  missed_shifts_7d INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_health_org ON site_health(org_id);

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

-- Quadrants
ALTER TABLE quadrants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read quadrants"
  ON quadrants FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can insert quadrants"
  ON quadrants FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can update quadrants"
  ON quadrants FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can delete quadrants"
  ON quadrants FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

-- Prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read prospects"
  ON prospects FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can insert prospects"
  ON prospects FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can update prospects"
  ON prospects FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can delete prospects"
  ON prospects FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

-- Site Health
ALTER TABLE site_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read site_health"
  ON site_health FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can insert site_health"
  ON site_health FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can update site_health"
  ON site_health FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can delete site_health"
  ON site_health FOR DELETE
  USING (is_org_member(org_id, auth.uid()));
