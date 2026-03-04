-- ============================================
-- PRIORITY 0: Inspection-photos bucket org isolation
-- Replaces cross-tenant policies with path-based RLS.
-- Object key must be: {org_id}/... (first segment = org_id).
-- ============================================

-- Drop existing inspection-photos policies (from 003_create_storage_bucket.sql)
DROP POLICY IF EXISTS "Authenticated users can upload inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read inspection photos" ON storage.objects;
-- Org-isolated: first path segment must be org_id and user must be member
DROP POLICY IF EXISTS "Org members can insert inspection photos" ON storage.objects;
CREATE POLICY "Org members can insert inspection photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Org members can select inspection photos" ON storage.objects;
CREATE POLICY "Org members can select inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Org members can delete inspection photos" ON storage.objects;
CREATE POLICY "Org members can delete inspection photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'inspection-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);
