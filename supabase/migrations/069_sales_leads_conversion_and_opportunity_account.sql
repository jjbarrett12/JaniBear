-- ============================================
-- Sales: Lead → Opportunity conversion + link Opportunities to Accounts
-- Additive only. Enables "Convert to Opportunity" from Leads and Account-centric pipeline.
-- ============================================

-- 1) Opportunities: link to Account (prospect/customer) when using accounts model
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id) WHERE account_id IS NOT NULL;
COMMENT ON COLUMN opportunities.account_id IS 'When set, opportunity is tied to this account (prospect/customer).';

-- 2) Leads: track conversion to Opportunity and Account
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_converted_opportunity ON leads(converted_opportunity_id) WHERE converted_opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_converted_account ON leads(converted_account_id) WHERE converted_account_id IS NOT NULL;
COMMENT ON COLUMN leads.converted_opportunity_id IS 'Set when lead is converted to an opportunity (Pipeline).';
COMMENT ON COLUMN leads.converted_account_id IS 'Account (prospect) created or selected when converting to opportunity.';
