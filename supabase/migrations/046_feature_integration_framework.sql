-- ============================================================================
-- 046: Feature Integration Framework
-- Adds tables for: recurring billing, enhanced work orders, marketing
-- automation, CSAT/NPS surveys, route optimization, workflow engine,
-- and contract renewal tracking.
-- ============================================================================

-- ============================================================================
-- 1. RECURRING BILLING
-- ============================================================================

CREATE TABLE IF NOT EXISTS recurring_billing_schedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  facility_id   UUID REFERENCES facilities(id) ON DELETE SET NULL,

  description   TEXT,
  frequency     TEXT NOT NULL DEFAULT 'monthly'
                  CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','annually')),
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  currency      TEXT NOT NULL DEFAULT 'USD',
  day_of_month  INTEGER CHECK (day_of_month BETWEEN 1 AND 28),
  day_of_week   INTEGER CHECK (day_of_week BETWEEN 0 AND 6),

  starts_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_at       DATE,
  next_invoice_at DATE,
  last_invoiced_at DATE,

  auto_send     BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  stripe_subscription_id TEXT,

  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','cancelled','completed')),
  notes         TEXT,

  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE recurring_billing_schedules IS 'Defines recurring billing cycles for account/facility contracts';

CREATE TABLE IF NOT EXISTS payment_reminders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  reminder_type   TEXT NOT NULL CHECK (reminder_type IN ('upcoming','due','overdue_3d','overdue_7d','overdue_14d','overdue_30d','custom')),
  scheduled_for   TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  channel         TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms','both')),
  recipient_email TEXT,
  recipient_phone TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','cancelled')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE payment_reminders IS 'Tracks scheduled and sent payment reminders for invoices';

-- ============================================================================
-- 2. ENHANCED WORK ORDERS
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low','medium','high','urgent'));
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('cleaning','repair','supply_restock','inspection_followup','complaint','other'));
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual','inspection','ticket','schedule','workflow'));
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS crew_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_duration_min INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS actual_duration_min INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN
  ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
  ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check
    CHECK (status IN ('pending','assigned','in_progress','on_hold','completed','cancelled'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS work_order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      DECIMAL(10,2) DEFAULT 1,
  unit          TEXT DEFAULT 'each',
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  completed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_order_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  caption       TEXT,
  taken_at      TIMESTAMPTZ DEFAULT NOW(),
  taken_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  photo_type    TEXT DEFAULT 'during' CHECK (photo_type IN ('before','during','after'))
);

COMMENT ON TABLE work_order_items IS 'Checklist items within a work order';
COMMENT ON TABLE work_order_photos IS 'Before/during/after photos attached to work orders';

-- ============================================================================
-- 3. MARKETING AUTOMATION (Email Sequences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  body_text   TEXT,
  category    TEXT DEFAULT 'general'
                CHECK (category IN ('general','sales','followup','onboarding','renewal','survey','marketing','notification')),
  variables   JSONB DEFAULT '[]'::jsonb,
  is_system   BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sequences (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_type  TEXT NOT NULL DEFAULT 'manual'
                  CHECK (trigger_type IN ('manual','new_lead','proposal_sent','proposal_viewed','inspection_complete','contract_expiring','lost_deal')),
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','active','paused','archived')),
  settings      JSONB DEFAULT '{}'::jsonb,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id   UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_order    INTEGER NOT NULL,
  step_type     TEXT NOT NULL DEFAULT 'email'
                  CHECK (step_type IN ('email','sms','task','wait','condition')),
  delay_days    INTEGER DEFAULT 0,
  delay_hours   INTEGER DEFAULT 0,
  template_id   UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject       TEXT,
  body_html     TEXT,
  body_text     TEXT,
  task_title    TEXT,
  task_description TEXT,
  condition_field TEXT,
  condition_operator TEXT,
  condition_value TEXT,
  settings      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id   UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_email TEXT NOT NULL,
  contact_name  TEXT,
  current_step  INTEGER DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','paused','completed','bounced','unsubscribed','replied')),
  enrolled_at   TIMESTAMPTZ DEFAULT NOW(),
  next_step_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  enrolled_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata      JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS email_sequence_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES email_sequence_enrollments(id) ON DELETE CASCADE,
  step_id       UUID REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
  event_type    TEXT NOT NULL
                  CHECK (event_type IN ('sent','delivered','opened','clicked','replied','bounced','unsubscribed','task_created','task_completed')),
  occurred_at   TIMESTAMPTZ DEFAULT NOW(),
  metadata      JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE email_templates IS 'Reusable email templates with variable placeholders';
COMMENT ON TABLE email_sequences IS 'Multi-step follow-up sequences (drip campaigns)';
COMMENT ON TABLE email_sequence_steps IS 'Individual steps within a sequence (email, SMS, task, wait)';
COMMENT ON TABLE email_sequence_enrollments IS 'Leads/contacts currently enrolled in a sequence';
COMMENT ON TABLE email_sequence_events IS 'Tracking events (opens, clicks, replies) for sequence steps';

-- ============================================================================
-- 4. CUSTOMER SATISFACTION SURVEYS (CSAT / NPS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customer_surveys (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  survey_type   TEXT NOT NULL DEFAULT 'csat'
                  CHECK (survey_type IN ('csat','nps','custom')),
  description   TEXT,
  trigger_type  TEXT DEFAULT 'manual'
                  CHECK (trigger_type IN ('manual','post_inspection','monthly','quarterly','on_ticket_resolve')),
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','active','paused','archived')),
  settings      JSONB DEFAULT '{}'::jsonb,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES customer_surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'rating'
                  CHECK (question_type IN ('rating','nps','text','multiple_choice','yes_no')),
  options       JSONB DEFAULT '[]'::jsonb,
  is_required   BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  survey_id     UUID NOT NULL REFERENCES customer_surveys(id) ON DELETE CASCADE,
  account_id    UUID REFERENCES accounts(id) ON DELETE SET NULL,
  facility_id   UUID REFERENCES facilities(id) ON DELETE SET NULL,
  respondent_email TEXT,
  respondent_name  TEXT,
  overall_score    DECIMAL(3,1),
  nps_score        INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','partial','completed','expired')),
  token         TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  submitted_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id   UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text   TEXT,
  answer_rating INTEGER,
  answer_choice TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE customer_surveys IS 'CSAT/NPS survey definitions with trigger configuration';
COMMENT ON TABLE survey_questions IS 'Questions within a customer survey';
COMMENT ON TABLE survey_responses IS 'Individual survey response sessions (token-based, no auth required)';
COMMENT ON TABLE survey_answers IS 'Answers to individual questions within a response';

-- ============================================================================
-- 5. ROUTE OPTIMIZATION & GPS CHECK-IN/CHECK-OUT
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  date            DATE NOT NULL,
  crew_id         UUID,
  assigned_to     UUID REFERENCES auth.users(id),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','optimized','active','completed')),
  total_drive_min INTEGER,
  total_stops     INTEGER,
  optimization_metadata JSONB DEFAULT '{}'::jsonb,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id      UUID NOT NULL REFERENCES route_plans(id) ON DELETE CASCADE,
  facility_id   UUID REFERENCES facilities(id) ON DELETE SET NULL,
  stop_order    INTEGER NOT NULL,
  address       TEXT,
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  arrival_time  TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  estimated_duration_min INTEGER,
  actual_duration_min    INTEGER,
  drive_time_from_prev_min INTEGER,
  status        TEXT DEFAULT 'pending'
                  CHECK (status IN ('pending','en_route','arrived','in_progress','completed','skipped')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crew_check_ins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  facility_id   UUID REFERENCES facilities(id) ON DELETE SET NULL,
  route_stop_id UUID REFERENCES route_stops(id) ON DELETE SET NULL,
  check_type    TEXT NOT NULL CHECK (check_type IN ('in','out')),
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  accuracy_meters DECIMAL(8,2),
  is_within_geofence BOOLEAN,
  photo_url     TEXT,
  device_info   JSONB DEFAULT '{}'::jsonb,
  checked_at    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE route_plans IS 'Optimized cleaning routes for crews/drivers';
COMMENT ON TABLE route_stops IS 'Individual stops within a route plan';
COMMENT ON TABLE crew_check_ins IS 'GPS-verified check-in/check-out at facilities';

-- ============================================================================
-- 6. WORKFLOW AUTOMATION ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_workflows (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','active','paused','archived')),
  run_count     INTEGER DEFAULT 0,
  last_run_at   TIMESTAMPTZ,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_triggers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  trigger_type  TEXT NOT NULL
                  CHECK (trigger_type IN (
                    'inspection_completed','inspection_score_below',
                    'ticket_created','ticket_resolved',
                    'invoice_overdue','invoice_paid',
                    'contract_expiring',
                    'survey_score_below','survey_completed',
                    'work_order_created','work_order_completed',
                    'lead_created','proposal_sent','proposal_signed',
                    'schedule','manual'
                  )),
  conditions    JSONB DEFAULT '{}'::jsonb,
  schedule_cron TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_actions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  action_order  INTEGER NOT NULL,
  action_type   TEXT NOT NULL
                  CHECK (action_type IN (
                    'send_email','send_sms',
                    'create_task','create_work_order','create_issue',
                    'update_status','update_field',
                    'assign_to_user','assign_to_crew',
                    'create_notification','log_activity',
                    'wait','condition'
                  )),
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id   UUID NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  trigger_id    UUID REFERENCES automation_triggers(id) ON DELETE SET NULL,
  status        TEXT NOT NULL CHECK (status IN ('started','completed','failed','skipped')),
  actions_run   INTEGER DEFAULT 0,
  trigger_data  JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

COMMENT ON TABLE automation_workflows IS 'User-defined "when X happens, do Y" automation rules';
COMMENT ON TABLE automation_triggers IS 'Event triggers that start a workflow';
COMMENT ON TABLE automation_actions IS 'Ordered actions executed when a workflow fires';
COMMENT ON TABLE automation_logs IS 'Execution history for workflow runs';

-- ============================================================================
-- 7. CONTRACT RENEWAL TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS contract_renewals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contract_id     UUID,
  contract_name   TEXT,
  current_mrr     DECIMAL(10,2),
  proposed_mrr    DECIMAL(10,2),
  expires_at      DATE NOT NULL,
  renewal_status  TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK (renewal_status IN ('upcoming','notified_90d','notified_60d','notified_30d','proposal_sent','negotiating','renewed','lost','expired')),
  assigned_to     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  proposal_id     UUID,
  notes           TEXT,
  auto_renew      BOOLEAN DEFAULT false,
  renewed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE contract_renewals IS 'Tracks contract expiration dates and renewal pipeline';

-- ============================================================================
-- 8. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recurring_billing_org ON recurring_billing_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_recurring_billing_next ON recurring_billing_schedules(next_invoice_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_billing_account ON recurring_billing_schedules(account_id);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_org ON payment_reminders(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled ON payment_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders(invoice_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_org_status ON work_orders(org_id, status);
CREATE INDEX IF NOT EXISTS idx_work_orders_facility ON work_orders(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_sla ON work_orders(sla_deadline) WHERE status NOT IN ('completed','cancelled');
CREATE INDEX IF NOT EXISTS idx_work_order_items_wo ON work_order_items(work_order_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_org ON email_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_seq ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_org ON email_sequence_enrollments(org_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next ON email_sequence_enrollments(next_step_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_events_enrollment ON email_sequence_events(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_customer_surveys_org ON customer_surveys(org_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_org ON survey_responses(org_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_account ON survey_responses(account_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_token ON survey_responses(token);

CREATE INDEX IF NOT EXISTS idx_route_plans_org_date ON route_plans(org_id, date);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_org ON crew_check_ins(org_id);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_user ON crew_check_ins(user_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_facility ON crew_check_ins(facility_id);

CREATE INDEX IF NOT EXISTS idx_automation_workflows_org ON automation_workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_workflow ON automation_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_actions_workflow ON automation_actions(workflow_id, action_order);
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow ON automation_logs(workflow_id);

CREATE INDEX IF NOT EXISTS idx_contract_renewals_org ON contract_renewals(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_expires ON contract_renewals(expires_at) WHERE renewal_status NOT IN ('renewed','lost','expired');
CREATE INDEX IF NOT EXISTS idx_contract_renewals_account ON contract_renewals(account_id);

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE recurring_billing_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_renewals ENABLE ROW LEVEL SECURITY;

-- Org-member isolation: SELECT for members of the same org
DO $$ BEGIN

-- Recurring billing
CREATE POLICY "org_member_select_recurring_billing" ON recurring_billing_schedules
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_recurring_billing" ON recurring_billing_schedules
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_recurring_billing" ON recurring_billing_schedules
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_recurring_billing" ON recurring_billing_schedules
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Payment reminders
CREATE POLICY "org_member_select_payment_reminders" ON payment_reminders
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_payment_reminders" ON payment_reminders
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_payment_reminders" ON payment_reminders
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Work order items (via work_order → org_id)
CREATE POLICY "org_member_select_wo_items" ON work_order_items
  FOR SELECT USING (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_wo_items" ON work_order_items
  FOR INSERT WITH CHECK (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_wo_items" ON work_order_items
  FOR UPDATE USING (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_delete_wo_items" ON work_order_items
  FOR DELETE USING (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Work order photos
CREATE POLICY "org_member_select_wo_photos" ON work_order_photos
  FOR SELECT USING (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_wo_photos" ON work_order_photos
  FOR INSERT WITH CHECK (work_order_id IN (
    SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Email templates
CREATE POLICY "org_member_select_email_templates" ON email_templates
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_email_templates" ON email_templates
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_email_templates" ON email_templates
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_email_templates" ON email_templates
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Email sequences
CREATE POLICY "org_member_select_email_sequences" ON email_sequences
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_email_sequences" ON email_sequences
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_email_sequences" ON email_sequences
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_email_sequences" ON email_sequences
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Sequence steps (via sequence → org_id)
CREATE POLICY "org_member_select_seq_steps" ON email_sequence_steps
  FOR SELECT USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_seq_steps" ON email_sequence_steps
  FOR INSERT WITH CHECK (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_seq_steps" ON email_sequence_steps
  FOR UPDATE USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_delete_seq_steps" ON email_sequence_steps
  FOR DELETE USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Sequence enrollments
CREATE POLICY "org_member_select_seq_enrollments" ON email_sequence_enrollments
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_seq_enrollments" ON email_sequence_enrollments
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_seq_enrollments" ON email_sequence_enrollments
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Sequence events (via enrollment → org_id)
CREATE POLICY "org_member_select_seq_events" ON email_sequence_events
  FOR SELECT USING (enrollment_id IN (
    SELECT id FROM email_sequence_enrollments WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Customer surveys
CREATE POLICY "org_member_select_surveys" ON customer_surveys
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_surveys" ON customer_surveys
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_surveys" ON customer_surveys
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_surveys" ON customer_surveys
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Survey questions
CREATE POLICY "org_member_select_survey_questions" ON survey_questions
  FOR SELECT USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_survey_questions" ON survey_questions
  FOR INSERT WITH CHECK (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_survey_questions" ON survey_questions
  FOR UPDATE USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_delete_survey_questions" ON survey_questions
  FOR DELETE USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Survey responses
CREATE POLICY "org_member_select_survey_responses" ON survey_responses
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_survey_responses" ON survey_responses
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
-- Public insert for token-based survey submissions
CREATE POLICY "public_insert_survey_responses" ON survey_responses
  FOR UPDATE USING (token IS NOT NULL AND expires_at > NOW());

-- Survey answers (via response → org_id)
CREATE POLICY "org_member_select_survey_answers" ON survey_answers
  FOR SELECT USING (response_id IN (
    SELECT id FROM survey_responses WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "public_insert_survey_answers" ON survey_answers
  FOR INSERT WITH CHECK (response_id IN (
    SELECT id FROM survey_responses WHERE token IS NOT NULL AND expires_at > NOW()
  ));

-- Route plans
CREATE POLICY "org_member_select_route_plans" ON route_plans
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_route_plans" ON route_plans
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_route_plans" ON route_plans
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_route_plans" ON route_plans
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Route stops
CREATE POLICY "org_member_select_route_stops" ON route_stops
  FOR SELECT USING (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_route_stops" ON route_stops
  FOR INSERT WITH CHECK (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_route_stops" ON route_stops
  FOR UPDATE USING (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Crew check-ins
CREATE POLICY "org_member_select_check_ins" ON crew_check_ins
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "user_insert_check_ins" ON crew_check_ins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Automation workflows
CREATE POLICY "org_member_select_workflows" ON automation_workflows
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_workflows" ON automation_workflows
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_workflows" ON automation_workflows
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_workflows" ON automation_workflows
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Automation triggers
CREATE POLICY "org_member_select_triggers" ON automation_triggers
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_triggers" ON automation_triggers
  FOR INSERT WITH CHECK (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_triggers" ON automation_triggers
  FOR UPDATE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_delete_triggers" ON automation_triggers
  FOR DELETE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Automation actions
CREATE POLICY "org_member_select_actions" ON automation_actions
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_insert_actions" ON automation_actions
  FOR INSERT WITH CHECK (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_update_actions" ON automation_actions
  FOR UPDATE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));
CREATE POLICY "org_member_delete_actions" ON automation_actions
  FOR DELETE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Automation logs
CREATE POLICY "org_member_select_automation_logs" ON automation_logs
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Contract renewals
CREATE POLICY "org_member_select_renewals" ON contract_renewals
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_insert_renewals" ON contract_renewals
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_update_renewals" ON contract_renewals
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "org_member_delete_renewals" ON contract_renewals
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 10. REGISTER NEW FEATURES IN FEATURE GATING SYSTEM
-- ============================================================================

INSERT INTO features (code, name) VALUES
  ('recurring_billing', 'Recurring Billing & Payment Automation'),
  ('work_orders', 'Work Order Management'),
  ('marketing_automation', 'Marketing Automation & Email Sequences'),
  ('customer_surveys', 'Customer Satisfaction Surveys (CSAT/NPS)'),
  ('route_optimization', 'Route Optimization & GPS Check-In'),
  ('workflow_engine', 'Workflow Automation Engine'),
  ('contract_renewals', 'Contract Renewal Tracking'),
  ('customer_portal', 'Enhanced Customer Portal')
ON CONFLICT (code) DO NOTHING;

-- Enable features for Grizzly and Kodiak plans by default
DO $$ 
DECLARE
  f RECORD;
  p RECORD;
BEGIN
  FOR f IN SELECT id, code FROM features WHERE code IN (
    'recurring_billing','work_orders','marketing_automation',
    'customer_surveys','route_optimization','workflow_engine',
    'contract_renewals','customer_portal'
  )
  LOOP
    FOR p IN SELECT code FROM plans WHERE tier >= 2
    LOOP
      INSERT INTO plan_features (plan_code, feature_id, enabled)
      VALUES (p.code, f.id, true)
      ON CONFLICT (plan_code, feature_id) DO NOTHING;
    END LOOP;
    
    -- Also enable work_orders and recurring_billing for tier-1 (Cub) plans
    IF f.code IN ('work_orders', 'recurring_billing') THEN
      FOR p IN SELECT code FROM plans WHERE tier = 1
      LOOP
        INSERT INTO plan_features (plan_code, feature_id, enabled)
        VALUES (p.code, f.id, true)
        ON CONFLICT (plan_code, feature_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;
