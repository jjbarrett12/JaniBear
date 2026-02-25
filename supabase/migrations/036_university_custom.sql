-- University: org-customizable training library. Categories (e.g. Floor Care, Chemical SDS),
-- folders (e.g. Carpet extraction, Bonnet cleaning), and media (photos/videos) per folder.

-- Categories (top-level: Floor Care, Terminal cleaning, Chemical SDS, Customer Service)
CREATE TABLE IF NOT EXISTS university_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Folders (under a category: e.g. Carpet extraction, Bonnet cleaning under Floor Care)
CREATE TABLE IF NOT EXISTS university_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES university_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, category_id, slug)
);

-- Media items (photos/videos in a folder)
CREATE TABLE IF NOT EXISTS university_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder_id UUID NOT NULL REFERENCES university_folders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'document')),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_university_categories_org ON university_categories(org_id);
CREATE INDEX IF NOT EXISTS idx_university_folders_category ON university_folders(category_id);
CREATE INDEX IF NOT EXISTS idx_university_folders_org ON university_folders(org_id);
CREATE INDEX IF NOT EXISTS idx_university_media_folder ON university_media(folder_id);
CREATE INDEX IF NOT EXISTS idx_university_media_org ON university_media(org_id);

ALTER TABLE university_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read university_categories" ON university_categories;
CREATE POLICY "Org members can read university_categories"
  ON university_categories FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org managers can manage university_categories" ON university_categories;
CREATE POLICY "Org managers can manage university_categories"
  ON university_categories FOR ALL TO authenticated
  USING (can_write_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can read university_folders" ON university_folders;
CREATE POLICY "Org members can read university_folders"
  ON university_folders FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org managers can manage university_folders" ON university_folders;
CREATE POLICY "Org managers can manage university_folders"
  ON university_folders FOR ALL TO authenticated
  USING (can_write_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can read university_media" ON university_media;
CREATE POLICY "Org members can read university_media"
  ON university_media FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org managers can manage university_media" ON university_media;
CREATE POLICY "Org managers can manage university_media"
  ON university_media FOR ALL TO authenticated
  USING (can_write_org(org_id, auth.uid()));

-- Storage bucket for university uploads (photos, videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('university-uploads', 'university-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: path = org_id/folder_id/filename
DROP POLICY IF EXISTS "Org members can read university-uploads" ON storage.objects;
CREATE POLICY "Org members can read university-uploads"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'university-uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org managers can upload university-uploads" ON storage.objects;
CREATE POLICY "Org managers can upload university-uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'university-uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "Org managers can update university-uploads" ON storage.objects;
CREATE POLICY "Org managers can update university-uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'university-uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "Org managers can delete university-uploads" ON storage.objects;
CREATE POLICY "Org managers can delete university-uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'university-uploads' AND
    (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- Seed default categories and folders for existing orgs (run once)
INSERT INTO university_categories (org_id, name, slug, sort_order)
  SELECT id, 'Floor Care', 'floor-care', 1 FROM organizations
  ON CONFLICT (org_id, slug) DO NOTHING;

INSERT INTO university_categories (org_id, name, slug, sort_order)
  SELECT id, 'Terminal Cleaning', 'terminal-cleaning', 2 FROM organizations
  ON CONFLICT (org_id, slug) DO NOTHING;

INSERT INTO university_categories (org_id, name, slug, sort_order)
  SELECT id, 'Chemical SDS', 'chemical-sds', 3 FROM organizations
  ON CONFLICT (org_id, slug) DO NOTHING;

INSERT INTO university_categories (org_id, name, slug, sort_order)
  SELECT id, 'Customer Service', 'customer-service', 4 FROM organizations
  ON CONFLICT (org_id, slug) DO NOTHING;

-- Seed Floor Care sub-folders for each org that has Floor Care
INSERT INTO university_folders (org_id, category_id, name, slug, sort_order)
  SELECT c.org_id, c.id, 'Carpet extraction', 'carpet-extraction', 1
  FROM university_categories c WHERE c.slug = 'floor-care'
  ON CONFLICT (org_id, category_id, slug) DO NOTHING;

INSERT INTO university_folders (org_id, category_id, name, slug, sort_order)
  SELECT c.org_id, c.id, 'Bonnet cleaning', 'bonnet-cleaning', 2
  FROM university_categories c WHERE c.slug = 'floor-care'
  ON CONFLICT (org_id, category_id, slug) DO NOTHING;

INSERT INTO university_folders (org_id, category_id, name, slug, sort_order)
  SELECT c.org_id, c.id, 'Spray buffing', 'spray-buffing', 3
  FROM university_categories c WHERE c.slug = 'floor-care'
  ON CONFLICT (org_id, category_id, slug) DO NOTHING;

INSERT INTO university_folders (org_id, category_id, name, slug, sort_order)
  SELECT c.org_id, c.id, 'Strip & wax', 'strip-wax', 4
  FROM university_categories c WHERE c.slug = 'floor-care'
  ON CONFLICT (org_id, category_id, slug) DO NOTHING;
