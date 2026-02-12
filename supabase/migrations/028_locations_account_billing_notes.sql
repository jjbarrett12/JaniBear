-- Add account_billing_notes to locations if missing (fixes schema cache error when adding a location)
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS account_billing_notes TEXT;
