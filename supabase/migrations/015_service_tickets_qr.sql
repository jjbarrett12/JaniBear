-- Service tickets: customer-facing ticketing (e.g. from QR scan at a location)
CREATE TABLE service_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  source TEXT NOT NULL DEFAULT 'qr' CHECK (source IN ('qr', 'manual')),
  contact_name TEXT,
  contact_phone TEXT,
  assignee_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_service_tickets_org_id ON service_tickets(org_id);
CREATE INDEX idx_service_tickets_location_id ON service_tickets(location_id);
CREATE INDEX idx_service_tickets_status ON service_tickets(status);
CREATE INDEX idx_service_tickets_created_at ON service_tickets(created_at DESC);

ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;

-- Org members can manage tickets for their org
CREATE POLICY "Org members can read service_tickets"
  ON service_tickets FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "Org writers can insert service_tickets"
  ON service_tickets FOR INSERT
  WITH CHECK (can_write_org(org_id, auth.uid()));

CREATE POLICY "Org writers can update service_tickets"
  ON service_tickets FOR UPDATE
  USING (can_write_org(org_id, auth.uid()));

-- Public: get location display name for ticket form (no auth required)
CREATE OR REPLACE FUNCTION get_public_location_display(p_location_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name TEXT;
  v_org_name TEXT;
BEGIN
  SELECT l.name, o.name INTO v_name, v_org_name
  FROM locations l
  JOIN organizations o ON o.id = l.org_id
  WHERE l.id = p_location_id;
  IF v_name IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('name', v_name, 'org_name', v_org_name);
END;
$$;

-- Public: create a service ticket from QR/form (no auth required)
CREATE OR REPLACE FUNCTION create_service_ticket_from_public(
  p_location_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_ticket_id UUID;
BEGIN
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;
  SELECT org_id INTO v_org_id FROM locations WHERE id = p_location_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid location';
  END IF;
  INSERT INTO service_tickets (org_id, location_id, title, description, contact_name, contact_phone, source, status)
  VALUES (v_org_id, p_location_id, trim(p_title), NULLIF(trim(p_description), ''), NULLIF(trim(p_contact_name), ''), NULLIF(trim(p_contact_phone), ''), 'qr', 'open')
  RETURNING id INTO v_ticket_id;
  RETURN v_ticket_id;
END;
$$;

-- Allow anon to call these functions (used by public ticket page)
GRANT EXECUTE ON FUNCTION get_public_location_display(UUID) TO anon;
GRANT EXECUTE ON FUNCTION create_service_ticket_from_public(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION set_service_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'resolved' AND (OLD.status IS DISTINCT FROM 'resolved') THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_tickets_updated_at
  BEFORE UPDATE ON service_tickets
  FOR EACH ROW EXECUTE PROCEDURE set_service_ticket_updated_at();
