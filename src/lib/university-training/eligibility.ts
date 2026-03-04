/**
 * JANIBEAR University — assignment/site gating eligibility.
 * Can this user be assigned to this account (site)? Checks role + account-level required training.
 * Server-only: use from server actions or API routes.
 *
 * Integration: Call checkAssignmentEligibility(userId, accountId) from assignment/scheduling flows
 * (e.g. before adding a user to an account or crew assignment). If !result.eligible, show
 * "Complete X trainings to be assigned" using result.missing_course_ids and result.expired_course_ids.
 */

import type { createClient } from '@/lib/supabase/server';
import type { EligibilityResult } from './types';

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Check if user can be assigned to account (site). Returns eligible=false and lists of
 * missing/expired course IDs when hard_gate requirements are not met.
 */
export async function canAssignUserToAccount(
  supabase: SupabaseServerClient,
  userId: string,
  accountId: string
): Promise<EligibilityResult> {
  const missing: string[] = [];
  const expired: string[] = [];

  const { data: account } = await supabase
    .from('accounts')
    .select('org_id')
    .eq('id', accountId)
    .single();
  if (!account?.org_id) {
    return { eligible: true, missing_course_ids: [], expired_course_ids: [] };
  }
  const orgId = account.org_id;

  const { data: membership } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  const userRole = (membership?.role ?? '').toLowerCase();

  const [roleReqs, accountReqs] = await Promise.all([
    supabase
      .from('jb_training_requirements')
      .select('required_course_ids')
      .eq('org_id', orgId)
      .eq('enforcement', 'hard_gate')
      .eq('requirement_type', 'role')
      .eq('role_key', userRole),
    supabase
      .from('jb_training_requirements')
      .select('required_course_ids')
      .eq('org_id', orgId)
      .eq('enforcement', 'hard_gate')
      .eq('requirement_type', 'account')
      .eq('account_id', accountId),
  ]);

  const requiredCourseIds = new Set<string>();
  [...(roleReqs.data ?? []), ...(accountReqs.data ?? [])].forEach((r) => {
    (r.required_course_ids ?? []).forEach((id: string) => requiredCourseIds.add(id));
  });
  if (requiredCourseIds.size === 0) {
    return { eligible: true, missing_course_ids: [], expired_course_ids: [] };
  }

  const now = new Date().toISOString();
  const { data: certs } = await supabase
    .from('jb_training_certifications')
    .select('course_id, expires_at, status')
    .eq('user_id', userId)
    .in('course_id', Array.from(requiredCourseIds));

  const { data: enrollments } = await supabase
    .from('jb_training_enrollments')
    .select('course_id, status, completed_at')
    .eq('user_id', userId)
    .in('course_id', Array.from(requiredCourseIds))
    .eq('status', 'completed');

  const completedCourseIds = new Set<string>((enrollments ?? []).map((e) => e.course_id));
  const certByCourse = new Map((certs ?? []).map((c) => [c.course_id, c]));

  for (const courseId of requiredCourseIds) {
    const cert = certByCourse.get(courseId);
    if (cert) {
      if (cert.status === 'revoked') {
        missing.push(courseId);
      } else if (cert.expires_at && cert.expires_at < now) {
        expired.push(courseId);
      }
      continue;
    }
    if (!completedCourseIds.has(courseId)) {
      missing.push(courseId);
    }
  }

  const eligible = missing.length === 0 && expired.length === 0;
  return {
    eligible,
    missing_course_ids: [...new Set(missing)],
    expired_course_ids: [...new Set(expired)],
  };
}
