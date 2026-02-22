'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import type {
  JbTrainingCourse,
  JbTrainingLesson,
  JbTrainingEnrollment,
  JbTrainingCertification,
  JbTrainingRequirement,
  JbTrainingRecommendation,
} from '@/lib/university-training/types';
import { canAssignUserToAccount } from '@/lib/university-training/eligibility';

const COURSE_CATEGORIES = [
  'floor_care',
  'chemicals',
  'customer_service',
  'medical',
  'safety',
  'supervision',
  'other',
] as const;

export type CourseCategoryFilter = (typeof COURSE_CATEGORIES)[number] | 'all';

/** List courses visible to org: global (org_id null) + org's own. Optionally filter by category, level, language. */
export async function listCourses(orgId: string, filters?: {
  category?: CourseCategoryFilter;
  level?: string;
  language?: string;
  requiredCourseIds?: string[];
}): Promise<{ courses: (JbTrainingCourse & { lessons_count?: number })[]; error?: string }> {
  try {
    await requireOrg();
    const supabase = await createClient();
    let q = supabase
      .from('jb_training_courses')
      .select('*')
      .eq('is_active', true)
      .or(`org_id.is.null,org_id.eq.${orgId}`);
    if (filters?.category && filters.category !== 'all') {
      q = q.eq('category', filters.category);
    }
    if (filters?.level) q = q.eq('level', filters.level);
    if (filters?.language) q = q.eq('language', filters.language);
    q = q.order('title');
    const { data, error } = await q;
    if (error) return { courses: [], error: error.message };
    const courses = (data ?? []).map((r) => ({ ...r, lessons_count: 0 })) as (JbTrainingCourse & { lessons_count?: number })[];
    if (courses.length > 0) {
      const { data: lessonCounts } = await supabase
        .from('jb_training_lessons')
        .select('course_id')
        .in('course_id', courses.map((c) => c.id));
      const countByCourse: Record<string, number> = {};
      (lessonCounts ?? []).forEach((l: { course_id: string }) => {
        countByCourse[l.course_id] = (countByCourse[l.course_id] ?? 0) + 1;
      });
      courses.forEach((c) => { c.lessons_count = countByCourse[c.id] ?? 0; });
    }
    return { courses };
  } catch (e) {
    return { courses: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Get single course with lessons. */
export async function getCourse(courseId: string): Promise<{ course: JbTrainingCourse | null; lessons: JbTrainingLesson[]; error?: string }> {
  try {
    await requireOrg();
    const supabase = await createClient();
    const { data: course, error: ce } = await supabase
      .from('jb_training_courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (ce || !course) return { course: null, lessons: [], error: ce?.message ?? 'Not found' };
    const { data: lessons } = await supabase
      .from('jb_training_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('sort_order');
    return {
      course: course as JbTrainingCourse,
      lessons: (lessons ?? []) as JbTrainingLesson[],
    };
  } catch (e) {
    return { course: null, lessons: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Enrollments for current user (or for a user if org admin). */
export async function listEnrollmentsForUser(orgId: string, userId?: string): Promise<{ enrollments: (JbTrainingEnrollment & { course?: JbTrainingCourse })[]; error?: string }> {
  try {
    const org = await requireOrg();
    const uid = await getCurrentUserId();
    const targetUserId = userId ?? uid ?? '';
    if (!targetUserId) return { enrollments: [], error: 'Unauthorized' };
    if (userId && org.org_id !== orgId) return { enrollments: [], error: 'Forbidden' };
    const supabase = await createClient();
    const { data: enrollments, error } = await supabase
      .from('jb_training_enrollments')
      .select('*')
      .eq('user_id', targetUserId)
      .in('course_id', await getCourseIdsVisibleToOrg(supabase, orgId))
      .order('last_activity_at', { ascending: false, nullsFirst: false });
    if (error) return { enrollments: [], error: error.message };
    const courseIds = [...new Set((enrollments ?? []).map((e) => e.course_id))];
    const { data: courses } = await supabase.from('jb_training_courses').select('*').in('id', courseIds);
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
    const list = (enrollments ?? []).map((e) => ({
      ...e,
      course: courseMap.get(e.course_id) as JbTrainingCourse | undefined,
    })) as (JbTrainingEnrollment & { course?: JbTrainingCourse })[];
    return { enrollments: list };
  } catch (e) {
    return { enrollments: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

async function getCourseIdsVisibleToOrg(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string): Promise<string[]> {
  const { data } = await supabase
    .from('jb_training_courses')
    .select('id')
    .eq('is_active', true)
    .or(`org_id.is.null,org_id.eq.${orgId}`);
  return (data ?? []).map((r) => r.id);
}

/** Certifications for user. */
export async function listCertificationsForUser(orgId: string, userId?: string): Promise<{ certifications: (JbTrainingCertification & { course?: JbTrainingCourse })[]; error?: string }> {
  try {
    const org = await requireOrg();
    const uid = await getCurrentUserId();
    const targetUserId = userId ?? uid ?? '';
    if (!targetUserId) return { certifications: [], error: 'Unauthorized' };
    if (userId && org.org_id !== orgId) return { certifications: [], error: 'Forbidden' };
    const supabase = await createClient();
    const { data: certs, error } = await supabase
      .from('jb_training_certifications')
      .select('*')
      .eq('user_id', targetUserId)
      .order('expires_at', { ascending: true, nullsFirst: false });
    if (error) return { certifications: [], error: error.message };
    const courseIds = [...new Set((certs ?? []).map((c) => c.course_id))];
    const { data: courses } = await supabase.from('jb_training_courses').select('*').in('id', courseIds);
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
    const list = (certs ?? []).map((c) => ({
      ...c,
      course: courseMap.get(c.course_id) as JbTrainingCourse | undefined,
    })) as (JbTrainingCertification & { course?: JbTrainingCourse })[];
    return { certifications: list };
  } catch (e) {
    return { certifications: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Requirements for org. */
export async function listRequirements(orgId: string): Promise<{ requirements: JbTrainingRequirement[]; error?: string }> {
  try {
    const org = await requireOrg();
    if (org.org_id !== orgId) return { requirements: [], error: 'Forbidden' };
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('jb_training_requirements')
      .select('*')
      .eq('org_id', orgId)
      .order('requirement_type');
    if (error) return { requirements: [], error: error.message };
    return { requirements: (data ?? []) as JbTrainingRequirement[] };
  } catch (e) {
    return { requirements: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Recommendations for current user in org. */
export async function listRecommendations(orgId: string): Promise<{ recommendations: (JbTrainingRecommendation & { course?: JbTrainingCourse })[]; error?: string }> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return { recommendations: [], error: 'Unauthorized' };
    await requireOrg();
    const supabase = await createClient();
    const { data: recs, error } = await supabase
      .from('jb_training_recommendations')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', uid)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) return { recommendations: [], error: error.message };
    const courseIds = [...new Set((recs ?? []).map((r) => r.course_id))];
    const { data: courses } = await supabase.from('jb_training_courses').select('*').in('id', courseIds);
    const courseMap = new Map((courses ?? []).map((c) => [c.id, c]));
    const list = (recs ?? []).map((r) => ({
      ...r,
      course: courseMap.get(r.course_id) as JbTrainingCourse | undefined,
    })) as (JbTrainingRecommendation & { course?: JbTrainingCourse })[];
    return { recommendations: list };
  } catch (e) {
    return { recommendations: [], error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Overview KPIs: compliance %, overdue count, expiring in 30 days, avg completion time. */
export async function getOverviewKpis(orgId: string): Promise<{
  compliancePct: number | null;
  overdueCount: number;
  expiringIn30Count: number;
  avgCompletionMinutes: number | null;
  error?: string;
}> {
  try {
    await requireOrg();
    const supabase = await createClient();
    const now = new Date().toISOString();
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: reqs } = await supabase
      .from('jb_training_requirements')
      .select('required_course_ids')
      .eq('org_id', orgId)
      .eq('enforcement', 'hard_gate');
    const requiredSet = new Set<string>();
    (reqs ?? []).forEach((r) => (r.required_course_ids ?? []).forEach((id: string) => requiredSet.add(id)));
    const requiredTotal = requiredSet.size;
    if (requiredTotal === 0) {
      return { compliancePct: null, overdueCount: 0, expiringIn30Count: 0, avgCompletionMinutes: null };
    }

    const { data: members } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('status', 'active');
    const userIds = (members ?? []).map((m) => m.user_id);
    if (userIds.length === 0) {
      return { compliancePct: 0, overdueCount: 0, expiringIn30Count: 0, avgCompletionMinutes: null };
    }

    const { data: certs } = await supabase
      .from('jb_training_certifications')
      .select('user_id, course_id, expires_at, status')
      .in('user_id', userIds)
      .in('course_id', Array.from(requiredSet));
    const activeCerts = (certs ?? []).filter((c) => c.status === 'active' && (!c.expires_at || c.expires_at >= now));
    const compliantPairs = new Set(activeCerts.map((c) => `${c.user_id}:${c.course_id}`));
    const totalRequired = userIds.length * requiredTotal;
    const compliant = compliantPairs.size;
    const compliancePct = totalRequired > 0 ? Math.round((compliant / totalRequired) * 100) : null;

    const { data: expiringCerts } = await supabase
      .from('jb_training_certifications')
      .select('id')
      .in('user_id', userIds)
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .gte('expires_at', now)
      .lte('expires_at', in30);
    const expiringIn30Count = (expiringCerts ?? []).length;

    const overdueCerts = (certs ?? []).filter((c) => c.status === 'active' && c.expires_at && c.expires_at < now);
    const overdueCount = overdueCerts.length;

    const { data: completed } = await supabase
      .from('jb_training_enrollments')
      .select('completed_at, started_at, course_id')
      .eq('status', 'completed')
      .in('user_id', userIds)
      .not('completed_at', 'is', null)
      .not('started_at', 'is', null);
    let totalMinutes = 0;
    let count = 0;
    const courseIds = [...new Set((completed ?? []).map((e) => e.course_id))];
    const { data: courseMins } = await supabase.from('jb_training_courses').select('id, estimated_minutes').in('id', courseIds);
    const minMap = new Map((courseMins ?? []).map((c) => [c.id, c.estimated_minutes ?? 0]));
    (completed ?? []).forEach((e) => {
      const mins = minMap.get(e.course_id) ?? 0;
      totalMinutes += mins;
      count += 1;
    });
    const avgCompletionMinutes = count > 0 ? Math.round(totalMinutes / count) : null;

    return {
      compliancePct: compliancePct ?? 0,
      overdueCount,
      expiringIn30Count,
      avgCompletionMinutes,
    };
  } catch (e) {
    return {
      compliancePct: null,
      overdueCount: 0,
      expiringIn30Count: 0,
      avgCompletionMinutes: null,
      error: e instanceof Error ? e.message : 'Forbidden',
    };
  }
}

/** Enroll current user in course. */
export async function enrollInCourse(courseId: string): Promise<{ enrollmentId?: string; error?: string }> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return { error: 'Unauthorized' };
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from('jb_training_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('user_id', uid)
      .maybeSingle();
    if (existing) return { enrollmentId: existing.id };
    const { data: inserted, error } = await supabase
      .from('jb_training_enrollments')
      .insert({ course_id: courseId, user_id: uid, status: 'not_started' })
      .select('id')
      .single();
    if (error) return { error: error.message };
    revalidatePath('/app/university');
    revalidatePath('/app/university/catalog');
    revalidatePath('/app/university/my-training');
    return { enrollmentId: inserted?.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Update lesson progress. */
export async function updateLessonProgress(
  enrollmentId: string,
  lessonId: string,
  status: 'in_progress' | 'completed',
  progressPercent: number
): Promise<{ error?: string }> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return { error: 'Unauthorized' };
    const supabase = await createClient();
    const { data: enrollment } = await supabase
      .from('jb_training_enrollments')
      .select('id, status')
      .eq('id', enrollmentId)
      .eq('user_id', uid)
      .single();
    if (!enrollment) return { error: 'Forbidden' };
    await supabase.from('jb_training_progress').upsert(
      {
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
        status,
        progress_percent: Math.min(100, Math.max(0, progressPercent)),
        last_viewed_at: new Date().toISOString(),
      },
      { onConflict: 'enrollment_id,lesson_id' }
    );
    if (status === 'completed') {
      const { data: enrollmentRow } = await supabase
        .from('jb_training_enrollments')
        .select('course_id')
        .eq('id', enrollmentId)
        .single();
      const courseId = enrollmentRow?.course_id;
      const [{ data: progressRows }, { data: lessons }] = await Promise.all([
        supabase.from('jb_training_progress').select('lesson_id').eq('enrollment_id', enrollmentId),
        courseId ? supabase.from('jb_training_lessons').select('id').eq('course_id', courseId) : { data: [] },
      ]);
      const totalLessons = (lessons ?? []).length;
      const completedCount = (progressRows ?? []).length;
      if (totalLessons > 0 && completedCount >= totalLessons) {
        await supabase
          .from('jb_training_enrollments')
          .update({ status: 'completed', completed_at: new Date().toISOString(), last_activity_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      } else {
        await supabase
          .from('jb_training_enrollments')
          .update({ status: 'in_progress', last_activity_at: new Date().toISOString() })
          .eq('id', enrollmentId);
      }
    } else {
      await supabase
        .from('jb_training_enrollments')
        .update({ status: 'in_progress', last_activity_at: new Date().toISOString() })
        .eq('id', enrollmentId);
    }
    revalidatePath('/app/university');
    revalidatePath('/app/university/my-training');
    revalidatePath('/app/university/course/[id]');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Submit quiz and optionally issue certification. */
export async function submitQuiz(
  quizId: string,
  enrollmentId: string,
  answers: Record<string, unknown>,
  score: number,
  passed: boolean
): Promise<{ error?: string }> {
  try {
    const uid = await getCurrentUserId();
    if (!uid) return { error: 'Unauthorized' };
    const supabase = await createClient();
    const { data: quiz } = await supabase.from('jb_training_quizzes').select('course_id, passing_score').eq('id', quizId).single();
    if (!quiz) return { error: 'Quiz not found' };
    await supabase.from('jb_training_quiz_submissions').insert({
      quiz_id: quizId,
      user_id: uid,
      enrollment_id: enrollmentId,
      score,
      passed,
      answers,
    });
    if (passed) {
      await supabase.from('jb_training_enrollments').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      }).eq('id', enrollmentId).eq('user_id', uid);
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      await supabase.from('jb_training_certifications').insert({
        user_id: uid,
        course_id: quiz.course_id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        renewal_due_at: expiresAt.toISOString(),
      });
    }
    revalidatePath('/app/university');
    revalidatePath('/app/university/certifications');
    revalidatePath('/app/university/course/[id]');
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Forbidden' };
  }
}

/** Eligibility: can user be assigned to account? */
export async function checkAssignmentEligibility(
  userId: string,
  accountId: string
): Promise<{ eligible: boolean; missing_course_ids: string[]; expired_course_ids: string[]; error?: string }> {
  try {
    await requireOrg();
    const supabase = await createClient();
    const result = await canAssignUserToAccount(supabase, userId, accountId);
    return result;
  } catch (e) {
    return {
      eligible: true,
      missing_course_ids: [],
      expired_course_ids: [],
      error: e instanceof Error ? e.message : 'Forbidden',
    };
  }
}
