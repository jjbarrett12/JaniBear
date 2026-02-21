-- CRM canonical chain: Clients (accounts) → Locations (facility) → Opportunities → Bids/Proposals + Activities & Contacts.
-- Additive only: link locations to clients, opportunities/walkthroughs to locations, bids to opportunities/walkthroughs;
-- new tables crm_activities, crm_contacts; optional client fields.
-- Supports both "locations" and "sites" as facility table (010 renamed locations→sites in some DBs).

-- =============================================================================
-- 1. Link Locations (or Sites) to Clients
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sites_client_id ON public.sites(client_id);
  END IF;
END $$;

-- =============================================================================
-- 2. Link Opportunities to Locations (canonical facility)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_opportunities_location_id ON public.opportunities(location_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_opportunities_location_id ON public.opportunities(location_id);
  END IF;
END $$;

-- =============================================================================
-- 3. Link Walkthroughs to Locations
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_walkthroughs_location_id ON public.walkthroughs(location_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_walkthroughs_location_id ON public.walkthroughs(location_id);
  END IF;
END $$;

-- =============================================================================
-- 4. Link Bids to Opportunities and Walkthroughs
-- =============================================================================
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE;
ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS walkthrough_id uuid REFERENCES public.walkthroughs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bids_opportunity_id ON public.bids(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_bids_walkthrough_id ON public.bids(walkthrough_id);

-- =============================================================================
-- 5. CRM Activities (unified timeline) — location_id added in DO block for locations/sites
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call','email','sms','meeting','task','note')),
  subject text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_activities_org_id ON public.crm_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON public.crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due_at ON public.crm_activities(due_at);
CREATE INDEX IF NOT EXISTS idx_crm_activities_client_id ON public.crm_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_location_id ON public.crm_activities(location_id) WHERE location_id IS NOT NULL;

-- =============================================================================
-- 6. CRM Contacts (lean contacts) — location_id added in DO block
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  title text,
  email text,
  phone text,
  contact_type text NOT NULL DEFAULT 'general' CHECK (contact_type IN ('decision_maker','facility','billing','emergency','general')),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_id ON public.crm_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_id ON public.crm_contacts(client_id);

-- =============================================================================
-- 7. Optional CRM fields on clients (additive, keep billing_json)
-- =============================================================================
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead','active','paused','former'));
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- 8. RLS for new tables only (org_members; do not change existing QC tables)
-- =============================================================================
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage crm_activities" ON public.crm_activities;
CREATE POLICY "Org members can manage crm_activities"
  ON public.crm_activities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_activities.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_activities.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );

DROP POLICY IF EXISTS "Org members can manage crm_contacts" ON public.crm_contacts;
CREATE POLICY "Org members can manage crm_contacts"
  ON public.crm_contacts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_contacts.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_contacts.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );
