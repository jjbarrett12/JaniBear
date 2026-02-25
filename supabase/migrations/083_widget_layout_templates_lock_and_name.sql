-- Layout Sharing & Templates: org template name and lock.
-- Replacement for legacy 0591_* migration id.

ALTER TABLE public.widget_layout_templates
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.widget_layout_templates.name IS 'Display name for the template (e.g. "Ops Standard v1").';
COMMENT ON COLUMN public.widget_layout_templates.is_locked IS 'When true, non-admin users cannot customize layout for this module+role; edit mode disabled.';
