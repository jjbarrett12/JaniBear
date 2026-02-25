-- ============================================================================
-- 088_reconcile_remaining_schema.sql
--
-- Reconciles all missing schema objects from migrations 063 through 086
-- (plus empty 20260222052729) into a single idempotent migration.
--
-- Every statement is safe to re-run:
--   - Tables:    CREATE TABLE IF NOT EXISTS
--   - Indexes:   CREATE INDEX IF NOT EXISTS (or DROP + CREATE for unique partials)
--   - Policies:  DROP POLICY IF EXISTS before CREATE POLICY
--   - Functions: CREATE OR REPLACE FUNCTION
--   - Triggers:  DROP TRIGGER IF EXISTS before CREATE TRIGGER
--   - Columns:   ALTER TABLE ADD COLUMN IF NOT EXISTS
--   - Buckets:   ON CONFLICT (id) DO NOTHING
--
-- Migrations 079 and 080 are intentionally skipped (duplicates of 077/078).
-- Migration 20260222052729 is empty — nothing to reconcile.
-- ============================================================================


-- ============================================================================
-- 063: Alerts table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('account_health_decay', 'missed_inspection', 'ar_aging', 'margin_leakage')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'dismissed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dismissed_at TIMESTAMPTZ,
  signals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.alerts IS 'Unified alerts from account health, missed inspections, AR aging, margin rules. signals = contributing factors for "what changed" view.';
COMMENT ON COLUMN public.alerts.signals IS 'Array of { label, value, detail? } describing what contributed to this alert.';

CREATE INDEX IF NOT EXISTS idx_alerts_org_status ON public.alerts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_org_created ON public.alerts(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON public.alerts(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(org_id, type);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can read alerts" ON public.alerts;
CREATE POLICY "Org members can read alerts"
  ON public.alerts FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can insert alerts" ON public.alerts;
CREATE POLICY "Org members can insert alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can update alerts" ON public.alerts;
CREATE POLICY "Org members can update alerts"
  ON public.alerts FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members can delete alerts" ON public.alerts;
CREATE POLICY "Org members can delete alerts"
  ON public.alerts FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at_alerts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON public.alerts;
CREATE TRIGGER trg_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_alerts();


-- ============================================================================
-- 064: Alerts anti-spam unique index
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_one_open_per_entity
  ON public.alerts (org_id, entity_type, entity_id)
  WHERE status = 'open' AND entity_id IS NOT NULL;

COMMENT ON INDEX public.idx_alerts_one_open_per_entity IS 'Prevents duplicate open alerts per entity; use upsert or check before insert in alert generation.';


-- ============================================================================
-- 065: Activity log insert policy
-- (activity_log may not exist — guard with table-existence check)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'activity_log'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Org members can insert activity_log" ON activity_log';
    EXECUTE 'CREATE POLICY "Org members can insert activity_log"
      ON activity_log FOR INSERT TO authenticated
      WITH CHECK (
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      )';
  END IF;
END $$;


-- ============================================================================
-- 066: JB Training tables (10 tables)
-- ============================================================================

-- 1) jb_training_courses
CREATE TABLE IF NOT EXISTS public.jb_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'floor_care', 'chemicals', 'customer_service', 'medical', 'safety', 'supervision', 'other'
  )),
  level TEXT NOT NULL DEFAULT 'foundation' CHECK (level IN ('foundation', 'skill', 'site', 'leadership')),
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'es')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  estimated_minutes INT NOT NULL DEFAULT 0,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'pdf', 'checklist', 'mixed')),
  content_url TEXT,
  thumbnail_url TEXT,
  premium_tier TEXT NOT NULL DEFAULT 'free' CHECK (premium_tier IN ('free', 'grizzly', 'kodiak')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_courses_org ON public.jb_training_courses(org_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_courses_category ON public.jb_training_courses(category);
CREATE INDEX IF NOT EXISTS idx_jb_training_courses_active ON public.jb_training_courses(is_active) WHERE is_active = true;

-- 2) jb_training_lessons
CREATE TABLE IF NOT EXISTS public.jb_training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.jb_training_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  content_url TEXT,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video', 'pdf', 'checklist', 'mixed')),
  estimated_minutes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_lessons_course ON public.jb_training_lessons(course_id);

-- 3) jb_training_quizzes
CREATE TABLE IF NOT EXISTS public.jb_training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.jb_training_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.jb_training_lessons(id) ON DELETE SET NULL,
  passing_score INT NOT NULL DEFAULT 80,
  attempts_allowed INT NOT NULL DEFAULT 3,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_quizzes_course ON public.jb_training_quizzes(course_id);

-- 4) jb_training_quiz_questions
CREATE TABLE IF NOT EXISTS public.jb_training_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.jb_training_quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single_choice', 'multi_choice', 'true_false')),
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer JSONB NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_quiz_questions_quiz ON public.jb_training_quiz_questions(quiz_id);

-- 5) jb_training_enrollments
CREATE TABLE IF NOT EXISTS public.jb_training_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.jb_training_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_jb_training_enrollments_user ON public.jb_training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_enrollments_course ON public.jb_training_enrollments(course_id);

-- 6) jb_training_progress
CREATE TABLE IF NOT EXISTS public.jb_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.jb_training_enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.jb_training_lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_jb_training_progress_enrollment ON public.jb_training_progress(enrollment_id);

-- 7) jb_training_quiz_submissions
CREATE TABLE IF NOT EXISTS public.jb_training_quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.jb_training_quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.jb_training_enrollments(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_quiz_submissions_user ON public.jb_training_quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_quiz_submissions_quiz ON public.jb_training_quiz_submissions(quiz_id);

-- 8) jb_training_certifications
CREATE TABLE IF NOT EXISTS public.jb_training_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.jb_training_courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  renewal_due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_certifications_user ON public.jb_training_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_certifications_course ON public.jb_training_certifications(course_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_certifications_expires ON public.jb_training_certifications(expires_at) WHERE expires_at IS NOT NULL;

-- 9) jb_training_requirements
CREATE TABLE IF NOT EXISTS public.jb_training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('role', 'site', 'account')),
  role_key TEXT CHECK (role_key IN ('cleaner', 'floor_tech', 'supervisor', 'medical', 'manager', 'inspector', 'owner', 'client_viewer')),
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
  required_course_ids UUID[] NOT NULL DEFAULT '{}',
  enforcement TEXT NOT NULL DEFAULT 'soft_recommend' CHECK (enforcement IN ('hard_gate', 'soft_recommend')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_requirements_org ON public.jb_training_requirements(org_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_requirements_account ON public.jb_training_requirements(account_id) WHERE account_id IS NOT NULL;

-- 10) jb_training_recommendations
CREATE TABLE IF NOT EXISTS public.jb_training_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('inspection_fail', 'complaint', 'sla_breach', 'manual')),
  source_ref_id UUID,
  course_id UUID NOT NULL REFERENCES public.jb_training_courses(id) ON DELETE CASCADE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jb_training_recommendations_org_user ON public.jb_training_recommendations(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_jb_training_recommendations_user ON public.jb_training_recommendations(user_id);

-- updated_at function for training tables
CREATE OR REPLACE FUNCTION public.set_updated_at_jb_training()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- RLS on all training tables
ALTER TABLE public.jb_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jb_training_recommendations ENABLE ROW LEVEL SECURITY;

-- Courses policies
DROP POLICY IF EXISTS "jb_training_courses_select_global_or_org" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_select_global_or_org"
  ON public.jb_training_courses FOR SELECT TO authenticated
  USING (
    (org_id IS NULL AND is_active = true)
    OR (org_id IS NOT NULL AND is_org_member(org_id, auth.uid()))
  );

DROP POLICY IF EXISTS "jb_training_courses_insert_platform_global" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_insert_platform_global"
  ON public.jb_training_courses FOR INSERT TO authenticated
  WITH CHECK (org_id IS NULL AND is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "jb_training_courses_insert_org" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_insert_org"
  ON public.jb_training_courses FOR INSERT TO authenticated
  WITH CHECK (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "jb_training_courses_update_platform_global" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_update_platform_global"
  ON public.jb_training_courses FOR UPDATE TO authenticated
  USING (org_id IS NULL AND is_platform_admin(auth.uid()))
  WITH CHECK (org_id IS NULL AND is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "jb_training_courses_update_org" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_update_org"
  ON public.jb_training_courses FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()))
  WITH CHECK (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

DROP POLICY IF EXISTS "jb_training_courses_delete_platform_global" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_delete_platform_global"
  ON public.jb_training_courses FOR DELETE TO authenticated
  USING (org_id IS NULL AND is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "jb_training_courses_delete_org" ON public.jb_training_courses;
CREATE POLICY "jb_training_courses_delete_org"
  ON public.jb_training_courses FOR DELETE TO authenticated
  USING (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

-- Lessons policies
DROP POLICY IF EXISTS "jb_training_lessons_select" ON public.jb_training_lessons;
CREATE POLICY "jb_training_lessons_select"
  ON public.jb_training_lessons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND c.is_active = true) OR (c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_lessons_insert" ON public.jb_training_lessons;
CREATE POLICY "jb_training_lessons_insert"
  ON public.jb_training_lessons FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_lessons_update" ON public.jb_training_lessons;
CREATE POLICY "jb_training_lessons_update"
  ON public.jb_training_lessons FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_lessons_delete" ON public.jb_training_lessons;
CREATE POLICY "jb_training_lessons_delete"
  ON public.jb_training_lessons FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Quizzes policies
DROP POLICY IF EXISTS "jb_training_quizzes_select" ON public.jb_training_quizzes;
CREATE POLICY "jb_training_quizzes_select"
  ON public.jb_training_quizzes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND c.is_active = true) OR (c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_quizzes_all_manage" ON public.jb_training_quizzes;
CREATE POLICY "jb_training_quizzes_all_manage"
  ON public.jb_training_quizzes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Quiz questions policies
DROP POLICY IF EXISTS "jb_training_quiz_questions_select" ON public.jb_training_quiz_questions;
CREATE POLICY "jb_training_quiz_questions_select"
  ON public.jb_training_quiz_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id
        AND ((c.org_id IS NULL AND c.is_active = true) OR (c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_quiz_questions_all_manage" ON public.jb_training_quiz_questions;
CREATE POLICY "jb_training_quiz_questions_all_manage"
  ON public.jb_training_quiz_questions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id
        AND ((c.org_id IS NULL AND is_platform_admin(auth.uid())) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Enrollments policies
DROP POLICY IF EXISTS "jb_training_enrollments_select_own" ON public.jb_training_enrollments;
CREATE POLICY "jb_training_enrollments_select_own"
  ON public.jb_training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "jb_training_enrollments_select_org" ON public.jb_training_enrollments;
CREATE POLICY "jb_training_enrollments_select_org"
  ON public.jb_training_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "jb_training_enrollments_insert" ON public.jb_training_enrollments;
CREATE POLICY "jb_training_enrollments_insert"
  ON public.jb_training_enrollments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "jb_training_enrollments_update" ON public.jb_training_enrollments;
CREATE POLICY "jb_training_enrollments_update"
  ON public.jb_training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jb_training_courses c WHERE c.id = course_id AND c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
  WITH CHECK (true);

-- Progress policies
DROP POLICY IF EXISTS "jb_training_progress_select_own" ON public.jb_training_progress;
CREATE POLICY "jb_training_progress_select_own"
  ON public.jb_training_progress FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "jb_training_progress_select_org" ON public.jb_training_progress;
CREATE POLICY "jb_training_progress_select_org"
  ON public.jb_training_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_enrollments e
      JOIN public.jb_training_courses c ON c.id = e.course_id
      WHERE e.id = enrollment_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "jb_training_progress_insert_update" ON public.jb_training_progress;
CREATE POLICY "jb_training_progress_insert_update"
  ON public.jb_training_progress FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  );

-- Quiz submissions policies
DROP POLICY IF EXISTS "jb_training_quiz_submissions_select_own" ON public.jb_training_quiz_submissions;
CREATE POLICY "jb_training_quiz_submissions_select_own"
  ON public.jb_training_quiz_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "jb_training_quiz_submissions_select_org" ON public.jb_training_quiz_submissions;
CREATE POLICY "jb_training_quiz_submissions_select_org"
  ON public.jb_training_quiz_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "jb_training_quiz_submissions_insert" ON public.jb_training_quiz_submissions;
CREATE POLICY "jb_training_quiz_submissions_insert"
  ON public.jb_training_quiz_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Certifications policies
DROP POLICY IF EXISTS "jb_training_certifications_select_own" ON public.jb_training_certifications;
CREATE POLICY "jb_training_certifications_select_own"
  ON public.jb_training_certifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "jb_training_certifications_select_org" ON public.jb_training_certifications;
CREATE POLICY "jb_training_certifications_select_org"
  ON public.jb_training_certifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "jb_training_certifications_insert" ON public.jb_training_certifications;
CREATE POLICY "jb_training_certifications_insert"
  ON public.jb_training_certifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND (c.org_id IS NULL AND is_platform_admin(auth.uid()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

DROP POLICY IF EXISTS "jb_training_certifications_update" ON public.jb_training_certifications;
CREATE POLICY "jb_training_certifications_update"
  ON public.jb_training_certifications FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Requirements policies
DROP POLICY IF EXISTS "jb_training_requirements_select" ON public.jb_training_requirements;
CREATE POLICY "jb_training_requirements_select"
  ON public.jb_training_requirements FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "jb_training_requirements_insert_update_delete" ON public.jb_training_requirements;
CREATE POLICY "jb_training_requirements_insert_update_delete"
  ON public.jb_training_requirements FOR ALL TO authenticated
  USING (can_write_org(org_id, auth.uid()))
  WITH CHECK (can_write_org(org_id, auth.uid()));

-- Recommendations policies
DROP POLICY IF EXISTS "jb_training_recommendations_select" ON public.jb_training_recommendations;
CREATE POLICY "jb_training_recommendations_select"
  ON public.jb_training_recommendations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "jb_training_recommendations_insert" ON public.jb_training_recommendations;
CREATE POLICY "jb_training_recommendations_insert"
  ON public.jb_training_recommendations FOR INSERT TO authenticated
  WITH CHECK (is_org_member(org_id, auth.uid()));

DROP POLICY IF EXISTS "jb_training_recommendations_update" ON public.jb_training_recommendations;
CREATE POLICY "jb_training_recommendations_update"
  ON public.jb_training_recommendations FOR UPDATE TO authenticated
  USING (is_org_member(org_id, auth.uid()) OR user_id = auth.uid())
  WITH CHECK (true);

-- Training triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_courses_updated_at') THEN
    CREATE TRIGGER trg_jb_training_courses_updated_at BEFORE UPDATE ON public.jb_training_courses
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_lessons_updated_at') THEN
    CREATE TRIGGER trg_jb_training_lessons_updated_at BEFORE UPDATE ON public.jb_training_lessons
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_requirements_updated_at') THEN
    CREATE TRIGGER trg_jb_training_requirements_updated_at BEFORE UPDATE ON public.jb_training_requirements
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_recommendations_updated_at') THEN
    CREATE TRIGGER trg_jb_training_recommendations_updated_at BEFORE UPDATE ON public.jb_training_recommendations
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_certifications_updated_at') THEN
    CREATE TRIGGER trg_jb_training_certifications_updated_at BEFORE UPDATE ON public.jb_training_certifications
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_enrollments_updated_at') THEN
    CREATE TRIGGER trg_jb_training_enrollments_updated_at BEFORE UPDATE ON public.jb_training_enrollments
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_progress_updated_at') THEN
    CREATE TRIGGER trg_jb_training_progress_updated_at BEFORE UPDATE ON public.jb_training_progress
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_quiz_questions_updated_at') THEN
    CREATE TRIGGER trg_jb_training_quiz_questions_updated_at BEFORE UPDATE ON public.jb_training_quiz_questions
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jb_training_quizzes_updated_at') THEN
    CREATE TRIGGER trg_jb_training_quizzes_updated_at BEFORE UPDATE ON public.jb_training_quizzes
      FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at_jb_training();
  END IF;
END;
$$;


-- ============================================================================
-- 067: JB Training seed data (global platform courses)
-- ============================================================================

DO $$
DECLARE
  cid UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM jb_training_courses LIMIT 1) THEN
    INSERT INTO public.jb_training_courses (org_id, title, description, category, level, language, is_active, estimated_minutes, content_type, premium_tier)
    VALUES
      (NULL, 'Chemical Dilution & Safety', 'Safe handling, dilution ratios, and SDS basics.', 'chemicals', 'foundation', 'en', true, 25, 'mixed', 'free'),
      (NULL, 'Restroom Sanitation Standards', 'Restroom cleaning procedures and health standards.', 'safety', 'foundation', 'en', true, 20, 'mixed', 'free'),
      (NULL, 'Floor Care Basics', 'Introduction to floor types, cleaning methods, and equipment.', 'floor_care', 'foundation', 'en', true, 30, 'video', 'free'),
      (NULL, 'Customer Service Basics', 'Professional communication and client interaction.', 'customer_service', 'foundation', 'en', true, 15, 'mixed', 'free'),
      (NULL, 'Terminal Cleaning', 'Healthcare and terminal cleaning protocols.', 'medical', 'skill', 'en', true, 45, 'mixed', 'grizzly'),
      (NULL, 'Strip & Wax Deep Dive', 'Advanced strip, seal, and wax procedures.', 'floor_care', 'skill', 'en', true, 60, 'video', 'grizzly');

    FOR cid IN SELECT id FROM public.jb_training_courses WHERE org_id IS NULL
    LOOP
      IF NOT EXISTS (SELECT 1 FROM public.jb_training_lessons WHERE course_id = cid LIMIT 1) THEN
        INSERT INTO public.jb_training_lessons (course_id, title, sort_order, content_type, estimated_minutes)
        VALUES (cid, 'Overview', 1, 'video', 5);
      END IF;
    END LOOP;
  END IF;
END;
$$;


-- ============================================================================
-- 068: Pro Gear feature flag, org scoping, savings, recurring orders
-- ============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pro_gear_enabled BOOLEAN NOT NULL DEFAULT false;
COMMENT ON COLUMN organizations.pro_gear_enabled IS 'When true, Member Pro Gear is visible and usable for this org.';

ALTER TABLE pro_gear_orders ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE pro_gear_orders ADD COLUMN IF NOT EXISTS savings_total_cents INT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_pro_gear_orders_org ON pro_gear_orders(org_id) WHERE org_id IS NOT NULL;

ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS retail_price_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS member_price_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS savings_cents INT;
ALTER TABLE pro_gear_order_items ADD COLUMN IF NOT EXISTS assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pro_gear_order_items_assigned_account ON pro_gear_order_items(assigned_account_id) WHERE assigned_account_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS pro_gear_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pro_gear_products(id) ON DELETE CASCADE,
  qty INT NOT NULL CHECK (qty > 0) DEFAULT 1,
  uom TEXT NOT NULL DEFAULT 'case' CHECK (uom IN ('box', 'case')),
  assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id, product_id, uom)
);

CREATE INDEX IF NOT EXISTS idx_pro_gear_cart_items_org_user ON pro_gear_cart_items(org_id, user_id);

ALTER TABLE pro_gear_cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pro_gear_cart_items" ON pro_gear_cart_items;
CREATE POLICY "Users manage own pro_gear_cart_items"
  ON pro_gear_cart_items FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS pro_gear_recurring_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency_days INT NOT NULL CHECK (frequency_days IN (30, 60, 90)) DEFAULT 30,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN pro_gear_recurring_orders.items IS 'Array of { product_id, qty, uom }';

CREATE INDEX IF NOT EXISTS idx_pro_gear_recurring_org ON pro_gear_recurring_orders(org_id);
CREATE INDEX IF NOT EXISTS idx_pro_gear_recurring_next ON pro_gear_recurring_orders(next_run_at) WHERE is_active = true;

ALTER TABLE pro_gear_recurring_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members read pro_gear_recurring_orders" ON pro_gear_recurring_orders;
CREATE POLICY "Org members read pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members insert pro_gear_recurring_orders" ON pro_gear_recurring_orders;
CREATE POLICY "Org members insert pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Org members update pro_gear_recurring_orders" ON pro_gear_recurring_orders;
CREATE POLICY "Org members update pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR UPDATE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Org members delete pro_gear_recurring_orders" ON pro_gear_recurring_orders;
CREATE POLICY "Org members delete pro_gear_recurring_orders"
  ON pro_gear_recurring_orders FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION pro_gear_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pro_gear_cart_items_updated ON pro_gear_cart_items;
CREATE TRIGGER trg_pro_gear_cart_items_updated BEFORE UPDATE ON pro_gear_cart_items
  FOR EACH ROW EXECUTE PROCEDURE pro_gear_set_updated_at();

DROP TRIGGER IF EXISTS trg_pro_gear_recurring_updated ON pro_gear_recurring_orders;
CREATE TRIGGER trg_pro_gear_recurring_updated BEFORE UPDATE ON pro_gear_recurring_orders
  FOR EACH ROW EXECUTE PROCEDURE pro_gear_set_updated_at();


-- ============================================================================
-- 069: Sales leads conversion + opportunity → account link
-- (opportunities and leads may not exist — guard with table checks)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'opportunities'
  ) THEN
    EXECUTE 'ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_opportunities_account_id ON opportunities(account_id) WHERE account_id IS NOT NULL';
    EXECUTE $c$COMMENT ON COLUMN opportunities.account_id IS 'When set, opportunity is tied to this account (prospect/customer).'$c$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'opportunities'
    ) THEN
      EXECUTE 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL';
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_converted_opportunity ON leads(converted_opportunity_id) WHERE converted_opportunity_id IS NOT NULL';
      EXECUTE $c$COMMENT ON COLUMN leads.converted_opportunity_id IS 'Set when lead is converted to an opportunity (Pipeline).'$c$;
    END IF;
    EXECUTE 'ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_converted_account ON leads(converted_account_id) WHERE converted_account_id IS NOT NULL';
    EXECUTE $c$COMMENT ON COLUMN leads.converted_account_id IS 'Account (prospect) created or selected when converting to opportunity.'$c$;
  END IF;
END $$;


-- ============================================================================
-- 070: Organizations branding columns ensure
-- ============================================================================

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_branding BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_organizations_custom_branding ON organizations(custom_branding) WHERE custom_branding = true;


-- ============================================================================
-- 071: AI Control Center (5 tables)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_ai_org_config_org ON ai_org_config(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_module_state_org ON ai_module_state(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_module_state_key ON ai_module_state(module_key);
CREATE INDEX IF NOT EXISTS idx_ai_automation_rules_org ON ai_automation_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_period ON ai_usage(org_id, period);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_date ON ai_usage(org_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_org ON ai_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_log_created ON ai_audit_log(created_at DESC);

ALTER TABLE ai_org_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_module_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_org_config_select" ON ai_org_config;
CREATE POLICY "ai_org_config_select" ON ai_org_config FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_org_config_admin" ON ai_org_config;
CREATE POLICY "ai_org_config_admin" ON ai_org_config FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "ai_module_state_select" ON ai_module_state;
CREATE POLICY "ai_module_state_select" ON ai_module_state FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_module_state_admin" ON ai_module_state;
CREATE POLICY "ai_module_state_admin" ON ai_module_state FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "ai_automation_rules_select" ON ai_automation_rules;
CREATE POLICY "ai_automation_rules_select" ON ai_automation_rules FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_automation_rules_admin" ON ai_automation_rules;
CREATE POLICY "ai_automation_rules_admin" ON ai_automation_rules FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

DROP POLICY IF EXISTS "ai_usage_select" ON ai_usage;
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_usage_insert" ON ai_usage;
CREATE POLICY "ai_usage_insert" ON ai_usage FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_audit_log_select" ON ai_audit_log;
CREATE POLICY "ai_audit_log_select" ON ai_audit_log FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ai_audit_log_insert" ON ai_audit_log;
CREATE POLICY "ai_audit_log_insert" ON ai_audit_log FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP INDEX IF EXISTS ai_usage_org_period_date_unique;
CREATE UNIQUE INDEX ai_usage_org_period_date_unique ON ai_usage(org_id, period)
  WHERE usage_date IS NULL;

DROP INDEX IF EXISTS ai_usage_org_period_day_unique;
CREATE UNIQUE INDEX ai_usage_org_period_day_unique ON ai_usage(org_id, period, usage_date)
  WHERE usage_date IS NOT NULL;


-- ============================================================================
-- 072: AI org config notify + budget display fields
-- ============================================================================

ALTER TABLE ai_org_config
  ADD COLUMN IF NOT EXISTS notify_at_percent INTEGER DEFAULT 80,
  ADD COLUMN IF NOT EXISTS notify_channel TEXT DEFAULT 'in_app' CHECK (notify_channel IN ('in_app', 'email', 'slack'));


-- ============================================================================
-- 073: KPI Command Center summary view
-- ============================================================================

CREATE OR REPLACE VIEW public.kpi_summary_view AS
SELECT
  o.id AS org_id,
  NULL::numeric AS mrr,
  NULL::numeric AS gross_margin_percent,
  NULL::numeric AS net_mrr_change_30d,
  NULL::integer AS accounts_at_risk_count,
  NULL::numeric AS crew_utilization_percent,
  NULL::numeric AS inspection_pass_rate,
  NULL::numeric AS ar_over_60_percent,
  NULL::numeric AS pipeline_value,
  NULL::numeric AS close_rate_percent,
  NULL::numeric AS avg_contract_size,
  NULL::integer AS sales_cycle_days,
  NULL::integer AS sla_breaches_count,
  NULL::integer AS open_issues_count,
  NULL::numeric AS contracts_expiring_90d_count,
  NULL::numeric AS client_health_decay_risk_count
FROM public.organizations o;

COMMENT ON VIEW public.kpi_summary_view IS 'One row per org for KPI Command Center. Replace with real aggregates when backend supports.';


-- ============================================================================
-- 074: Organization logos storage bucket + policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-logos', 'organization-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload logos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can read logos from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Public can read organization logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete logos from their organization" ON storage.objects;

CREATE POLICY "Users can upload logos for their organization"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can read logos from their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can read organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

CREATE POLICY "Users can delete logos from their organization"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM org_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
  )
);


-- ============================================================================
-- 075: Accept org invite function
-- (org_invites may not exist at runtime; function creation succeeds regardless)
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_org_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite RECORD;
  v_limit INT;
  v_count INT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT id, org_id, email, role, expires_at, accepted_at
  INTO v_invite
  FROM org_invites
  WHERE token = p_token;

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired invite');
  END IF;
  IF v_invite.accepted_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has already been used');
  END IF;
  IF v_invite.expires_at < NOW() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has expired');
  END IF;

  SELECT COALESCE(o.seat_limit, 5) INTO v_limit
  FROM organizations o WHERE o.id = v_invite.org_id;
  SELECT COUNT(*)::INT INTO v_count
  FROM org_members
  WHERE org_id = v_invite.org_id AND status = 'active';
  IF v_count >= v_limit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Organization seat limit reached');
  END IF;

  INSERT INTO org_members (org_id, user_id, role, status)
  VALUES (v_invite.org_id, v_user_id, v_invite.role, 'active')
  ON CONFLICT (org_id, user_id) DO UPDATE SET role = v_invite.role, status = 'active';

  UPDATE org_invites SET accepted_at = NOW() WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'org_id', v_invite.org_id);
END;
$$;

COMMENT ON FUNCTION accept_org_invite(TEXT) IS 'Accept an org invite by token. Call as authenticated user. Adds/updates org_members and marks invite accepted.';


-- ============================================================================
-- 076: Organization logos — larger file limit (20 MB)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'storage' AND table_name = 'buckets' AND column_name = 'file_size_limit'
  ) THEN
    UPDATE storage.buckets
    SET file_size_limit = 20971520
    WHERE id = 'organization-logos';
  END IF;
END $$;


-- ============================================================================
-- 077: Allow managers to update organization row (e.g. branding)
-- ============================================================================

DROP POLICY IF EXISTS "Owners can update org" ON organizations;
CREATE POLICY "Owners can update org"
  ON organizations FOR UPDATE
  TO authenticated
  USING (get_user_org_role(id, auth.uid()) IN ('owner', 'manager'));

COMMENT ON POLICY "Owners can update org" ON organizations IS
  'Owner and manager can update org (e.g. branding, name)';


-- ============================================================================
-- 078: Profiles — allow same-org member reads for crew forms
-- ============================================================================

DROP POLICY IF EXISTS "Org members can read same-org member profiles" ON profiles;
CREATE POLICY "Org members can read same-org member profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT om.user_id
      FROM org_members om
      WHERE om.org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
    )
  );

COMMENT ON POLICY "Org members can read same-org member profiles" ON profiles IS
  'Allows crew form and similar features to show names of other org members; same-org only.';


-- ============================================================================
-- 079 and 080 SKIPPED — duplicates of 077 and 078
-- ============================================================================


-- ============================================================================
-- 081: Pro Gear product SKU + contact requests table
-- ============================================================================

ALTER TABLE pro_gear_products ADD COLUMN IF NOT EXISTS sku TEXT;
CREATE INDEX IF NOT EXISTS idx_pro_gear_products_sku ON pro_gear_products(sku) WHERE sku IS NOT NULL;

CREATE TABLE IF NOT EXISTS pro_gear_contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  estimated_quantity TEXT,
  estimated_value_cents INT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pro_gear_contact_requests_status ON pro_gear_contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_pro_gear_contact_requests_created ON pro_gear_contact_requests(created_at DESC);

ALTER TABLE pro_gear_contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own pro_gear_contact_requests" ON pro_gear_contact_requests;
CREATE POLICY "Users can insert own pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can read own pro_gear_contact_requests" ON pro_gear_contact_requests;
CREATE POLICY "Users can read own pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all pro_gear_contact_requests" ON pro_gear_contact_requests;
CREATE POLICY "Admins read all pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR SELECT TO authenticated
  USING (is_pro_gear_admin());

DROP POLICY IF EXISTS "Admins update pro_gear_contact_requests" ON pro_gear_contact_requests;
CREATE POLICY "Admins update pro_gear_contact_requests"
  ON pro_gear_contact_requests FOR UPDATE TO authenticated
  USING (is_pro_gear_admin());

COMMENT ON TABLE pro_gear_contact_requests IS 'Request to be contacted about large orders / bulk opportunities';


-- ============================================================================
-- 082: Profiles — deny self-assign of is_platform_admin
-- ============================================================================

CREATE OR REPLACE FUNCTION profiles_deny_platform_admin_self_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.is_platform_admin = true AND (OLD.is_platform_admin IS DISTINCT FROM true)) THEN
    IF NOT is_platform_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Only a platform admin can set is_platform_admin.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS profiles_platform_admin_guard ON profiles;
CREATE TRIGGER profiles_platform_admin_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_deny_platform_admin_self_update();


-- ============================================================================
-- 083: Widget layout templates — name and lock columns
-- (widget_layout_templates may not exist — guard with table check)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'widget_layout_templates'
  ) THEN
    EXECUTE 'ALTER TABLE public.widget_layout_templates ADD COLUMN IF NOT EXISTS name text';
    EXECUTE 'ALTER TABLE public.widget_layout_templates ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false';
    EXECUTE $c$COMMENT ON COLUMN public.widget_layout_templates.name IS 'Display name for the template (e.g. "Ops Standard v1").'$c$;
    EXECUTE $c$COMMENT ON COLUMN public.widget_layout_templates.is_locked IS 'When true, non-admin users cannot customize layout for this module+role; edit mode disabled.'$c$;
  END IF;
END $$;


-- ============================================================================
-- 084: Audit log table (CRM/Ops/Finance immutable trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT
);

COMMENT ON TABLE public.audit_log IS 'Immutable audit trail. Key actions: pricing changes, proposal edits, contract frequency, inspection score, invoice edits.';
COMMENT ON COLUMN public.audit_log.before_state IS 'Snapshot before change (relevant fields only).';
COMMENT ON COLUMN public.audit_log.after_state IS 'Snapshot after change (relevant fields only).';

CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.audit_log(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_entity ON public.audit_log(org_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(org_id, actor_user_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read audit_log" ON public.audit_log;
CREATE POLICY "Admin can read audit_log"
  ON public.audit_log FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.org_id = audit_log.org_id AND m.user_id = auth.uid()
        AND LOWER(COALESCE(m.role, '')) IN ('owner', 'admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Org member can insert audit_log" ON public.audit_log;
CREATE POLICY "Org member can insert audit_log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );


-- ============================================================================
-- 085: Avatars storage bucket + policies
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- 086: Benchmark share code + code-based aggregates
-- ============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS benchmark_share_code TEXT;

COMMENT ON COLUMN organizations.benchmark_share_code IS 'Optional. When set, org is included in code-based benchmark aggregate. Share this code with other JANIBEAR orgs to compare only with them.';

CREATE INDEX IF NOT EXISTS idx_organizations_benchmark_share_code
  ON organizations(benchmark_share_code) WHERE benchmark_share_code IS NOT NULL AND TRIM(benchmark_share_code) <> '';

CREATE TABLE IF NOT EXISTS public.benchmark_code_aggregates (
  share_code TEXT NOT NULL PRIMARY KEY,
  avg_close_rate NUMERIC,
  avg_inspection_score NUMERIC,
  avg_gross_margin NUMERIC,
  avg_cost_per_sqft NUMERIC,
  org_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.benchmark_code_aggregates IS 'Benchmark aggregates by share code. Only orgs with that code can read. Populated by refresh_benchmark_code_aggregates.';

ALTER TABLE public.benchmark_code_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own code group aggregates" ON public.benchmark_code_aggregates;
CREATE POLICY "Read own code group aggregates"
  ON public.benchmark_code_aggregates FOR SELECT
  TO authenticated
  USING (
    share_code IN (
      SELECT o.benchmark_share_code
      FROM organizations o
      INNER JOIN org_members m ON m.org_id = o.id
      WHERE m.user_id = auth.uid()
        AND (m.status = 'active' OR m.status IS NULL)
        AND o.benchmark_share_code IS NOT NULL
        AND TRIM(o.benchmark_share_code) <> ''
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_benchmark_code_aggregates()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_affected INT;
BEGIN
  TRUNCATE public.benchmark_code_aggregates;

  WITH with_code AS (
    SELECT id, TRIM(benchmark_share_code) AS code
    FROM organizations
    WHERE benchmark_share_code IS NOT NULL AND TRIM(benchmark_share_code) <> ''
  ),
  close_rates AS (
    SELECT sp.org_id,
      CASE WHEN COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')) > 0
        THEN COUNT(*) FILTER (WHERE sp.status = 'won' AND sp.delivered_at >= (NOW() - INTERVAL '90 days'))::NUMERIC
          / NULLIF(COUNT(*) FILTER (WHERE sp.delivered_at >= (NOW() - INTERVAL '90 days')), 0)
        ELSE NULL END AS close_rate
    FROM sales_proposals sp
    INNER JOIN with_code w ON w.id = sp.org_id
    GROUP BY sp.org_id
  ),
  insp_scores AS (
    SELECT i.org_id,
      AVG(COALESCE(i.score, i.total_score)) AS avg_score
    FROM inspections i
    INNER JOIN with_code w ON w.id = i.org_id
    WHERE (i.completed_at IS NOT NULL AND i.completed_at >= (NOW() - INTERVAL '90 days'))
    GROUP BY i.org_id
  ),
  org_metrics AS (
    SELECT w.id, w.code,
      cr.close_rate,
      ins.avg_score AS inspection_score
    FROM with_code w
    LEFT JOIN close_rates cr ON cr.org_id = w.id
    LEFT JOIN insp_scores ins ON ins.org_id = w.id
  ),
  agg AS (
    SELECT
      om.code AS share_code,
      AVG(om.close_rate) AS avg_close_rate,
      AVG(om.inspection_score) AS avg_inspection_score,
      NULL::NUMERIC AS avg_gross_margin,
      NULL::NUMERIC AS avg_cost_per_sqft,
      COUNT(*)::INT AS org_count
    FROM org_metrics om
    GROUP BY om.code
  )
  INSERT INTO public.benchmark_code_aggregates (
    share_code,
    avg_close_rate,
    avg_inspection_score,
    avg_gross_margin,
    avg_cost_per_sqft,
    org_count,
    updated_at
  )
  SELECT
    a.share_code,
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

COMMENT ON FUNCTION public.refresh_benchmark_code_aggregates() IS 'Recomputes benchmark_code_aggregates from orgs that have benchmark_share_code set. Call from cron with refresh_benchmark_aggregates.';


-- ============================================================================
-- END OF RECONCILIATION
-- ============================================================================
