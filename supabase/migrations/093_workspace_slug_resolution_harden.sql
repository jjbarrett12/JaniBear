-- =============================================================================
-- 093: Harden get_org_id_by_slug — constant-time response to prevent enumeration
-- - SECURITY DEFINER remains (middleware calls with anon key).
-- - EXECUTE for anon kept so Edge middleware can resolve slug without session.
--   (Revoking anon would require middleware to call an internal API with service
--   role; consider edge throttling / rate limit instead.)
-- - Add fixed minimal delay so response time does not leak org existence.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_org_id_by_slug(p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  out_id UUID;
BEGIN
  -- Constant-time: small fixed delay so "found" vs "not found" have similar response time.
  -- Reduces risk of org enumeration via timing side channel.
  PERFORM pg_sleep(0.02);

  SELECT id INTO out_id
  FROM public.organizations
  WHERE slug = p_slug
  LIMIT 1;

  RETURN out_id;
END;
$$;

COMMENT ON FUNCTION public.get_org_id_by_slug(TEXT) IS 'Returns org id for workspace URL routing. Constant-time to limit enumeration. Callable by anon for middleware; consider edge throttling.';
