import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getCourse, listEnrollmentsForUser } from '@/actions/university-training';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import { isPremiumPlan } from '@/lib/is-premium';
import { UniversityCourseClient } from './university-course-client';

export default async function UniversityCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const premium = await isPremiumPlan(org.org_id, userId);
  const { course, lessons, error } = await getCourse(id);
  const { enrollments } = await listEnrollmentsForUser(org.org_id);
  const enrollment = (enrollments ?? []).find((e) => e.course_id === id);

  if (error || !course) {
    return (
      <div className="space-y-4">
        <Link href="/app/university/catalog" className="text-sm text-primary hover:underline">
          ← Back to catalog
        </Link>
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const isGated =
    (course.premium_tier === 'grizzly' || course.premium_tier === 'kodiak') && !premium;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/university/catalog" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to catalog
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <GraduationCap className="h-8 w-8 text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
              <p className="text-muted-foreground">{course.description ?? ''}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <span className="text-sm text-muted-foreground">{course.estimated_minutes} min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGated ? (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle>Upgrade to access</CardTitle>
            <CardDescription>
              This course is available on Grizzly or Kodiak plans. Upgrade to unlock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pricing">View plans</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <UniversityCourseClient
          courseId={course.id}
          courseTitle={course.title}
          lessons={lessons.map((l) => ({ id: l.id, title: l.title, sortOrder: l.sort_order }))}
          enrollmentId={enrollment?.id}
          enrollmentStatus={enrollment?.status}
        />
      )}
    </div>
  );
}
