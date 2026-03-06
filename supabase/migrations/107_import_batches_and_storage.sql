-- =============================================================================
-- 107: Import your business — import_batches, import_batch_items, storage
-- Used by onboarding import wizard for self-serve spreadsheet migration.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Import batches (one per uploaded file / run)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'mapped', 'importing', 'done', 'failed', 'rolled_back')),
  file_path TEXT,
  summary JSONB DEFAULT '{}'::jsonb,
  mapping JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_org ON public.import_batches(org_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches(org_id, status);
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- Only org members can see; only owner/admin can insert/update (enforced in app + RLS).
CREATE POLICY "Import batches org read"
  ON public.import_batches FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = import_batches.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );

CREATE POLICY "Import batches org insert"
  ON public.import_batches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = import_batches.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );

CREATE POLICY "Import batches org update"
  ON public.import_batches FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = import_batches.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = import_batches.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );

-- -----------------------------------------------------------------------------
-- 2) Import batch items (for rollback: every created row is recorded here)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.import_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batch_items_batch ON public.import_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_batch_items_entity ON public.import_batch_items(entity_type, entity_id);
ALTER TABLE public.import_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Import batch items via batch"
  ON public.import_batch_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.import_batches b
      JOIN public.org_members m ON m.org_id = b.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL)
      WHERE b.id = batch_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.import_batches b
      JOIN public.org_members m ON m.org_id = b.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL)
      WHERE b.id = batch_id
    )
  );

-- -----------------------------------------------------------------------------
-- 3) Storage bucket for onboarding imports (path: onboarding-imports/{org_id}/{batch_id}/source.{ext})
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'onboarding-imports',
  'onboarding-imports',
  false,
  10485760,
  ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/csv']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: org members can read/write their org's folder only. Path: {org_id}/{batch_id}/source.{ext}
CREATE POLICY "Onboarding imports org folder"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'onboarding-imports'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members
      WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)
    )
  )
  WITH CHECK (
    bucket_id = 'onboarding-imports'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members
      WHERE user_id = auth.uid() AND (status = 'active' OR status IS NULL)
    )
  );
