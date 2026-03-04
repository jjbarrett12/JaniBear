-- Executive Mode: simplified dashboard view for owner/admin. Toggle persists per user per org.
ALTER TABLE public.user_ui_prefs
  ADD COLUMN IF NOT EXISTS executive_mode_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_ui_prefs.executive_mode_enabled IS 'When true, dashboard shows simplified executive view (high-signal KPIs only, no widget editing). Stored with module_key = dashboard.';
