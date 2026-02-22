-- Restrict inspection template write to org admins (owner/manager) only.
-- Inspectors must not create or edit org-level templates (role-based layout checklist).

CREATE OR REPLACE FUNCTION public.can_admin_org(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.can_admin_org IS 'True if user is owner or manager of the org (admin-level write, e.g. templates).';

-- Templates: replace write policy with admin-only
DROP POLICY IF EXISTS "Can write templates" ON public.templates;
CREATE POLICY "Can write templates"
  ON public.templates FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));

-- Template sections: same (table has org_id)
DROP POLICY IF EXISTS "Can write template sections" ON public.template_sections;
CREATE POLICY "Can write template sections"
  ON public.template_sections FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));

-- Template items: same (table has org_id)
DROP POLICY IF EXISTS "Can write template items" ON public.template_items;
CREATE POLICY "Can write template items"
  ON public.template_items FOR ALL
  USING (can_admin_org(org_id, auth.uid()))
  WITH CHECK (can_admin_org(org_id, auth.uid()));
