-- Account logos: column on accounts + storage bucket for uploads

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

COMMENT ON COLUMN accounts.logo_url IS 'Public URL of account logo (stored in account-logos bucket)';

-- Storage bucket for account logos (path: org_id/account_id/filename)
INSERT INTO storage.buckets (id, name, public)
VALUES ('account-logos', 'account-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: path segments are (org_id, account_id, filename); org members can read any logo under their org
CREATE POLICY "Org members can read account logos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'account-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can upload account logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'account-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update account logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'account-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete account logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'account-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );
