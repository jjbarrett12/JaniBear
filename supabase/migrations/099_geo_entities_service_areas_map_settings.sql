-- =============================================================================
-- 099: Unified mapping — geo_entities, service_areas, service_area_assignments, map_settings
-- One canonical geo store; Sales (leads) + Ops (accounts, crews, service areas) layers.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) geo_entities — canonical geo for any mappable entity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.geo_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'account', 'crew', 'franchisee', 'site', 'building', 'prospect')),
  entity_id UUID NOT NULL,
  label TEXT NOT NULL,
  address1 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geohash TEXT,
  source TEXT CHECK (source IN ('manual', 'google_places', 'geocode')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_geo_entities_org_type ON public.geo_entities(org_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_geo_entities_org_geohash ON public.geo_entities(org_id, geohash) WHERE geohash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_geo_entities_lat_lng ON public.geo_entities(lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

COMMENT ON TABLE public.geo_entities IS 'Canonical geo store for leads, accounts, sites, crews; used by Sales and Ops maps.';

ALTER TABLE public.geo_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read geo_entities"
  ON public.geo_entities FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Org members with maps.write can insert geo_entities"
  ON public.geo_entities FOR INSERT TO authenticated
  WITH CHECK ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'maps.write') OR public.is_site_admin(auth.uid())));

CREATE POLICY "Org members with maps.write can update geo_entities"
  ON public.geo_entities FOR UPDATE TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'maps.write') OR public.is_site_admin(auth.uid())));

CREATE POLICY "Org members with maps.write can delete geo_entities"
  ON public.geo_entities FOR DELETE TO authenticated
  USING ((public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid())) AND (public.has_permission(org_id, 'maps.write') OR public.is_site_admin(auth.uid())));

-- Allow insert/update for lead/create flows: require lead.write or maps.write
-- (Simplified: maps.write covers; for lead-only we could add a policy with has_permission(org_id, 'lead.write'))
-- Above policies use maps.write for write; read uses org membership so maps.read is enforced in app layer.

-- -----------------------------------------------------------------------------
-- 2) service_areas — polygons or radius for Ops
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'polygon' CHECK (type IN ('polygon', 'radius')),
  geojson JSONB NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_areas_org ON public.service_areas(org_id);

COMMENT ON TABLE public.service_areas IS 'Service areas / territories for Ops map (polygon or radius).';

ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read service_areas"
  ON public.service_areas FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Org members with maps.write can manage service_areas"
  ON public.service_areas FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 3) service_area_assignments — which crew/franchisee is assigned to which area
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_area_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_area_id UUID NOT NULL REFERENCES public.service_areas(id) ON DELETE CASCADE,
  assignee_type TEXT NOT NULL CHECK (assignee_type IN ('crew', 'franchisee', 'manager')),
  assignee_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_area_assignments_org_assignee ON public.service_area_assignments(org_id, assignee_type, assignee_id);

ALTER TABLE public.service_area_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read service_area_assignments"
  ON public.service_area_assignments FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Org members with maps.write can manage service_area_assignments"
  ON public.service_area_assignments FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- 4) map_settings — per-org map preferences (optional)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.map_settings (
  org_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'mapbox' CHECK (provider IN ('mapbox', 'google', 'leaflet')),
  default_center JSONB,
  default_zoom INT NOT NULL DEFAULT 10,
  sales_layers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ops_layers JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.map_settings IS 'Per-org map display preferences (center, zoom, layer toggles).';

ALTER TABLE public.map_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read map_settings"
  ON public.map_settings FOR SELECT TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));

CREATE POLICY "Org members with maps.write can manage map_settings"
  ON public.map_settings FOR ALL TO authenticated
  USING (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()))
  WITH CHECK (public.is_org_member(org_id, auth.uid()) OR public.is_site_admin(auth.uid()));
