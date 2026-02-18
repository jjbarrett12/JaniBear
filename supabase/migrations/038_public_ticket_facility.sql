-- Update public ticket RPCs to use facility_id (after 037_accounts_facilities).

-- Public: get facility display name for ticket form (no auth required)
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
  -- Support both legacy location_id (if locations still exist) and facility_id
  SELECT f.name, o.name INTO v_name, v_org_name
  FROM facilities f
  JOIN organizations o ON o.id = f.org_id
  WHERE f.id = p_location_id;
  IF v_name IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN jsonb_build_object('name', v_name, 'org_name', v_org_name);
END;
$$;

-- Public: create a service ticket from QR/form (no auth required); use facility_id
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
  -- p_location_id is now facility_id (same UUID passed from QR/form)
  SELECT org_id INTO v_org_id FROM facilities WHERE id = p_location_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid facility';
  END IF;
  INSERT INTO service_tickets (org_id, facility_id, title, description, contact_name, contact_phone, source, status)
  VALUES (v_org_id, p_location_id, trim(p_title), NULLIF(trim(p_description), ''), NULLIF(trim(p_contact_name), ''), NULLIF(trim(p_contact_phone), ''), 'qr', 'open')
  RETURNING id INTO v_ticket_id;
  RETURN v_ticket_id;
END;
$$;
