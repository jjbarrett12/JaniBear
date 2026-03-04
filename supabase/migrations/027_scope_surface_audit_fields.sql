-- ============================================
-- Scope surface audit fields (LiDAR + vision strategy)
-- See LIDAR_AND_SURFACE_STRATEGY.md: surface_type_final = what you bill on;
-- surface_source = manual | ai_suggested | ai_confirmed for auditability.
-- ============================================

ALTER TABLE scope_models
  ADD COLUMN IF NOT EXISTS surface_type_final JSONB,
  ADD COLUMN IF NOT EXISTS surface_type_predicted JSONB,
  ADD COLUMN IF NOT EXISTS surface_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS surface_source TEXT;
COMMENT ON COLUMN scope_models.surface_type_final IS 'Sqft by surface type for billing/quotes, e.g. {"carpet": 5000, "tile": 3000, "lvt": 1200}. Source of truth for line items.';
COMMENT ON COLUMN scope_models.surface_type_predicted IS 'AI/classifier output before user confirmation; same shape as surface_type_final.';
COMMENT ON COLUMN scope_models.surface_confidence IS 'Overall confidence 0–1 for surface classification (e.g. from segmentation model).';
COMMENT ON COLUMN scope_models.surface_source IS 'How final surface data was set: manual | ai_suggested | ai_confirmed.';
-- Optional: constrain surface_source for clarity (add check only if column exists and you want enum-like behavior)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'scope_models' AND column_name = 'surface_source'
  ) THEN
    ALTER TABLE scope_models DROP CONSTRAINT IF EXISTS scope_models_surface_source_check;
    ALTER TABLE scope_models ADD CONSTRAINT scope_models_surface_source_check
      CHECK (surface_source IS NULL OR surface_source IN ('manual', 'ai_suggested', 'ai_confirmed'));
  END IF;
END $$;
