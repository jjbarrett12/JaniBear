-- Location dashboard fields for janitorial accounts
-- Active/inactive status, square footage by flooring, restrooms, service days,
-- access codes, contacts, billing, supplies authorization, documents.

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS sqft_by_flooring_type JSONB;

COMMENT ON COLUMN locations.sqft_by_flooring_type IS 'e.g. {"carpet": 5000, "tile": 3000, "hardwood": 2000}';

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS restroom_count INTEGER;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS days_of_service TEXT;

COMMENT ON COLUMN locations.days_of_service IS 'e.g. Mon, Wed, Fri or 5x/week';

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS door_alarm_code TEXT;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS billing_contact_name TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS billing_contact_phone TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS billing_contact_email TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS billing_notes TEXT;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS authorized_to_order_supplies BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS account_billing_notes TEXT;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS contract_storage_path TEXT;

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS other_documents JSONB;

COMMENT ON COLUMN locations.other_documents IS 'Array of {name, path or url} for uploaded docs';

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS types_of_supplies_used TEXT[];

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS special_instructions TEXT;

CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
