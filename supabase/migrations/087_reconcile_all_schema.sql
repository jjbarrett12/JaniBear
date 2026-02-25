-- ============================================================================
-- 087: Reconcile All Schema (Part 1 of 2) — Migrations 046 through 062
-- ============================================================================
-- Idempotent recreation of all schema objects from migrations 046–062.
--
-- Every statement is idempotent:
--   - CREATE TABLE IF NOT EXISTS  (gen_random_uuid() for PKs)
--   - CREATE INDEX IF NOT EXISTS
--   - DROP POLICY IF EXISTS before every CREATE POLICY
--   - CREATE OR REPLACE FUNCTION
--   - DROP TRIGGER IF EXISTS before every CREATE TRIGGER
--   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS
--   - Storage buckets: ON CONFLICT (id) DO NOTHING
--   - Enum types: DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$
--
-- Tables whose REQUIRED FKs reference potentially-missing tables (invoices,
-- work_orders, leads, clients, opportunities, walkthroughs, bids, locations)
-- are wrapped in DO blocks with information_schema checks.
-- Tables whose OPTIONAL (nullable) FKs reference those tables are created
-- without those FKs, then the FK columns are added conditionally.
-- ============================================================================


-- ############################################################################
-- FROM 046: Feature Integration Framework
-- ############################################################################

-- ============================================================================
-- 046 §1  RECURRING BILLING
-- ============================================================================
CREATE TABLE IF NOT EXISTS recurring_billing_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- payment_reminders (references invoices which MAY NOT exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
    CREATE TABLE IF NOT EXISTS payment_reminders (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  END IF;
END $$;

-- ============================================================================
-- 046 §2  ENHANCED WORK ORDERS (references work_orders which MAY NOT exist)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_orders') THEN
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
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

    BEGIN
      ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
      ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check
        CHECK (status IN ('pending','assigned','in_progress','on_hold','completed','cancelled'));
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    CREATE TABLE IF NOT EXISTS work_order_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
      photo_url     TEXT NOT NULL,
      caption       TEXT,
      taken_at      TIMESTAMPTZ DEFAULT NOW(),
      taken_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
      photo_type    TEXT DEFAULT 'during' CHECK (photo_type IN ('before','during','after'))
    );

    COMMENT ON TABLE work_order_items IS 'Checklist items within a work order';
    COMMENT ON TABLE work_order_photos IS 'Before/during/after photos attached to work orders';
  END IF;
END $$;

-- ============================================================================
-- 046 §3  MARKETING AUTOMATION (Email Sequences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- email_sequence_enrollments: create without lead_id FK, add it conditionally
CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id   UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='leads') THEN
    ALTER TABLE email_sequence_enrollments ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_sequence_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 046 §4  CUSTOMER SATISFACTION SURVEYS (CSAT / NPS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_surveys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  token         TEXT UNIQUE DEFAULT replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  submitted_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 046 §5  ROUTE OPTIMIZATION & GPS CHECK-IN/CHECK-OUT
-- ============================================================================
CREATE TABLE IF NOT EXISTS route_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 046 §6  WORKFLOW AUTOMATION ENGINE
-- ============================================================================
CREATE TABLE IF NOT EXISTS automation_workflows (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 046 §7  CONTRACT RENEWAL TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS contract_renewals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 046 §8  INDEXES
-- ============================================================================

-- Recurring billing
CREATE INDEX IF NOT EXISTS idx_recurring_billing_org ON recurring_billing_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_recurring_billing_next ON recurring_billing_schedules(next_invoice_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recurring_billing_account ON recurring_billing_schedules(account_id);

-- Payment reminders (conditional)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payment_reminders') THEN
    CREATE INDEX IF NOT EXISTS idx_payment_reminders_org ON payment_reminders(org_id);
    CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled ON payment_reminders(scheduled_for) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders(invoice_id);
  END IF;
END $$;

-- Work orders (conditional)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_orders') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_org_status ON work_orders(org_id, status);
    CREATE INDEX IF NOT EXISTS idx_work_orders_facility ON work_orders(facility_id);
    CREATE INDEX IF NOT EXISTS idx_work_orders_assigned ON work_orders(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_work_orders_sla ON work_orders(sla_deadline) WHERE status NOT IN ('completed','cancelled');
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_items') THEN
    CREATE INDEX IF NOT EXISTS idx_work_order_items_wo ON work_order_items(work_order_id);
  END IF;
END $$;

-- Email marketing
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_org ON email_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_sequence_steps_seq ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_org ON email_sequence_enrollments(org_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_next ON email_sequence_enrollments(next_step_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sequence_events_enrollment ON email_sequence_events(enrollment_id);

-- Surveys
CREATE INDEX IF NOT EXISTS idx_customer_surveys_org ON customer_surveys(org_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_org ON survey_responses(org_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_account ON survey_responses(account_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_token ON survey_responses(token);

-- Routes
CREATE INDEX IF NOT EXISTS idx_route_plans_org_date ON route_plans(org_id, date);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_org ON crew_check_ins(org_id);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_user ON crew_check_ins(user_id, checked_at);
CREATE INDEX IF NOT EXISTS idx_crew_check_ins_facility ON crew_check_ins(facility_id);

-- Automation
CREATE INDEX IF NOT EXISTS idx_automation_workflows_org ON automation_workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_triggers_workflow ON automation_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_automation_actions_workflow ON automation_actions(workflow_id, action_order);
CREATE INDEX IF NOT EXISTS idx_automation_logs_workflow ON automation_logs(workflow_id);

-- Contract renewals
CREATE INDEX IF NOT EXISTS idx_contract_renewals_org ON contract_renewals(org_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_expires ON contract_renewals(expires_at) WHERE renewal_status NOT IN ('renewed','lost','expired');
CREATE INDEX IF NOT EXISTS idx_contract_renewals_account ON contract_renewals(account_id);

-- ============================================================================
-- 046 §9  ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE recurring_billing_schedules ENABLE ROW LEVEL SECURITY;
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

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payment_reminders') THEN
    ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_items') THEN
    ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_photos') THEN
    ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- 046 §9  POLICIES — Recurring billing
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_recurring_billing" ON recurring_billing_schedules;
CREATE POLICY "org_member_select_recurring_billing" ON recurring_billing_schedules
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_recurring_billing" ON recurring_billing_schedules;
CREATE POLICY "org_member_insert_recurring_billing" ON recurring_billing_schedules
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_recurring_billing" ON recurring_billing_schedules;
CREATE POLICY "org_member_update_recurring_billing" ON recurring_billing_schedules
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_recurring_billing" ON recurring_billing_schedules;
CREATE POLICY "org_member_delete_recurring_billing" ON recurring_billing_schedules
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Payment reminders (conditional)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='payment_reminders') THEN
    DROP POLICY IF EXISTS "org_member_select_payment_reminders" ON payment_reminders;
    CREATE POLICY "org_member_select_payment_reminders" ON payment_reminders
      FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "org_member_insert_payment_reminders" ON payment_reminders;
    CREATE POLICY "org_member_insert_payment_reminders" ON payment_reminders
      FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

    DROP POLICY IF EXISTS "org_member_update_payment_reminders" ON payment_reminders;
    CREATE POLICY "org_member_update_payment_reminders" ON payment_reminders
      FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
  END IF;
END $$;

-- ============================================================================
-- 046 §9  POLICIES — Work order items & photos (conditional)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_items') THEN
    DROP POLICY IF EXISTS "org_member_select_wo_items" ON work_order_items;
    CREATE POLICY "org_member_select_wo_items" ON work_order_items
      FOR SELECT USING (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));

    DROP POLICY IF EXISTS "org_member_insert_wo_items" ON work_order_items;
    CREATE POLICY "org_member_insert_wo_items" ON work_order_items
      FOR INSERT WITH CHECK (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));

    DROP POLICY IF EXISTS "org_member_update_wo_items" ON work_order_items;
    CREATE POLICY "org_member_update_wo_items" ON work_order_items
      FOR UPDATE USING (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));

    DROP POLICY IF EXISTS "org_member_delete_wo_items" ON work_order_items;
    CREATE POLICY "org_member_delete_wo_items" ON work_order_items
      FOR DELETE USING (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_order_photos') THEN
    DROP POLICY IF EXISTS "org_member_select_wo_photos" ON work_order_photos;
    CREATE POLICY "org_member_select_wo_photos" ON work_order_photos
      FOR SELECT USING (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));

    DROP POLICY IF EXISTS "org_member_insert_wo_photos" ON work_order_photos;
    CREATE POLICY "org_member_insert_wo_photos" ON work_order_photos
      FOR INSERT WITH CHECK (work_order_id IN (
        SELECT id FROM work_orders WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      ));
  END IF;
END $$;

-- ============================================================================
-- 046 §9  POLICIES — Email templates
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_email_templates" ON email_templates;
CREATE POLICY "org_member_select_email_templates" ON email_templates
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_email_templates" ON email_templates;
CREATE POLICY "org_member_insert_email_templates" ON email_templates
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_email_templates" ON email_templates;
CREATE POLICY "org_member_update_email_templates" ON email_templates
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_email_templates" ON email_templates;
CREATE POLICY "org_member_delete_email_templates" ON email_templates
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================================
-- 046 §9  POLICIES — Email sequences
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_email_sequences" ON email_sequences;
CREATE POLICY "org_member_select_email_sequences" ON email_sequences
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_email_sequences" ON email_sequences;
CREATE POLICY "org_member_insert_email_sequences" ON email_sequences
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_email_sequences" ON email_sequences;
CREATE POLICY "org_member_update_email_sequences" ON email_sequences
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_email_sequences" ON email_sequences;
CREATE POLICY "org_member_delete_email_sequences" ON email_sequences
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================================
-- 046 §9  POLICIES — Sequence steps
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_seq_steps" ON email_sequence_steps;
CREATE POLICY "org_member_select_seq_steps" ON email_sequence_steps
  FOR SELECT USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_insert_seq_steps" ON email_sequence_steps;
CREATE POLICY "org_member_insert_seq_steps" ON email_sequence_steps
  FOR INSERT WITH CHECK (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_update_seq_steps" ON email_sequence_steps;
CREATE POLICY "org_member_update_seq_steps" ON email_sequence_steps
  FOR UPDATE USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_delete_seq_steps" ON email_sequence_steps;
CREATE POLICY "org_member_delete_seq_steps" ON email_sequence_steps
  FOR DELETE USING (sequence_id IN (
    SELECT id FROM email_sequences WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- 046 §9  POLICIES — Sequence enrollments
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_seq_enrollments" ON email_sequence_enrollments;
CREATE POLICY "org_member_select_seq_enrollments" ON email_sequence_enrollments
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_seq_enrollments" ON email_sequence_enrollments;
CREATE POLICY "org_member_insert_seq_enrollments" ON email_sequence_enrollments
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_seq_enrollments" ON email_sequence_enrollments;
CREATE POLICY "org_member_update_seq_enrollments" ON email_sequence_enrollments
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================================
-- 046 §9  POLICIES — Sequence events
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_seq_events" ON email_sequence_events;
CREATE POLICY "org_member_select_seq_events" ON email_sequence_events
  FOR SELECT USING (enrollment_id IN (
    SELECT id FROM email_sequence_enrollments WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- 046 §9  POLICIES — Customer surveys
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_surveys" ON customer_surveys;
CREATE POLICY "org_member_select_surveys" ON customer_surveys
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_surveys" ON customer_surveys;
CREATE POLICY "org_member_insert_surveys" ON customer_surveys
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_surveys" ON customer_surveys;
CREATE POLICY "org_member_update_surveys" ON customer_surveys
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_surveys" ON customer_surveys;
CREATE POLICY "org_member_delete_surveys" ON customer_surveys
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Survey questions
DROP POLICY IF EXISTS "org_member_select_survey_questions" ON survey_questions;
CREATE POLICY "org_member_select_survey_questions" ON survey_questions
  FOR SELECT USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_insert_survey_questions" ON survey_questions;
CREATE POLICY "org_member_insert_survey_questions" ON survey_questions
  FOR INSERT WITH CHECK (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_update_survey_questions" ON survey_questions;
CREATE POLICY "org_member_update_survey_questions" ON survey_questions
  FOR UPDATE USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_delete_survey_questions" ON survey_questions;
CREATE POLICY "org_member_delete_survey_questions" ON survey_questions
  FOR DELETE USING (survey_id IN (
    SELECT id FROM customer_surveys WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Survey responses
DROP POLICY IF EXISTS "org_member_select_survey_responses" ON survey_responses;
CREATE POLICY "org_member_select_survey_responses" ON survey_responses
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_survey_responses" ON survey_responses;
CREATE POLICY "org_member_insert_survey_responses" ON survey_responses
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "public_insert_survey_responses" ON survey_responses;
CREATE POLICY "public_insert_survey_responses" ON survey_responses
  FOR UPDATE USING (token IS NOT NULL AND expires_at > NOW());

-- Survey answers
DROP POLICY IF EXISTS "org_member_select_survey_answers" ON survey_answers;
CREATE POLICY "org_member_select_survey_answers" ON survey_answers
  FOR SELECT USING (response_id IN (
    SELECT id FROM survey_responses WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "public_insert_survey_answers" ON survey_answers;
CREATE POLICY "public_insert_survey_answers" ON survey_answers
  FOR INSERT WITH CHECK (response_id IN (
    SELECT id FROM survey_responses WHERE token IS NOT NULL AND expires_at > NOW()
  ));

-- ============================================================================
-- 046 §9  POLICIES — Route plans
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_route_plans" ON route_plans;
CREATE POLICY "org_member_select_route_plans" ON route_plans
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_route_plans" ON route_plans;
CREATE POLICY "org_member_insert_route_plans" ON route_plans
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_route_plans" ON route_plans;
CREATE POLICY "org_member_update_route_plans" ON route_plans
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_route_plans" ON route_plans;
CREATE POLICY "org_member_delete_route_plans" ON route_plans
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Route stops
DROP POLICY IF EXISTS "org_member_select_route_stops" ON route_stops;
CREATE POLICY "org_member_select_route_stops" ON route_stops
  FOR SELECT USING (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_insert_route_stops" ON route_stops;
CREATE POLICY "org_member_insert_route_stops" ON route_stops
  FOR INSERT WITH CHECK (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_update_route_stops" ON route_stops;
CREATE POLICY "org_member_update_route_stops" ON route_stops
  FOR UPDATE USING (route_id IN (
    SELECT id FROM route_plans WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Crew check-ins
DROP POLICY IF EXISTS "org_member_select_check_ins" ON crew_check_ins;
CREATE POLICY "org_member_select_check_ins" ON crew_check_ins
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "user_insert_check_ins" ON crew_check_ins;
CREATE POLICY "user_insert_check_ins" ON crew_check_ins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 046 §9  POLICIES — Automation workflows
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_workflows" ON automation_workflows;
CREATE POLICY "org_member_select_workflows" ON automation_workflows
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_workflows" ON automation_workflows;
CREATE POLICY "org_member_insert_workflows" ON automation_workflows
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_workflows" ON automation_workflows;
CREATE POLICY "org_member_update_workflows" ON automation_workflows
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_workflows" ON automation_workflows;
CREATE POLICY "org_member_delete_workflows" ON automation_workflows
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Automation triggers
DROP POLICY IF EXISTS "org_member_select_triggers" ON automation_triggers;
CREATE POLICY "org_member_select_triggers" ON automation_triggers
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_insert_triggers" ON automation_triggers;
CREATE POLICY "org_member_insert_triggers" ON automation_triggers
  FOR INSERT WITH CHECK (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_update_triggers" ON automation_triggers;
CREATE POLICY "org_member_update_triggers" ON automation_triggers
  FOR UPDATE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_delete_triggers" ON automation_triggers;
CREATE POLICY "org_member_delete_triggers" ON automation_triggers
  FOR DELETE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Automation actions
DROP POLICY IF EXISTS "org_member_select_actions" ON automation_actions;
CREATE POLICY "org_member_select_actions" ON automation_actions
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_insert_actions" ON automation_actions;
CREATE POLICY "org_member_insert_actions" ON automation_actions
  FOR INSERT WITH CHECK (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_update_actions" ON automation_actions;
CREATE POLICY "org_member_update_actions" ON automation_actions
  FOR UPDATE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS "org_member_delete_actions" ON automation_actions;
CREATE POLICY "org_member_delete_actions" ON automation_actions
  FOR DELETE USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- Automation logs
DROP POLICY IF EXISTS "org_member_select_automation_logs" ON automation_logs;
CREATE POLICY "org_member_select_automation_logs" ON automation_logs
  FOR SELECT USING (workflow_id IN (
    SELECT id FROM automation_workflows WHERE org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  ));

-- ============================================================================
-- 046 §9  POLICIES — Contract renewals
-- ============================================================================
DROP POLICY IF EXISTS "org_member_select_renewals" ON contract_renewals;
CREATE POLICY "org_member_select_renewals" ON contract_renewals
  FOR SELECT USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_insert_renewals" ON contract_renewals;
CREATE POLICY "org_member_insert_renewals" ON contract_renewals
  FOR INSERT WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_update_renewals" ON contract_renewals;
CREATE POLICY "org_member_update_renewals" ON contract_renewals
  FOR UPDATE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_member_delete_renewals" ON contract_renewals;
CREATE POLICY "org_member_delete_renewals" ON contract_renewals
  FOR DELETE USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================================
-- 046 §10  REGISTER NEW FEATURES IN FEATURE GATING SYSTEM
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='features') THEN
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
  END IF;
END $$;

DO $$
DECLARE
  f RECORD;
  p RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='features')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plans')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='plan_features') THEN
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

      IF f.code IN ('work_orders', 'recurring_billing') THEN
        FOR p IN SELECT code FROM plans WHERE tier = 1
        LOOP
          INSERT INTO plan_features (plan_code, feature_id, enabled)
          VALUES (p.code, f.id, true)
          ON CONFLICT (plan_code, feature_id) DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
END $$;


-- ############################################################################
-- FROM 047: Territory Map
-- ############################################################################

-- ============================================================================
-- 047 §1  Add lat/lng to facilities
-- ============================================================================
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_facilities_lat_lng
  ON facilities(org_id) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- 047 §2  Quadrants table
-- ============================================================================
CREATE TABLE IF NOT EXISTS quadrants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('ops', 'sales')),
  name TEXT NOT NULL,
  assigned_user_id UUID NULL,
  color TEXT NULL,
  geojson JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quadrants_org_mode ON quadrants(org_id, mode);
CREATE INDEX IF NOT EXISTS idx_quadrants_org_user ON quadrants(org_id, assigned_user_id);

-- ============================================================================
-- 047 §3  Prospects table
-- ============================================================================
CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quadrant_id UUID NULL REFERENCES quadrants(id) ON DELETE SET NULL,
  assigned_user_id UUID NULL,
  name TEXT NULL,
  industry TEXT NULL,
  address1 TEXT NULL,
  city TEXT NULL,
  state TEXT NULL,
  postal TEXT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  status TEXT NOT NULL DEFAULT 'uncontacted'
    CHECK (status IN ('uncontacted', 'contacted', 'proposal_sent', 'closed_won', 'closed_lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prospects_org_status ON prospects(org_id, status);
CREATE INDEX IF NOT EXISTS idx_prospects_org_quadrant ON prospects(org_id, quadrant_id);
CREATE INDEX IF NOT EXISTS idx_prospects_org_user ON prospects(org_id, assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_lat_lng ON prospects(lat, lng);

-- ============================================================================
-- 047 §4  Site health table
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_health (
  site_id UUID PRIMARY KEY REFERENCES facilities(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  health_status TEXT NOT NULL DEFAULT 'green'
    CHECK (health_status IN ('green', 'yellow', 'red')),
  last_inspection_at TIMESTAMPTZ NULL,
  last_inspection_score NUMERIC(5,2) NULL,
  checklist_completion_7d NUMERIC(5,2) NULL,
  open_ticket_count INT NOT NULL DEFAULT 0,
  overdue_ticket_count INT NOT NULL DEFAULT 0,
  missed_shifts_7d INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_health_org ON site_health(org_id);

-- ============================================================================
-- 047 §5  RLS + Policies
-- ============================================================================
ALTER TABLE quadrants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_health ENABLE ROW LEVEL SECURITY;

-- Quadrants
DROP POLICY IF EXISTS "Org members can read quadrants" ON quadrants;
CREATE POLICY "Org members can read quadrants"
  ON quadrants FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can insert quadrants" ON quadrants;
CREATE POLICY "Org members can insert quadrants"
  ON quadrants FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can update quadrants" ON quadrants;
CREATE POLICY "Org members can update quadrants"
  ON quadrants FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can delete quadrants" ON quadrants;
CREATE POLICY "Org members can delete quadrants"
  ON quadrants FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

-- Prospects
DROP POLICY IF EXISTS "Org members can read prospects" ON prospects;
CREATE POLICY "Org members can read prospects"
  ON prospects FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can insert prospects" ON prospects;
CREATE POLICY "Org members can insert prospects"
  ON prospects FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can update prospects" ON prospects;
CREATE POLICY "Org members can update prospects"
  ON prospects FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can delete prospects" ON prospects;
CREATE POLICY "Org members can delete prospects"
  ON prospects FOR DELETE
  USING (is_org_member(org_id, auth.uid()));

-- Site Health
DROP POLICY IF EXISTS "Org members can read site_health" ON site_health;
CREATE POLICY "Org members can read site_health"
  ON site_health FOR SELECT
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can insert site_health" ON site_health;
CREATE POLICY "Org members can insert site_health"
  ON site_health FOR INSERT
  WITH CHECK (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can update site_health" ON site_health;
CREATE POLICY "Org members can update site_health"
  ON site_health FOR UPDATE
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "Org members can delete site_health" ON site_health;
CREATE POLICY "Org members can delete site_health"
  ON site_health FOR DELETE
  USING (is_org_member(org_id, auth.uid()));


-- ############################################################################
-- FROM 048: CRM Canonical Chain
-- ############################################################################

-- ============================================================================
-- 048 §1  Link Locations/Sites to Clients (both MAY NOT exist)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
      ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_locations_client_id ON public.locations(client_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
      ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_sites_client_id ON public.sites(client_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 048 §2  Link Opportunities to Locations
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunities') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_opportunities_location_id ON public.opportunities(location_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
      ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_opportunities_location_id ON public.opportunities(location_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 048 §3  Link Walkthroughs to Locations
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='walkthroughs') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
      ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_walkthroughs_location_id ON public.walkthroughs(location_id);
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
      ALTER TABLE public.walkthroughs ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_walkthroughs_location_id ON public.walkthroughs(location_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 048 §4  Link Bids to Opportunities and Walkthroughs
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bids')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunities') THEN
    ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_bids_opportunity_id ON public.bids(opportunity_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bids')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='walkthroughs') THEN
    ALTER TABLE public.bids ADD COLUMN IF NOT EXISTS walkthrough_id uuid REFERENCES public.walkthroughs(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bids_walkthrough_id ON public.bids(walkthrough_id);
  END IF;
END $$;

-- ============================================================================
-- 048 §5  CRM Activities (create without maybe-missing FKs, add conditionally)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('call','email','sms','meeting','task','note')),
  subject text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunities') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
    ALTER TABLE public.crm_activities ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_activities_org_id ON public.crm_activities(org_id);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_activities' AND column_name='opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON public.crm_activities(opportunity_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_crm_activities_due_at ON public.crm_activities(due_at);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_activities' AND column_name='client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_activities_client_id ON public.crm_activities(client_id);
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_activities' AND column_name='location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_activities_location_id ON public.crm_activities(location_id) WHERE location_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 048 §6  CRM Contacts (client_id NOT NULL → wrap entire table)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    CREATE TABLE IF NOT EXISTS public.crm_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      first_name text,
      last_name text,
      title text,
      email text,
      phone text,
      contact_type text NOT NULL DEFAULT 'general' CHECK (contact_type IN ('decision_maker','facility','billing','emergency','general')),
      is_primary boolean NOT NULL DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_id ON public.crm_contacts(org_id);
    CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_id ON public.crm_contacts(client_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='crm_contacts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
      ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sites') THEN
      ALTER TABLE public.crm_contacts ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.sites(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- 048 §7  Optional CRM fields on clients (conditional)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'lead';
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry text;
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website text;
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 048 §8  RLS + Policies for crm_activities and crm_contacts
-- ============================================================================
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage crm_activities" ON public.crm_activities;
CREATE POLICY "Org members can manage crm_activities"
  ON public.crm_activities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_activities.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_activities.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
  );

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='crm_contacts') THEN
    ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org members can manage crm_contacts" ON public.crm_contacts;
    CREATE POLICY "Org members can manage crm_contacts"
      ON public.crm_contacts FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_contacts.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = crm_contacts.org_id AND m.user_id = auth.uid() AND (m.status = 'active' OR m.status IS NULL))
      );
  END IF;
END $$;


-- ############################################################################
-- FROM 049: CRM Indexes & RLS Confirm
-- ############################################################################

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='locations' AND column_name='client_id') THEN
      CREATE INDEX IF NOT EXISTS idx_locations_org_id_client_id
        ON public.locations(org_id, client_id)
        WHERE client_id IS NOT NULL;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunities')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='opportunities' AND column_name='location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_opportunities_org_client_location_stage
      ON public.opportunities(org_id, client_id, location_id, stage);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='walkthroughs')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='walkthroughs' AND column_name='location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_walkthroughs_org_opportunity_location_status
      ON public.walkthroughs(org_id, opportunity_id, location_id, status);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='bids')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bids' AND column_name='opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_bids_org_opportunity_walkthrough_status
      ON public.bids(org_id, opportunity_id, walkthrough_id, status);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_activities' AND column_name='opportunity_id') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_activities_org_opportunity_due_at
      ON public.crm_activities(org_id, opportunity_id, due_at)
      WHERE opportunity_id IS NOT NULL AND due_at IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='crm_contacts')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='crm_contacts' AND column_name='location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_contacts_org_client_location
      ON public.crm_contacts(org_id, client_id, location_id);
  END IF;
END $$;


-- ############################################################################
-- FROM 050: Launch Plans
-- ############################################################################

-- launch_plans: opportunity_id NOT NULL → wrap for opportunities; add client_id/location_id conditionally
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='opportunities') THEN
    CREATE TABLE IF NOT EXISTS public.launch_plans (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
      opportunity_id uuid NOT NULL UNIQUE REFERENCES public.opportunities(id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sales_ready','ops_ready','launched','blocked')),
      start_date date,
      sales_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      ops_owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      sales_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
      ops_setup jsonb NOT NULL DEFAULT '{}'::jsonb,
      risks jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='launch_plans')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    ALTER TABLE public.launch_plans ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='launch_plans')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='locations') THEN
    ALTER TABLE public.launch_plans ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='launch_plans') THEN
    CREATE INDEX IF NOT EXISTS idx_launch_plans_org_id ON public.launch_plans(org_id);
    CREATE INDEX IF NOT EXISTS idx_launch_plans_status_start_date ON public.launch_plans(status, start_date);
    CREATE INDEX IF NOT EXISTS idx_launch_plans_opportunity_id ON public.launch_plans(opportunity_id);

    COMMENT ON TABLE public.launch_plans IS 'Sales → Ops handoff packet per opportunity; enforces completeness before launch.';

    ALTER TABLE public.launch_plans ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Org members read launch_plans" ON public.launch_plans;
    CREATE POLICY "Org members read launch_plans"
      ON public.launch_plans FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.org_members m
          WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
            AND COALESCE(m.status, 'active') IN ('active', 'pending')
            AND m.role IN ('owner', 'manager', 'admin', 'inspector', 'sales', 'ops')
        )
      );

    DROP POLICY IF EXISTS "Org members write launch_plans" ON public.launch_plans;
    CREATE POLICY "Org members write launch_plans"
      ON public.launch_plans FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.org_members m
          WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
            AND COALESCE(m.status, 'active') IN ('active', 'pending')
            AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
        )
      );

    DROP POLICY IF EXISTS "Org members update delete launch_plans" ON public.launch_plans;
    CREATE POLICY "Org members update delete launch_plans"
      ON public.launch_plans FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.org_members m
          WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
            AND COALESCE(m.status, 'active') IN ('active', 'pending')
            AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.org_members m
          WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
            AND COALESCE(m.status, 'active') IN ('active', 'pending')
            AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
        )
      );

    DROP POLICY IF EXISTS "Org members delete launch_plans" ON public.launch_plans;
    CREATE POLICY "Org members delete launch_plans"
      ON public.launch_plans FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.org_members m
          WHERE m.org_id = launch_plans.org_id AND m.user_id = auth.uid()
            AND COALESCE(m.status, 'active') IN ('active', 'pending')
            AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='launch_plans')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='launch_plans' AND column_name='location_id') THEN
    CREATE INDEX IF NOT EXISTS idx_launch_plans_location_id ON public.launch_plans(location_id);
  END IF;
END $$;


-- ############################################################################
-- FROM 051: Platform Owner Console
-- ############################################################################

-- ============================================================================
-- 051 §1  platform_admins table
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE platform_admins IS 'Platform superadmins only. Access to /platform/* and cross-org data. NOT an org role.';

INSERT INTO platform_admins (user_id, note)
  SELECT id, 'Migrated from profiles.is_platform_admin'
  FROM profiles
  WHERE is_platform_admin = true
  ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 051 §2  is_platform_admin(auth.uid()) function
-- ============================================================================
CREATE OR REPLACE FUNCTION is_platform_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = p_user_id);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION is_platform_admin(UUID) IS 'True if user is in platform_admins. Use for /platform/* and cross-org access only.';
GRANT EXECUTE ON FUNCTION is_platform_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_platform_admin() TO authenticated;

-- ============================================================================
-- 051 §3  has_org_role() function (role_enum replaced with role)
-- ============================================================================
CREATE OR REPLACE FUNCTION has_org_role(p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id
      AND user_id = auth.uid()
      AND (status = 'active' OR status IS NULL)
      AND role = ANY(p_roles)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION has_org_role(UUID, TEXT[]) IS 'True if current user is in p_org_id with one of the given roles.';
GRANT EXECUTE ON FUNCTION has_org_role(UUID, TEXT[]) TO authenticated;

-- ============================================================================
-- 051 §4  user_activity table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_org ON user_activity(org_id);

COMMENT ON TABLE user_activity IS 'Tracks last activity per user per org for WAU/MAU. Upsert from app on each request.';

ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upsert own activity" ON user_activity;
CREATE POLICY "Users can upsert own activity"
  ON user_activity FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Platform admin can read all activity" ON user_activity;
CREATE POLICY "Platform admin can read all activity"
  ON user_activity FOR SELECT
  USING (is_platform_admin(auth.uid()));

-- ============================================================================
-- 051 §5  platform_audit_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_audit_created ON platform_audit_log(created_at);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admin only audit log" ON platform_audit_log;
CREATE POLICY "Platform admin only audit log"
  ON platform_audit_log FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================================
-- 051 §6  org_invites — add created_by if missing
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_invites') THEN
    ALTER TABLE org_invites ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 051 §7  RLS: platform_admins
-- ============================================================================
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admin only platform_admins" ON platform_admins;
CREATE POLICY "Platform admin only platform_admins"
  ON platform_admins FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================================
-- 051 §8  RLS: organizations (platform or member)
-- ============================================================================
DROP POLICY IF EXISTS "Allow insert for new org" ON organizations;
DROP POLICY IF EXISTS "Owners can create org" ON organizations;
DROP POLICY IF EXISTS "Owners and managers can update org" ON organizations;
DROP POLICY IF EXISTS "Owners can update org" ON organizations;

DROP POLICY IF EXISTS "Org members can read org" ON organizations;
DROP POLICY IF EXISTS "Organizations select platform or member" ON organizations;
CREATE POLICY "Organizations select platform or member"
  ON organizations FOR SELECT
  USING (
    is_platform_admin(auth.uid())
    OR is_org_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Organizations insert platform only" ON organizations;
CREATE POLICY "Organizations insert platform only"
  ON organizations FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Organizations update platform only" ON organizations;
CREATE POLICY "Organizations update platform only"
  ON organizations FOR UPDATE
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- ============================================================================
-- 051 §8  create_org_for_signup function
-- ============================================================================
CREATE OR REPLACE FUNCTION create_org_for_signup(org_name TEXT, owner_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  IF owner_user_id IS NULL OR owner_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF EXISTS (SELECT 1 FROM org_members WHERE user_id = owner_user_id) THEN
    RAISE EXCEPTION 'User already has an org';
  END IF;
  INSERT INTO organizations (name, status)
  VALUES (org_name, 'trialing')
  RETURNING id INTO v_org_id;
  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_org_id, owner_user_id, 'owner', 'active');
  RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION create_org_for_signup(TEXT, UUID) IS 'Called on signup only: creates org and adds user as owner. Runs as definer.';
GRANT EXECUTE ON FUNCTION create_org_for_signup(TEXT, UUID) TO authenticated;

-- ============================================================================
-- 051 §9  RLS: org_members
-- ============================================================================
DROP POLICY IF EXISTS "Users can read own memberships" ON org_members;
DROP POLICY IF EXISTS "Owners can manage members" ON org_members;

DROP POLICY IF EXISTS "Org members select platform or member" ON org_members;
CREATE POLICY "Org members select platform or member"
  ON org_members FOR SELECT
  USING (
    is_platform_admin(auth.uid())
    OR user_id = auth.uid()
    OR is_org_member(org_id, auth.uid())
  );

DROP POLICY IF EXISTS "Org members insert platform or org admin" ON org_members;
CREATE POLICY "Org members insert platform or org admin"
  ON org_members FOR INSERT
  WITH CHECK (
    is_platform_admin(auth.uid())
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Org members update platform or org admin" ON org_members;
CREATE POLICY "Org members update platform or org admin"
  ON org_members FOR UPDATE
  USING (
    is_platform_admin(auth.uid())
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  )
  WITH CHECK (
    is_platform_admin(auth.uid())
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Org members delete platform or org admin" ON org_members;
CREATE POLICY "Org members delete platform or org admin"
  ON org_members FOR DELETE
  USING (
    is_platform_admin(auth.uid())
    OR has_org_role(org_id, ARRAY['owner', 'admin'])
  );

DROP POLICY IF EXISTS "Users can add own first membership" ON org_members;
CREATE POLICY "Users can add own first membership"
  ON org_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM org_members om WHERE om.user_id = auth.uid())
  );

-- ============================================================================
-- 051 §10  RLS: org_invites (conditional — table may not exist)
-- ============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_invites') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Org members can view all" ON org_invites';
    EXECUTE 'DROP POLICY IF EXISTS "Org invites platform full" ON org_invites';
    EXECUTE 'CREATE POLICY "Org invites platform full" ON org_invites FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()))';
    EXECUTE 'DROP POLICY IF EXISTS "Org invites org admin manage own org" ON org_invites';
    EXECUTE 'CREATE POLICY "Org invites org admin manage own org" ON org_invites FOR ALL USING (has_org_role(org_id, ARRAY[''owner'', ''admin''])) WITH CHECK (has_org_role(org_id, ARRAY[''owner'', ''admin'']))';
  END IF;
END $$;


-- ############################################################################
-- FROM 052: Org Shell Enum
-- ############################################################################

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_shell') THEN
    CREATE TYPE org_shell AS ENUM ('owner_operator', 'franchisee', 'franchisor');
  END IF;
END $$;

COMMENT ON TYPE org_shell IS 'Dashboard experience: owner_operator (independent), franchisee (unit + network), franchisor (brand HQ only).';

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS shell org_shell NOT NULL DEFAULT 'owner_operator';

COMMENT ON COLUMN organizations.shell IS 'Dashboard experience; only platform admin can change. Drives nav, landing, route access.';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'org_type') THEN
    UPDATE organizations
    SET shell = CASE
      WHEN org_type = 'franchisor' THEN 'franchisor'::org_shell
      WHEN org_type = 'franchisee' THEN 'franchisee'::org_shell
      ELSE shell
    END
    WHERE org_type IN ('franchisor', 'franchisee');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_shell ON organizations(shell);


-- ############################################################################
-- FROM 053: Expense Receipts
-- ############################################################################

CREATE TABLE IF NOT EXISTS expense_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  amount numeric(12,2),
  receipt_date date,
  category text,
  tax_category text,
  vendor text,
  notes text,
  ai_filed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_receipts_org_created
  ON expense_receipts(org_id, created_at DESC);

COMMENT ON TABLE expense_receipts IS 'Receipt images and metadata for expenses; AI can extract and file for taxes.';

ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage expense receipts" ON expense_receipts;
CREATE POLICY "Org members can manage expense receipts"
  ON expense_receipts FOR ALL
  TO authenticated
  USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Org members can insert expense receipts" ON storage.objects;
CREATE POLICY "Org members can insert expense receipts"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can select expense receipts" ON storage.objects;
CREATE POLICY "Org members can select expense receipts"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can update expense receipts" ON storage.objects;
CREATE POLICY "Org members can update expense receipts"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members can delete expense receipts" ON storage.objects;
CREATE POLICY "Org members can delete expense receipts"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'expense-receipts'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
    )
  );


-- ############################################################################
-- FROM 054: Launch Packets
-- ############################################################################

CREATE TABLE IF NOT EXISTS public.launch_packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ops_owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sales_owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'review', 'ready', 'sent_to_ops', 'accepted', 'rejected'
  )),
  payload_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  ready_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_launch_packets_org_id ON public.launch_packets(org_id);
CREATE INDEX IF NOT EXISTS idx_launch_packets_account_id ON public.launch_packets(account_id);
CREATE INDEX IF NOT EXISTS idx_launch_packets_status ON public.launch_packets(status);
CREATE INDEX IF NOT EXISTS idx_launch_packets_ready_at ON public.launch_packets(ready_at);

COMMENT ON TABLE public.launch_packets IS 'Sales → Ops handoff; payload_jsonb: locations, scope, schedule_draft, sla, staffing, supplies, docs_refs.';

ALTER TABLE public.launch_packets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "launch_packets_select" ON public.launch_packets;
CREATE POLICY "launch_packets_select"
  ON public.launch_packets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops', 'inspector')
    )
  );

DROP POLICY IF EXISTS "launch_packets_insert" ON public.launch_packets;
CREATE POLICY "launch_packets_insert"
  ON public.launch_packets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

DROP POLICY IF EXISTS "launch_packets_update" ON public.launch_packets;
CREATE POLICY "launch_packets_update"
  ON public.launch_packets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin', 'sales', 'ops')
    )
  );

DROP POLICY IF EXISTS "launch_packets_delete" ON public.launch_packets;
CREATE POLICY "launch_packets_delete"
  ON public.launch_packets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = launch_packets.org_id AND m.user_id = auth.uid()
        AND COALESCE(m.status, 'active') IN ('active', 'pending')
        AND m.role IN ('owner', 'manager', 'admin')
    )
  );


-- ############################################################################
-- FROM 055: Org Branding Update Policy (replaces 051's update-only policy)
-- ############################################################################

DROP POLICY IF EXISTS "Organizations update platform only" ON organizations;
DROP POLICY IF EXISTS "Organizations update platform or org admins" ON organizations;

CREATE POLICY "Organizations update platform or org admins"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    is_platform_admin(auth.uid())
    OR (
      is_org_member(id, auth.uid())
      AND (
        SELECT om.role
        FROM org_members om
        WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
        LIMIT 1
      ) IN ('owner', 'manager', 'op_admin', 'fr_admin')
    )
  )
  WITH CHECK (
    is_platform_admin(auth.uid())
    OR (
      is_org_member(id, auth.uid())
      AND (
        SELECT om.role
        FROM org_members om
        WHERE om.org_id = organizations.id AND om.user_id = auth.uid()
        LIMIT 1
      ) IN ('owner', 'manager', 'op_admin', 'fr_admin')
    )
  );

COMMENT ON POLICY "Organizations update platform or org admins" ON organizations IS
  'Platform admins can update any org; org owners/managers can update their own org (logo, colors, branding in Settings).';


-- ############################################################################
-- FROM 056: Organizations Custom Branding Column
-- ############################################################################

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_branding ON organizations(custom_branding) WHERE custom_branding = true;


-- ############################################################################
-- FROM 057: User Widget Layouts
-- ############################################################################

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

ALTER TABLE public.user_widget_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can read own widget layouts" ON public.user_widget_layouts;
CREATE POLICY "User can read own widget layouts"
  ON public.user_widget_layouts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "User can insert own widget layouts" ON public.user_widget_layouts;
CREATE POLICY "User can insert own widget layouts"
  ON public.user_widget_layouts FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "User can update own widget layouts" ON public.user_widget_layouts;
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

DROP POLICY IF EXISTS "User can delete own widget layouts" ON public.user_widget_layouts;
CREATE POLICY "User can delete own widget layouts"
  ON public.user_widget_layouts FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );


-- ############################################################################
-- FROM 058: Widget Layout Templates & User UI Prefs
-- ############################################################################

-- ============================================================================
-- 058 §1  widget_layout_templates
-- ============================================================================
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

DROP POLICY IF EXISTS "widget_layout_templates_select" ON public.widget_layout_templates;
CREATE POLICY "widget_layout_templates_select"
  ON public.widget_layout_templates FOR SELECT
  TO authenticated
  USING (
    org_id IS NULL
    OR org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "widget_layout_templates_insert" ON public.widget_layout_templates;
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

DROP POLICY IF EXISTS "widget_layout_templates_update" ON public.widget_layout_templates;
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

DROP POLICY IF EXISTS "widget_layout_templates_delete" ON public.widget_layout_templates;
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

-- ============================================================================
-- 058 §2  user_ui_prefs
-- ============================================================================
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

DROP POLICY IF EXISTS "user_ui_prefs_select" ON public.user_ui_prefs;
CREATE POLICY "user_ui_prefs_select"
  ON public.user_ui_prefs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "user_ui_prefs_insert" ON public.user_ui_prefs;
CREATE POLICY "user_ui_prefs_insert"
  ON public.user_ui_prefs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "user_ui_prefs_update" ON public.user_ui_prefs;
CREATE POLICY "user_ui_prefs_update"
  ON public.user_ui_prefs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_ui_prefs_delete" ON public.user_ui_prefs;
CREATE POLICY "user_ui_prefs_delete"
  ON public.user_ui_prefs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ############################################################################
-- FROM 059: Templates Admin-Only Write
-- ############################################################################

CREATE OR REPLACE FUNCTION public.can_admin_org(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = p_org_id
      AND user_id = p_user_id
      AND role IN ('owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.can_admin_org IS 'True if user is owner or manager of the org (admin-level write, e.g. templates).';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='templates') THEN
    DROP POLICY IF EXISTS "Can write templates" ON public.templates;
    CREATE POLICY "Can write templates"
      ON public.templates FOR ALL
      USING (can_admin_org(org_id, auth.uid()))
      WITH CHECK (can_admin_org(org_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='template_sections') THEN
    DROP POLICY IF EXISTS "Can write template sections" ON public.template_sections;
    CREATE POLICY "Can write template sections"
      ON public.template_sections FOR ALL
      USING (can_admin_org(org_id, auth.uid()))
      WITH CHECK (can_admin_org(org_id, auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='template_items') THEN
    DROP POLICY IF EXISTS "Can write template items" ON public.template_items;
    CREATE POLICY "Can write template items"
      ON public.template_items FOR ALL
      USING (can_admin_org(org_id, auth.uid()))
      WITH CHECK (can_admin_org(org_id, auth.uid()));
  END IF;
END $$;


-- ############################################################################
-- FROM 060: Benchmarking Opt-In and Aggregates
-- ############################################################################

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS benchmarking_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS company_size_bucket TEXT,
  ADD COLUMN IF NOT EXISTS vertical TEXT;

COMMENT ON COLUMN organizations.benchmarking_opt_in IS 'If true, org is included in anonymized benchmark aggregates. Default false.';
COMMENT ON COLUMN organizations.company_size_bucket IS 'Peer group: e.g. 1-10, 11-50, 51-200, 201+. Used only for benchmarking.';
COMMENT ON COLUMN organizations.vertical IS 'Peer group: e.g. medical, industrial, education, retail, other. Used only for benchmarking.';

CREATE INDEX IF NOT EXISTS idx_organizations_benchmarking_opt_in
  ON organizations(benchmarking_opt_in) WHERE benchmarking_opt_in = true;

CREATE TABLE IF NOT EXISTS public.benchmark_aggregates (
  company_size_bucket TEXT NOT NULL,
  vertical TEXT NOT NULL,
  avg_close_rate NUMERIC,
  avg_inspection_score NUMERIC,
  avg_gross_margin NUMERIC,
  avg_cost_per_sqft NUMERIC,
  org_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_size_bucket, vertical)
);

COMMENT ON TABLE public.benchmark_aggregates IS 'Anonymized benchmark metrics by peer group. Only aggregated data; no org-level rows. Populated by cron/job.';

CREATE INDEX IF NOT EXISTS idx_benchmark_aggregates_updated_at
  ON public.benchmark_aggregates(updated_at DESC);

ALTER TABLE public.benchmark_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read benchmark aggregates" ON public.benchmark_aggregates;
CREATE POLICY "Authenticated can read benchmark aggregates"
  ON public.benchmark_aggregates FOR SELECT
  TO authenticated
  USING (true);


-- ############################################################################
-- FROM 061: Benchmark Minimum Cohort (supersedes 060's function)
-- ############################################################################

CREATE OR REPLACE FUNCTION public.refresh_benchmark_aggregates()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  TRUNCATE public.benchmark_aggregates;

  WITH opted AS (
    SELECT id,
      COALESCE(NULLIF(TRIM(company_size_bucket), ''), 'unknown') AS bucket,
      COALESCE(NULLIF(TRIM(vertical), ''), 'unknown') AS vertical
    FROM organizations
    WHERE benchmarking_opt_in = true
  ),
  close_rates AS (
    SELECT sp.org_id,
      CASE WHEN COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')) > 0
        THEN COUNT(*) FILTER (WHERE sp.status = 'won' AND sp.delivered_at >= (NOW() - INTERVAL '90 days'))::NUMERIC
          / NULLIF(COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')), 0)
        ELSE NULL END AS close_rate
    FROM sales_proposals sp
    INNER JOIN opted o ON o.id = sp.org_id
    GROUP BY sp.org_id
  ),
  insp_scores AS (
    SELECT i.org_id,
      AVG(COALESCE(i.score, i.total_score)) AS avg_score
    FROM inspections i
    INNER JOIN opted o ON o.id = i.org_id
    WHERE (i.completed_at IS NOT NULL AND i.completed_at >= (NOW() - INTERVAL '90 days'))
    GROUP BY i.org_id
  ),
  org_metrics AS (
    SELECT o.id, o.bucket, o.vertical,
      cr.close_rate,
      ins.avg_score AS inspection_score
    FROM opted o
    LEFT JOIN close_rates cr ON cr.org_id = o.id
    LEFT JOIN insp_scores ins ON ins.org_id = o.id
  ),
  agg AS (
    SELECT
      om.bucket AS company_size_bucket,
      om.vertical,
      AVG(om.close_rate) AS avg_close_rate,
      AVG(om.inspection_score) AS avg_inspection_score,
      NULL::NUMERIC AS avg_gross_margin,
      NULL::NUMERIC AS avg_cost_per_sqft,
      COUNT(*)::INT AS org_count
    FROM org_metrics om
    GROUP BY om.bucket, om.vertical
    HAVING COUNT(*) >= 10
  )
  INSERT INTO public.benchmark_aggregates (
    company_size_bucket,
    vertical,
    avg_close_rate,
    avg_inspection_score,
    avg_gross_margin,
    avg_cost_per_sqft,
    org_count,
    updated_at
  )
  SELECT
    a.company_size_bucket,
    a.vertical,
    a.avg_close_rate,
    a.avg_inspection_score,
    a.avg_gross_margin,
    a.avg_cost_per_sqft,
    a.org_count,
    NOW()
  FROM agg a;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected;
END;
$$;

COMMENT ON FUNCTION public.refresh_benchmark_aggregates() IS 'Recomputes benchmark_aggregates from opted-in orgs only. Cohorts with fewer than 10 orgs are excluded to prevent re-identification.';


-- ############################################################################
-- FROM 062: Executive Mode Pref
-- ############################################################################

ALTER TABLE public.user_ui_prefs
  ADD COLUMN IF NOT EXISTS executive_mode_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_ui_prefs.executive_mode_enabled IS 'When true, dashboard shows simplified executive view (high-signal KPIs only, no widget editing). Stored with module_key = dashboard.';


-- ============================================================================
-- END OF 087 RECONCILIATION (Part 1: migrations 046–062)
-- ============================================================================
