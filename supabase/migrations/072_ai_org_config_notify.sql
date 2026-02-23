-- Add notify and budget display fields to ai_org_config for AI Control Center.
ALTER TABLE ai_org_config
  ADD COLUMN IF NOT EXISTS notify_at_percent INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS notify_channel TEXT DEFAULT 'in_app' CHECK (notify_channel IN ('in_app', 'email', 'slack'));
