-- Ensure organization-logos bucket and policies exist (idempotent).
-- Run this if logo upload in Organization Settings fails with "Bucket not found".

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies so this migration can be re-run safely
DROP POLICY IF EXISTS "Users can upload logos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can read logos from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Public can read organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos from their organization" ON storage.objects;

-- RLS policies for organization logos (first path segment = org_id, must be in org_members)
CREATE POLICY "Users can upload logos for their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read logos from their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can read organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

CREATE POLICY "Users can delete logos from their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  )
);
