-- Launch Packet: Sales → Ops handoff (account-centric).
-- Status: draft → review → ready → sent_to_ops → accepted | rejected.
-- Sales can move to ready; Ops can only Accept/Reject.

CREATE TABLE IF NOT EXISTS public.launch_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ops_owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'ready', 'sent_to_ops', 'accepted', 'rejected'
  )),
  payload_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  ready_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_packets_org_id ON public.launch_packets(org_id);
CREATE INDEX IF NOT EXISTS idx_launch_packets_account_id ON public.launch_packets(account_id);
CREATE INDEX IF NOT EXISTS idx_launch_packets_status ON public.launch_packets(status);
CREATE INDEX IF NOT EXISTS idx_launch_packets_ready_at ON public.launch_packets(ready_at);

COMMENT ON TABLE public.launch_packets IS 'Sales → Ops handoff; payload_jsonb: locations, scope, schedule_draft, sla, staffing, supplies, docs_refs.';

ALTER TABLE public.launch_packets ENABLE ROW LEVEL SECURITY;

-- Read: org members with sales or ops or owner/manager/admin
DROP POLICY IF EXISTS "launch_packets_select" ON public.launch_packets;
CREATE POLICY "launch_packets_select"
  ON public.launch_packets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops', 'inspector')
    )
  );

-- Insert: sales, ops, owner, manager, admin (Sales creates packets)
DROP POLICY IF EXISTS "launch_packets_insert" ON public.launch_packets;
CREATE POLICY "launch_packets_insert"
  ON public.launch_packets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

-- Update: Sales can edit until ready; Ops can only set accepted/rejected (enforced in app/API)
DROP POLICY IF EXISTS "launch_packets_update" ON public.launch_packets;
CREATE POLICY "launch_packets_update"
  ON public.launch_packets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

-- Delete: owner, manager, admin only (optional)
DROP POLICY IF EXISTS "launch_packets_delete" ON public.launch_packets;
CREATE POLICY "launch_packets_delete"
  ON public.launch_packets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin')
    )
  );
