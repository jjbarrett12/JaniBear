-- ============================================================
-- RUN THIS IN SUPABASE SQL EDITOR IF YOU GET
-- "relation walkthroughs does not exist" or "relation scope_models does not exist"
--
-- This creates: sites (from locations if you have it), opportunities,
-- walkthroughs, scope_models, and the surface columns. Run in one go.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) Sites: walkthroughs need a "sites" table. If you have "locations", we create sites and copy rows.
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  square_footage NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- If you have "locations", copy into sites so walkthroughs can reference them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    INSERT INTO sites (id, org_id, name, address, city, state, zip, square_footage, notes, created_at)
    SELECT id, org_id, name, address, city, state, zip, square_footage, notes, created_at
    FROM locations
    ON CONFLICT (id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- ignore if already populated or columns differ
END $$;

-- 2) Clients (needed for opportunities)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3) Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  stage TEXT DEFAULT 'new',
  est_mrr NUMERIC,
  est_value NUMERIC,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ
);

-- 4) Walkthroughs
CREATE TABLE IF NOT EXISTS walkthroughs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) scope_models (for LiDAR/scope and surface types)
CREATE TABLE IF NOT EXISTS scope_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES walkthroughs(id) ON DELETE CASCADE,
  extracted_json JSONB,
  confidence NUMERIC,
  missing_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Ensure is_org_member(org_id) exists for RLS (one-arg version)
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 7) RLS and policy for scope_models
ALTER TABLE scope_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org members can view all" ON scope_models;
CREATE POLICY "Org members can view all" ON scope_models FOR ALL USING (is_org_member(org_id));

-- 8) Surface columns (carpet, tile, etc.)
ALTER TABLE scope_models
  ADD COLUMN IF NOT EXISTS surface_type_final JSONB,
  ADD COLUMN IF NOT EXISTS surface_type_predicted JSONB,
  ADD COLUMN IF NOT EXISTS surface_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS surface_source TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scope_models' AND column_name = 'surface_source'
  ) THEN
    ALTER TABLE scope_models DROP CONSTRAINT IF EXISTS scope_models_surface_source_check;
    ALTER TABLE scope_models ADD CONSTRAINT scope_models_surface_source_check
      CHECK (surface_source IS NULL OR surface_source IN ('manual', 'ai_suggested', 'ai_confirmed'));
  END IF;
END $$;
