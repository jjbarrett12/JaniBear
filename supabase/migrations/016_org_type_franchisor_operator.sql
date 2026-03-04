-- JaniBear OS: Organization type (Operator | Franchisor) for joint-employer separation.
-- See JANIBEAR_OS_SYSTEM.md. Franchisors may define standards and review outcomes only;
-- operators control labor and execution.

-- Organization type: operator = labor/execution; franchisor = standards/audit only
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'operator'
  CHECK (org_type IN ('operator', 'franchisor'));
COMMENT ON COLUMN organizations.org_type IS 'operator: labor/execution; franchisor: standards/outcomes only (no labor control)';
-- RLS helpers for feature and data visibility gating
CREATE OR REPLACE FUNCTION get_org_type(p_org_id UUID)
RETURNS TEXT AS $$
  SELECT org_type FROM organizations WHERE id = p_org_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
CREATE OR REPLACE FUNCTION is_franchisor_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_org_type(p_org_id) = 'franchisor';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
CREATE OR REPLACE FUNCTION is_operator_org(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_org_type(p_org_id) = 'operator';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
-- True only for operator orgs: used to gate labor data (crews, schedules, task assignments, PII)
CREATE OR REPLACE FUNCTION org_can_see_labor_data(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT get_org_type(p_org_id) = 'operator';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
-- Optional: grant execute to authenticated for use in RLS and app
-- (SECURITY DEFINER already runs with definer rights; anon/authenticated can call if we grant)
GRANT EXECUTE ON FUNCTION get_org_type(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_franchisor_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_operator_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION org_can_see_labor_data(UUID) TO authenticated;
