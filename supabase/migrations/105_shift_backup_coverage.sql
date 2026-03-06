-- =============================================================================
-- 105: Shift Backup Coverage — backup pools, shift coverage, coverage gaps
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Backup pools (who can help where)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  territory_id UUID NULL REFERENCES public.territories(id) ON DELETE SET NULL,
  vertical_id UUID NULL REFERENCES public.verticals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backup_pools_org ON public.backup_pools(org_id);
CREATE INDEX IF NOT EXISTS idx_backup_pools_territory ON public.backup_pools(territory_id) WHERE territory_id IS NOT NULL;
ALTER TABLE public.backup_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backup pools org read"
  ON public.backup_pools FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Backup pools org write"
  ON public.backup_pools FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 2) Backup pool members (crews/franchisees in pool)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES public.backup_pools(id) ON DELETE CASCADE,
  operator_type TEXT NOT NULL CHECK (operator_type IN ('crew', 'franchisee')),
  operator_id UUID NOT NULL,
  priority INT NOT NULL DEFAULT 1,
  max_backup_shifts_per_week INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pool_id, operator_type, operator_id)
);

CREATE INDEX IF NOT EXISTS idx_backup_pool_members_pool ON public.backup_pool_members(pool_id);
ALTER TABLE public.backup_pool_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backup pool members read via pool"
  ON public.backup_pool_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.backup_pools p
      WHERE p.id = pool_id AND (public.is_org_member(p.org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
    )
  );

CREATE POLICY "Backup pool members write via pool"
  ON public.backup_pool_members FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.backup_pools p
      WHERE p.id = pool_id AND (public.is_org_member(p.org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.backup_pools p
      WHERE p.id = pool_id AND (public.is_org_member(p.org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
    )
  );

-- -----------------------------------------------------------------------------
-- 3) Shift coverage (per shift coverage state + backup assignment)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  facility_id UUID NULL REFERENCES public.facilities(id) ON DELETE SET NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  primary_operator_id UUID NULL,
  backup_operator_type TEXT NULL CHECK (backup_operator_type IN ('crew', 'franchisee')),
  backup_operator_id UUID NULL,
  coverage_status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (coverage_status IN ('scheduled', 'coverage_needed', 'backup_assigned', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_coverage_org_date ON public.shift_coverage(org_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shift_coverage_status ON public.shift_coverage(org_id, coverage_status) WHERE coverage_status = 'coverage_needed';
CREATE INDEX IF NOT EXISTS idx_shift_coverage_facility ON public.shift_coverage(facility_id) WHERE facility_id IS NOT NULL;
ALTER TABLE public.shift_coverage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shift coverage org read"
  ON public.shift_coverage FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Shift coverage org write"
  ON public.shift_coverage FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) Shift coverage events (audit)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_coverage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shift_coverage_id UUID NOT NULL REFERENCES public.shift_coverage(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_coverage_events_shift ON public.shift_coverage_events(shift_coverage_id);
ALTER TABLE public.shift_coverage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shift coverage events org read"
  ON public.shift_coverage_events FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Shift coverage events org insert"
  ON public.shift_coverage_events FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 5) Org setting: auto-assign backup
-- -----------------------------------------------------------------------------
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS auto_assign_backup BOOLEAN NOT NULL DEFAULT false;
