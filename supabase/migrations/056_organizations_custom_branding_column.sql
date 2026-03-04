-- Ensure custom_branding exists (schema cache error fix when column was missing in some environments)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_branding ON organizations(custom_branding) WHERE custom_branding = true;
