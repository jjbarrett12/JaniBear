-- Sales cadence: templates and steps (10-touch sequence)
CREATE TABLE IF NOT EXISTS sales_cadence_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default 10-Touch Cadence',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sales_cadence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES sales_cadence_templates(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 20),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'call', 'linkedin', 'sms', 'meeting')),
  delay_days INTEGER NOT NULL DEFAULT 0,
  subject TEXT,
  body_template TEXT,
  call_script TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, step_number)
);
-- Lead enrollment in a cadence + touch log
CREATE TABLE IF NOT EXISTS lead_cadence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES sales_cadence_templates(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  current_step INTEGER DEFAULT 1,
  next_touch_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_by_user_id UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id)
);
CREATE TABLE IF NOT EXISTS lead_touch_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'call', 'linkedin', 'sms', 'meeting')),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_by_user_id UUID REFERENCES auth.users(id)
);
-- Top 10 targets per rep (relationship selling focus)
CREATE TABLE IF NOT EXISTS top_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 10),
  notes TEXT,
  relationship_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id, rank)
);
CREATE INDEX IF NOT EXISTS idx_sales_cadence_templates_org ON sales_cadence_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_sales_cadence_steps_template ON sales_cadence_steps(template_id);
CREATE INDEX IF NOT EXISTS idx_lead_cadence_enrollments_lead ON lead_cadence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_cadence_enrollments_next ON lead_cadence_enrollments(next_touch_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_lead_touch_log_lead ON lead_touch_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_top_targets_org_user ON top_targets(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_top_targets_lead ON top_targets(lead_id);
-- RLS
ALTER TABLE sales_cadence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_touch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage cadence templates"
  ON sales_cadence_templates FOR ALL USING (is_org_member(org_id, auth.uid()));
CREATE POLICY "Org members manage cadence steps"
  ON sales_cadence_steps FOR ALL USING (
    EXISTS (SELECT 1 FROM sales_cadence_templates t WHERE t.id = template_id AND is_org_member(t.org_id, auth.uid()))
  );
CREATE POLICY "Org members manage lead cadence enrollments"
  ON lead_cadence_enrollments FOR ALL USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_id AND is_org_member(l.org_id, auth.uid()))
  );
CREATE POLICY "Org members manage lead touch log"
  ON lead_touch_log FOR ALL USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = lead_id AND is_org_member(l.org_id, auth.uid()))
  );
CREATE POLICY "Org members can view top targets"
  ON top_targets FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own top targets"
  ON top_targets FOR INSERT WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own top targets"
  ON top_targets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own top targets"
  ON top_targets FOR DELETE USING (user_id = auth.uid());
