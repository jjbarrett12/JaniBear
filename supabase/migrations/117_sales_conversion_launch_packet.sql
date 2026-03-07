-- =============================================================================
-- 117: Sales conversion and launch packet workflow
-- Account contacts (Contact entity for accounts); launch_packets linked to opportunity and lead.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Account contacts (Contact for account/customer — lead conversion creates one)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.account_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  title TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_contacts_org ON public.account_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_account_contacts_account ON public.account_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_account_contacts_email ON public.account_contacts(account_id, email) WHERE email IS NOT NULL;

COMMENT ON TABLE public.account_contacts IS 'Contacts (people) under an account. Created on lead conversion or manually.';

ALTER TABLE public.account_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "account_contacts_org" ON public.account_contacts FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()));

-- -----------------------------------------------------------------------------
-- 2. Link opportunities to contact (account_contacts)
-- -----------------------------------------------------------------------------
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contact_id UUID;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'opportunities_contact_id_fkey' AND table_schema = 'public' AND table_name = 'opportunities'
  ) THEN
    ALTER TABLE public.opportunities ADD CONSTRAINT opportunities_contact_id_fkey
      FOREIGN KEY (contact_id) REFERENCES public.account_contacts(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_opportunities_contact ON public.opportunities(contact_id) WHERE contact_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 3. Launch packets: link to opportunity and lead
-- -----------------------------------------------------------------------------
ALTER TABLE public.launch_packets ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL;
ALTER TABLE public.launch_packets ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_launch_packets_opportunity ON public.launch_packets(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_launch_packets_lead ON public.launch_packets(lead_id) WHERE lead_id IS NOT NULL;

COMMENT ON COLUMN public.launch_packets.opportunity_id IS 'Opportunity this packet hands off from (set on conversion or when creating from won deal).';
COMMENT ON COLUMN public.launch_packets.lead_id IS 'Lead that was converted to create this packet (if applicable).';
