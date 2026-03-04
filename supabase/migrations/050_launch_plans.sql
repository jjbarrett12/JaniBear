-- Launch Plan: sales → ops handoff (one per won opportunity).
-- Single new table. Additive only. locations is canonical facility.

CREATE TABLE IF NOT EXISTS public.launch_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL UNIQUE REFERENCES public.opportunities(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sales_ready','ops_ready','launched','blocked')),
  start_date date,
  sales_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ops_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ops_setup jsonb NOT NULL DEFAULT '{}'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_plans_org_id ON public.launch_plans(org_id);
CREATE INDEX IF NOT EXISTS idx_launch_plans_status_start_date ON public.launch_plans(status, start_date);
CREATE INDEX IF NOT EXISTS idx_launch_plans_location_id ON public.launch_plans(location_id);
CREATE INDEX IF NOT EXISTS idx_launch_plans_opportunity_id ON public.launch_plans(opportunity_id);

COMMENT ON TABLE public.launch_plans IS 'Sales → Ops handoff packet per opportunity; enforces completeness before launch.';

ALTER TABLE public.launch_plans ENABLE ROW LEVEL SECURITY;

-- Read: owner, manager, admin, inspector, sales, ops (client_viewer excluded)
DROP POLICY IF EXISTS "Org members read launch_plans" ON public.launch_plans;
CREATE POLICY "Org members read launch_plans"
  ON public.launch_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'inspector', 'sales', 'ops')
    )
  );

-- Write: owner, manager, admin, sales, ops only (inspector and client_viewer cannot insert/update/delete)
DROP POLICY IF EXISTS "Org members write launch_plans" ON public.launch_plans;
CREATE POLICY "Org members write launch_plans"
  ON public.launch_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

DROP POLICY IF EXISTS "Org members update delete launch_plans" ON public.launch_plans;
CREATE POLICY "Org members update delete launch_plans"
  ON public.launch_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

DROP POLICY IF EXISTS "Org members delete launch_plans" ON public.launch_plans;
CREATE POLICY "Org members delete launch_plans"
  ON public.launch_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );
