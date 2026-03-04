-- Ensure all branding columns exist on organizations (fixes "Could not find the 'custom_branding' column" and Save Branding / logo).
-- Run this in Supabase SQL Editor if Settings > Branding save or logo upload fails with a schema cache error.
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_branding ON organizations(custom_branding) WHERE custom_branding = true;
