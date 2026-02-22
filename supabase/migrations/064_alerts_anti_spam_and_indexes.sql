-- Anti-spam: at most one open alert per (org_id, entity_type, entity_id).
-- When entity_id is set, duplicate open alerts for the same entity are rejected.
-- Generation logic should: INSERT only if no existing open alert for that entity, or use ON CONFLICT DO NOTHING / UPDATE.

CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_one_open_per_entity
  ON public.alerts (org_id, entity_type, entity_id)
  WHERE status = 'open' AND entity_id IS NOT NULL;

COMMENT ON INDEX public.idx_alerts_one_open_per_entity IS 'Prevents duplicate open alerts per entity; use upsert or check before insert in alert generation.';

-- Optional: index for "recent alerts" queries that filter by type and order by created_at (covered by idx_alerts_org_created + type filter; idx_alerts_type exists).
-- No change to existing indexes; 063 already has idx_alerts_entity (org_id, entity_type, entity_id) and idx_alerts_org_created (org_id, created_at DESC).
