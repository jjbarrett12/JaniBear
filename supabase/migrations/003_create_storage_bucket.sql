-- Create storage bucket for inspection photos
-- Note: This creates the bucket, but you may still need to set it to public in the Supabase dashboard

INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload inspection photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspection-photos');
-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inspection-photos');
-- Allow public to read files (for shared reports)
CREATE POLICY "Public can read inspection photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'inspection-photos');
