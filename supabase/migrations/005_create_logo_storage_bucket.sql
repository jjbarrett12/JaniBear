-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;
-- RLS policies for organization logos
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
    WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
  )
);
