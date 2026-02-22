-- Layout Sharing & Templates: org template name and lock.
-- is_locked: when true, non-admin users cannot enter edit mode (see UI).
-- name: display name for the template (e.g. "Ops Standard v1").

ALTER TABLE public.widget_layout_templates
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.widget_layout_templates.name IS 'Display name for the template (e.g. "Ops Standard v1").';
COMMENT ON COLUMN public.widget_layout_templates.is_locked IS 'When true, non-admin users cannot customize layout for this module+role; edit mode disabled.';
