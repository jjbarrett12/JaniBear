
-- Update Organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS seat_limit INTEGER DEFAULT 5;

-- Update Org Members Roles
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_role_check;
ALTER TABLE org_members ADD CONSTRAINT org_members_role_check 
  CHECK (role IN ('owner', 'admin', 'sales', 'ops', 'inspector', 'cleaner', 'client'));

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  billing_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rename Locations to Sites and link to Clients
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    ALTER TABLE locations RENAME TO sites;
  END IF;
END $$;

ALTER TABLE sites ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

-- Spaces (was location_areas)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_areas') THEN
    ALTER TABLE location_areas RENAME TO spaces;
    ALTER TABLE spaces RENAME COLUMN location_id TO site_id;
  END IF;
END $$;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS sqft NUMERIC;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS fixtures_jsonb JSONB DEFAULT '[]';

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  site_id UUID REFERENCES sites(id),
  stage TEXT DEFAULT 'new', 
  est_mrr NUMERIC,
  est_value NUMERIC,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ
);

-- Walkthroughs
CREATE TABLE IF NOT EXISTS walkthroughs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS walkthrough_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES walkthroughs(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('photo', 'video', 'audio')),
  storage_path TEXT NOT NULL,
  metadata_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS walkthrough_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES walkthroughs(id) ON DELETE CASCADE,
  text TEXT,
  segments_jsonb JSONB,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scope_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  walkthrough_id UUID NOT NULL REFERENCES walkthroughs(id) ON DELETE CASCADE,
  extracted_json JSONB,
  confidence NUMERIC,
  missing_fields JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Proposals to link to Opportunities
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS scope_json JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS pricing_json JSONB;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS proposal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('viewed', 'accepted', 'revised', 'emailed')),
  payload_jsonb JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks & Sequences
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  related_type TEXT,
  related_id UUID,
  assignee_id UUID REFERENCES auth.users(id),
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_type TEXT CHECK (step_type IN ('email', 'sms', 'task')),
  delay_hours INTEGER DEFAULT 0,
  template_jsonb JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  last_step_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'sms')),
  "to" TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  provider_id TEXT,
  related_type TEXT,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QC / Retention
CREATE TABLE IF NOT EXISTS inspection_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  checklist_jsonb JSONB DEFAULT '[]',
  scoring_rules_jsonb JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update Inspections
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS score NUMERIC;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS template_snapshot_jsonb JSONB; -- Snapshot of template at time of inspection

CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  score NUMERIC,
  notes TEXT,
  photos_jsonb JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issues (Update existing)
ALTER TABLE issues ADD COLUMN IF NOT EXISTS ai_tags JSONB;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  issue_id UUID REFERENCES issues(id),
  assigned_to UUID REFERENCES auth.users(id),
  due_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workload
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  hourly_cost NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workload_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  employees_count INTEGER DEFAULT 1,
  minutes_per_clean INTEGER DEFAULT 60,
  frequency_per_week INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  planned_minutes INTEGER,
  assigned_employee_ids JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'generated', 'sent')),
  generated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS client_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id),
  month DATE NOT NULL,
  html TEXT,
  pdf_path TEXT,
  sent_at TIMESTAMPTZ
);

-- RLS Policies Helper Function (if not exists)
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID) 
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members 
    WHERE org_members.org_id = is_org_member.org_id 
    AND org_members.user_id = auth.uid() 
    AND org_members.status = 'active' -- Assuming 'active' is the status for valid members (existing was undefined/null in script?)
    -- Existing schema for org_members didn't specify 'status' column in Create Table, but prompt requested it.
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Add status to org_members if missing
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended'));

-- Org Invites
CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Enable RLS on new tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthroughs ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE walkthrough_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workload_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;

-- Apply Policies (Generic for org members)
CREATE POLICY "Org members can view all" ON clients FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON client_contacts FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON opportunities FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON walkthroughs FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON walkthrough_media FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON walkthrough_transcripts FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON scope_models FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON proposal_events FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON tasks FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON sequences FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON sequence_steps FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON sequence_enrollments FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON messages FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON inspection_templates FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON inspection_items FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON work_orders FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON employees FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON workload_rules FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON shifts FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON report_runs FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON client_reports FOR ALL USING (is_org_member(org_id));
CREATE POLICY "Org members can view all" ON org_invites FOR ALL USING (is_org_member(org_id));

-- Public Proposal Access
CREATE OR REPLACE FUNCTION get_proposal_public(token_input TEXT)
RETURNS TABLE (
  proposal_html TEXT,
  scope_json JSONB,
  pricing_json JSONB,
  client_name TEXT,
  site_name TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.html as proposal_html, -- Assuming html column exists or is constructed
    p.scope_json,
    p.pricing_json,
    c.name as client_name,
    s.name as site_name
  FROM proposals p
  LEFT JOIN opportunities o ON p.opportunity_id = o.id
  LEFT JOIN clients c ON o.client_id = c.id
  LEFT JOIN sites s ON o.site_id = s.id
  WHERE p.public_token = token_input;
END;
$$ LANGUAGE plpgsql;
