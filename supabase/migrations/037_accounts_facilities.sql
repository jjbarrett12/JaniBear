-- Account + Facility model (single platform, seamless onboarding)
-- Account = commercial relationship + contract + billing. Facility = physical service location.
-- Facilities belong to exactly one Account. Accounts belong to exactly one Organization.

-- =============================================================================
-- 1. Accounts table
-- =============================================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  billing_contact_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  billing_terms TEXT,
  contract_value_monthly NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_org_status ON accounts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_accounts_org_name ON accounts(org_id, name);

-- =============================================================================
-- 2. Facilities table
-- =============================================================================
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  timezone TEXT,
  access_notes TEXT,
  service_notes TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facilities_org_account ON facilities(org_id, account_id);
CREATE INDEX IF NOT EXISTS idx_facilities_org_name ON facilities(org_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS facilities_one_primary_per_account
  ON facilities(account_id) WHERE (is_primary = true);

-- =============================================================================
-- 3. Mapping table for migration (location_id -> facility_id)
-- =============================================================================
CREATE TABLE IF NOT EXISTS _loc_fac_map (
  location_id UUID PRIMARY KEY,
  facility_id UUID NOT NULL
);

-- =============================================================================
-- 4. Migrate from locations (if table exists)
-- =============================================================================
DO $$
DECLARE
  loc RECORD;
  acc_id UUID;
  fac_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    FOR loc IN
      SELECT l.id, l.org_id, l.name, l.address, l.city, l.state, l.zip, l.notes, l.created_at
      FROM locations l
      ORDER BY l.created_at
    LOOP
      INSERT INTO accounts (org_id, name, status, notes, created_at, updated_at)
      VALUES (loc.org_id, loc.name, 'active', loc.notes, loc.created_at, NOW())
      RETURNING id INTO acc_id;

      INSERT INTO facilities (org_id, account_id, name, address_line1, city, state, zip, is_primary, created_at, updated_at)
      VALUES (loc.org_id, acc_id, loc.name, loc.address, loc.city, loc.state, loc.zip, true, loc.created_at, NOW())
      RETURNING id INTO fac_id;

      INSERT INTO _loc_fac_map (location_id, facility_id) VALUES (loc.id, fac_id)
      ON CONFLICT (location_id) DO UPDATE SET facility_id = EXCLUDED.facility_id;
    END LOOP;
  END IF;
END;
$$;

-- Copy optional location columns to account/facility where they exist (billing on account, access on facility)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'billing_contact_name') THEN
    UPDATE accounts a SET
      billing_contact_name = l.billing_contact_name,
      billing_email = l.billing_contact_email,
      billing_phone = l.billing_contact_phone,
      billing_terms = l.billing_notes
    FROM locations l
    JOIN _loc_fac_map m ON m.location_id = l.id
    JOIN facilities f ON f.id = m.facility_id
    WHERE a.id = f.account_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'door_alarm_code') THEN
    UPDATE facilities f SET
      access_notes = l.door_alarm_code,
      service_notes = l.special_instructions
    FROM locations l
    JOIN _loc_fac_map m ON m.location_id = l.id
    WHERE f.id = m.facility_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'locations' AND column_name = 'status') THEN
    UPDATE accounts a SET status = l.status
    FROM locations l
    JOIN _loc_fac_map m ON m.location_id = l.id
    JOIN facilities f ON f.id = m.facility_id
    WHERE a.id = f.account_id;
  END IF;
END;
$$;

-- =============================================================================
-- 5. Add facility_id to tables that reference location_id; backfill; then switch
-- =============================================================================

-- location_areas (or spaces if 010 ran)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'location_areas') AND (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN
    ALTER TABLE location_areas ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE location_areas la SET facility_id = m.facility_id FROM _loc_fac_map m WHERE la.location_id = m.location_id;
    ALTER TABLE location_areas DROP CONSTRAINT IF EXISTS location_areas_location_id_fkey;
    ALTER TABLE location_areas DROP COLUMN IF EXISTS location_id;
    ALTER TABLE location_areas ALTER COLUMN facility_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_location_areas_facility_id ON location_areas(facility_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'location_areas') THEN
    ALTER TABLE location_areas ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE location_areas la SET facility_id = m.facility_id FROM _loc_fac_map m WHERE la.location_id = m.location_id;
    CREATE INDEX IF NOT EXISTS idx_location_areas_facility_id ON location_areas(facility_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spaces') AND (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN
    ALTER TABLE spaces ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE spaces s SET facility_id = m.facility_id FROM _loc_fac_map m WHERE s.site_id = m.location_id;
    ALTER TABLE spaces DROP CONSTRAINT IF EXISTS spaces_site_id_fkey;
    ALTER TABLE spaces DROP COLUMN IF EXISTS site_id;
    ALTER TABLE spaces ALTER COLUMN facility_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_spaces_facility_id ON spaces(facility_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spaces') THEN
    ALTER TABLE spaces ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE spaces s SET facility_id = m.facility_id FROM _loc_fac_map m WHERE s.site_id = m.location_id;
    CREATE INDEX IF NOT EXISTS idx_spaces_facility_id ON spaces(facility_id);
  END IF;
END;
$$;

-- service_contracts
ALTER TABLE service_contracts ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
UPDATE service_contracts sc SET facility_id = m.facility_id FROM _loc_fac_map m WHERE sc.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE service_contracts DROP CONSTRAINT IF EXISTS service_contracts_location_id_fkey; ALTER TABLE service_contracts DROP COLUMN IF EXISTS location_id; ALTER TABLE service_contracts ALTER COLUMN facility_id SET NOT NULL; END IF; END; $$;

-- bids
ALTER TABLE bids ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
UPDATE bids b SET facility_id = m.facility_id FROM _loc_fac_map m WHERE b.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE bids DROP CONSTRAINT IF EXISTS bids_location_id_fkey; ALTER TABLE bids DROP COLUMN IF EXISTS location_id; END IF; END; $$;

-- supply_usage
ALTER TABLE supply_usage ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
UPDATE supply_usage su SET facility_id = m.facility_id FROM _loc_fac_map m WHERE su.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE supply_usage DROP CONSTRAINT IF EXISTS supply_usage_location_id_fkey; ALTER TABLE supply_usage DROP COLUMN IF EXISTS location_id; END IF; END; $$;

-- crew_assignments
ALTER TABLE crew_assignments ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
UPDATE crew_assignments ca SET facility_id = m.facility_id FROM _loc_fac_map m WHERE ca.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE crew_assignments DROP CONSTRAINT IF EXISTS crew_assignments_location_id_fkey; ALTER TABLE crew_assignments DROP COLUMN IF EXISTS location_id; ALTER TABLE crew_assignments ALTER COLUMN facility_id SET NOT NULL; END IF; END; $$;
CREATE INDEX IF NOT EXISTS idx_crew_assignments_facility_id ON crew_assignments(facility_id);

-- schedules
ALTER TABLE schedules ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
UPDATE schedules s SET facility_id = m.facility_id FROM _loc_fac_map m WHERE s.location_id = m.location_id;
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN
    ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_location_id_fkey;
    BEGIN
      ALTER TABLE schedules DROP COLUMN IF EXISTS location_id;
      ALTER TABLE schedules ALTER COLUMN facility_id SET NOT NULL;
    EXCEPTION WHEN SQLSTATE '2BP01' THEN
      NULL; -- leave location_id in place if views depend on it
    END;
  END IF;
END;
$$;
CREATE INDEX IF NOT EXISTS idx_schedules_facility_id ON schedules(facility_id);

-- inspections
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
UPDATE inspections i SET facility_id = m.facility_id FROM _loc_fac_map m WHERE i.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_location_id_fkey; ALTER TABLE inspections DROP COLUMN IF EXISTS location_id; ALTER TABLE inspections ALTER COLUMN facility_id SET NOT NULL; END IF; END; $$;
CREATE INDEX IF NOT EXISTS idx_inspections_facility_id ON inspections(facility_id);

-- issues
ALTER TABLE issues ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
UPDATE issues i SET facility_id = m.facility_id FROM _loc_fac_map m WHERE i.location_id = m.location_id;
DO $$ BEGIN IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_location_id_fkey; ALTER TABLE issues DROP COLUMN IF EXISTS location_id; ALTER TABLE issues ALTER COLUMN facility_id SET NOT NULL; END IF; END; $$;
CREATE INDEX IF NOT EXISTS idx_issues_facility_id ON issues(facility_id);

-- service_tickets (015)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_tickets') THEN
    ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE service_tickets st SET facility_id = m.facility_id FROM _loc_fac_map m WHERE st.location_id = m.location_id;
    IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 THEN
      ALTER TABLE service_tickets DROP CONSTRAINT IF EXISTS service_tickets_location_id_fkey;
      ALTER TABLE service_tickets DROP COLUMN IF EXISTS location_id;
      ALTER TABLE service_tickets ALTER COLUMN facility_id SET NOT NULL;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_service_tickets_facility_id ON service_tickets(facility_id);
  END IF;
END;
$$;

-- customer_products (013) - has location_id and unique_customer_product(org_id, client_id, location_id, product_id)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_products' AND column_name = 'location_id') THEN
    ALTER TABLE customer_products ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE;
    UPDATE customer_products cp SET facility_id = m.facility_id FROM _loc_fac_map m WHERE cp.location_id = m.location_id;
    ALTER TABLE customer_products DROP CONSTRAINT IF EXISTS unique_customer_product;
    ALTER TABLE customer_products DROP CONSTRAINT IF EXISTS customer_products_location_id_fkey;
    ALTER TABLE customer_products DROP COLUMN IF EXISTS location_id;
    ALTER TABLE customer_products ADD CONSTRAINT unique_customer_product UNIQUE (org_id, client_id, facility_id, product_id);
    CREATE INDEX IF NOT EXISTS idx_customer_products_facility_id ON customer_products(facility_id);
  END IF;
END;
$$;

-- purchase_orders (013) - location_id optional
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' AND column_name = 'location_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
    UPDATE purchase_orders po SET facility_id = m.facility_id FROM _loc_fac_map m WHERE po.location_id = m.location_id;
    ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_location_id_fkey;
    ALTER TABLE purchase_orders DROP COLUMN IF EXISTS location_id;
    CREATE INDEX IF NOT EXISTS idx_purchase_orders_facility_id ON purchase_orders(facility_id);
  END IF;
END;
$$;

-- compliance_records (007)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_records') THEN
    ALTER TABLE compliance_records ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
    UPDATE compliance_records cr SET facility_id = m.facility_id FROM _loc_fac_map m WHERE cr.location_id = m.location_id;
    ALTER TABLE compliance_records DROP CONSTRAINT IF EXISTS compliance_records_location_id_fkey;
    ALTER TABLE compliance_records DROP COLUMN IF EXISTS location_id;
    CREATE INDEX IF NOT EXISTS idx_compliance_records_facility_id ON compliance_records(facility_id);
  END IF;
END;
$$;

-- =============================================================================
-- 6. Drop locations table and mapping table
-- =============================================================================
-- Drop locations only if we migrated and no other objects depend on it
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM _loc_fac_map) > 0 AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    BEGIN
      DROP TABLE locations;
    EXCEPTION WHEN SQLSTATE '2BP01' THEN
      NULL;
    END;
  END IF;
END;
$$;
DROP TABLE IF EXISTS _loc_fac_map;

-- =============================================================================
-- 7. RLS for accounts and facilities
-- =============================================================================
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read accounts"
  ON accounts FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can insert accounts"
  ON accounts FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can update accounts"
  ON accounts FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can delete accounts"
  ON accounts FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can read facilities"
  ON facilities FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can insert facilities"
  ON facilities FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can update facilities"
  ON facilities FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org members can delete facilities"
  ON facilities FOR DELETE
  USING (is_org_member(org_id, auth.uid()));
