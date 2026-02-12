-- ============================================
-- Walkthrough-scans bucket + RLS for LiDAR/RoomPlan uploads
-- Path convention: org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/
-- First segment = 'org', second = org_id (for RLS).
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('walkthrough-scans', 'walkthrough-scans', false)
ON CONFLICT (id) DO NOTHING;

-- Org-isolated: path must be org/{org_id}/... and org_id must be user's org
CREATE POLICY "Org members can insert walkthrough scans"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'walkthrough-scans'
  AND (storage.foldername(name))[1] = 'org'
  AND (storage.foldername(name))[2] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can select walkthrough scans"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'walkthrough-scans'
  AND (storage.foldername(name))[1] = 'org'
  AND (storage.foldername(name))[2] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Org members can delete walkthrough scans"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'walkthrough-scans'
  AND (storage.foldername(name))[1] = 'org'
  AND (storage.foldername(name))[2] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

-- ============================================
-- walkthrough_scans.status: constrain allowed values (only if table exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'walkthrough_scans') THEN
    ALTER TABLE walkthrough_scans DROP CONSTRAINT IF EXISTS walkthrough_scans_status_check;
    ALTER TABLE walkthrough_scans ADD CONSTRAINT walkthrough_scans_status_check
      CHECK (status IN ('uploaded', 'processing', 'ready', 'failed'));
  END IF;
END $$;
