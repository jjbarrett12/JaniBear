-- Widget Layout System: per-user, per-module, per-breakpoint layouts
-- Table: user_widget_layouts

CREATE TABLE IF NOT EXISTS public.user_widget_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  breakpoint text NOT NULL CHECK (breakpoint IN ('lg', 'md', 'sm')),
  layout jsonb NOT NULL DEFAULT '[]',
  hidden_widgets text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (org_id, user_id, module_key, breakpoint)
);

COMMENT ON TABLE public.user_widget_layouts IS 'Per-user widget layout and hidden widgets per module and breakpoint';

CREATE INDEX IF NOT EXISTS idx_user_widget_layouts_lookup
  ON public.user_widget_layouts (org_id, user_id, module_key);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_user_widget_layouts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_widget_layouts_updated_at ON public.user_widget_layouts;
CREATE TRIGGER trg_user_widget_layouts_updated_at
  BEFORE UPDATE ON public.user_widget_layouts
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at_user_widget_layouts();

-- RLS
ALTER TABLE public.user_widget_layouts ENABLE ROW LEVEL SECURITY;

-- User can only select/insert/update/delete their own rows for orgs they belong to
CREATE POLICY "User can read own widget layouts"
  ON public.user_widget_layouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "User can insert own widget layouts"
  ON public.user_widget_layouts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "User can update own widget layouts"
  ON public.user_widget_layouts FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "User can delete own widget layouts"
  ON public.user_widget_layouts FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );
