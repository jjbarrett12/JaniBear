-- Role-Based Dashboard Intelligence: layout templates (org + system) and user UI prefs (active layout mode).
-- widget_layout_templates: org_id NULL = system/global template; else org-specific.
-- user_ui_prefs: stores active_layout_mode per user per module ('my' | 'recommended' | 'org_template').

-- =============================================================================
-- 1. widget_layout_templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.widget_layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  role text NOT NULL,
  breakpoint text NOT NULL CHECK (breakpoint IN ('lg', 'md', 'sm')),
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- One system template per (module_key, role, breakpoint); one org template per (org_id, module_key, role, breakpoint).
CREATE UNIQUE INDEX IF NOT EXISTS widget_layout_templates_global_uniq
  ON public.widget_layout_templates (module_key, role, breakpoint)
  WHERE org_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS widget_layout_templates_org_uniq
  ON public.widget_layout_templates (org_id, module_key, role, breakpoint)
  WHERE org_id IS NOT NULL;

COMMENT ON TABLE public.widget_layout_templates IS 'Recommended or org-specific widget layouts per module, role, and breakpoint. org_id NULL = system default.';

CREATE INDEX IF NOT EXISTS idx_widget_layout_templates_org_module
  ON public.widget_layout_templates (org_id, module_key);
CREATE INDEX IF NOT EXISTS idx_widget_layout_templates_global
  ON public.widget_layout_templates (module_key, role, breakpoint) WHERE org_id IS NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_widget_layout_templates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_widget_layout_templates_updated_at ON public.widget_layout_templates;
CREATE TRIGGER trg_widget_layout_templates_updated_at
  BEFORE UPDATE ON public.widget_layout_templates
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_widget_layout_templates();

ALTER TABLE public.widget_layout_templates ENABLE ROW LEVEL SECURITY;

-- Read: users can read global templates (org_id IS NULL) and templates for orgs they belong to
CREATE POLICY "widget_layout_templates_select"
  ON public.widget_layout_templates FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Insert/Update/Delete: org admins only for rows where org_id = their org; no one can insert/update/delete system (org_id NULL)
CREATE POLICY "widget_layout_templates_insert"
  ON public.widget_layout_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IS NOT NULL
    AND org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "widget_layout_templates_update"
  ON public.widget_layout_templates FOR UPDATE
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    org_id IS NOT NULL
    AND org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "widget_layout_templates_delete"
  ON public.widget_layout_templates FOR DELETE
  TO authenticated
  USING (
    org_id IS NOT NULL
    AND org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    )
  );

-- =============================================================================
-- 2. user_ui_prefs (active layout mode per user per module)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_ui_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  active_layout_mode text NOT NULL DEFAULT 'recommended'
    CHECK (active_layout_mode IN ('my', 'recommended', 'org_template')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, org_id, module_key)
);

COMMENT ON TABLE public.user_ui_prefs IS 'Per-user UI preferences per org and module; e.g. active_layout_mode for widget grid (my | recommended | org_template).';

CREATE INDEX IF NOT EXISTS idx_user_ui_prefs_lookup
  ON public.user_ui_prefs (user_id, org_id, module_key);

CREATE OR REPLACE FUNCTION public.set_updated_at_user_ui_prefs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_user_ui_prefs_updated_at ON public.user_ui_prefs;
CREATE TRIGGER trg_user_ui_prefs_updated_at
  BEFORE UPDATE ON public.user_ui_prefs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_user_ui_prefs();

ALTER TABLE public.user_ui_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ui_prefs_select"
  ON public.user_ui_prefs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "user_ui_prefs_insert"
  ON public.user_ui_prefs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "user_ui_prefs_update"
  ON public.user_ui_prefs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_ui_prefs_delete"
  ON public.user_ui_prefs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
