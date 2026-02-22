-- ============================================
-- JANIBEAR University Training System (Phase 1)
-- Courses, lessons, quizzes, enrollments, progress, certifications, requirements, recommendations.
-- org_id NULL = global/platform course (readable by all authenticated).
-- ============================================

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

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at_jb_training()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

-- Courses: global (org_id IS NULL) readable by all authenticated; org courses by org members. Platform admin can manage global; org admins manage org.
CREATE POLICY "jb_training_courses_select_global_or_org"
  ON public.jb_training_courses FOR SELECT TO authenticated
  USING (
    (org_id IS NULL AND is_active = true)
    OR (org_id IS NOT NULL AND is_org_member(org_id, auth.uid()))
  );

CREATE POLICY "jb_training_courses_insert_platform_global"
  ON public.jb_training_courses FOR INSERT TO authenticated
  WITH CHECK (org_id IS NULL AND is_platform_admin());

CREATE POLICY "jb_training_courses_insert_org"
  ON public.jb_training_courses FOR INSERT TO authenticated
  WITH CHECK (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

CREATE POLICY "jb_training_courses_update_platform_global"
  ON public.jb_training_courses FOR UPDATE TO authenticated
  USING (org_id IS NULL AND is_platform_admin())
  WITH CHECK (org_id IS NULL AND is_platform_admin());

CREATE POLICY "jb_training_courses_update_org"
  ON public.jb_training_courses FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()))
  WITH CHECK (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

CREATE POLICY "jb_training_courses_delete_platform_global"
  ON public.jb_training_courses FOR DELETE TO authenticated
  USING (org_id IS NULL AND is_platform_admin());

CREATE POLICY "jb_training_courses_delete_org"
  ON public.jb_training_courses FOR DELETE TO authenticated
  USING (org_id IS NOT NULL AND can_write_org(org_id, auth.uid()));

-- Lessons: same visibility as parent course (via course_id -> courses.org_id)
CREATE POLICY "jb_training_lessons_select"
  ON public.jb_training_lessons FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND c.is_active = true) OR (c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())))
    )
  );

CREATE POLICY "jb_training_lessons_insert"
  ON public.jb_training_lessons FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

CREATE POLICY "jb_training_lessons_update"
  ON public.jb_training_lessons FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

CREATE POLICY "jb_training_lessons_delete"
  ON public.jb_training_lessons FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Quizzes: same as lessons
CREATE POLICY "jb_training_quizzes_select"
  ON public.jb_training_quizzes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND c.is_active = true) OR (c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())))
    )
  );

CREATE POLICY "jb_training_quizzes_all_manage"
  ON public.jb_training_quizzes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Quiz questions: same as quiz -> course
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

CREATE POLICY "jb_training_quiz_questions_all_manage"
  ON public.jb_training_quiz_questions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id
        AND ((c.org_id IS NULL AND is_platform_admin()) OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

-- Enrollments: user sees own; org admins/supervisors can list for org (we allow select where user in same org)
CREATE POLICY "jb_training_enrollments_select_own"
  ON public.jb_training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "jb_training_enrollments_select_org"
  ON public.jb_training_enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

CREATE POLICY "jb_training_enrollments_insert"
  ON public.jb_training_enrollments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())
    )
  );

CREATE POLICY "jb_training_enrollments_update"
  ON public.jb_training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jb_training_courses c WHERE c.id = course_id AND c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
  WITH CHECK (true);

-- Progress: user updates own; org can read for compliance
CREATE POLICY "jb_training_progress_select_own"
  ON public.jb_training_progress FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  );

CREATE POLICY "jb_training_progress_select_org"
  ON public.jb_training_progress FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_enrollments e
      JOIN public.jb_training_courses c ON c.id = e.course_id
      WHERE e.id = enrollment_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

CREATE POLICY "jb_training_progress_insert_update"
  ON public.jb_training_progress FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.jb_training_enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid())
  );

-- Quiz submissions: user sees own; org can read for compliance
CREATE POLICY "jb_training_quiz_submissions_select_own"
  ON public.jb_training_quiz_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "jb_training_quiz_submissions_select_org"
  ON public.jb_training_quiz_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_quizzes q
      JOIN public.jb_training_courses c ON c.id = q.course_id
      WHERE q.id = quiz_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

CREATE POLICY "jb_training_quiz_submissions_insert"
  ON public.jb_training_quiz_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Certifications: user sees own; org can read for compliance
CREATE POLICY "jb_training_certifications_select_own"
  ON public.jb_training_certifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "jb_training_certifications_select_org"
  ON public.jb_training_certifications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND c.org_id IS NOT NULL AND is_org_member(c.org_id, auth.uid())
    )
  );

CREATE POLICY "jb_training_certifications_insert"
  ON public.jb_training_certifications FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jb_training_courses c
      WHERE c.id = course_id AND (c.org_id IS NULL AND is_platform_admin() OR (c.org_id IS NOT NULL AND can_write_org(c.org_id, auth.uid())))
    )
  );

CREATE POLICY "jb_training_certifications_update"
  ON public.jb_training_certifications FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Requirements: org members read; org admins write
CREATE POLICY "jb_training_requirements_select"
  ON public.jb_training_requirements FOR SELECT TO authenticated
  USING (is_org_member(org_id, auth.uid()));

CREATE POLICY "jb_training_requirements_insert_update_delete"
  ON public.jb_training_requirements FOR ALL TO authenticated
  USING (can_write_org(org_id, auth.uid()))
  WITH CHECK (can_write_org(org_id, auth.uid()));

-- Recommendations: user sees own; org admins can manage
CREATE POLICY "jb_training_recommendations_select"
  ON public.jb_training_recommendations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_org_member(org_id, auth.uid()));

CREATE POLICY "jb_training_recommendations_insert"
  ON public.jb_training_recommendations FOR INSERT TO authenticated
  WITH CHECK (is_org_member(org_id, auth.uid()));

CREATE POLICY "jb_training_recommendations_update"
  ON public.jb_training_recommendations FOR UPDATE TO authenticated
  USING (is_org_member(org_id, auth.uid()) OR user_id = auth.uid())
  WITH CHECK (true);

-- Triggers for updated_at
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
