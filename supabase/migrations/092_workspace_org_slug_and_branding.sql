-- =============================================================================
-- 092: Workspace multi-tenant: org slug + org_settings branding
-- - organizations.slug (unique) for subdomain/path routing
-- - org_settings: display_name, logo_url, primary_color, accent_color (workspace branding)
-- - get_org_id_by_slug(slug) for middleware (resolvable without auth)
-- =============================================================================

-- 1) organizations.slug (unique, for routing)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug) WHERE slug IS NOT NULL;

-- Backfill slug from name: lowercase, replace spaces/special with hyphen
UPDATE public.organizations
SET slug = lower(regexp_replace(regexp_replace(trim(name), '\s+', '-', 'g'), '[^a-z0-9\-]', '', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;
-- Ensure no empty slugs
UPDATE public.organizations SET slug = 'org-' || substr(id::text, 1, 8) WHERE slug IS NULL OR slug = '';

ALTER TABLE public.organizations ALTER COLUMN slug SET NOT NULL;

-- Trigger: set slug from name on insert when slug not provided
CREATE OR REPLACE FUNCTION public.organizations_slug_from_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(trim(COALESCE(NEW.name, 'org')), '\s+', '-', 'g'), '[^a-z0-9\-]', '', 'g'));
    IF NEW.slug = '' THEN NEW.slug := 'org-' || substr(NEW.id::text, 1, 8); END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_organizations_slug_on_insert ON public.organizations;
CREATE TRIGGER trg_organizations_slug_on_insert
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE PROCEDURE public.organizations_slug_from_name();

-- 2) org_settings: workspace branding (display name, logo, colors)
ALTER TABLE public.org_settings ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.org_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.org_settings ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE public.org_settings ADD COLUMN IF NOT EXISTS accent_color TEXT;

-- Backfill display_name from organizations
UPDATE public.org_settings s
SET display_name = o.name
FROM public.organizations o
WHERE s.org_id = o.id AND (s.display_name IS NULL OR s.display_name = '');

COMMENT ON COLUMN public.org_settings.display_name IS 'Workspace display name (defaults from organizations.name).';
COMMENT ON COLUMN public.org_settings.logo_url IS 'Workspace logo URL (overrides organizations.logo_url when set).';
COMMENT ON COLUMN public.org_settings.primary_color IS 'Workspace primary color (overrides organizations.primary_color when set).';
COMMENT ON COLUMN public.org_settings.accent_color IS 'Workspace accent color (overrides organizations.secondary_color when set).';

-- 3) Resolve org_id by slug (used by middleware; organizations.slug is source of truth)
CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(p_slug TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations WHERE slug = p_slug LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_org_id_by_slug(TEXT) IS 'Returns org id for workspace URL routing. Callable by anon for middleware.';
GRANT EXECUTE ON FUNCTION public.get_org_id_by_slug(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_org_id_by_slug(TEXT) TO authenticated;
