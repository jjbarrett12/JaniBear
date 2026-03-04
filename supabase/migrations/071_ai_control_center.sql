-- AI Control Center: org-scoped config, modules, rules, usage, audit.
-- Only org members can read; only owner/admin (or ai_settings.manage) can write.

-- Global AI org config (toggles, privacy, model, provider)
CREATE TABLE IF NOT EXISTS ai_org_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_enabled BOOLEAN NOT NULL DEFAULT true,
  budget_limit_cents INTEGER,
  budget_hard_cap BOOLEAN NOT NULL DEFAULT false,
  data_access JSONB NOT NULL DEFAULT '{}'::jsonb,
  redaction_level TEXT NOT NULL DEFAULT 'basic' CHECK (redaction_level IN ('none', 'basic', 'aggressive')),
  retain_prompts BOOLEAN NOT NULL DEFAULT false,
  retain_prompts_days INTEGER NOT NULL DEFAULT 0,
  model_key TEXT NOT NULL DEFAULT 'balanced',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (temperature >= 0.2 AND temperature <= 0.9),
  response_length TEXT NOT NULL DEFAULT 'standard' CHECK (response_length IN ('short', 'standard', 'detailed')),
  confidence_threshold TEXT NOT NULL DEFAULT 'med' CHECK (confidence_threshold IN ('low', 'med', 'high')),
  use_cheaper_model_drafts BOOLEAN NOT NULL DEFAULT true,
  provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai', 'byok')),
  byok_validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id)
);

-- Per-module state (enabled, settings, usage stats)
CREATE TABLE IF NOT EXISTS ai_module_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  calls_this_month INTEGER NOT NULL DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, module_key)
);

-- Automation rules (triggers + actions)
CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  trigger_type TEXT NOT NULL,
  trigger_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  notify_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  cooldown_minutes INTEGER NOT NULL DEFAULT 60,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage per org per month (and daily breakdown)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  usage_date DATE,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  module_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log for AI config changes
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_org_config_org ON ai_org_config(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_module_state_org ON ai_module_state(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_module_state_key ON ai_module_state(module_key);
CREATE INDEX IF NOT EXISTS idx_ai_automation_rules_org ON ai_automation_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_period ON ai_usage(org_id, period);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON ai_usage(org_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_org ON ai_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created ON ai_audit_log(created_at DESC);

-- RLS
ALTER TABLE ai_org_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_org_config_select" ON ai_org_config FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_org_config_admin" ON ai_org_config FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "ai_module_state_select" ON ai_module_state FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_module_state_admin" ON ai_module_state FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "ai_automation_rules_select" ON ai_automation_rules FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_automation_rules_admin" ON ai_automation_rules FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_usage_insert" ON ai_usage FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_audit_log_select" ON ai_audit_log FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "ai_audit_log_insert" ON ai_audit_log FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Unique constraint for ai_usage: (org_id, period, usage_date). For month-level row use usage_date NULL.
-- Postgres unique with NULLs: use partial unique index.
DROP INDEX IF EXISTS ai_usage_org_period_date_unique;
CREATE UNIQUE INDEX ai_usage_org_period_date_unique ON ai_usage(org_id, period)
  WHERE usage_date IS NULL;
CREATE UNIQUE INDEX ai_usage_org_period_day_unique ON ai_usage(org_id, period, usage_date)
  WHERE usage_date IS NOT NULL;
