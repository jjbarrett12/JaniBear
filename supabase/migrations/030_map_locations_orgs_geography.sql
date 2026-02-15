-- Map feature: lat/lng for locations (customer sites); org address + lat/lng for franchisee HQs (franchisor map).
-- Operators/Franchisees: map locations + crew assignments. Franchisors: map franchisee orgs only.

-- Locations: optional coordinates for map pins (geocode from address or manual)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN locations.latitude IS 'Optional; for map display. Can be set from address geocoding or manually.';
COMMENT ON COLUMN locations.longitude IS 'Optional; for map display.';

CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON locations(org_id) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Organizations: optional address and coordinates (for franchisor map of franchisee HQs)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS address_line TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC,
  ADD COLUMN IF NOT EXISTS longitude NUMERIC;

COMMENT ON COLUMN organizations.address_line IS 'Optional org address (e.g. franchisee HQ for map).';
COMMENT ON COLUMN organizations.latitude IS 'Optional; for franchisor map of franchisee locations.';
COMMENT ON COLUMN organizations.longitude IS 'Optional; for franchisor map of franchisee locations.';
