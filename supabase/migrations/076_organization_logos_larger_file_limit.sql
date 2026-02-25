-- Allow larger organization logos (e.g. high-res for retina, up to 20MB).
-- Storage policy review (074): public read; authenticated org members can upload; owners/admins/managers can delete. No change needed.
-- If your Supabase version supports file_size_limit on storage.buckets, this sets 20MB.
-- Otherwise set in Dashboard: Storage → organization-logos → Settings → File size limit → 20 MB.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'file_size_limit'
  ) THEN
    UPDATE storage.buckets
    SET file_size_limit = 20971520
    WHERE id = 'organization-logos';
  END IF;
END $$;
