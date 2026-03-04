-- Sales: Leads (import from paste, email, text, 3rd party, voice, scan)
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
-- Walk-through appointments
CREATE TABLE walkthrough_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location_address TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Proposal formulas (org-specific calculation rules)
CREATE TABLE proposal_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  formula_type TEXT NOT NULL CHECK (formula_type IN ('labor_per_sqft', 'hours_per_sqft', 'rate_per_restroom', 'custom')),
  expression TEXT,
  variables JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Proposals (link to lead and optional bid)
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  bid_id UUID REFERENCES bids(id) ON DELETE SET NULL,
  square_footage NUMERIC,
  flooring_breakdown JSONB,
  cleaning_frequency TEXT,
  suggested_crew_size INTEGER,
  ai_notes TEXT,
  total_amount NUMERIC,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_leads_org_id ON leads(org_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_walkthrough_appointments_lead_id ON walkthrough_appointments(lead_id);
CREATE INDEX idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX idx_proposal_formulas_org_id ON proposal_formulas(org_id);
-- RLS for sales tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage leads"
  ON leads FOR ALL USING (is_org_member(org_id, auth.uid()));
CREATE POLICY "Org members can manage walkthrough_appointments"
  ON walkthrough_appointments FOR ALL USING (is_org_member(org_id, auth.uid()));
CREATE POLICY "Org members can manage proposal_formulas"
  ON proposal_formulas FOR ALL USING (is_org_member(org_id, auth.uid()));
CREATE POLICY "Org members can manage proposals"
  ON proposals FOR ALL USING (is_org_member(org_id, auth.uid()));
