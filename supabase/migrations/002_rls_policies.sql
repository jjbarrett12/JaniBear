-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_section_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is member of org
CREATE OR REPLACE FUNCTION is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's role in org
CREATE OR REPLACE FUNCTION get_user_org_role(p_org_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM org_members
    WHERE org_id = p_org_id AND user_id = p_user_id
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can write (owner/manager/inspector)
CREATE OR REPLACE FUNCTION can_write_org(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id 
      AND user_id = p_user_id
      AND role IN ('owner', 'manager', 'inspector')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Organizations: Members can read, owners/managers can write
CREATE POLICY "Org members can read org"
  ON organizations FOR SELECT
  USING (is_org_member(id, auth.uid()));

CREATE POLICY "Owners can create org"
  ON organizations FOR INSERT
  WITH CHECK (true); -- Will be validated in app logic

CREATE POLICY "Owners can update org"
  ON organizations FOR UPDATE
  USING (get_user_org_role(id, auth.uid()) = 'owner');

-- Org members: Users can read memberships for orgs they belong to
CREATE POLICY "Users can read own memberships"
  ON org_members FOR SELECT
  USING (user_id = auth.uid() OR is_org_member(org_id, auth.uid()));

CREATE POLICY "Owners can manage members"
  ON org_members FOR ALL
  USING (get_user_org_role(org_id, auth.uid()) = 'owner');

-- Locations: Read for all members, write for owner/manager/inspector
CREATE POLICY "Org members can read locations"
  ON locations FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write locations"
  ON locations FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Location areas: Same as locations
CREATE POLICY "Org members can read location areas"
  ON location_areas FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write location areas"
  ON location_areas FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Service contracts: Same pattern
CREATE POLICY "Org members can read contracts"
  ON service_contracts FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write contracts"
  ON service_contracts FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Bids: Same pattern
CREATE POLICY "Org members can read bids"
  ON bids FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write bids"
  ON bids FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Supply usage: Same pattern
CREATE POLICY "Org members can read supply usage"
  ON supply_usage FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write supply usage"
  ON supply_usage FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Crews: Same pattern
CREATE POLICY "Org members can read crews"
  ON crews FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write crews"
  ON crews FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Crew members: Same pattern
CREATE POLICY "Org members can read crew members"
  ON crew_members FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write crew members"
  ON crew_members FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Crew assignments: Same pattern
CREATE POLICY "Org members can read crew assignments"
  ON crew_assignments FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write crew assignments"
  ON crew_assignments FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Templates: Same pattern
CREATE POLICY "Org members can read templates"
  ON templates FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write templates"
  ON templates FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Template sections: Same pattern
CREATE POLICY "Org members can read template sections"
  ON template_sections FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write template sections"
  ON template_sections FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Template items: Same pattern
CREATE POLICY "Org members can read template items"
  ON template_items FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write template items"
  ON template_items FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Schedules: Same pattern
CREATE POLICY "Org members can read schedules"
  ON schedules FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write schedules"
  ON schedules FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Task assignments: Members can read, assigned user can update completion
CREATE POLICY "Org members can read task assignments"
  ON task_assignments FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write task assignments"
  ON task_assignments FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Task completions: Assigned user can create/update their own
CREATE POLICY "Assigned user can manage completions"
  ON task_completions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta
      WHERE ta.id = task_completions.task_assignment_id
        AND ta.assigned_user_id = auth.uid()
    )
    OR can_write_org(org_id, auth.uid())
  );

-- Inspections: Same pattern
CREATE POLICY "Org members can read inspections"
  ON inspections FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write inspections"
  ON inspections FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Inspection section scores: Same pattern
CREATE POLICY "Org members can read section scores"
  ON inspection_section_scores FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write section scores"
  ON inspection_section_scores FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Inspection responses: Same pattern
CREATE POLICY "Org members can read responses"
  ON inspection_responses FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write responses"
  ON inspection_responses FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Inspection photos: Same pattern
CREATE POLICY "Org members can read inspection photos"
  ON inspection_photos FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write inspection photos"
  ON inspection_photos FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Issues: Same pattern
CREATE POLICY "Org members can read issues"
  ON issues FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write issues"
  ON issues FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Issue comments: Same pattern
CREATE POLICY "Org members can read issue comments"
  ON issue_comments FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write issue comments"
  ON issue_comments FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Issue photos: Same pattern
CREATE POLICY "Org members can read issue photos"
  ON issue_photos FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Can write issue photos"
  ON issue_photos FOR ALL
  USING (can_write_org(org_id, auth.uid()));

-- Report shares: Public read via token (handled in app route)
CREATE POLICY "Public can read via token"
  ON report_shares FOR SELECT
  USING (true); -- Token validation happens in app route
