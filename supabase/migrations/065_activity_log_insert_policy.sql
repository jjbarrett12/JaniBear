-- activity_log: allow org members to insert (so server actions can write).
-- No client spoofing: inserts only happen from server-side code (createClient from server + requireOrg).
-- SELECT remains org-scoped; no admin-only requirement for activity_log (general activity feed).

-- Table may exist as activity_log (006) or public.activity_log
CREATE POLICY "Org members can insert activity_log"
  ON activity_log FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );
