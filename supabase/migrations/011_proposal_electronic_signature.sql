-- Electronic signature support for proposals (DIY, no DocuSign cost)
-- Customers can draw their signature when accepting via public link

-- Ensure proposals has html column (used by get_proposal_public)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS html TEXT;

ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS client_signature_data TEXT,
  ADD COLUMN IF NOT EXISTS client_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_signer_name TEXT;

COMMENT ON COLUMN proposals.client_signature_data IS 'Base64 PNG of drawn signature';
COMMENT ON COLUMN proposals.client_signed_at IS 'When customer electronically signed';
COMMENT ON COLUMN proposals.client_signer_name IS 'Printed/typed name of signer';

-- RPC: record signature when customer accepts via public token (no auth required)
CREATE OR REPLACE FUNCTION accept_proposal_with_signature(
  token_input TEXT,
  signer_name_input TEXT,
  signature_data_input TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal_id UUID;
  v_already_signed BOOLEAN;
BEGIN
  -- Validate inputs
  IF token_input IS NULL OR trim(token_input) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid token');
  END IF;
  IF signer_name_input IS NULL OR trim(signer_name_input) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signer name is required');
  END IF;
  IF signature_data_input IS NULL OR trim(signature_data_input) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Signature is required');
  END IF;

  -- Find proposal by token
  SELECT id, (client_signed_at IS NOT NULL) INTO v_proposal_id, v_already_signed
  FROM proposals
  WHERE public_token = token_input;

  IF v_proposal_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired link');
  END IF;

  IF v_already_signed THEN
    RETURN jsonb_build_object('success', false, 'error', 'This proposal has already been signed');
  END IF;

  -- Record signature and acceptance
  UPDATE proposals
  SET
    client_signature_data = signature_data_input,
    client_signer_name = trim(signer_name_input),
    client_signed_at = NOW(),
    accepted_at = NOW(),
    status = 'accepted'
  WHERE id = v_proposal_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update get_proposal_public to return signature status
CREATE OR REPLACE FUNCTION get_proposal_public(token_input TEXT)
RETURNS TABLE (
  proposal_html TEXT,
  scope_json JSONB,
  pricing_json JSONB,
  client_name TEXT,
  site_name TEXT,
  client_signed_at TIMESTAMPTZ,
  client_signer_name TEXT,
  client_signature_data TEXT
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.html as proposal_html,
    p.scope_json,
    p.pricing_json,
    c.name as client_name,
    s.name as site_name,
    p.client_signed_at,
    p.client_signer_name,
    p.client_signature_data
  FROM proposals p
  LEFT JOIN opportunities o ON p.opportunity_id = o.id
  LEFT JOIN clients c ON o.client_id = c.id
  LEFT JOIN sites s ON o.site_id = s.id
  WHERE p.public_token = token_input;
END;
$$ LANGUAGE plpgsql;
