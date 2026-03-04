-- Ensure public.leads exists (fixes "Could not find the table 'public.leads' in the schema cache").
-- Idempotent: safe to run if 008_sales_and_qc already created the table.
-- Run this in Supabase SQL Editor if new leads aren't saving, or run: supabase db push

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    CREATE TABLE leads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      source TEXT NOT NULL CHECK (source IN ('paste', 'email', 'text', 'third_party', 'voice', 'scan')),
      contact_name TEXT,
      company TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      raw_text TEXT,
      notes TEXT,
      status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'walkthrough_scheduled', 'walkthrough_done', 'proposal_sent', 'won', 'lost')),
      created_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX idx_leads_org_id ON leads(org_id);
    CREATE INDEX idx_leads_status ON leads(status);
    CREATE INDEX idx_leads_created_at ON leads(created_at);

    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Org members can manage leads"
      ON leads FOR ALL USING (is_org_member(org_id, auth.uid()));
  END IF;

  -- Add conversion columns from 069 if opportunities/accounts exist (optional)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'opportunities')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_converted_opportunity ON leads(converted_opportunity_id) WHERE converted_opportunity_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_converted_account ON leads(converted_account_id) WHERE converted_account_id IS NOT NULL;
  END IF;
END $$;
