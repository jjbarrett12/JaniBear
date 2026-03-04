import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listEnrollmentsForUser, listCertificationsForUser, listRequirements, listCourses } from '@/actions/university-training';
import { Badge } from '@/components/ui/badge';
import { UniversityMyTrainingClient } from './university-my-training-client';

export default async function UniversityMyTrainingPage() {
  const org = await requireOrg();
  const { enrollments } = await listEnrollmentsForUser(org.org_id);
  const { certifications } = await listCertificationsForUser(org.org_id);
  const { requirements } = await listRequirements(org.org_id);
  const { courses } = await listCourses(org.org_id);

  const requiredCourseIds = new Set<string>();
  (requirements ?? []).forEach((r) => (r.required_course_ids ?? []).forEach((id: string) => requiredCourseIds.add(id)));

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringCerts = (certifications ?? []).filter(
    (c) => c.status === 'active' && c.expires_at && c.expires_at >= now.toISOString() && c.expires_at <= in30.toISOString()
  );
  const requiredEnrollments = (enrollments ?? []).filter((e) => e.course_id && requiredCourseIds.has(e.course_id));
  const inProgressOrNotStarted = (enrollments ?? []).filter(
    (e) => e.status === 'in_progress' || e.status === 'not_started'
  );
  const availableCourses = (courses ?? []).filter(
    (c) => !(enrollments ?? []).some((e) => e.course_id === c.id)
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to University
        </Link>
        <h1 className="text-2xl font-bold text-foreground">My training</h1>
        <p className="text-muted-foreground">
          Required, expiring soon, and available courses
        </p>
      </div>

      <UniversityMyTrainingClient
        requiredItems={requiredEnrollments.map((e) => ({
          id: e.id,
          courseId: e.course_id,
          title: e.course?.title ?? 'Course',
          status: e.status,
          estimatedMinutes: e.course?.estimated_minutes ?? 0,
        }))}
        expiringItems={expiringCerts.map((c) => ({
          id: c.id,
          courseId: c.course_id,
          title: c.course?.title ?? 'Course',
          expiresAt: c.expires_at ?? '',
        }))}
        availableCourses={availableCourses.slice(0, 12).map((c) => ({
          id: c.id,
          title: c.title,
          estimatedMinutes: c.estimated_minutes,
          level: c.level,
        }))}
      />
    </div>
  );
}
